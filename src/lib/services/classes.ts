// Classes Service - CRUD operations for Kelas
import { supabase } from '../supabase';
import type { Class, ClassInsert, ClassUpdate } from '@/types/database.types';

export interface ClassWithRelations extends Class {
    homeroom_teacher?: { id: string; name: string } | null;
    academic_year?: { id: string; name: string } | null;
    _count?: { students: number };
}

export const classesService = {
    /**
     * Get all classes with relations
     */
    async getAll(): Promise<ClassWithRelations[]> {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase
            .from('classes')
            .select(`
                *,
                homeroom_teacher:teachers!homeroom_teacher_id(id, name, email),
                academic_year:academic_years(id, name)
            `)
            .order('grade_level')
            .order('name');

        if (pesantrenId) {
            query = query.eq('pesantren_id', pesantrenId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    /**
     * Get class by ID with full details
     */
    async getById(id: string): Promise<ClassWithRelations | null> {
        const { data, error } = await supabase
            .from('classes')
            .select(`
                *,
                homeroom_teacher:teachers!homeroom_teacher_id(id, name, email),
                academic_year:academic_years(id, name)
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    /**
     * Get classes by grade level
     */
    async getByGradeLevel(gradeLevel: number): Promise<Class[]> {
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .eq('grade_level', gradeLevel)
            .order('name');

        if (error) throw error;
        return data || [];
    },

    /**
     * Create new class
     */
    async create(classData: ClassInsert): Promise<Class> {
        const { requirePesantrenId } = await import('./helpers');
        const pesantrenId = await requirePesantrenId((classData as any).pesantren_id);

        const { data, error } = await supabase
            .from('classes')
            .insert({
                name: classData.name,
                grade_level: classData.grade_level,
                homeroom_teacher_id: classData.homeroom_teacher_id || null,
                academic_year_id: classData.academic_year_id || null,
                capacity: classData.capacity || 30,
                pesantren_id: pesantrenId
            } as any)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update class
     */
    async update(id: string, updates: ClassUpdate): Promise<Class> {
        const { data, error } = await supabase
            .from('classes')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete class
     */
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Get student count per class
     */
    async getStudentCounts(): Promise<Record<string, number>> {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase
            .from('students')
            .select('class_id')
            .eq('status', 'active');

        if (pesantrenId) {
            query = query.eq('pesantren_id', pesantrenId);
        }

        const { data, error } = await query;

        if (error) throw error;

        const counts: Record<string, number> = {};
        data?.forEach(student => {
            if (student.class_id) {
                counts[student.class_id] = (counts[student.class_id] || 0) + 1;
            }
        });
        return counts;
    },

    /**
     * Get class for homeroom teacher
     */
    async getByHomeroomTeacher(teacherId: string): Promise<Class | null> {
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .eq('homeroom_teacher_id', teacherId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    async getDensity(): Promise<any[]> {
        const [classes, studentCounts] = await Promise.all([
            this.getAll(),
            this.getStudentCounts()
        ]);

        return classes.map(c => ({
            name: c.name,
            count: studentCounts[c.id] || 0,
            capacity: c.capacity || 30
        }));
    },

    /**
     * Bulk promote students from one class to another
     */
    async promoteStudents(fromClassId: string, toClassId: string): Promise<{ moved_count: number }> {
        const { data, error } = await supabase.rpc('promote_students_bulk', {
            from_class_id: fromClassId,
            to_class_id: toClassId
        });

        if (error) throw error;
        // RPC returns JSON object { status, moved_count, message }
        return data as { moved_count: number };
    },
};
