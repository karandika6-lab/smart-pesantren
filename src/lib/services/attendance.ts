import { supabase } from '../supabase';
import { getPesantrenId, getLocalDate } from './helpers';

// Update interface to allow null/undefined status initially
export interface AttendanceItem {
    student_id: string;
    student_name: string;
    class_name?: string;
    nis: string;
    status: 'hadir' | 'izin' | 'sakit' | 'alpha' | 'telat' | null;
    notes: string;
}

export interface AttendanceStats {
    totalStudents: number;
    presentToday: number;
    sickPermissionToday: number;
    alphaToday: number;
}

export interface AttendanceRekapItem {
    id: string;
    studentId: string;
    studentName: string;
    studentClass: string;
    classId: string;
    session: string;
    status: string;
    date: string;
}



export const attendanceService = {
    // 1. Get Class Roster with attendance status for a specific date
    async getClassAttendance(
        classId: string | null,
        date: string,
        session?: string,
        type: string = 'class'
    ): Promise<AttendanceItem[]> {
        const { data, error } = await supabase.rpc('get_class_attendance_status', {
            p_class_id: (classId === 'all' || !classId) ? undefined : classId,
            p_date: date,
            p_session: session,
            p_type: type
        } as any);

        if (error) {
            console.error('Error fetching class attendance:', error);
            throw error;
        }

        return (data || []).map((item: { student_id: string, student_name: string, class_name: string, nis: string, status: string | null, notes: string | null }) => ({
            student_id: item.student_id,
            student_name: item.student_name,
            class_name: item.class_name,
            nis: item.nis,
            // Status remains null if from DB is null. We handle default in UI Page based on Class Selection.
            status: item.status as AttendanceItem['status'],
            notes: item.notes || ''
        }));
    },
    // 2. Submit Attendance (Batch)
    async submitAttendance(
        date: string,
        attendanceList: AttendanceItem[],
        recordedBy: string,
        session?: string, // e.g. "Madin"
        type: string = 'class' // 'class', 'prayer', etc.
    ) {
        const pesantrenId = await getPesantrenId();

        // Transform to minimal payload for RPC
        const payload = attendanceList.map(item => ({
            student_id: item.student_id,
            status: item.status,
            notes: item.notes
        }));

        // Ensure type matches DB constraint ('class', 'prayer', 'activity')
        let dbType = type;
        if (type === 'academic' || type === 'class') dbType = 'class';
        else if (type === 'prayer') dbType = 'prayer';
        else dbType = 'activity'; // Default and fallback for 'activity', 'other', 'kegiatan_umum', etc.

        console.log('Payload:', JSON.stringify(payload));
        const { data, error } = await supabase.rpc('submit_class_attendance', {
            p_date: date,
            p_attendance_list: payload,
            p_recorded_by: recordedBy,
            p_pesantren_id: pesantrenId || undefined,
            p_session: session,
            p_type: dbType
        } as any);

        if (error) {
            console.error('Error submitting attendance RPC:', error);
            throw error;
        }

        // Handle RPC internal failure (EXCEPTION block in SQL)
        if (data && (data as any).success === false) {
            console.error('RPC Submission Failed:', (data as any).message);
            throw new Error((data as any).message || 'Gagal menyimpan absensi ke database');
        }

        // Trigger Push Notifications for statuses that need parent info
        try {
            const filteredStudents = attendanceList.filter(item => 
                item.status && ['hadir', 'alpha', 'sakit', 'izin', 'tidak_hadir', 'telat'].includes(item.status)
            );

            for (const student of filteredStudents) {
                let statusText = 
                    student.status === 'hadir' ? 'Hadir' :
                    student.status === 'sakit' ? 'Sakit' : 
                    student.status === 'izin' ? 'Izin' : 
                    student.status === 'telat' ? 'Terlambat' : 'Alpha (Tidak Hadir)';
                                 
                fetch('/api/notifications/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: student.student_id,
                        title: `Pemberitahuan Absensi: ${session || 'Harian'}`,
                        message: `Putra/Putri Anda pada sesi ini tercatat dengan status: ${statusText}. ${student.notes ? 'Catatan: ' + student.notes : ''}`,
                        type: 'absensi'
                    })
                }).catch(e => console.error("Notification trigger error:", e));
            }
        } catch (notifErr) {
            console.error("Non-blocking error firing notification:", notifErr);
        }

        return data;
    },

    // 3. Get Attendance Statistics for Dashboard
    async getStats(): Promise<AttendanceStats> {
        const pesantrenId = await getPesantrenId();
        const today = getLocalDate();

        // Get total students
        let studentQuery = supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        if (pesantrenId) {
            studentQuery = studentQuery.eq('pesantren_id', pesantrenId);
        }

        const { count: totalStudents } = await studentQuery;

        // Get today's attendance
        let attendanceQuery = supabase
            .from('attendance')
            .select('student_id, status')
            .eq('date', today);

        if (pesantrenId) {
            attendanceQuery = attendanceQuery.eq('pesantren_id', pesantrenId);
        }

        // Filter removed to include ALL attendance types (Prayer, Class, Activity)
        // attendanceQuery = attendanceQuery.in('type', ['class', 'academic']);

        const { data: todayAttendance } = await attendanceQuery;

        // Group by student_id to avoid double counting same student in multiple sessions
        const uniqueStudents = new Set();
        let presentToday = 0;
        let sickPermissionToday = 0;
        let alphaToday = 0;

        (todayAttendance || []).forEach(a => {
            if (!uniqueStudents.has(a.student_id)) {
                uniqueStudents.add(a.student_id);
                if (a.status === 'hadir') presentToday++;
                else if (a.status === 'sakit' || a.status === 'izin') sickPermissionToday++;
                else if (a.status === 'alpha') alphaToday++;
            }
        });

        return {
            totalStudents: totalStudents || 0,
            presentToday,
            sickPermissionToday,
            alphaToday
        };
    },

    // 4. Get Presence Meter (percentage)
    async getPresenceMeter(): Promise<number> {
        const pesantrenId = await getPesantrenId();
        const today = getLocalDate();
        
        let query = supabase
            .from('attendance')
            .select('student_id, status')
            .eq('date', today);
        // .in('type', ['class', 'academic']); // Focus on school/academic attendance

        if (pesantrenId) {
            query = query.eq('pesantren_id', pesantrenId);
        }

        const { data } = await query;
 
         if (!data || data.length === 0) return 0;
 
         // Count unique students who ever attended today
         const totalUnique = new Set(data.map(d => d.student_id)).size;
         const presentUnique = new Set(data.filter(a => a.status === 'hadir').map(d => d.student_id)).size;
 
         return totalUnique > 0 ? Math.round((presentUnique / totalUnique) * 100) : 0;
    },

    // 5. Get Session Alpha (for bar chart)
    async getSessionAlpha(): Promise<{ name: string; alpha: number }[]> {
        const pesantrenId = await getPesantrenId();
        const today = getLocalDate();

        let query = supabase
            .from('attendance')
            .select('session, status')
            .eq('date', today)
            .eq('status', 'alpha');

        if (pesantrenId) {
            query = query.eq('pesantren_id', pesantrenId);
        }

        const { data } = await query;

        // Group by session name
        const counts: Record<string, number> = {};

        (data || []).forEach((row: { session: string | null; status: string }) => {
            const sessionName = row.session || 'Umum';
            counts[sessionName] = (counts[sessionName] || 0) + 1;
        });

        // Convert to array
        const result = Object.keys(counts).map(key => ({
            name: key,
            alpha: counts[key]
        }));

        // If empty, return dummy structure to avoid chart crash, but with 0 values? 
        // No, better return empty or specific empty state in UI.
        // Let's return at least one if empty so chart renders valid empty state if needed.
        if (result.length === 0) return [];

        return result;
    },

    // 6. Get Student Attendance Summary (percentage)
    async getStudentAttendanceSummary(studentId: string): Promise<number> {
        const { data } = await supabase
            .from('attendance')
            .select('status')
            .eq('student_id', studentId);

        if (!data || data.length === 0) return 100;

        const present = data.filter(a => a.status === 'hadir').length;
        return Math.round((present / data.length) * 100);
    },

    // 7. Get Rekap (for admin rekap page)
    async getRekap(filters: { date?: string; search?: string }): Promise<AttendanceRekapItem[]> {
        let query = supabase
            .from('attendance')
            .select(`
                id,
                date,
                status,
                notes,
                check_in_time,
                session,
                students (
                    id,
                    name,
                    nis,
                    class_id,
                    classes (name)
                )
            `)
            .order('date', { ascending: false });

        if (filters.date) {
            query = query.eq('date', filters.date);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching rekap:', error);
            return [];
        }

        interface RekapRow {
            id: string;
            date: string;
            status: string;
            notes: string | null;
            session: string | null;
            students: {
                id: string;
                name: string;
                nis: string;
                class_id: string;
                classes: { name: string } | null;
            } | null;
        }

        const result = (data as unknown as RekapRow[] || []).map((item): AttendanceRekapItem => ({
            id: item.id,
            studentId: item.students?.id || 'Unknown',
            studentName: item.students?.name || 'Unknown',
            studentClass: item.students?.classes?.name || 'N/A',
            classId: item.students?.class_id || 'Unknown',
            session: item.session || 'Umum',
            status: item.status,
            date: new Date(item.date).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric'
            })
        }));

        // Filter by search if provided
        if (filters.search) {
            const search = filters.search.toLowerCase();
            return result.filter((r: { studentName: string, studentClass: string }) =>
                r.studentName.toLowerCase().includes(search) ||
                r.studentClass.toLowerCase().includes(search)
            );
        }

        return result;
    },

    // 8. Get Student History (for wali/parent dashboard)
    async getStudentHistory(studentId: string): Promise<unknown[]> {
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                id,
                date,
                status,
                notes,
                check_in_time,
                session,
                type
            `)
            .eq('student_id', studentId)
            .order('date', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching student history:', error);
            return [];
        }

        return data || [];
    },

    // 9. Get Monthly Report (Raw Data for Excel)
    async getMonthlyReport(month: number, year: number, classId?: string): Promise<unknown[]> {
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        // Calculate end date (last day of month)
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const query = supabase
            .from('attendance')
            .select(`
                date,
                status,
                type,
                session,
                students (
                    name,
                    nis,
                    classes (name)
                )
            `)
            .gte('date', startDate)
            .lte('date', endDate);

        // If classId provided, we need to filter on the joined table, but Supabase simple query can't do deep filter easily without !inner
        // Use RPC or fetch all and filter in JS if dataset is small.
        // For standard Supabase, we can verify if 'classes' filter works with inner join:
        if (classId) {
            // For now, let's fetch all and filter client side or implement RPC for optimization later
        }

        const { data, error } = await query;
 
         if (error) {
             console.error(error);
             return [];
         }
 
         return data || [];
     },
 
     // 10. Get Single Student Today's Status (for Santri/Wali dashboard)
     async getStudentTodayStatus(studentId: string): Promise<string | null> {
         const today = getLocalDate();
         const { data } = await supabase
             .from('attendance')
             .select('status')
             .eq('student_id', studentId)
             .eq('date', today)
             .order('updated_at', { ascending: false })
             .limit(1)
             .maybeSingle();
         
         return data?.status || null;
     }
 };
