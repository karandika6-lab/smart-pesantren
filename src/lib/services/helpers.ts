// Helper untuk mendapatkan pesantren_id dengan fallback
import { supabase } from '../supabase';
import { getCurrentUser } from '../auth';

/**
 * Gets pesantren_id from multiple sources with fallbacks
 * Priority: 1. Provided ID, 2. User session, 3. Profiles table, 4. First pesantren (super_admin only)
 */
export async function getPesantrenId(providedId?: string): Promise<string | null> {
    // 1. Use provided ID if available
    if (providedId) return providedId;

    const user = getCurrentUser();

    // 2. Check user session
    if (user?.pesantrenId) return user.pesantrenId;

    // 3. Try to get from profiles table
    if (user?.id) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('pesantren_id')
            .eq('id', user.id)
            .single();

        if (profile?.pesantren_id) return profile.pesantren_id;
    }

    // 4. For super_admin without pesantren, get first available
    if (user?.role === 'super_admin') {
        const { data: pesantren } = await supabase
            .from('pesantren')
            .select('id')
            .neq('name', 'SaaS Management')
            .limit(1)
            .single();

        if (pesantren?.id) return pesantren.id;
    }

    return null;
}

/**
 * Gets pesantren_id or throws an error if not found
 */
export async function requirePesantrenId(providedId?: string): Promise<string> {
    const pesantrenId = await getPesantrenId(providedId);
    if (!pesantrenId) {
        throw new Error('Pesantren tidak ditemukan. Pastikan Anda sudah terhubung ke pesantren.');
    }
    return pesantrenId;
}

/**
 * Gets the current date in local ISO format (YYYY-MM-DD)
 * This avoids the day-shift issue when using .toISOString().split('T')[0]
 */
export function getLocalDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
