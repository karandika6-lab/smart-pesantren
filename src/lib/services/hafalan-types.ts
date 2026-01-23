// ============================================
// Hafalan Types Service
// ============================================
// Service for managing hafalan types (Admin Akademik only)

import { supabase } from '@/lib/supabase';

export interface HafalanType {
    id: string;
    name: string;
    description: string;
    category: 'quran' | 'doa' | 'mufrodat' | 'hadits' | 'nadhom' | 'other';
    total_units: number;
    unit_name: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export const hafalanTypesService = {
    /**
     * Get all active hafalan types
     */
    async getAll(): Promise<HafalanType[]> {
        const { data, error } = await supabase
            .from('hafalan_types')
            .select('*')
            .eq('is_active', true)
            .order('category', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get all hafalan types including inactive (Admin only)
     */
    async getAllIncludingInactive(): Promise<HafalanType[]> {
        const { data, error } = await supabase
            .from('hafalan_types')
            .select('*')
            .order('category', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get hafalan types by category
     */
    async getByCategory(category: string): Promise<HafalanType[]> {
        const { data, error } = await supabase
            .from('hafalan_types')
            .select('*')
            .eq('category', category)
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get single hafalan type by ID
     */
    async getById(id: string): Promise<HafalanType | null> {
        const { data, error } = await supabase
            .from('hafalan_types')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }
        return data;
    },

    /**
     * Create new hafalan type (Admin Akademik only)
     */
    async create(hafalanType: Omit<HafalanType, 'id' | 'created_at' | 'updated_at'>): Promise<HafalanType> {
        const { data, error } = await supabase
            .from('hafalan_types')
            .insert(hafalanType)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('Nama hafalan sudah ada. Gunakan nama yang berbeda.');
            }
            throw error;
        }
        return data;
    },

    /**
     * Update hafalan type (Admin Akademik only)
     */
    async update(id: string, updates: Partial<Omit<HafalanType, 'id' | 'created_at' | 'updated_at'>>): Promise<HafalanType> {
        const { data, error } = await supabase
            .from('hafalan_types')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('Nama hafalan sudah ada. Gunakan nama yang berbeda.');
            }
            throw error;
        }
        return data;
    },

    /**
     * Soft delete hafalan type (set is_active = false)
     * Only allowed if no active programs use this type
     */
    async delete(id: string): Promise<void> {
        // Check if any active programs use this type
        const { data: programs, error: checkError } = await supabase
            .from('hafalan_programs')
            .select('id')
            .eq('hafalan_type_id', id)
            .eq('status', 'active')
            .limit(1);

        if (checkError) throw checkError;

        if (programs && programs.length > 0) {
            throw new Error('Tidak dapat menghapus hafalan type yang masih digunakan oleh santri. Nonaktifkan program terlebih dahulu.');
        }

        const { error } = await supabase
            .from('hafalan_types')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Reactivate hafalan type
     */
    async reactivate(id: string): Promise<HafalanType> {
        const { data, error } = await supabase
            .from('hafalan_types')
            .update({ is_active: true })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Hard delete hafalan type (PERMANENT - cannot be undone)
     * Only allowed if NO programs (active or inactive) use this type
     */
    async hardDelete(id: string): Promise<void> {
        // Check if ANY programs use this type (active or inactive)
        const { data: programs, error: checkError } = await supabase
            .from('hafalan_programs')
            .select('id, status')
            .eq('hafalan_type_id', id)
            .limit(1);

        if (checkError) throw checkError;

        if (programs && programs.length > 0) {
            throw new Error('Tidak dapat menghapus hafalan type yang pernah/sedang digunakan oleh santri. Hapus semua program terkait terlebih dahulu.');
        }

        // Permanent delete from database
        const { error } = await supabase
            .from('hafalan_types')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Get statistics about hafalan types
     */
    async getStatistics(): Promise<{
        total: number;
        by_category: Record<string, number>;
        active: number;
        inactive: number;
    }> {
        const { data, error } = await supabase
            .from('hafalan_types')
            .select('category, is_active');

        if (error) throw error;

        const stats = {
            total: data.length,
            active: data.filter(d => d.is_active).length,
            inactive: data.filter(d => !d.is_active).length,
            by_category: data.reduce((acc, item) => {
                acc[item.category] = (acc[item.category] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        };

        return stats;
    }
};
