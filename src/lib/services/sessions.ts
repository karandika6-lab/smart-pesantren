import { supabase } from '../supabase';

export interface AttendanceSession {
    id: string;
    name: string;
    category: 'academic' | 'prayer' | 'activity' | 'other';
    start_time: string | null;
    end_time: string | null;
    is_active: boolean;
    created_at?: string;
}

export const sessionsService = {
    async getAll(): Promise<AttendanceSession[]> {
        const { data, error } = await supabase
            .from('attendance_sessions')
            .select('*')
            .order('start_time', { ascending: true });

        if (error) {
            console.error('Error fetching sessions:', error);
            throw error;
        }

        return data || [];
    },

    async create(session: Partial<AttendanceSession>): Promise<AttendanceSession> {
        const { data, error } = await supabase
            .from('attendance_sessions')
            .insert(session)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<AttendanceSession>): Promise<AttendanceSession> {
        const { data, error } = await supabase
            .from('attendance_sessions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('attendance_sessions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getCurrentSession(): Promise<AttendanceSession | null> {
        // Get all sessions and check time client-side for simplicity
        // or use SQL time checks if preferred. Client-side is fine for few sessions.
        const { data } = await supabase
            .from('attendance_sessions')
            .select('*')
            .eq('is_active', true);

        if (!data) return null;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

        const activeSession = data.find(session => {
            if (!session.start_time) return false;

            // Parse HH:MM
            const [startH, startM] = session.start_time.split(':').map(Number);
            const startTime = startH * 60 + startM;

            let endTime = startTime + 90; // Default 90 mins duration if no end_time
            if (session.end_time) {
                const [endH, endM] = session.end_time.split(':').map(Number);
                endTime = endH * 60 + endM;
            }

            return currentTime >= startTime && currentTime <= endTime;
        });

        // If no session is currently active, maybe return the Next upcoming session?
        // For "Sesi Saat Ini", if none open, maybe show "Tidak ada sesi aktif"?
        return activeSession || null;
    }
};
