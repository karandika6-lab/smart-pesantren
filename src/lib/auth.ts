// Smart Pesantren - Authentication Logic
// Supabase Authentication with 9 distinct user roles

import { supabase } from './supabase';

// Profile interface for type safety
interface ProfileData {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string | null;
    avatar_url?: string | null;
    is_active?: boolean;
}

export type UserRole =
    | 'super_admin'      // Full access
    | 'admin_keuangan'   // Finance/SPP management
    | 'admin_akademik'   // Curriculum/class management
    | 'kesantrian'       // Student affairs/discipline/dorms
    | 'admin_absensi'    // Attendance picket staff
    | 'wali_kelas'       // Homeroom teacher/class supervisor
    | 'ustadz'           // Teacher
    | 'wali_santri'      // Parent/guardian
    | 'santri';          // Student

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    secondaryRoles?: string[];  // e.g. ['wali_kelas'] for teachers who are also homeroom
    avatar?: string;
    phone?: string;
    // Role-specific data
    className?: string;    // For wali_kelas
    subject?: string;      // For ustadz
    childName?: string;    // For wali_santri
    roomNumber?: string;   // For santri
    // Multi-tenancy
    pesantrenId?: string;
}

export interface AuthResult {
    success: boolean;
    user?: User;
    error?: string;
}

// Role-based route mapping
export const ROLE_ROUTES: Record<UserRole, string> = {
    super_admin: '/dashboard/admin',
    admin_keuangan: '/dashboard/keuangan',
    admin_akademik: '/dashboard/akademik',
    kesantrian: '/dashboard/kesantrian',
    admin_absensi: '/dashboard/absensi',
    wali_kelas: '/dashboard/wali-kelas',
    ustadz: '/dashboard/ustadz',
    wali_santri: '/dashboard/wali',
    santri: '/dashboard/santri',
};

// Role display names (Indonesian)
export const ROLE_NAMES: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    admin_keuangan: 'Admin Keuangan',
    admin_akademik: 'Admin Akademik',
    kesantrian: 'Bagian Kesantrian',
    admin_absensi: 'Admin Absensi',
    wali_kelas: 'Wali Kelas',
    ustadz: 'Ustadz',
    wali_santri: 'Wali Santri',
    santri: 'Santri',
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
    super_admin: 'Akses penuh ke seluruh sistem',
    admin_keuangan: 'Kelola SPP, pembayaran, dan keuangan',
    admin_akademik: 'Kelola kurikulum dan jadwal kelas',
    kesantrian: 'Kelola kedisiplinan dan asrama',
    admin_absensi: 'Petugas piket absensi',
    wali_kelas: 'Supervisor kelas dan wali murid',
    ustadz: 'Input nilai dan hafalan',
    wali_santri: 'Pantau perkembangan anak',
    santri: 'Lihat jadwal dan nilai',
};

// Role colors for UI
export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
    super_admin: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    admin_keuangan: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    admin_akademik: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    kesantrian: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    admin_absensi: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
    wali_kelas: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
    ustadz: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
    wali_santri: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    santri: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
};

// Demo accounts for quick testing (in production, these should be created via Supabase Auth)
export const DEMO_ACCOUNTS: { email: string; role: UserRole; label: string }[] = [
    { email: 'admin@pesantren.com', role: 'super_admin', label: 'Super Admin' },
    { email: 'keuangan@pesantren.com', role: 'admin_keuangan', label: 'Keuangan' },
    { email: 'akademik@pesantren.com', role: 'admin_akademik', label: 'Akademik' },
    { email: 'kesantrian@pesantren.com', role: 'kesantrian', label: 'Kesantrian' },
    { email: 'absensi@pesantren.com', role: 'admin_absensi', label: 'Absensi' },
    { email: 'walikelas@pesantren.com', role: 'wali_kelas', label: 'Wali Kelas' },
    { email: 'ustadz@pesantren.com', role: 'ustadz', label: 'Ustadz' },
    { email: 'wali@pesantren.com', role: 'wali_santri', label: 'Wali Santri' },
    { email: 'santri@pesantren.com', role: 'santri', label: 'Santri' },
];

/**
 * Authenticate user with Supabase Auth
 */
export async function authenticateUser(
    email: string,
    password: string
): Promise<AuthResult> {
    try {
        // Sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password,
        });

        if (authError) {
            // Map Supabase errors to Indonesian messages
            if (authError.message.includes('Invalid login credentials')) {
                return { success: false, error: 'Email atau password salah' };
            }
            if (authError.message.includes('Email not confirmed')) {
                return { success: false, error: 'Email belum dikonfirmasi' };
            }
            return { success: false, error: authError.message };
        }

        if (!authData.user) {
            return { success: false, error: 'Gagal mendapatkan data user' };
        }

        // Fetch user profile with role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError || !profile) {
            console.error('Profile fetch error:', profileError);
            return { success: false, error: 'Profil pengguna tidak ditemukan' };
        }

        // Convert profile to User object
        const user: User = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role as UserRole,
            secondaryRoles: profile.secondary_roles || [],
            avatar: profile.avatar_url || undefined,
            phone: profile.phone || undefined,
            pesantrenId: profile.pesantren_id,
        };

        // Record login activity for dashboard tracking
        try {
            await supabase.rpc('record_login', {
                p_user_id: profile.id,
                p_email: profile.email,
                p_role: profile.role,
                p_pesantren_id: profile.pesantren_id || null
            });
        } catch (e) {
            console.warn('Failed to record login activity:', e);
        }

        return { success: true, user };
    } catch (error: unknown) {
        console.error('Authentication error:', error);
        return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
    }
}

/**
 * Synchronize current user session with latest database profile
 */
export async function syncUserSession(): Promise<User | null> {
    try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (profile) {
            const user: User = {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role as UserRole,
                secondaryRoles: profile.secondary_roles || [],
                avatar: profile.avatar_url || undefined,
                phone: profile.phone || undefined,
                pesantrenId: profile.pesantren_id,
            };
            cacheUser(user);
            return user;
        }
    } catch (error: unknown) {
        console.error('Sync user session error:', error);
    }
    return getCurrentUser();
}

/**
 * Create new user account (Admin only)
 */
export async function createUser(
    email: string,
    password: string,
    name: string,
    role: UserRole,
    phone?: string,
    pesantrenId?: string
): Promise<AuthResult> {
    try {
        // Create user in Supabase Auth with metadata
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email.toLowerCase().trim(),
            password,
            options: {
                data: {
                    name,
                    role,
                    pesantren_id: pesantrenId || getCurrentUser()?.pesantrenId,
                },
            },
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                return { success: false, error: 'Email sudah terdaftar' };
            }
            return { success: false, error: authError.message };
        }

        if (!authData.user) {
            return { success: false, error: 'Gagal membuat akun' };
        }

        // Update profile with additional data (phone)
        if (phone) {
            await supabase
                .from('profiles')
                .update({ phone })
                .eq('id', authData.user.id);
        }

        const user: User = {
            id: authData.user.id,
            email,
            name,
            role,
            phone,
        };

        return { success: true, user };
    } catch (error: unknown) {
        console.error('Create user error:', error);
        return { success: false, error: 'Gagal membuat akun. Silakan coba lagi.' };
    }
}

/**
 * Get redirect route based on user role
 */
export function getRedirectRoute(role: UserRole): string {
    return ROLE_ROUTES[role] || '/dashboard';
}

/**
 * Check if user has permission for a specific route
 */
export function hasRouteAccess(role: UserRole, route: string): boolean {
    const allowedRoute = ROLE_ROUTES[role];
    return route.startsWith(allowedRoute);
}

/**
 * Get current user from Supabase session (async)
 */
export async function getCurrentUserAsync(): Promise<User | null> {
    try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            return null;
        }

        // Fetch profile
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (error || !profile) {
            console.error('Error fetching profile:', error);
            return null;
        }

        return {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role as UserRole,
            secondaryRoles: profile.secondary_roles || [],
            avatar: profile.avatar_url || undefined,
            phone: profile.phone || undefined,
            pesantrenId: profile.pesantren_id,
        };
    } catch (error: unknown) {
        console.error('Get current user error:', error);
        return null;
    }
}

/**
 * Get current user synchronously from localStorage cache
 * This is the primary function for backwards compatibility
 */
export function getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;

    try {
        const cached = localStorage.getItem('smart_pesantren_user');
        if (cached) {
            return JSON.parse(cached) as User;
        }
    } catch {
        // Ignore parse errors
    }
    return null;
}

/**
 * Alias for getCurrentUser (for explicit sync usage)
 */
export const getCurrentUserSync = getCurrentUser;

/**
 * Cache user data for faster sync access
 */
export function cacheUser(user: User): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('smart_pesantren_user', JSON.stringify(user));
    }
}

/**
 * Clear user session (logout)
 */
export async function clearSession(): Promise<void> {
    try {
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
            localStorage.removeItem('smart_pesantren_user');
            localStorage.removeItem('activeRole');
        }
    } catch (error: unknown) {
        console.error('Logout error:', error);
    }
}

/**
 * Get active role from localStorage (for multi-role users)
 */
export function getActiveRole(): UserRole | null {
    if (typeof window === 'undefined') return null;
    const role = localStorage.getItem('activeRole');
    return role as UserRole | null;
}

/**
 * Set active role in localStorage
 */
export function setActiveRole(role: UserRole): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('activeRole', role);
    }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                const user: User = {
                    id: profile.id,
                    email: profile.email,
                    name: profile.name,
                    role: profile.role as UserRole,
                    secondaryRoles: profile.secondary_roles || [],
                    avatar: profile.avatar_url || undefined,
                    phone: profile.phone || undefined,
                    pesantrenId: profile.pesantren_id,
                };
                cacheUser(user);
                callback(user);
            }
        } else if (event === 'SIGNED_OUT') {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('smart_pesantren_user');
            }
            callback(null);
        }
    });
}

/**
 * Update user profile
 */
export async function updateProfile(
    userId: string,
    updates: Partial<Pick<ProfileData, 'name' | 'phone' | 'avatar_url'>>
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: unknown) {
        console.error('Update profile error:', error);
        return { success: false, error: 'Gagal memperbarui profil' };
    }
}

/**
 * Change user password
 */
export async function changePassword(
    newPassword: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: unknown) {
        console.error('Change password error:', error);
        return { success: false, error: 'Gagal mengubah password' };
    }
}

/**
 * Reset password via email
 */
export async function resetPassword(
    email: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: unknown) {
        console.error('Reset password error:', error);
        return { success: false, error: 'Gagal mengirim email reset password' };
    }
}

// ============================================
// Multi-Role System Functions
// ============================================

/**
 * Get all available roles for a user (primary + secondary)
 */
export function getAvailableRoles(user: User | null): UserRole[] {
    if (!user) return [];

    const roles: UserRole[] = [user.role];

    // Add secondary roles
    if (user.secondaryRoles && user.secondaryRoles.length > 0) {
        user.secondaryRoles.forEach(sr => {
            if (!roles.includes(sr as UserRole)) {
                roles.push(sr as UserRole);
            }
        });
    }

    return roles;
}

/**
 * Get the effective role (active role or primary role)
 */
export function getEffectiveRole(user: User | null): UserRole | null {
    if (!user) return null;

    // Check if there's an active role set
    const activeRole = getActiveRole();
    const availableRoles = getAvailableRoles(user);

    // Return active role if it's valid for this user
    if (activeRole && availableRoles.includes(activeRole)) {
        return activeRole;
    }

    // Otherwise return primary role
    return user.role;
}

/**
 * Switch to a different role (for multi-role users)
 */
export function switchRole(role: UserRole): void {
    setActiveRole(role);

    // Redirect to the new role's dashboard
    const route = getRedirectRoute(role);
    if (typeof window !== 'undefined') {
        window.location.href = route;
    }
}

/**
 * Check if user has a specific role (primary or secondary)
 */
export function hasRole(user: User | null, role: UserRole): boolean {
    if (!user) return false;
    return getAvailableRoles(user).includes(role);
}

/**
 * Get display text for user's roles (e.g. "Ustadz + Wali Kelas")
 */
export function getRoleDisplayText(user: User | null): string {
    if (!user) return '';

    const roles = getAvailableRoles(user);
    return roles.map(r => ROLE_NAMES[r]).join(' + ');
}
