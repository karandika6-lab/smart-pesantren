// Grades Service - CRUD operations for Nilai
import { supabase } from '../supabase';
import type { Grade, GradeInsert, GradeUpdate } from '@/types/database.types';

export interface GradeWithRelations extends Grade {
    student?: { id: string; name: string; nis: string } | null;
    subject?: { id: string; name: string; code: string } | null;
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
                subject:subjects(id, name, code),
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
                subject:subjects(id, name, code)
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
     */
    calculateFinalGrade(grade: Partial<Grade>): number | null {
        const { uh1, uh2, uts, uas } = grade;
        if (uh1 == null || uh2 == null || uts == null || uas == null) return null;
        // Typical formula: UH 25%, UTS 25%, UAS 50%
        return Math.round((Number(uh1) * 0.125 + Number(uh2) * 0.125 + Number(uts) * 0.25 + Number(uas) * 0.5) * 100) / 100;
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
    subscribeToClassGrades(classId: string, callback: (payload: any) => void) {
        const channel = supabase
            .channel(`grades_class_${classId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'grades' },
                callback
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    },

    /**
     * Helper to get final grade value from potentially different column names
     */
    getFinalValue(grade: any): number {
        if (!grade) return 0;
        return Number(grade.final_grade ?? grade.final_score ?? 0);
    },
};
