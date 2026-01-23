import { supabase } from '../supabase';

export interface SystemSettings {
    id: string;
    app_name: string;
    tagline: string;
    logo_url: string | null;
    primary_color: string;
    active_academic_year_id: string | null;
    maintenance_mode: boolean;
    allow_registration: boolean;
    email_notifications: boolean;
    sms_notifications: boolean;
    auto_backup: boolean;
    session_timeout: number;
}

export const settingsService = {
    async get() {
        // Try maybeSingle() instead of single() to avoid 406 JSON error when no rows exist
        const { data, error } = await supabase
            .from('system_settings')
            .select('*')
            .eq('id', 'global')
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            // Return default in-memory only to avoid RLS error on Insert
            return {
                id: 'global',
                app_name: 'Smart Pesantren',
                tagline: 'Sistem Manajemen Pesantren Modern',
                logo_url: null,
                primary_color: '#8b5cf6',
                active_academic_year_id: null,
                maintenance_mode: false,
                allow_registration: true,
                email_notifications: true,
                sms_notifications: false,
                auto_backup: true,
                session_timeout: 30
            } as SystemSettings;
        }

        return data as SystemSettings;
    },

    async update(updates: Partial<SystemSettings>) {
        const { data, error } = await supabase
            .from('system_settings')
            .update(updates)
            .eq('id', 'global')
            .select()
            .single();

        if (error) throw error;
        return data as SystemSettings;
    }
};
