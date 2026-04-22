import { supabase } from '../supabase';

export const kesantrianService = {
    async getStats() {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        // 1. Total Violations This Month
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        let vQuery = supabase
            .from('violations')
            .select('*', { count: 'exact', head: true })
            .gte('violation_date', firstDayOfMonth);

        // 2. Pending Permissions
        let pQuery = supabase
            .from('permissions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        // 3. Dorm occupancy
        let dQuery = supabase
            .from('dormitories')
            .select('current_occupancy, capacity');

        if (pesantrenId) {
            vQuery = vQuery.eq('pesantren_id', pesantrenId);
            pQuery = pQuery.eq('pesantren_id', pesantrenId);
            dQuery = dQuery.eq('pesantren_id', pesantrenId);
        }

        const [{ count: violationCount, error: vError }, { count: pendingCount, error: pError }, { data: dorms, error: dError }] = await Promise.all([
            vQuery,
            pQuery,
            dQuery
        ]);

        let occupied = 0;
        let totalCapacity = 0;
        dorms?.forEach(d => {
            occupied += d.current_occupancy || 0;
            totalCapacity += d.capacity || 0;
        });

        // 4. Students Currently "Out"
        const now = new Date().toISOString();
        let oQuery = supabase
            .from('permissions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved')
            .lte('start_date', now)
            .gte('end_date', now);

        if (pesantrenId) oQuery = oQuery.eq('pesantren_id', pesantrenId);
        const { count: outCount, error: oError } = await oQuery;

        if (vError || pError || dError || oError) {
            console.error('Error fetching kesantrian stats:', { vError, pError, dError, oError });
        }

        return {
            totalViolations: violationCount || 0,
            pendingPermissions: pendingCount || 0,
            dormOccupancy: `${occupied}/${totalCapacity}`,
            studentsOut: outCount || 0
        };
    },

    async getViolationTrend() {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase
            .from('violations')
            .select('violation_date')
            .gte('violation_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('violation_date');

        if (pesantrenId) query = query.eq('pesantren_id', pesantrenId);

        const { data, error } = await query;
        if (error) throw error;

        const weeks: Record<string, number> = {
            'Minggu 1': 0,
            'Minggu 2': 0,
            'Minggu 3': 0,
            'Minggu 4': 0,
        };

        const now = new Date();
        data?.forEach(v => {
            const date = new Date(v.violation_date || new Date());
            const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
            if (diffDays <= 7) weeks['Minggu 4']++;
            else if (diffDays <= 14) weeks['Minggu 3']++;
            else if (diffDays <= 21) weeks['Minggu 2']++;
            else if (diffDays <= 30) weeks['Minggu 1']++;
        });

        return Object.entries(weeks).map(([name, violations]) => ({ name, violations }));
    },

    async getViolationRadar() {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase.from('violations').select('category');
        if (pesantrenId) query = query.eq('pesantren_id', pesantrenId);

        const { data, error } = await query;
        if (error) throw error;

        const categories: Record<string, number> = {
            'Ringan': 0,
            'Sedang': 0,
            'Berat': 0,
        };

        data?.forEach(v => {
            const cat = v.category ? (v.category.charAt(0).toUpperCase() + v.category.slice(1)) : 'Unknown';
            if (categories[cat] !== undefined) categories[cat]++;
        });

        return Object.entries(categories).map(([subject, value]) => ({
            subject,
            value,
            fullMark: Math.max(...Object.values(categories), 10)
        }));
    },

    async getPermissionStats() {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase.from('permissions').select('permission_type');
        if (pesantrenId) query = query.eq('pesantren_id', pesantrenId);

        const { data, error } = await query;
        if (error) throw error;

        const types: Record<string, number> = {
            'pulang': 0,
            'keluar': 0,
            'sakit': 0,
            'kegiatan': 0, // Changed from lainnya to match DB schema
        };

        const labels: Record<string, string> = {
            'pulang': 'Pulang',
            'keluar': 'Izin Keluar',
            'sakit': 'Sakit',
            'kegiatan': 'Kegiatan',
        };

        (data || []).forEach((v: unknown) => {
            const permission = v as { permission_type: string };
            if (permission.permission_type && types[permission.permission_type] !== undefined) {
                types[permission.permission_type]++;
            }
        });

        return Object.entries(types).map(([key, value]) => ({
            name: labels[key] || key,
            value
        }));
    },

    async getPendingPermissions() {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase
            .from('permissions')
            .select(`
                *,
                students (
                    name,
                    class_id,
                    classes (name),
                    parent_name,
                    parent_phone
                )
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (pesantrenId) query = query.eq('pesantren_id', pesantrenId);

        const { data, error } = await query;
        if (error) throw error;

        interface StudentInfo {
            name: string;
            classes?: { name: string } | null;
            parent_name?: string | null;
            parent_phone?: string | null;
        }

        interface PermissionRow {
            id: string;
            students: StudentInfo | null;
            reason: string;
            start_date: string;
            end_date: string;
            status: string;
            created_at: string;
        }

        return (data as unknown as PermissionRow[] || []).map((p) => ({
            id: p.id,
            studentName: p.students?.name || 'Unknown',
            studentClass: p.students?.classes?.name || 'Unknown',
            parentName: p.students?.parent_name || 'N/A',
            parentPhone: p.students?.parent_phone || 'N/A',
            reason: p.reason,
            startDate: new Date(p.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            endDate: new Date(p.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            status: p.status,
            createdAt: new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        }));
    },

    async getPermissionHistory() {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase
            .from('permissions')
            .select(`
                *,
                students (
                    name,
                    class_id,
                    classes (name),
                    parent_name,
                    parent_phone
                )
            `)
            .neq('status', 'pending')
            .order('created_at', { ascending: false }); // Changed updated_at to created_at if updated_at is missing or null

        if (pesantrenId) query = query.eq('pesantren_id', pesantrenId);

        const { data, error } = await query;
        if (error) throw error;

        interface StudentInfo {
            name: string;
            classes?: { name: string } | null;
            parent_name?: string | null;
            parent_phone?: string | null;
        }

        interface PermissionRow {
            id: string;
            students: StudentInfo | null;
            reason: string;
            start_date: string;
            end_date: string;
            status: string;
            created_at: string;
        }

        return (data as unknown as PermissionRow[] || []).map((p) => ({
            id: p.id,
            studentName: p.students?.name || 'Unknown',
            studentClass: p.students?.classes?.name || 'Unknown',
            parentName: p.students?.parent_name || 'N/A',
            parentPhone: p.students?.parent_phone || 'N/A',
            reason: p.reason,
            startDate: new Date(p.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            endDate: new Date(p.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            status: p.status,
            createdAt: new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        }));
    },

    async updatePermissionStatus(id: string, status: 'approved' | 'rejected', handledBy: string) {
        const { error } = await supabase
            .from('permissions')
            .update({
                status,
                approved_by: status === 'approved' ? handledBy : null,
            })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async recordViolation(violation: {
        studentId: string;
        type: 'ringan' | 'sedang' | 'berat';
        description: string;
        points: number;
        reportedBy: string;
    }) {
        const { requirePesantrenId } = await import('./helpers');
        const pesantrenId = await requirePesantrenId();

        const { error } = await supabase
            .from('violations')
            .insert({
                student_id: violation.studentId,
                category: violation.type, // Map type -> category
                description: violation.description,
                points: violation.points,
                reported_by: violation.reportedBy, // Map recorded_by -> reported_by
                violation_date: new Date().toISOString().split('T')[0], // Map date -> violation_date
                status: 'pending',
                pesantren_id: pesantrenId
            });

        if (error) throw error;

        // Trigger Notification (Fire and forget)
        try {
            const { sendNotification } = await import('./notificationUtils');
            const { data: student } = await supabase
                .from('students')
                .select('name')
                .eq('id', violation.studentId)
                .single();
            
            await sendNotification({
                studentId: violation.studentId,
                title: 'Laporan Pelanggaran',
                message: `Putra/Putri Anda (${student?.name || 'Santri'}) tercatat melakukan pelanggaran kategori ${violation.type}. Deskripsi: ${violation.description}`,
                type: 'general'
            });
        } catch (notifErr) {
            console.error('Failed to trigger violation notification:', notifErr);
        }

        return true;
    },

    async getAllViolations() {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase
            .from('violations')
            .select(`
                *,
                students (
                    name,
                    classes (name)
                )
            `)
            .order('violation_date', { ascending: false });

        if (pesantrenId) query = query.eq('pesantren_id', pesantrenId);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async getDormitoryDensity() {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        let query = supabase
            .from('dormitories')
            .select('name, current_occupancy, capacity');

        if (pesantrenId) query = query.eq('pesantren_id', pesantrenId);

        const { data, error } = await query;
        if (error) throw error;

        const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

        return (data || []).map((d, index) => ({
            name: d.name,
            value: Math.round(((d.current_occupancy || 0) / (d.capacity || 1)) * 100),
            fullMark: 100,
            color: colors[index % colors.length]
        }));
    },

    async getTopViolators() {
        // Fetch from SQL View (Aggregated Points)
        const { data, error } = await supabase
            .from('view_student_violation_points')
            .select('*')
            .order('total_points', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Failed to fetch top violators:', error);
            // Fallback empty if view error
            return [];
        }

        return data;
    }
};
