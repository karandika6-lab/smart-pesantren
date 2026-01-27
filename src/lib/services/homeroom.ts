import { supabase } from '../supabase';

export const homeroomService = {
    async getClassInfo(userId: string) {
        // First, get teacher ID from user ID
        const { data: teacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!teacher) {
            return null; // User is not a teacher
        }

        // Then get class info using teacher ID
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .eq('homeroom_teacher_id', teacher.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    async getStudents(classId: string) {
        console.log('Fetching students for classId:', classId);
        const { data, error } = await supabase
            .from('students')
            .select('id, name, nis, gender, birth_place, birth_date, status')
            .eq('class_id', classId)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching students:', error);
            // Don't throw, just return empty to prevent crash
            return [];
        }
        console.log('Fetched students count:', data?.length);
        return data || [];
    },

    async getAttendanceSummary(classId: string) {
        const today = new Date().toISOString().split('T')[0];

        // Join with students to filter by class
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                status,
                students!inner(class_id)
            `)
            .eq('date', today)
            .eq('students.class_id', classId);

        if (error) throw error;

        const summary = {
            'Hadir': 0,
            'Sakit': 0,
            'Izin': 0,
            'Alpha': 0,
        };

        const colors: Record<string, string> = {
            'Hadir': '#10b981',
            'Sakit': '#f59e0b',
            'Izin': '#3b82f6',
            'Alpha': '#ef4444',
        };

        data?.forEach((a: unknown) => {
            const att = a as { status: string };
            const status = (att.status.charAt(0).toUpperCase() + att.status.slice(1)) as keyof typeof summary;
            if (summary[status] !== undefined) summary[status]++;
        });

        return Object.entries(summary).map(([name, value]) => ({
            name,
            value,
            color: colors[name]
        }));
    },

    async getGradeSummary(classId: string) {
        const { data, error } = await supabase
            .from('grades')
            .select(`
                score,
                subjects(name),
                students!inner(class_id)
            `)
            .eq('students.class_id', classId);

        if (error) throw error;

        const subjectSums: Record<string, { total: number, count: number }> = {};
        data?.forEach((g: unknown) => {
            const gd = g as { score: number, subjects: { name: string } | null };
            const subjectName = gd.subjects?.name || 'Unknown';
            if (!subjectSums[subjectName]) subjectSums[subjectName] = { total: 0, count: 0 };
            subjectSums[subjectName].total += gd.score;
            subjectSums[subjectName].count++;
        });

        return Object.entries(subjectSums).map(([subject, stats]) => ({
            subject,
            score: Math.round(stats.total / stats.count)
        })).sort((a, b) => b.score - a.score).slice(0, 5);
    },

    async getTopViolations(classId: string) {
        const { data, error } = await supabase
            .from('violations')
            .select(`
                points,
                students!inner(name, class_id)
            `)
            .eq('students.class_id', classId);

        if (error) throw error;

        const studentPoints: Record<string, number> = {};
        data?.forEach((v: unknown) => {
            const violation = v as { points: number, students: { name: string } | null };
            const name = violation.students?.name || 'Unknown';
            studentPoints[name] = (studentPoints[name] || 0) + violation.points;
        });

        const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-rose-500'];

        return Object.entries(studentPoints)
            .map(([name, points], i) => ({
                name,
                points,
                color: colors[i % colors.length]
            }))
            .sort((a, b) => b.points - a.points)
            .slice(0, 5);
    }
};
