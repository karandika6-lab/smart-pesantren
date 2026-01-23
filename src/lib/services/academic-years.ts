// Academic Years Service
import { supabase } from '../supabase';
import { getCurrentUser } from '../auth';

export interface AcademicYear {
    id: string;
    name: string;
    semester: 'ganjil' | 'genap';
    is_active: boolean;
    start_date: string | null;
    end_date: string | null;
    pesantren_id: string;
    created_at: string;
}

export const academicYearsService = {
    async getAll(): Promise<AcademicYear[]> {
        const user = getCurrentUser();
        let query = supabase
            .from('academic_years')
            .select('*')
            .order('name', { ascending: false });

        if (user?.role !== 'super_admin' && user?.pesantrenId) {
            query = query.eq('pesantren_id', user.pesantrenId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async getActive(): Promise<AcademicYear | null> {
        const user = getCurrentUser();
        let query = supabase
            .from('academic_years')
            .select('*')
            .eq('is_active', true);

        if (user?.pesantrenId) {
            query = query.eq('pesantren_id', user.pesantrenId);
        }

        const { data, error } = await query.single();
        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    },

    async create(year: Partial<AcademicYear>): Promise<AcademicYear> {
        const { requirePesantrenId } = await import('./helpers');
        const pesantrenId = await requirePesantrenId(year.pesantren_id);

        const { data, error } = await supabase
            .from('academic_years')
            .insert({
                name: year.name,
                start_date: year.start_date,
                end_date: year.end_date,
                is_active: year.is_active ?? false,
                pesantren_id: pesantrenId
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<AcademicYear>): Promise<AcademicYear> {
        const { data, error } = await supabase
            .from('academic_years')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async setActive(id: string): Promise<boolean> {
        const { data, error } = await supabase.rpc('set_active_academic_year', {
            p_year_id: id
        });

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('academic_years')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
