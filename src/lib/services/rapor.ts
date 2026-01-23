import { supabase } from '../supabase';
import { StudentWithRelations, studentsService } from './students';
import { gradesService } from './grades';
import { attendanceService } from './attendance';
import { academicYearService } from './academic';

export const raporService = {
    async getRaporDataByClass(classId: string, academicYearId: string, semester: number) {
        // 1. Get all students in class
        const students = await studentsService.getByClass(classId);
        if (!students || students.length === 0) return [];

        // 2. Get all grades for these students
        const grades = await gradesService.getByClass(classId);

        // 3. Get all attendance for these students
        // We'll calculate summary for the whole semester or year?
        // Usually, rapor is for a specific semester.
        // We need a way to get attendance summary per student.
        // For simplicity, we'll fetch all attendance and summarize.
        const { data: attendance, error: attError } = await supabase
            .from('attendance')
            .select('*')
            .in('student_id', students.map(s => s.id));

        if (attError) throw attError;

        // 4. Get active teacher info for the class (Wali Kelas)
        const { data: classWithWali, error: classError } = await supabase
            .from('classes')
            .select(`
                *,
                homeroom_teacher:teachers(
                    id,
                    name,
                    nip
                )
            `)
            .eq('id', classId)
            .single();

        if (classError) throw classError;

        // 5. Build the final mapping
        return students.map(student => {
            const studentGrades = grades.filter(g => g.student_id === student.id && g.academic_year_id === academicYearId && g.semester === semester);
            const studentAttendance = attendance?.filter(a => a.student_id === student.id) || [];

            const attendanceSummary = {
                sakit: studentAttendance.filter(a => a.status === 'sakit').length,
                izin: studentAttendance.filter(a => a.status === 'izin').length,
                alpha: studentAttendance.filter(a => a.status === 'alpha').length,
            };

            return {
                id: student.id,
                name: student.name,
                nis: student.nis,
                nisn: (student as any).nis || '-', // Fallback to nis or custom logic
                class: classWithWali?.name || 'Unknown',
                gender: (student as any).gender || 'L',
                grades: studentGrades.map((g: any) => ({
                    subject: g.subjects?.name || g.subject?.name || 'Mata Pelajaran',
                    score: Number(g.final_grade || g.score || 0),
                    category: (g.subjects?.category || g.subject?.category || 'umum') as 'agama' | 'umum'
                })),
                attendance: attendanceSummary,
                waliKelas: {
                    name: (classWithWali as any).homeroom_teacher?.name || '-',
                    nip: (classWithWali as any).homeroom_teacher?.nip || '-'
                },
                // Default promotion logic
                promotion: {
                    isPromoted: true,
                    nextClass: (parseInt(classWithWali.name) + 1).toString() + (classWithWali.name.replace(/[0-9]/g, ''))
                }
            };
        });
    }
};
