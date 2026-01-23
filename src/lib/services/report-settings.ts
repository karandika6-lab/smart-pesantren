// Report Settings Service
import { supabase } from '../supabase';
import { getCurrentUser } from '../auth';

export interface ReportSettings {
    id: string;
    pesantren_id: string;
    logo_url: string | null;
    school_name: string | null;
    address: string | null;
    nsm: string | null;
    npsn: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    principal_name: string | null;
    principal_nip: string | null;
    principal_signature_url: string | null;
}

export const reportSettingsService = {
    async get(): Promise<ReportSettings | null> {
        const user = getCurrentUser();
        if (!user?.pesantrenId) return null;

        const { data, error } = await supabase
            .from('report_settings')
            .select('*')
            .eq('pesantren_id', user.pesantrenId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    },

    async upsert(settings: Partial<ReportSettings>): Promise<ReportSettings> {
        const user = getCurrentUser();
        const pesantrenId = settings.pesantren_id || user?.pesantrenId;

        const { data, error } = await supabase
            .from('report_settings')
            .upsert({
                ...settings,
                pesantren_id: pesantrenId,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'pesantren_id'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async uploadLogo(file: File): Promise<string> {
        const user = getCurrentUser();
        const fileName = `logos/${user?.pesantrenId}/${Date.now()}_${file.name}`;

        const { data, error } = await supabase.storage
            .from('public-assets')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from('public-assets')
            .getPublicUrl(data.path);

        return urlData.publicUrl;
    },

    async uploadSignature(file: File): Promise<string> {
        const user = getCurrentUser();
        const fileName = `signatures/${user?.pesantrenId}/${Date.now()}_${file.name}`;

        const { data, error } = await supabase.storage
            .from('public-assets')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from('public-assets')
            .getPublicUrl(data.path);

        return urlData.publicUrl;
    }
};
