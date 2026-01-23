import { supabase } from '../supabase';

export const ustadzService = {
    /**
     * Helper to get teacher record ID from user ID
     */
    async getTeacherId(userId: string) {
        if (!userId) return null;

        try {
            // 1. Try to get existing teacher record
            let { data, error } = await supabase
                .from('teachers')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle();

            // 2. Auto-repair/sync: If user is ustadz but record missing in teachers table
            if (!data && !error) {
                console.log('Teacher record missing. Attempting auto-reconcile for userId:', userId);
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

                if (profile && (profile.role === 'ustadz' || profile.role === 'wali_kelas')) {
                    const { data: newTeacher, error: createError } = await supabase
                        .from('teachers')
                        .insert([{
                            user_id: userId,
                            name: profile.name,
                            email: profile.email,
                            is_active: true,
                            pesantren_id: profile.pesantren_id,
                            status: 'active'
                        }])
                        .select()
                        .single();

                    if (!createError) return newTeacher.id;
                    console.error('Reconcile failed:', createError);
                }
            }

            if (error) {
                console.error('Supabase error in getTeacherId:', error);
                return null;
            }

            return data?.id || null;
        } catch (err) {
            console.error('Unexpected error in getTeacherId:', err);
            return null;
        }
    },

    async getGradeDistribution(userId: string) {
        try {
            const teacherId = await this.getTeacherId(userId);
            if (!teacherId) {
                console.warn('getGradeDistribution: No teacher record found for', userId);
                return [];
            }

            const { data, error } = await supabase
                .from('grades')
                .select('grade_letter')
                .eq('teacher_id', teacherId);

            if (error) throw error;

            const distribution: Record<string, number> = {
                'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0
            };

            const colors: Record<string, string> = {
                'A': '#8b5cf6', 'B': '#a78bfa', 'C': '#c4b5fd', 'D': '#ddd6fe', 'E': '#ede9fe'
            };

            data?.forEach(g => {
                const grade = g.grade_letter || 'C';
                if (distribution[grade] !== undefined) distribution[grade]++;
            });

            return Object.entries(distribution).map(([grade, count]) => ({
                grade,
                count,
                color: colors[grade]
            }));
        } catch (err) {
            console.error('Error in getGradeDistribution:', err);
            return [];
        }
    },

    async getHafalanProgress(userId: string) {
        try {
            // STRATEGY: 
            // 1. Try V2 Schema (New): Hafalan records use evaluated_by (User ID)
            const { data: v2Data, error: v2Error } = await supabase
                .from('hafalan_progress')
                .select('created_at, unit_number')
                .eq('evaluated_by', userId)
                .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

            // If V2 call succeeded and found data, use it
            if (!v2Error && v2Data && v2Data.length > 0) {
                const weeks: Record<string, { total: number, count: number }> = {
                    'Minggu 1': { total: 0, count: 0 },
                    'Minggu 2': { total: 0, count: 0 },
                    'Minggu 3': { total: 0, count: 0 },
                    'Minggu 4': { total: 0, count: 0 },
                };

                const now = new Date();
                v2Data.forEach(h => {
                    const date = new Date(h.created_at);
                    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
                    let weekKey = '';
                    if (diffDays <= 7) weekKey = 'Minggu 4';
                    else if (diffDays <= 14) weekKey = 'Minggu 3';
                    else if (diffDays <= 21) weekKey = 'Minggu 2';
                    else if (diffDays <= 30) weekKey = 'Minggu 1';

                    if (weekKey) {
                        weeks[weekKey].total += 1;
                        weeks[weekKey].count += 1;
                    }
                });

                return Object.entries(weeks).map(([week, stats]) => ({
                    week,
                    average: stats.total
                }));
            }

            // 2. Fallback to V2 Schema but check if data exists
            // Since the main table no longer has teacher_id, we should NEVER query it there.
            // If we want legacy data, we check hafalan_progress_old
            const { data: oldData, error: oldError } = await supabase
                .from('hafalan_progress_old')
                .select('created_at')
                .eq('teacher_id', await this.getTeacherId(userId));

            if (oldError || !oldData || oldData.length === 0) {
                return [];
            }

            const weeks: Record<string, { total: number, count: number }> = {
                'Minggu 1': { total: 0, count: 0 },
                'Minggu 2': { total: 0, count: 0 },
                'Minggu 3': { total: 0, count: 0 },
                'Minggu 4': { total: 0, count: 0 },
            };

            const now = new Date();
            oldData.forEach(h => {
                const date = new Date(h.created_at);
                const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

                let weekKey = '';
                if (diffDays <= 7) weekKey = 'Minggu 4';
                else if (diffDays <= 14) weekKey = 'Minggu 3';
                else if (diffDays <= 21) weekKey = 'Minggu 2';
                else if (diffDays <= 30) weekKey = 'Minggu 1';

                if (weekKey) {
                    weeks[weekKey].total += 1;
                    weeks[weekKey].count += 1;
                }
            });

            return Object.entries(weeks).map(([week, stats]) => ({
                week,
                average: stats.total
            }));
        } catch (err) {
            console.error('Error in getHafalanProgress:', err);
            return [];
        }
    },

    async getTodaySchedule(userId: string) {
        try {
            const teacherId = await this.getTeacherId(userId);
            if (!teacherId) return [];

            const today = new Date().getDay();

            const { data, error } = await supabase
                .from('schedules')
                .select(`
                    id, start_time, end_time, room,
                    classes (name),
                    subjects (name)
                `)
                .eq('teacher_id', teacherId)
                .eq('day_of_week', today)
                .order('start_time');

            if (error) throw error;

            return (data || []).map(s => ({
                time: `${s.start_time?.slice(0, 5) || '--:--'} - ${s.end_time?.slice(0, 5) || '--:--'}`,
                subject: (s.subjects as any)?.name || 'Unknown',
                class: (s.classes as any)?.name || 'N/A',
                room: s.room || 'Room N/A'
            }));
        } catch (err) {
            console.error('Error in getTodaySchedule:', err);
            return [];
        }
    },

    async getFullWeeklySchedule(userId: string) {
        try {
            const teacherId = await this.getTeacherId(userId);
            if (!teacherId) return {};

            const { data, error } = await supabase
                .from('schedules')
                .select(`
                    id, day_of_week, start_time, end_time, room,
                    classes (name),
                    subjects (name)
                `)
                .eq('teacher_id', teacherId)
                .order('day_of_week')
                .order('start_time');

            if (error) throw error;

            const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const grouped: Record<string, any[]> = {};
            dayNames.forEach(day => grouped[day] = []);

            data?.forEach(s => {
                const day = dayNames[s.day_of_week];
                grouped[day].push({
                    id: s.id,
                    time: `${s.start_time?.slice(0, 5) || '--:--'} - ${s.end_time?.slice(0, 5) || '--:--'}`,
                    subject: (s.subjects as any)?.name || 'Unknown',
                    class: (s.classes as any)?.name || 'N/A',
                    room: s.room || 'Room N/A',
                    status: 'Aktif'
                });
            });

            return grouped;
        } catch (err) {
            console.error('Error in getFullWeeklySchedule:', err);
            return {};
        }
    },

    async getAssignedClasses(userId: string) {
        try {
            const teacherId = await this.getTeacherId(userId);
            if (!teacherId) return [];

            const { data, error } = await supabase
                .from('schedules')
                .select(`
                    class_id,
                    classes (id, name)
                `)
                .eq('teacher_id', teacherId);

            if (error) throw error;

            const uniqueClasses = Array.from(new Set(data.map(d => d.class_id)))
                .map(id => {
                    const item = data.find(d => d.class_id === id);
                    return item?.classes;
                })
                .filter(Boolean);

            return uniqueClasses as any[];
        } catch (err) {
            console.error('Error in getAssignedClasses:', err);
            return [];
        }
    },

    async getAssignedSubjects(userId: string) {
        try {
            const teacherId = await this.getTeacherId(userId);
            if (!teacherId) return [];

            const { data, error } = await supabase
                .from('schedules')
                .select(`
                    subject_id,
                    subjects (id, name)
                `)
                .eq('teacher_id', teacherId);

            if (error) throw error;

            const uniqueSubjects = Array.from(new Set(data.map(d => d.subject_id)))
                .map(id => {
                    const item = data.find(d => d.subject_id === id);
                    return item?.subjects;
                })
                .filter(Boolean);

            return uniqueSubjects as any[];
        } catch (err) {
            console.error('Error in getAssignedSubjects:', err);
            return [];
        }
    },

    async getMyStudents(userId: string) {
        try {
            const teacherId = await this.getTeacherId(userId);
            if (!teacherId) return [];

            const { data: classData } = await supabase
                .from('schedules')
                .select('class_id')
                .eq('teacher_id', teacherId);

            const classIds = Array.from(new Set(classData?.map(d => d.class_id) || []));
            if (classIds.length === 0) return [];

            const { data: students, error: studentError } = await supabase
                .from('students')
                .select(`
                    id, name, nis, class_id, 
                    classes (id, name)
                `)
                .in('class_id', classIds)
                .eq('status', 'active')
                .order('name');

            if (studentError || !students) throw studentError || new Error('No students found');

            const studentIds = students.map(s => s.id);
            const { data: progressData } = await supabase
                .from('hafalan_progress')
                .select('student_id, unit_number, grade')
                .in('student_id', studentIds)
                .order('created_at', { ascending: true });

            return students.map(s => {
                const studentProgress = progressData?.filter(p => p.student_id === s.id) || [];
                // Sort locally to get latest by creation
                const latest = studentProgress.length > 0 ? studentProgress[studentProgress.length - 1] : null;

                return {
                    id: s.id,
                    name: s.name,
                    class: (s.classes as any)?.name || '-',
                    lastJuz: latest ? latest.unit_number : '-',
                    totalJuz: studentProgress.length,
                    status: latest && (latest.grade === 'A' || latest.grade === 'B') ? 'Lancar' : studentProgress.length > 0 ? 'Perlu Muraja\'ah' : 'Baru'
                };
            });
        } catch (err) {
            console.error('Error in getMyStudents:', err);
            return [];
        }
    },

    async getDashboardStats(userId: string) {
        try {
            const teacherId = await this.getTeacherId(userId);
            if (!teacherId) return { totalStudents: 0, totalSubjects: 0, activeSchedules: 0, totalHafalan: 0 };

            const [students, subjects, schedules, hafalan] = await Promise.all([
                supabase.from('schedules').select('class_id').eq('teacher_id', teacherId),
                supabase.from('schedules').select('subject_id').eq('teacher_id', teacherId),
                supabase.from('schedules').select('id').eq('teacher_id', teacherId),
                supabase.from('hafalan_progress').select('id').eq('evaluated_by', userId)
            ]);

            // Approximate student count by classes taught
            const classIds = Array.from(new Set((students.data || []).map(s => s.class_id)));
            const { count: studentCount } = await supabase
                .from('students')
                .select('id', { count: 'exact', head: true })
                .in('class_id', classIds);

            return {
                totalStudents: studentCount || 0,
                totalSubjects: new Set((subjects.data || []).map(s => s.subject_id)).size,
                activeSchedules: (schedules.data || []).length,
                totalHafalan: (hafalan.data || []).length
            };
        } catch (err) {
            console.error('Error in getDashboardStats:', err);
            return { totalStudents: 0, totalSubjects: 0, activeSchedules: 0, totalHafalan: 0 };
        }
    }
};
