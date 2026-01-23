// Rapor Settings Service - Database & Storage Integration
import { supabase } from '../supabase';
import { getCurrentUser } from '../auth';

export interface RaporSettingsDB {
    id: string;
    pesantren_id: string;
    yayasan_name: string;
    school_name: string;
    school_name_arabic: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logo_url: string;
    pengasuh_pondok_name: string;
    pengasuh_pondok_nip: string;
    active_semester: 1 | 2;
    academic_year: string;
    report_city: string;
    created_at: string;
    updated_at: string;
}

/**
 * Helper to get pesantren ID - handles various cases
 */
async function getPesantrenId(): Promise<string | null> {
    const user = getCurrentUser();

    // 1. Check if already in user session
    if (user?.pesantrenId) {
        return user.pesantrenId;
    }

    // 2. Try to get from profiles table
    if (user?.id) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('pesantren_id')
            .eq('id', user.id)
            .single();

        if (profile?.pesantren_id) {
            return profile.pesantren_id;
        }
    }

    // 3. For super_admin without pesantren, get first available
    if (user?.role === 'super_admin') {
        const { data: pesantren } = await supabase
            .from('pesantren')
            .select('id')
            .limit(1)
            .single();

        if (pesantren?.id) {
            return pesantren.id;
        }
    }

    return null;
}

export const raporSettingsService = {
    /**
     * Get settings untuk pesantren saat ini
     */
    async getSettings(): Promise<RaporSettingsDB | null> {
        const pesantrenId = await getPesantrenId();
        if (!pesantrenId) {
            console.warn('No pesantren ID found');
            return null;
        }

        try {
            // Priority: Fetch directly first (safer, avoids 409 Conflict from RPC get-or-create)
            const { data: directData } = await supabase
                .from('rapor_settings')
                .select('*')
                .eq('pesantren_id', pesantrenId)
                .maybeSingle();

            if (directData) return directData;

            // If empty, try RPC as fallback
            const { data, error } = await supabase.rpc('get_or_create_rapor_settings', {
                p_pesantren_id: pesantrenId
            });

            if (error) {
                console.warn('RPC failed or not available:', error);
                return null;
            }

            return Array.isArray(data) ? data[0] : data;
        } catch (e) {
            console.error('Get settings error:', e);
            return null;
        }
    },

    /**
     * Update settings
     */
    async updateSettings(settings: Partial<RaporSettingsDB>): Promise<RaporSettingsDB | null> {
        const pesantrenId = await getPesantrenId();
        if (!pesantrenId) throw new Error('No pesantren ID found');

        try {
            // Try RPC first
            const { data, error } = await supabase.rpc('update_rapor_settings', {
                p_pesantren_id: pesantrenId,
                p_settings: settings
            });

            if (error) {
                console.warn('RPC not available, updating directly:', error);
                // Fallback to direct update
                const { data: directData, error: directError } = await supabase
                    .from('rapor_settings')
                    .upsert({
                        pesantren_id: pesantrenId,
                        ...settings,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'pesantren_id' })
                    .select()
                    .single();

                if (directError) throw directError;
                return directData;
            }

            // RPC returns array, get first item
            return Array.isArray(data) ? data[0] : data;
        } catch (e) {
            console.error('Update settings error:', e);
            throw e;
        }
    },

    /**
     * Upload logo ke Supabase Storage
     */
    async uploadLogo(file: File): Promise<string> {
        const pesantrenId = await getPesantrenId();
        if (!pesantrenId) throw new Error('No pesantren ID found. Pastikan Anda sudah terhubung ke sebuah pesantren.');

        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
        const fileName = `${pesantrenId}/logo.${fileExt}`;

        // Upload to storage
        const { data, error } = await supabase.storage
            .from('logos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true // Replace if exists
            });

        if (error) {
            console.error('Upload error:', error);
            throw new Error('Gagal upload logo: ' + error.message);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('logos')
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    },

    /**
     * Delete logo dari storage
     */
    async deleteLogo(): Promise<void> {
        const pesantrenId = await getPesantrenId();
        if (!pesantrenId) return;

        // Get current settings to find logo filename
        const settings = await this.getSettings();
        if (!settings?.logo_url) return;

        // Extract filename from URL
        const urlParts = settings.logo_url.split('/');
        const fileName = `${pesantrenId}/${urlParts[urlParts.length - 1]}`;

        await supabase.storage
            .from('logos')
            .remove([fileName]);

        // Update settings to remove logo URL
        await this.updateSettings({ logo_url: '' });
    }
};

