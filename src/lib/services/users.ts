// Users Service - Admin user management
import { supabase } from '../supabase';
import type { Profile, ProfileUpdate } from '@/types/database.types';
import { createUser, UserRole } from '../auth';

export interface UserWithDetails extends Profile {
    last_login?: string;
}

export interface UserFilters {
    role?: UserRole | 'all';
    isActive?: boolean;
    search?: string;
    pesantrenId?: string | 'all';
}

export const usersService = {
    async getAll(filters?: UserFilters): Promise<any[]> {
        // 1. Get user from local storage cache
        const cachedUser = typeof window !== 'undefined' ? localStorage.getItem('smart_pesantren_user') : null;
        const currentUser = cachedUser ? JSON.parse(cachedUser) : null;

        const isSuperAdmin = currentUser?.role === 'super_admin';

        // 2. Prepare optimized query
        let query = supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        // 3. Fast Filtering
        // ONLY restrict if NOT super_admin
        if (!isSuperAdmin && currentUser?.pesantrenId) {
            query = query.eq('pesantren_id', currentUser.pesantrenId);
        }

        // Apply additional filters
        if (filters?.isActive !== undefined) {
            query = query.eq('is_active', filters.isActive);
        }

        if (filters?.role && filters.role !== 'all') {
            query = query.eq('role', filters.role);
        }

        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }

        // Apply Pesantren Filter from UI (if Super Admin is filtering by a specific pesantren)
        if (isSuperAdmin && filters?.pesantrenId && filters.pesantrenId !== 'all') {
            query = query.eq('pesantren_id', filters.pesantrenId);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Fetch Error:', error);
            throw error;
        }

        return data || [];
    },

    async getById(id: string): Promise<Profile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    async getByRole(role: UserRole): Promise<Profile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', role)
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async getPotentialSupervisors(): Promise<Profile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .in('role', ['ustadz', 'musyrif', 'kesantrian', 'super_admin'])
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async create(
        email: string,
        password: string,
        name: string,
        role: UserRole,
        phone?: string,
        pesantrenId?: string
    ): Promise<{ success: boolean; user?: Profile; error?: string }> {
        try {
            // Call API route that uses Supabase Auth Admin API (SAFE & PRODUCTION-READY)
            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    name,
                    role,
                    phone,
                    pesantren_id: pesantrenId
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                return { success: false, error: data.error || 'Failed to create user' };
            }

            // Fetch the created profile to return it
            if (data.user_id) {
                const profile = await this.getById(data.user_id);
                return { success: true, user: profile || undefined };
            }

            return { success: true };
        } catch (error: any) {
            console.error('Create user error:', error);
            return { success: false, error: error.message || 'Network error' };
        }
    },

    async update(id: string, updates: ProfileUpdate): Promise<Profile> {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async toggleActive(id: string): Promise<Profile> {
        const current = await this.getById(id);
        if (!current) throw new Error('User not found');

        return this.update(id, { is_active: !current.is_active });
    },

    async updateRole(userId: string, newRole: UserRole): Promise<void> {
        // 1. Update profiles table (if column exists)
        await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        // 2. Update user_roles table
        // Delete existing roles first to maintain single primary role for this simplified management
        await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId);

        const { error } = await supabase
            .from('user_roles')
            .insert({
                user_id: userId,
                role: newRole
            });

        if (error) throw error;
    },

    async delete(id: string): Promise<void> {
        // Use the secure RPC function to delete from both auth.users and public.profiles
        const { error } = await supabase.rpc('delete_user_complete', {
            target_user_id: id
        });

        if (error) {
            console.error('RPC delete_user_complete failed:', error.message, error.details);

            // Fallback: Try hard delete from profiles directly (handling Ghost User case)
            const { error: deleteError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            if (deleteError) {
                // Check for Foreign Key Constraint violation
                if (deleteError.code === '23503') {
                    throw new Error('Gagal menghapus user: User ini terhubung dengan data lain (misal: mengajar kelas, ada nilai, dll). Hapus data terkait terlebih dahulu.');
                }
                console.error('Direct profile delete failed:', deleteError);
                throw new Error(deleteError.message);
            }
        }
    },

    async getStats(): Promise<{ total: number; active: number; byRole: Record<string, number> }> {
        // High Speed Fetch: Use combined RPC to get all stats in one trip
        const { data, error } = await supabase.rpc('get_super_admin_stats');

        if (error) {
            console.error('Failed to fetch user stats via RPC:', error);
            return { total: 0, active: 0, byRole: {} };
        }

        return {
            total: data.total_users || 0,
            active: data.active_users || 0,
            byRole: {}
        };
    },

    async getSystemHealth(): Promise<any[]> {
        // Mock health but with real DB check
        const start = Date.now();
        const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
        const latency = Date.now() - start;

        return [
            { name: 'Server Status', status: 'healthy', value: 'Online', icon: 'server' },
            { name: 'Database', status: error ? 'error' : 'healthy', value: error ? 'Disconnected' : 'Connected', icon: 'database' },
            { name: 'Latency', status: latency < 500 ? 'healthy' : 'warning', value: `${latency}ms`, icon: 'wifi' },
            { name: 'Storage', status: 'healthy', value: 'Optimized', icon: 'hard-drive' },
            { name: 'Security', status: 'healthy', value: 'SSL Active', icon: 'shield' },
            { name: 'Backups', status: 'healthy', value: 'Daily Active', icon: 'clock' },
        ];
    },

    async getLoginTraffic(): Promise<any[]> {
        const { data, error } = await supabase
            .from('login_logs')
            .select('login_time')
            .gte('login_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('login_time');

        if (error) throw error;

        // Group by day
        const days: Record<string, number> = {};
        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            days[dateStr] = 0;
        }

        data?.forEach(log => {
            const dateStr = new Date(log.login_time).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            if (days[dateStr] !== undefined) days[dateStr]++;
        });

        return Object.entries(days).map(([date, value]) => ({ date, value }));
    },

    subscribeToChanges(callback: (payload: any) => void) {
        const channel = supabase
            .channel('profiles_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                callback
            )
            .subscribe();
        return () => supabase.removeChannel(channel);
    },
};
