// Grades Service - CRUD operations for Nilai
import { supabase } from '../supabase';
import type { Grade, GradeInsert, GradeUpdate } from '@/types/database.types';

export interface GradeWithRelations extends Grade {
    student?: { id: string; name: string; nis: string | null } | null;
    subject?: { id: string; name: string; code: string | null; category?: string | null } | null;
    teacher?: { id: string; name: string } | null;
}

export interface GradeFilters {
    studentId?: string;
    subjectId?: string;
    teacherId?: string;
    classId?: string;
    academicYearId?: string;
    semester?: 1 | 2;
}

export const gradesService = {
    /**
     * Get grades with filters
     */
    async getAll(filters?: GradeFilters): Promise<GradeWithRelations[]> {
        let query = supabase
            .from('grades')
            .select(`
                *,
                student:students(id, name, nis),
                subject:subjects(id, name, code, category),
                teacher:teachers(id, name)
            `);

        if (filters?.studentId) query = query.eq('student_id', filters.studentId);
        if (filters?.subjectId) query = query.eq('subject_id', filters.subjectId);
        if (filters?.teacherId) query = query.eq('teacher_id', filters.teacherId);
        if (filters?.academicYearId) query = query.eq('academic_year_id', filters.academicYearId);
        if (filters?.semester) query = query.eq('semester', filters.semester);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    /**
     * Get grades by class (through students)
     */
    async getByClass(classId: string, subjectId?: string): Promise<GradeWithRelations[]> {
        let query = supabase
            .from('grades')
            .select(`
                *,
                student:students!inner(id, name, nis, class_id),
                subject:subjects(id, name, code, category)
            `)
            .eq('student.class_id', classId);

        if (subjectId) query = query.eq('subject_id', subjectId);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    /**
     * Get student's grades
     */
    async getByStudent(studentId: string, semester?: 1 | 2): Promise<GradeWithRelations[]> {
        let query = supabase
            .from('grades')
            .select(`
                *,
                subject:subjects(id, name, code, category)
            `)
            .eq('student_id', studentId);

        if (semester) query = query.eq('semester', semester);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    /**
     * Create or update grade (upsert)
     */
    async upsert(grade: GradeInsert): Promise<Grade> {
        const { data, error } = await supabase
            .from('grades')
            .upsert(grade, {
                onConflict: 'student_id,subject_id,academic_year_id,semester',
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Bulk upsert grades
     */
    async bulkUpsert(grades: GradeInsert[]): Promise<Grade[]> {
        const { data, error } = await supabase
            .from('grades')
            .upsert(grades, {
                onConflict: 'student_id,subject_id,academic_year_id,semester',
            })
            .select();

        if (error) throw error;
        return data || [];
    },

    /**
     * Update specific grade fields
     */
    async update(id: string, updates: GradeUpdate): Promise<Grade> {
        // Calculate final grade if component grades are updated
        const finalGrade = this.calculateFinalGrade(updates);

        // Prepare updates with both possible field names for safety
        const gradeWithCalculation = finalGrade !== null
            ? {
                ...updates,
                final_grade: finalGrade,
                final_score: finalGrade, // Try to update both
                grade_letter: this.getGradeLetter(finalGrade)
            }
            : updates;

        const { data, error } = await supabase
            .from('grades')
            .update(gradeWithCalculation)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete grade
     */
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('grades')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Calculate final grade from components
     * Formula: Tugas 20%, UTS 30%, UAS 50%
     */
    calculateFinalGrade(grade: Partial<Grade>): number | null {
        const { tugas_score, uts_score, uas_score } = grade;
        if (tugas_score == null || uts_score == null || uas_score == null) return null;
        return Math.round((Number(tugas_score) * 0.2 + Number(uts_score) * 0.3 + Number(uas_score) * 0.5) * 100) / 100;
    },

    /**
     * Get grade letter from numeric grade
     */
    getGradeLetter(grade: number): string {
        if (grade >= 90) return 'A';
        if (grade >= 80) return 'B';
        if (grade >= 70) return 'C';
        if (grade >= 60) return 'D';
        return 'E';
    },

    /**
     * Subscribe to grade changes for a class
     */
    subscribeToClassGrades(classId: string, callback: (payload: { new: Grade | null, old: Grade | null, eventType: string }) => void) {
        const channel = supabase
            .channel(`grades_class_${classId}`)
            .on(
                'postgres_changes' as 'system',
                { event: '*', schema: 'public', table: 'grades' } as unknown as { event: 'system' },
                callback as unknown as (payload: { extension: string; status: string; message: string }) => void
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    },

    /**
     * Helper to get final grade value from potentially different column names
     */
    getFinalValue(grade: unknown): number {
        if (!grade) return 0;
        const g = grade as { final_grade?: number, final_score?: number };
        return Number(g.final_grade ?? g.final_score ?? 0);
    },
};
