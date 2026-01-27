// Students Service - CRUD operations for Santri
import { supabase } from '../supabase';
import type { Student, StudentInsert, StudentUpdate } from '@/types/database.types';

export interface StudentWithRelations extends Student {
    class?: { id: string; name: string } | null;
    dormitory?: { id: string; name: string } | null;
}

export interface StudentFilters {
    classId?: string;
    dormitoryId?: string;
    status?: 'active' | 'graduated' | 'dropped';
    search?: string;
}

export const studentsService = {
    /**
     * Get all students with optional filters
     */
    async getAll(filters?: StudentFilters): Promise<StudentWithRelations[]> {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase
            .from('students')
            .select(`
                *,
                class:classes(id, name),
                dormitory:dormitories(id, name)
            `)
            .order('name');

        if (pesantrenId) {
            query = query.eq('pesantren_id', pesantrenId);
        }
        if (filters?.classId) {
            query = query.eq('class_id', filters.classId);
        }
        if (filters?.dormitoryId) {
            query = query.eq('dormitory_id', filters.dormitoryId);
        }
        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,nis.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    /**
     * Get student by ID with full relations
     */
    async getById(id: string): Promise<StudentWithRelations | null> {
        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                class:classes(*),
                dormitory:dormitories(*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }
        return data;
    },

    /**
     * Get students by class
     */
    async getByClass(classId: string): Promise<StudentWithRelations[]> {
        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                class:classes(id, name),
                dormitory:dormitories(id, name)
            `)
            .eq('class_id', classId)
            .eq('status', 'active')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    /**
     * Create new student (with automatic user account for santri and optionally parent)
     */
    async create(student: StudentInsert & { pesantren_id?: string }): Promise<Student> {
        try {
            const { requirePesantrenId } = await import('./helpers');
            const pesantrenId = await requirePesantrenId(student.pesantren_id);

            // Call API route that uses Supabase Auth Admin API
            const response = await fetch('/api/admin/create-student', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...student,
                    pesantren_id: pesantrenId
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to create student');
            }
            return data as unknown as Student;
        } catch (err: unknown) {
            console.error('Error in studentsService.create:', err);
            throw err;
        }
    },

    /**
     * Update student
     */
    async update(id: string, student: StudentUpdate): Promise<Student> {
        const { data, error } = await supabase
            .from('students')
            .update(student)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete student and associated auth user
     */
    async delete(id: string): Promise<void> {
        // Try cascade delete first (removes auth user too)
        const { data, error: rpcError } = await supabase.rpc('delete_student_cascade', {
            p_student_id: id
        });

        if (rpcError) {
            console.warn('RPC delete failed, falling back to direct delete:', rpcError);
            // Fallback to direct delete (won't remove auth user)
            const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return;
        }

        if (data && !data.success) {
            throw new Error(data.message || 'Gagal menghapus santri');
        }
    },

    /**
     * Bulk import students
     */
    async bulkImport(students: StudentInsert[]): Promise<Student[]> {
        const { data, error } = await supabase
            .from('students')
            .insert(students)
            .select();

        if (error) throw error;
        return data || [];
    },

    /**
     * Get student count by status
     */
    async getStats(): Promise<{ active: number; graduated: number; dropped: number; total: number }> {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        const getCount = async (status: string) => {
            let query = supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('status', status);

            if (pesantrenId) {
                query = query.eq('pesantren_id', pesantrenId);
            }
            return query;
        };

        const [active, graduated, dropped] = await Promise.all([
            getCount('active'),
            getCount('graduated'),
            getCount('dropped')
        ]);

        return {
            active: active.count || 0,
            graduated: graduated.count || 0,
            dropped: dropped.count || 0,
            total: (active.count || 0) + (graduated.count || 0) + (dropped.count || 0),
        };
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getGenderRatio(): Promise<any[]> {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase.from('students').select('gender');
        if (pesantrenId) {
            query = query.eq('pesantren_id', pesantrenId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const counts = { L: 0, P: 0 };
        data?.forEach(s => {
            if (s.gender === 'L') counts.L++;
            if (s.gender === 'P') counts.P++;
        });

        if (counts.L === 0 && counts.P === 0) return [];

        return [
            { name: 'Santri Putra', value: counts.L, color: '#10b981' },
            { name: 'Santri Putri', value: counts.P, color: '#f43f5e' },
        ];
    },

    /**
     * Subscribe to real-time student changes
     */
    subscribeToChanges(callback: (payload: { new: Student | null, old: Student | null, eventType: string }) => void) {
        const channel = supabase
            .channel('students_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'students' },
                callback
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    },
};
