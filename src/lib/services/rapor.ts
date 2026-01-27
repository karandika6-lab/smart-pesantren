import { supabase } from '../supabase';
import { studentsService } from './students';
import { gradesService } from './grades';

export const raporService = {
    async getRaporDataByClass(classId: string, academicYearId: string, semester: number) {
        // 1. Get all students in class
        const students = await studentsService.getByClass(classId);
        if (!students || students.length === 0) return [];

        // 2. Get all grades for these students
        const grades = await gradesService.getByClass(classId);

        // 3. Get all attendance for these students
        const { data: attendance, error: attError } = await supabase
            .from('attendance')
            .select('*')
            .in('student_id', students.map((s: any) => s.id));

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
        return students.map((student: any) => {
            const studentGrades = grades.filter((g: any) =>
                (g.student_id === student.id || (g.student && g.student.id === student.id)) &&
                g.academic_year_id === academicYearId &&
                g.semester === semester
            );
            const studentAttendance = attendance?.filter(a => a.student_id === student.id) || [];

            const attendanceSummary = {
                sakit: studentAttendance.filter(a => a.status === 'sakit').length,
                izin: studentAttendance.filter(a => a.status === 'izin').length,
                alpha: studentAttendance.filter(a => a.status === 'alpha').length,
            };

            return {
                id: student.id,
                name: student.name,
                parentName: student.parent_name || student.father_name || student.guardian_name || '-',
                nis: student.nis,
                nisn: student.nis || '-',
                class: classWithWali?.name || 'Unknown',
                gender: student.gender || 'L',
                grades: studentGrades.map((g: any) => {
                    const rawScore = g.final_score ?? g.final_grade ?? g.score ?? 0;
                    const score = isNaN(Number(rawScore)) ? 0 : Number(rawScore);
                    return {
                        subject: g.subject?.name || g.subjects?.name || g.subject || 'Mata Pelajaran',
                        score: score,
                        category: (g.subject?.category || g.subjects?.category || 'umum') as 'agama' | 'umum'
                    };
                }),
                attendance: attendanceSummary,
                waliKelas: {
                    name: (classWithWali as any).homeroom_teacher?.name || '-',
                    nip: (classWithWali as any).homeroom_teacher?.nip || '-'
                },
                promotion: {
                    isPromoted: true,
                    nextClass: (parseInt(classWithWali?.name || '0') + 1).toString() + (classWithWali?.name?.replace(/[0-9]/g, '') || '')
                }
            };
        });
    }
};
