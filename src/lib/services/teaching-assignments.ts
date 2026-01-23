// Teaching Assignments Service
import { supabase } from '../supabase';
import { getCurrentUser } from '../auth';

export interface TeachingAssignment {
    id: string;
    teacher_id: string;
    subject_id: string;
    class_id: string;
    academic_year_id: string | null;
    hours_per_week: number;
    pesantren_id: string;
    // Joined data
    teacher?: { id: string; name: string };
    subject?: { id: string; name: string; code: string };
    class?: { id: string; name: string; grade: number };
}

export const teachingAssignmentsService = {
    async getAll(): Promise<TeachingAssignment[]> {
        const user = getCurrentUser();
        let query = supabase
            .from('teaching_assignments')
            .select(`
                *,
                teacher:teachers(id, name),
                subject:subjects(id, name, code),
                class:classes(id, name, grade)
            `)
            .order('created_at', { ascending: false });

        if (user?.role !== 'super_admin' && user?.pesantrenId) {
            query = query.eq('pesantren_id', user.pesantrenId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async getByTeacher(teacherId: string): Promise<TeachingAssignment[]> {
        const { data, error } = await supabase
            .from('teaching_assignments')
            .select(`
                *,
                subject:subjects(id, name, code),
                class:classes(id, name, grade)
            `)
            .eq('teacher_id', teacherId);

        if (error) throw error;
        return data || [];
    },

    async getByClass(classId: string): Promise<TeachingAssignment[]> {
        const { data, error } = await supabase
            .from('teaching_assignments')
            .select(`
                *,
                teacher:teachers(id, name),
                subject:subjects(id, name, code)
            `)
            .eq('class_id', classId);

        if (error) throw error;
        return data || [];
    },

    async create(assignment: Partial<TeachingAssignment>): Promise<TeachingAssignment> {
        const { requirePesantrenId } = await import('./helpers');
        const pesantrenId = await requirePesantrenId(assignment.pesantren_id);

        const { data, error } = await supabase
            .from('teaching_assignments')
            .insert({
                teacher_id: assignment.teacher_id,
                subject_id: assignment.subject_id,
                class_id: assignment.class_id,
                academic_year_id: assignment.academic_year_id || null,
                hours_per_week: assignment.hours_per_week || 2,
                pesantren_id: pesantrenId
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<TeachingAssignment>): Promise<TeachingAssignment> {
        const { data, error } = await supabase
            .from('teaching_assignments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('teaching_assignments')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async bulkCreate(assignments: Partial<TeachingAssignment>[]): Promise<void> {
        const { requirePesantrenId } = await import('./helpers');
        const pesantrenId = await requirePesantrenId();

        const dataWithPesantren = assignments.map(a => ({
            teacher_id: a.teacher_id,
            subject_id: a.subject_id,
            class_id: a.class_id,
            academic_year_id: a.academic_year_id || null,
            hours_per_week: a.hours_per_week || 2,
            pesantren_id: pesantrenId
        }));

        const { error } = await supabase
            .from('teaching_assignments')
            .insert(dataWithPesantren);

        if (error) throw error;
    }
};
