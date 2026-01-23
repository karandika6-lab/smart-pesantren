// Subjects Service - CRUD operations for Mata Pelajaran
import { supabase } from '../supabase';
import { getCurrentUser } from '../auth';

export interface Subject {
    id: string;
    code: string;
    name: string;
    category: 'umum' | 'agama' | 'tahfidz' | 'ekstrakurikuler';
    hours_per_week: number;
    pesantren_id: string;
    is_active: boolean;
    created_at: string;
}

export const subjectsService = {
    async getAll(): Promise<Subject[]> {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase
            .from('subjects')
            .select('*')
            .order('category')
            .order('name');

        if (pesantrenId) {
            query = query.eq('pesantren_id', pesantrenId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<Subject | null> {
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    async create(subject: any): Promise<Subject> {
        const { requirePesantrenId } = await import('./helpers');
        const pesantrenId = await requirePesantrenId(subject.pesantren_id);

        const { data, error } = await supabase
            .from('subjects')
            .insert({
                code: subject.code,
                name: subject.name,
                category: subject.category?.toLowerCase() || 'umum',
                hours_per_week: subject.hours_per_week || 2,
                is_active: subject.is_active ?? true,
                pesantren_id: pesantrenId
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: any): Promise<Subject> {
        const payload: any = {};
        if (updates.code) payload.code = updates.code;
        if (updates.name) payload.name = updates.name;
        if (updates.is_active !== undefined) payload.is_active = updates.is_active;
        if (updates.hours_per_week !== undefined) payload.hours_per_week = updates.hours_per_week;
        if (updates.category) payload.category = updates.category.toLowerCase();

        const { data, error } = await supabase
            .from('subjects')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('subjects')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getByCategory(category: 'umum' | 'agama' | 'tahfidz'): Promise<Subject[]> {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase
            .from('subjects')
            .select('*')
            .eq('category', category)
            .order('name');

        if (pesantrenId) {
            query = query.eq('pesantren_id', pesantrenId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }
};
