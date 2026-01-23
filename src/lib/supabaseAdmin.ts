import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Admin Client
 * Used for server-side operations that require service role (bypass RLS)
 */

export function getSupabaseAdmin(): SupabaseClient<any> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        // Fallback for build time
        console.warn('Supabase Admin credentials missing. Using placeholder.');
        return createClient(
            supabaseUrl || 'https://placeholder.supabase.co',
            serviceRoleKey || 'placeholder-key',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
