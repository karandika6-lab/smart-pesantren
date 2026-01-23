import { supabase } from '../supabase';

export const studentDashboardService = {
    async getGPAHistory(studentId: string) {
        // Safe selection of existing columns across versions
        const { data, error } = await supabase
            .from('grades')
            .select('*') // Get everything to handle schema variations safely
            .eq('student_id', studentId);

        if (error) throw error;

        // Group by pseudo-semesters
        const semesterGrades: Record<string, { total: number, count: number }> = {};
        (data || []).forEach((g: any, i: number) => {
            const sem = `Sem ${Math.floor(i / 5) + 1}`;
            if (!semesterGrades[sem]) semesterGrades[sem] = { total: 0, count: 0 };

            // Integrated Calculation Fallback
            // Support both final_score (MASTER-SETUP) and final_grade (V2/Legacy)
            let score = g.final_score ?? g.final_grade;

            if (score === null || score === undefined) {
                // Fallback to components if final score isn't calculated
                // Handle both short (uh1, uh2) and long (tugas_score, uts_score, uas_score) names
                const uh1 = g.uh1 ?? g.tugas_score ?? 0;
                const uh2 = g.uh2 ?? 0;
                const uts = g.uts ?? g.uts_score ?? 0;
                const uas = g.uas ?? g.uas_score ?? 0;

                const avgUh = (Number(uh1) + Number(uh2)) / (uh2 ? 2 : 1);
                score = (avgUh * 0.25) + (Number(uts) * 0.25) + (Number(uas) * 0.5);
            }

            semesterGrades[sem].total += Number(score);
            semesterGrades[sem].count += 1;
        });

        if (Object.keys(semesterGrades).length === 0) {
            return [
                { semester: 'Sem 1', gpa: 0 },
                { semester: 'Sem 2', gpa: 0 }
            ];
        }

        return Object.entries(semesterGrades).map(([semester, stats]) => ({
            semester,
            gpa: Number((stats.total / stats.count / 25).toFixed(2))
        })).slice(-5);
    },

    async getHafalanData(studentId: string) {
        // 1. Get Active Program first to get correct metadata
        const { data: activePrograms, error: progError } = await supabase
            .from('hafalan_programs')
            .select(`
                id,
                hafalan_types (
                    id,
                    name,
                    unit_name,
                    total_units
                )
            `)
            .eq('student_id', studentId)
            .eq('status', 'active')
            .limit(1);

        if (progError) throw progError;

        const activeProg = activePrograms?.[0] as any;
        const metadata = activeProg?.hafalan_types;

        // 2. Get latest progress for this student
        const { data: v2Data, error: v2Error } = await supabase
            .from('hafalan_progress')
            .select(`
                unit_number, 
                unit_name, 
                progress_percentage, 
                updated_at,
                hafalan_programs (
                    hafalan_types (
                        name,
                        unit_name,
                        total_units
                    )
                )
            `)
            .eq('student_id', studentId)
            .order('updated_at', { ascending: false });

        if (!v2Error && (v2Data && v2Data.length > 0)) {
            const latest = v2Data[0] as any;
            const progInfo = latest.hafalan_programs?.hafalan_types || metadata;
            const unitLabel = progInfo?.unit_name || 'Unit';
            const progName = progInfo?.name || 'Program';
            const totalTarget = progInfo?.total_units || 30;

            // Calculate completed units (progress_percentage = 100)
            const completedUnits = v2Data.filter(h => h.progress_percentage === 100).length;

            // Calculate total progress percentage across all units
            const totalSumProgress = v2Data.reduce((sum, h) => sum + (h.progress_percentage || 0), 0);
            const totalProgress = Math.min(100, Math.round(totalSumProgress / totalTarget));

            return {
                currentJuz: latest.unit_number,
                unitLabel: unitLabel,
                programName: progName,
                // Format: "Nama Program - Unit X"
                currentName: `${progName} - ${latest.unit_name || `${unitLabel} ${latest.unit_number}`}`,
                progress: latest.progress_percentage,
                totalProgress: totalProgress,
                completed: completedUnits,
                remaining: Math.max(0, totalTarget - completedUnits),
                totalTarget: totalTarget,
                lastUpdate: latest.updated_at,
                chartData: [
                    { name: 'Selesai', value: completedUnits },
                    { name: 'Target', value: Math.max(0, totalTarget - completedUnits) }
                ]
            };
        }

        // 3. Fallback: If no progress yet but has active program
        if (activeProg) {
            const unitLabel = metadata.unit_name || 'Unit';
            const progName = metadata.name || 'Program';
            const totalTarget = metadata.total_units || 30;

            return {
                currentJuz: 1,
                unitLabel: unitLabel,
                programName: progName,
                currentName: `${progName} - ${unitLabel} 1`,
                progress: 0,
                totalProgress: 0,
                completed: 0,
                remaining: totalTarget,
                totalTarget: totalTarget,
                lastUpdate: null,
                chartData: [
                    { name: 'Selesai', value: 0 },
                    { name: 'Target', value: totalTarget }
                ]
            };
        }

        // 2. Fallback to legacy schema
        const tryLegacy = async (tableName: string) => {
            // Check only what we need, with safer selection
            const { data, error } = await supabase
                .from(tableName)
                .select('*') // Safer than listing missing columns
                .eq('student_id', studentId);

            if (error) return { data: [], error };

            // Re-apply ordering in JS to be safe
            const sorted = (data || []).sort((a: any, b: any) => (b.juz || 0) - (a.juz || 0));
            return { data: sorted, error: null };
        };

        // Try 'hafalan_progress_old' first if we suspect 'hafalan_progress' is already V2
        let legacyData: any[] = [];
        const oldResult = await tryLegacy('hafalan_progress_old');

        if (!oldResult.error && oldResult.data.length > 0) {
            legacyData = oldResult.data;
        } else {
            // If old table doesn't exist/empty, maybe the main table IS legacy
            const mainResult = await tryLegacy('hafalan_progress');
            if (mainResult.data?.[0]?.juz !== undefined) {
                legacyData = mainResult.data;
            }
        }

        const latest = legacyData[0];
        if (!latest) return null; // Return null if absolutely no data found

        const completedJuz = new Set(legacyData.filter((h: any) =>
            ['completed', 'selesai', 'tuntas', 'lulus', 'muroja_ah', 'memorized'].includes(h.status?.toLowerCase())
        ).map((h: any) => h.juz)).size;

        const totalTarget = 30;

        return {
            currentJuz: latest.juz,
            unitLabel: 'Juz',
            currentName: latest.surah_name ? `Surah ${latest.surah_name}` : `Juz ${latest.juz}`,
            currentDetail: latest ? `Ayat ${latest.start_ayat || 1} - ${latest.end_ayat || '...'}` : null,
            completed: completedJuz,
            remaining: Math.max(0, totalTarget - completedJuz),
            lastUpdate: latest.updated_at,
            chartData: [
                { name: 'Selesai', value: completedJuz },
                { name: 'Target', value: Math.max(0, totalTarget - completedJuz) }
            ]
        };
    },

    async getTodaySchedule(studentId: string) {
        const { data: student, error: sError } = await supabase
            .from('students')
            .select('class_id')
            .eq('id', studentId)
            .maybeSingle();

        if (sError) throw sError;
        if (!student?.class_id) return [];

        const todayIdx = new Date().getDay();

        const { data, error } = await supabase
            .from('schedules')
            .select(`
                id,
                start_time,
                end_time,
                room,
                subjects (name),
                teachers (
                    name
                )
            `)
            .eq('class_id', student.class_id)
            .eq('day_of_week', todayIdx)
            .order('start_time');

        if (error) throw error;

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

        return (data || []).map((s: any) => ({
            id: s.id,
            time: `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`,
            subject: s.subjects?.name || 'Unknown',
            teacher: s.teachers?.name || 'Ustadz/Teacher',
            room: s.room || 'N/A',
            status: currentTime > s.end_time ? 'Selesai' : currentTime < s.start_time ? 'Akan Datang' : 'Sedang Berlangsung'
        }));
    },

    async getTopScore(studentId: string) {
        // Try all possible column names for final score/grade
        const { data, error } = await supabase
            .from('grades')
            .select(`
                *,
                subjects (name)
            `)
            .eq('student_id', studentId);

        if (error || !data || data.length === 0) return null;

        // Sort in JS to find the highest score regardless of column name
        const sorted = [...data].sort((a, b) => {
            const scoreA = Number(a.final_score ?? a.final_grade ?? a.uas_score ?? a.uas ?? 0);
            const scoreB = Number(b.final_score ?? b.final_grade ?? b.uas_score ?? b.uas ?? 0);
            return scoreB - scoreA;
        });

        const best = sorted[0];
        const bestScore = best.final_score ?? best.final_grade ?? best.uas_score ?? best.uas;

        return {
            score: bestScore,
            subjects: best.subjects
        };
    },

    async getDisciplinePoints(studentId: string) {
        const { data, error } = await supabase
            .from('violations')
            .select('points')
            .eq('student_id', studentId);

        if (error) return 0;

        // Base points is 100, deducted by violations
        const totalViolations = (data || []).reduce((acc, curr) => acc + (curr.points || 0), 0);
        return Math.max(0, 100 - totalViolations);
    },

    async getRecentViolations(studentId: string) {
        const { data, error } = await supabase
            .from('violations')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) return [];
        return data || [];
    },

    async getWeeklySchedule(studentId: string) {
        const { data: student, error: sError } = await supabase
            .from('students')
            .select('class_id')
            .eq('id', studentId)
            .single();

        if (sError) throw sError;

        const { data, error } = await supabase
            .from('schedules')
            .select(`
                id,
                day_of_week,
                start_time,
                end_time,
                room,
                subjects (name),
                teachers (name)
            `)
            .eq('class_id', student?.class_id)
            .order('day_of_week')
            .order('start_time');

        if (error) throw error;
        return data || [];
    }
};
