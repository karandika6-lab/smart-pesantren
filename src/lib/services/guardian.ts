import { supabase } from '../supabase';

export const guardianService = {
    async getChildren(userId: string) {
        const { data, error } = await supabase
            .from('students')
            .select('*, classes(name)')
            .eq('parent_user_id', userId);

        if (error) throw error;
        return data || [];
    },

    async getHafalanGrowth(studentId: string) {
        // Try V2 first
        const { data: v2Data, error: v2Error } = await supabase
            .from('hafalan_progress')
            .select('created_at, unit_number')
            .eq('student_id', studentId)
            .order('created_at');

        if (!v2Error && v2Data && v2Data.length > 0) {
            const months: Record<string, number> = {};
            v2Data.forEach(h => {
                const month = new Date(h.created_at).toLocaleDateString('id-ID', { month: 'short' });
                months[month] = Math.max(months[month] || 0, h.unit_number);
            });

            return Object.entries(months).map(([month, unit]) => ({
                month,
                pages: unit // Mapping unit to pages for UI consistency
            }));
        }

        // Fallback to old table
        const { data: oldData } = await supabase
            .from('hafalan_progress_old')
            .select('created_at, end_ayat, start_ayat')
            .eq('student_id', studentId)
            .order('created_at');

        // Group by month
        const months: Record<string, number> = {};
        oldData?.forEach(h => {
            const month = new Date(h.created_at).toLocaleDateString('id-ID', { month: 'short' });
            const pages = Math.ceil(((h.end_ayat || 0) - (h.start_ayat || 0) + 1) / 15);
            months[month] = (months[month] || 0) + pages;
        });

        // Accumulative growth
        let total = 0;
        return Object.entries(months).map(([month, pages]) => {
            total += pages;
            return { month, pages: total };
        });
    },

    async getPotentialRadar(studentId: string) {
        const { data, error } = await supabase
            .from('grades')
            .select('final_grade, subjects(name)')
            .eq('student_id', studentId);

        if (error) throw error;

        // Map categories (simplification)
        const categories: Record<string, { total: number, count: number }> = {};
        data?.forEach((g: any) => {
            const name = g.subjects?.name || 'Unknown';
            const score = g.final_grade || 0;
            if (!categories[name]) categories[name] = { total: 0, count: 0 };
            categories[name].total += score;
            categories[name].count++;
        });

        return Object.entries(categories).map(([subject, stats]) => ({
            subject,
            A: Math.round(stats.total / stats.count),
            fullMark: 100
        })).slice(0, 6);
    },

    async getAttendanceHeatmap(studentId: string) {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

        const { data, error } = await supabase
            .from('attendance')
            .select('date, status')
            .eq('student_id', studentId)
            .gte('date', firstDayOfMonth);

        if (error) throw error;

        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const heatmap = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const record = data?.find(d => new Date(d.date).getDate() === day);
            return {
                day,
                status: record?.status || 'none'
            };
        });

        return heatmap;
    }
};
