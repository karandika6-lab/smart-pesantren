// Teachers Service - CRUD operations for Ustadz/Guru
import { supabase } from '../supabase';
import type { Teacher, TeacherInsert, TeacherUpdate } from '@/types/database.types';

export interface TeacherWithProfile extends Teacher {
    profile?: { id: string; name: string; email: string; role: string } | null;
}

export interface TeacherFilters {
    isActive?: boolean;
    specialization?: string;
    search?: string;
}

export const teachersService = {
    /**
     * Get all teachers with optional filters
     */
    async getAll(filters?: TeacherFilters): Promise<Teacher[]> {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase
            .from('teachers')
            .select('*')
            .order('name');

        if (pesantrenId) {
            query = query.eq('pesantren_id', pesantrenId);
        }
        if (filters?.isActive !== undefined) {
            query = query.eq('is_active', filters.isActive);
        }
        if (filters?.specialization) {
            query = query.eq('specialization', filters.specialization);
        }
        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,nip.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    /**
     * Get teacher by ID
     */
    async getById(id: string): Promise<Teacher | null> {
        const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    /**
     * Get teacher by user ID (for ustadz login)
     */
    async getByUserId(userId: string): Promise<Teacher | null> {
        const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    /**
     * Create new teacher (with automatic user account)
     */
    async create(teacher: TeacherInsert & { pesantren_id?: string }): Promise<Teacher> {
        try {
            const { requirePesantrenId } = await import('./helpers');
            const pesantrenId = await requirePesantrenId(teacher.pesantren_id);

            // Call API route that uses Supabase Auth Admin API
            const response = await fetch('/api/admin/create-teacher', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...teacher,
                    pesantren_id: pesantrenId
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to create teacher');
            }

            return data as unknown as Teacher;
        } catch (error: unknown) {
            console.error('Create teacher error:', error);
            throw error;
        }
    },

    /**
     * Update teacher
     */
    async update(id: string, updates: TeacherUpdate): Promise<Teacher> {
        const { data, error } = await supabase
            .from('teachers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete teacher and associated auth user
     */
    async delete(id: string): Promise<void> {
        // Try cascade delete first (removes auth user too)
        const { data, error: rpcError } = await supabase.rpc('delete_teacher_cascade', {
            p_teacher_id: id
        });

        if (rpcError) {
            console.warn('RPC delete failed, falling back to direct delete:', rpcError);
            // Fallback to direct delete (won't remove auth user)
            const { error } = await supabase
                .from('teachers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return;
        }

        if (data && !data.success) {
            throw new Error(data.message || 'Gagal menghapus guru');
        }
    },

    /**
     * Get active teacher count
     */
    async getActiveCount(): Promise<number> {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase
            .from('teachers')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        if (pesantrenId) {
            query = query.eq('pesantren_id', pesantrenId);
        }

        const { count, error } = await query;

        if (error) throw error;
        return count || 0;
    },

    /**
     * Get unique specializations
     */
    async getSpecializations(): Promise<string[]> {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase
            .from('teachers')
            .select('specialization')
            .not('specialization', 'is', null);

        if (pesantrenId) {
            query = query.eq('pesantren_id', pesantrenId);
        }

        const { data, error } = await query;

        if (error) throw error;
        const specs = new Set(data?.map(t => t.specialization).filter(Boolean));
        return Array.from(specs) as string[];
    },

    async getLoad(): Promise<{ name: string; hours: number }[]> {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase
            .from('schedules')
            .select(`
                teacher_id,
                teachers(name)
            `);

        if (pesantrenId) {
            query = query.eq('pesantren_id', pesantrenId);
        }

        const { data } = await query;

        const loads: Record<string, { name: string, hours: number }> = {};
        data?.forEach((s: unknown) => {
            const schedule = s as { teacher_id: string; teachers: { name: string } | null };
            const teacherObj = Array.isArray(schedule.teachers) ? schedule.teachers[0] : schedule.teachers;
            if (schedule.teacher_id && teacherObj) {
                if (!loads[schedule.teacher_id]) {
                    loads[schedule.teacher_id] = { name: teacherObj.name, hours: 0 };
                }
                loads[schedule.teacher_id].hours += 2;
            }
        });

        return Object.values(loads).sort((a, b) => b.hours - a.hours).slice(0, 5);
    },
};
