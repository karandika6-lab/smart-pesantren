import { supabase } from '../supabase';

export interface Violation {
    id: string;
    student_id: string;
    category: 'ringan' | 'sedang' | 'berat';
    description?: string;
    points: number;
    reported_by?: string;
    violation_date: string;
    status: 'pending' | 'completed' | 'cancelled';
    punishment?: string;
    created_at: string;
}

export interface ViolationWithRelations extends Violation {
    students?: {
        id: string;
        name: string;
        classes?: {
            id: string;
            name: string;
        } | null;
    } | null;
}

export const violationsService = {
    async getAll(): Promise<ViolationWithRelations[]> {
        const { data, error } = await supabase
            .from('violations')
            .select(`
                *,
                students (
                    id,
                    name,
                    classes (
                        id,
                        name
                    )
                )
            `)
            .order('violation_date', { ascending: false });

        if (error) throw error;
        return (data || []) as unknown as ViolationWithRelations[];
    },

    async getById(id: string): Promise<ViolationWithRelations | null> {
        const { data, error } = await supabase
            .from('violations')
            .select(`
                *,
                students (
                    id,
                    name,
                    classes (
                        id,
                        name
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data as unknown as ViolationWithRelations;
    },

    async create(violation: {
        student_id: string;
        type?: string;
        category?: string;
        description?: string;
        points?: number;
        recorded_by?: string;
        reported_by?: string;
        date?: string;
        violation_date?: string;
        status?: 'pending' | 'completed' | 'cancelled';
        pesantren_id?: string;
    }): Promise<Violation> {
        const { requirePesantrenId } = await import('./helpers');
        const pesantrenId = await requirePesantrenId(violation.pesantren_id);

        const { data, error } = await supabase
            .from('violations')
            .insert({
                student_id: violation.student_id,
                category: violation.type || violation.category,
                description: violation.description || null,
                points: violation.points || 0,
                reported_by: violation.recorded_by || violation.reported_by || null,
                violation_date: violation.date || violation.violation_date || new Date().toISOString().split('T')[0],
                status: violation.status || 'pending',
                // punishment: violation.punishment || null, // punishment column might not exist in new schema? let's omit if not in schema-additional or create script
                pesantren_id: pesantrenId
            })
            .select()
            .single();

        if (error) throw error;

        // Trigger Notification (Fire and forget)
        try {
            const { sendNotification } = await import('./notificationUtils');
            const { data: student } = await supabase
                .from('students')
                .select('name')
                .eq('id', violation.student_id)
                .single();
            
            sendNotification({
                studentId: violation.student_id,
                title: 'Laporan Pelanggaran',
                message: `Putra/Putri Anda (${student?.name || 'Santri'}) tercatat melakukan pelanggaran kategori ${violation.type || violation.category}. Deskripsi: ${violation.description || '-'}`,
                type: 'general'
            });
        } catch (notifErr) {
            console.error('Failed to trigger violation notification:', notifErr);
        }

        return data as unknown as Violation;
    },

    async update(id: string, updates: Record<string, unknown>): Promise<Violation> {
        const dbUpdates: Record<string, unknown> = { ...updates };
        if (updates.type) dbUpdates.category = updates.type;
        if (updates.date) dbUpdates.violation_date = updates.date;
        if (updates.recorded_by) dbUpdates.reported_by = updates.recorded_by;

        delete dbUpdates.type;
        delete dbUpdates.date;
        delete dbUpdates.recorded_by;

        const { data, error } = await supabase
            .from('violations')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as Violation;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('violations')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
