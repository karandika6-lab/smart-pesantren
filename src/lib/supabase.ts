// Supabase Client Configuration
// Smart Pesantren - Database Connection

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a placeholder client if env vars aren't available (for build time)
let supabaseClient: SupabaseClient<Database>;

if (supabaseUrl && supabaseAnonKey) {
    // Production/runtime client
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        }
    });
} else {
    // Placeholder for build time - operations will fail gracefully
    // This prevents build errors when env vars aren't set
    console.warn('Supabase credentials not configured. API calls will fail.');
    supabaseClient = createClient<Database>(
        'https://placeholder.supabase.co',
        'placeholder-key',
        { auth: { persistSession: false } }
    );
}

export const supabase: SupabaseClient<Database> = supabaseClient;

// Helper to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Helper to get current session
export async function getSession() {
    if (!isSupabaseConfigured()) return null;

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error getting session:', error);
        return null;
    }
    return session;
}

// Helper to get current user from auth
export async function getUser() {
    if (!isSupabaseConfigured()) return null;

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error getting user:', error);
        return null;
    }
    return user;
}

export default supabase;
