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

    async create(violation: any): Promise<Violation> {
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
        return data as unknown as Violation;
    },

    async update(id: string, updates: any): Promise<Violation> {
        // Map updates to DB columns
        const dbUpdates: any = { ...updates };
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
