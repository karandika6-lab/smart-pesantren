// ============================================
// Hafalan Programs & Progress Service
// ============================================
// Service for managing hafalan programs and progress tracking

import { supabase } from '@/lib/supabase';

export interface HafalanType {
    id: string;
    name: string;
    description?: string;
    category?: string;
    total_units?: number;
}

export interface StudentInfo {
    id: string;
    name: string;
    nis?: string;
    class_id?: string;
    classes?: { name: string } | null;
}

export interface HafalanProgram {
    id: string;
    student_id: string;
    hafalan_type_id: string;
    hafalan_type?: HafalanType;
    student?: StudentInfo;
    assigned_by: string;
    assigned_date: string;
    target_completion_date?: string;
    status: 'active' | 'completed' | 'paused';
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface HafalanProgress {
    id: string;
    program_id: string;
    student_id: string;
    unit_number: number;
    unit_name?: string;
    progress_percentage: number;
    grade?: 'A' | 'B' | 'C' | 'D' | 'E';
    notes?: string;
    evaluated_by?: string;
    evaluated_at?: string;
    created_at?: string;
    updated_at?: string;
}

export const hafalanService = {
    // ============================================
    // PROGRAM MANAGEMENT
    // ============================================

    /**
     * Assign hafalan program to student
     */
    async assignProgram(data: {
        student_id: string;
        hafalan_type_id: string;
        assigned_by: string;
        target_completion_date?: string;
        notes?: string;
    }): Promise<HafalanProgram> {
        const { data: program, error } = await supabase
            .from('hafalan_programs')
            .insert({
                ...data,
                status: 'active'
            })
            .select('*, hafalan_type:hafalan_types(*)')
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('Santri sudah memiliki program hafalan ini.');
            }
            throw error;
        }
        return program;
    },

    /**
     * Get student's programs (all statuses)
     */
    async getStudentPrograms(studentId: string): Promise<HafalanProgram[]> {
        const { data, error } = await supabase
            .from('hafalan_programs')
            .select('*, hafalan_type:hafalan_types(*)')
            .eq('student_id', studentId)
            .order('assigned_date', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get active programs by class (for wali kelas)
     */
    async getProgramsByClass(classId: string): Promise<HafalanProgram[]> {
        const { data, error } = await supabase
            .from('hafalan_programs')
            .select(`
                *,
                student:students!inner(id, name, nis, class_id),
                hafalan_type:hafalan_types(*)
            `)
            .eq('student.class_id', classId)
            .eq('status', 'active')
            .order('student.name', { ascending: true });

        if (error) {
            console.error('Supabase error in getProgramsByClass:', error);
            throw error;
        }
        return data || [];
    },

    /**
     * Get ALL programs by class (for wali kelas) - includes all statuses
     */
    /**
     * Get ALL programs for specific students - includes all statuses
     * Safe alternative to complex joins
     */
    async getProgramsByStudentIds(studentIds: string[]): Promise<HafalanProgram[]> {
        if (studentIds.length === 0) return [];

        const { data, error } = await supabase
            .from('hafalan_programs')
            .select(`
                *,
                hafalan_types(*)
            `)
            .in('student_id', studentIds)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching programs:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Get all active programs (for ustadz tahfidz)
     */
    async getAllActivePrograms(): Promise<HafalanProgram[]> {
        const { data, error } = await supabase
            .from('hafalan_programs')
            .select(`
                *,
                student:students(id, name, nis, class_id, classes(name)),
                hafalan_type:hafalan_types(*)
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error in getAllActivePrograms:', error);
            throw error;
        }
        return data || [];
    },

    /**
     * Update program status
     */
    async updateProgramStatus(
        programId: string,
        status: 'active' | 'completed' | 'paused',
        notes?: string
    ): Promise<HafalanProgram> {
        const { data, error } = await supabase
            .from('hafalan_programs')
            .update({ status, notes })
            .eq('id', programId)
            .select('*, hafalan_type:hafalan_types(*)')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete program (only if no progress recorded)
     */
    async deleteProgram(programId: string): Promise<void> {
        // Check if any progress exists
        const { data: progress, error: checkError } = await supabase
            .from('hafalan_progress')
            .select('id')
            .eq('program_id', programId)
            .limit(1);

        if (checkError) throw checkError;

        if (progress && progress.length > 0) {
            throw new Error('Tidak dapat menghapus program yang sudah memiliki progress. Ubah status menjadi "paused" sebagai gantinya.');
        }

        const { error } = await supabase
            .from('hafalan_programs')
            .delete()
            .eq('id', programId);

        if (error) throw error;
    },

    // ============================================
    // PROGRESS TRACKING
    // ============================================

    /**
     * Record or update progress for a unit
     */
    async recordProgress(data: {
        program_id: string;
        student_id: string;
        unit_number: number;
        unit_name?: string;
        progress_percentage: number;
        grade?: 'A' | 'B' | 'C' | 'D' | 'E';
        notes?: string;
        evaluated_by: string;
    }): Promise<HafalanProgress> {
        const { data: progress, error } = await supabase
            .from('hafalan_progress')
            .upsert({
                ...data,
                evaluated_at: new Date().toISOString()
            }, {
                onConflict: 'program_id,unit_number'
            })
            .select()
            .single();

        if (error) throw error;

        // Trigger Notification (Fire and forget)
        try {
            const { sendNotification } = await import('./notificationUtils');
            // Fetch program details to get student name and hafalan type
            const { data: program } = await supabase
                .from('hafalan_programs')
                .select('student:students(name), hafalan_type:hafalan_types(name)')
                .eq('id', data.program_id)
                .single();

            if (program) {
                const studentName = (program.student as any)?.name || 'Santri';
                const typeName = (program.hafalan_type as any)?.name || 'Hafalan';
                const unitName = data.unit_name || `Unit ${data.unit_number}`;
                
                sendNotification({
                    studentId: data.student_id,
                    title: `Laporan Hafalan: ${typeName}`,
                    message: `${studentName} telah menyelesaikan ${unitName} dengan persentase ${data.progress_percentage}% ${data.grade ? '(Nilai: ' + data.grade + ')' : ''}. ${data.notes ? 'Catatan: ' + data.notes : ''}`,
                    type: 'hafalan'
                });
            }
        } catch (notifErr) {
            console.error('Failed to trigger hafalan notification:', notifErr);
        }

        return progress;
    },

    /**
     * Get progress for a specific program
     */
    async getProgramProgress(programId: string): Promise<HafalanProgress[]> {
        const { data, error } = await supabase
            .from('hafalan_progress')
            .select('*')
            .eq('program_id', programId)
            .order('unit_number', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get all progress records for a student across all programs
     */
    async getByStudent(studentId: string): Promise<(HafalanProgress & { program: HafalanProgram | null })[]> {
        const { data, error } = await supabase
            .from('hafalan_progress')
            .select(`
                *,
                program:hafalan_programs(
                    id,
                    hafalan_type:hafalan_types(*)
                )
            `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get student's overall progress summary
     */
    async getStudentSummary(studentId: string): Promise<HafalanProgram[]> {
        const programs = await this.getStudentPrograms(studentId);

        const summary = await Promise.all(
            programs.map(async (program) => {
                const progress = await this.getProgramProgress(program.id);
                const totalUnits = program.hafalan_type?.total_units || 1;
                const completedUnits = progress.filter(p => p.progress_percentage === 100).length;
                const averageGrade = this.calculateAverageGrade(progress);
                const averageProgress = progress.length > 0
                    ? Math.round(progress.reduce((sum, p) => sum + p.progress_percentage, 0) / progress.length)
                    : 0;

                return {
                    ...program,
                    progress_summary: {
                        total_units: totalUnits,
                        completed_units: completedUnits,
                        in_progress_units: progress.length,
                        completion_percentage: Math.round((completedUnits / totalUnits) * 100),
                        average_progress: averageProgress,
                        average_grade: averageGrade,
                        latest_progress: progress[progress.length - 1] || null
                    }
                };
            })
        );

        return summary;
    },

    /**
     * Calculate average grade from progress records
     */
    calculateAverageGrade(progress: HafalanProgress[]): string {
        const grades = progress.filter(p => p.grade).map(p => p.grade!);
        if (grades.length === 0) return '-';

        const gradePoints: Record<string, number> = {
            A: 4,
            B: 3,
            C: 2,
            D: 1,
            E: 0
        };

        const avgPoint = grades.reduce((sum, g) => sum + (gradePoints[g] || 0), 0) / grades.length;

        if (avgPoint >= 3.5) return 'A';
        if (avgPoint >= 2.5) return 'B';
        if (avgPoint >= 1.5) return 'C';
        if (avgPoint >= 0.5) return 'D';
        return 'E';
    },

    /**
     * Get progress statistics for a class
     */
    async getClassStatistics(classId: string) {
        const programs = await this.getProgramsByClass(classId);

        const stats = {
            total_students: new Set(programs.map(p => p.student_id)).size,
            total_programs: programs.length,
            by_hafalan_type: programs.reduce((acc, p) => {
                const typeName = p.hafalan_type?.name || 'Unknown';
                acc[typeName] = (acc[typeName] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            completion_rates: await Promise.all(
                programs.map(async (p) => {
                    const progress = await this.getProgramProgress(p.id);
                    const completed = progress.filter(pr => pr.progress_percentage === 100).length;
                    return {
                        student_name: p.student?.name || 'Unknown',
                        hafalan_type: p.hafalan_type?.name || 'Unknown',
                        completion: Math.round((completed / (p.hafalan_type?.total_units || 1)) * 100)
                    };
                })
            )
        };

        return stats;
    }
};
