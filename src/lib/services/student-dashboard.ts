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
        (data || []).map(row => row as Record<string, unknown>).forEach((g, i) => {
            const sem = `Sem ${Math.floor(i / 5) + 1}`;
            if (!semesterGrades[sem]) semesterGrades[sem] = { total: 0, count: 0 };

            // Integrated Calculation Fallback
            // Support both final_score (MASTER-SETUP) and final_grade (V2/Legacy)
            let score = (g.final_score as number | undefined) ?? (g.final_grade as number | undefined);

            if (score === null || score === undefined) {
                // Fallback to components if final score isn't calculated
                // Handle both short (uh1, uh2) and long (tugas_score, uts_score, uas_score) names
                const uh1 = (g.uh1 as number | undefined) ?? (g.tugas_score as number | undefined) ?? 0;
                const uh2 = (g.uh2 as number | undefined) ?? 0;
                const uts = (g.uts as number | undefined) ?? (g.uts_score as number | undefined) ?? 0;
                const uas = (g.uas as number | undefined) ?? (g.uas_score as number | undefined) ?? 0;

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

        const activeProg = activePrograms?.[0] as unknown as { id: string; hafalan_types: { id: string; name: string; unit_name: string; total_units: number } | null } | undefined;
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
            const latest = v2Data[0] as unknown as {
                unit_number: number;
                unit_name?: string;
                progress_percentage: number;
                updated_at?: string;
                hafalan_programs?: { hafalan_types?: { name: string; unit_name: string; total_units: number } }
            };
            const progInfo = (latest.hafalan_programs?.hafalan_types || metadata) as { name?: string; unit_name?: string; total_units?: number } | null;
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
                currentName: `${progName} - ${latest.unit_name || `${unitLabel} ${latest.unit_number}`}`,
                currentDetail: null,
                progress: latest.progress_percentage || 0,
                totalProgress: totalProgress,
                completed: completedUnits,
                remaining: Math.max(0, totalTarget - completedUnits),
                totalTarget: totalTarget,
                lastUpdate: latest.updated_at || null,
                chartData: [
                    { name: 'Selesai', value: completedUnits },
                    { name: 'Target', value: Math.max(0, totalTarget - completedUnits) }
                ]
            };
        }

        // Try 'hafalan_progress_old' first if we suspect 'hafalan_progress' is already V2
        const { data: oldData, error: oldError } = await supabase
            .from('hafalan_progress_old')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (!oldError && (oldData && oldData.length > 0)) {
            const latest = oldData[0] as unknown as { juz?: number; surah?: string; created_at?: string; status?: string };
            const completedJuz = new Set(oldData.map(h => h as unknown as { status?: string; juz: number }).filter((h) =>
                ['completed', 'selesai', 'tuntas', 'lulus', 'muroja_ah', 'memorized'].includes(h.status?.toLowerCase() || '')
            ).map((h) => h.juz)).size;
            const totalTarget = 30;

            return {
                currentJuz: latest.juz || 30,
                unitLabel: 'Juz',
                programName: 'Hafalan Qur\'an',
                currentName: `Juz ${latest.juz}`,
                currentDetail: latest.surah || '-',
                progress: 100,
                totalProgress: Number(((completedJuz / totalTarget) * 100).toFixed(0)),
                completed: completedJuz,
                remaining: totalTarget - completedJuz,
                totalTarget: totalTarget,
                lastUpdate: latest.created_at,
                chartData: [
                    { name: 'Completed', value: completedJuz },
                    { name: 'Remaining', value: totalTarget - completedJuz }
                ]
            };
        }

        // 3. Fallback: If no progress yet but has active program
        if (activeProg) {
            const progMetadata = metadata as { name?: string; unit_name?: string; total_units?: number } | null;
            const unitLabel = progMetadata?.unit_name || 'Unit';
            const progName = progMetadata?.name || 'Program';
            const totalTarget = progMetadata?.total_units || 30;

            return {
                currentJuz: 1,
                unitLabel: unitLabel,
                programName: progName,
                currentName: `${progName} - ${unitLabel} 1`,
                currentDetail: null,
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

        // 2. Fallback to legacy schema (if hafalan_progress_old didn't exist or was empty)
        const tryLegacy = async (tableName: string) => {
            // Check only what we need, with safer selection
            const { data, error } = await supabase
                .from(tableName)
                .select('*') // Safer than listing missing columns
                .eq('student_id', studentId);

            if (error) return { data: [], error };

            // Re-apply ordering in JS to be safe
            const sorted = (data || []).sort((a, b) => {
                const aj = (a as unknown as { juz?: number }).juz || 0;
                const bj = (b as unknown as { juz?: number }).juz || 0;
                return bj - aj;
            });
            return { data: sorted, error: null };
        };

        let legacyData: unknown[] = [];
        // If old table doesn't exist/empty, maybe the main table IS legacy
        const mainResult = await tryLegacy('hafalan_progress');
        if (mainResult.data?.[0]?.juz !== undefined) {
            legacyData = mainResult.data;
        }


        const latest = legacyData[0] as unknown as { juz?: number; surah_name?: string; start_ayat?: number; end_ayat?: number; updated_at?: string };
        if (!latest) return null; // Return null if absolutely no data found

        const completedJuz = new Set(legacyData.map(h => h as unknown as { status?: string; juz: number }).filter((h) =>
            ['completed', 'selesai', 'tuntas', 'lulus', 'muroja_ah', 'memorized'].includes(h.status?.toLowerCase() || '')
        ).map((h) => h.juz)).size;

        const totalTarget = 30;

        return {
            currentJuz: latest.juz,
            unitLabel: 'Juz',
            programName: 'Hafalan Al-Qur\'an',
            currentName: latest.surah_name ? `Surah ${latest.surah_name}` : `Juz ${latest.juz}`,
            currentDetail: latest ? `Ayat ${latest.start_ayat || 1} - ${latest.end_ayat || '...'}` : null,
            progress: 0,
            totalProgress: Math.round((completedJuz / totalTarget) * 100),
            completed: completedJuz,
            remaining: Math.max(0, totalTarget - completedJuz),
            totalTarget: totalTarget,
            lastUpdate: latest.updated_at || null,
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        try {
            const { data, error } = await supabase
                .from('grades')
                .select(`
                    final_score,
                    uas_score,
                    subjects (name)
                `)
                .eq('student_id', studentId)
                .order('final_score', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            if (!data) return null;

            return {
                ...data,
                score: data.final_score ?? data.uas_score ?? 0
            };
        } catch (err) {
            console.error('Error in getTopScore:', err instanceof Error ? err.message : err);
            return null;
        }
    },

    async getDisciplinePoints(studentId: string) {
        const { data, error } = await supabase
            .from('violations')
            .select('points')
            .eq('student_id', studentId);

        if (error) {
            // Try legacy table?
            const { data: legacy, error: lErr } = await supabase.from('students').select('total_violation_points').eq('id', studentId).single();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!lErr && legacy) return 100 - ((legacy as any).total_violation_points || 0);

            return 100;
        }

        // Base points is 100, deducted by violations
        const totalViolations = (data || []).reduce((acc, curr) => acc + (curr.points || 0), 0);
        return Math.max(0, 100 - totalViolations);
    },

    async getRecentViolations(studentId: string) {
        const { data, error } = await supabase
            .from('violations')
            .select(`
                id,
                created_at,
                description,
                points,
                punishment,
                status
            `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) return [];
        return (data || []).map((v: unknown) => {
            const violation = v as { id: string, created_at: string, description: string, points: number, punishment: string, status: string };
            return {
                id: violation.id,
                created_at: violation.created_at,
                description: violation.description,
                points: violation.points,
                punishment: violation.punishment,
                status: violation.status
            };
        });
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
