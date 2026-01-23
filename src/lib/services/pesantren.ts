import { supabase } from '../supabase';

export interface Pesantren {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    logo_url?: string;
    created_at?: string;
}

export const pesantrenService = {
    async getAll(): Promise<Pesantren[]> {
        const { data, error } = await supabase
            .from('pesantren')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getDetailedAll(): Promise<any[]> {
        // High Speed Fetch: Single query to optimized DB view
        const { data, error } = await supabase
            .from('view_pesantren_dashboard_stats')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch detailed pesantren:', error);
            // Fallback to basic getAll if view doesn't exist yet
            return this.getAll().then(list => list.map(p => ({ ...p, totalStudents: 0, totalUsers: 0 })));
        }

        return data.map(p => ({
            ...p,
            totalStudents: p.total_students || 0,
            totalUsers: p.total_users || 0
        }));
    },

    async getGrowthStats(): Promise<any[]> {
        try {
            // Try RPC function first
            const { data, error } = await supabase.rpc('get_pesantren_growth_6months');
            if (error) throw error;
            return data?.map((d: any) => ({ name: d.month_name, value: d.count })) || [];
        } catch (e) {
            console.warn('get_pesantren_growth_6months not available, using fallback');
            // Fallback to manual calculation
            const { data, error } = await supabase
                .from('pesantren')
                .select('created_at')
                .order('created_at', { ascending: true });

            if (error) throw error;

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
            const statsMap: Record<string, number> = {};

            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
                statsMap[key] = 0;
            }

            data?.forEach(p => {
                const d = new Date(p.created_at);
                const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
                if (statsMap[key] !== undefined) {
                    statsMap[key]++;
                }
            });

            return Object.entries(statsMap).map(([name, value]) => ({ name, value }));
        }
    },

    async getLoginTraffic(): Promise<any[]> {
        const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        const trafficData = days.map(d => ({ name: d, value: 0 }));

        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);

            // Query 'login_logs' table which is populated by handle_user_login RPC
            const { data, error } = await supabase
                .from('login_logs')
                .select('login_time')
                .gte('login_time', startDate.toISOString());

            if (data) {
                // Group by day of week
                const dayCounts: Record<number, number> = {};
                data.forEach(log => {
                    const date = new Date(log.login_time);
                    const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday...
                    // Adjust to match our array (Monday = 0)
                    const arrayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
                    dayCounts[arrayIndex] = (dayCounts[arrayIndex] || 0) + 1;
                });

                return trafficData.map((t, i) => ({
                    name: t.name,
                    value: dayCounts[i] || 0
                }));
            }

            return trafficData;
        } catch (e) {
            console.warn('Error fetching login traffic:', e);
            return trafficData;
        }
    },

    async create(pesantren: Partial<Pesantren>): Promise<Pesantren> {
        const { data, error } = await supabase
            .from('pesantren')
            .insert(pesantren)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<Pesantren>): Promise<Pesantren> {
        const { data, error } = await supabase
            .from('pesantren')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('pesantren')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
