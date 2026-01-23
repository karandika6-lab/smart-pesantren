import { supabase } from '../supabase';

export interface Dormitory {
    id: string;
    name: string;
    capacity: number;
    current_occupancy: number;
    supervisor_id?: string | null;
    created_at: string;
}

export interface DormitoryWithRelations extends Dormitory {
    supervisor?: { id: string; name: string } | null;
}

export const dormitoriesService = {
    async getAll(): Promise<DormitoryWithRelations[]> {
        const { data, error } = await supabase
            .from('dormitories')
            .select(`
                *,
                supervisor:profiles(id, name)
            `)
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<DormitoryWithRelations | null> {
        const { data, error } = await supabase
            .from('dormitories')
            .select(`
                *,
                supervisor:profiles(id, name)
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    async create(dorm: any): Promise<Dormitory> {
        const { requirePesantrenId } = await import('./helpers');
        const pesantrenId = await requirePesantrenId(dorm.pesantren_id);

        const { data, error } = await supabase
            .from('dormitories')
            .insert({
                name: dorm.name,
                building: dorm.building,
                capacity: dorm.capacity || 20,
                current_occupancy: dorm.current_occupancy || 0,
                supervisor_id: dorm.supervisor_id || null, // Handle empty string
                pesantren_id: pesantrenId
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: any): Promise<Dormitory> {
        // Use RPC to bypass PostgREST cache issues (PGRST204)
        // This ensures the update works even if the API schema cache is stale
        const { data, error } = await supabase.rpc('update_dormitory_safe', {
            p_id: id,
            p_name: updates.name,
            p_building: updates.building,
            p_capacity: updates.capacity,
            p_supervisor_id: updates.supervisor_id || null
        });

        if (error) {
            console.error("RPC Update failed:", error);
            // Fallback to standard update if RPC doesn't exist (though it should)
            const cleanUpdates = {
                name: updates.name,
                building: updates.building, // This is the problematic column
                capacity: updates.capacity,
                supervisor_id: updates.supervisor_id || null,
            };

            const { data: standardData, error: standardError } = await supabase
                .from('dormitories')
                .update(cleanUpdates)
                .eq('id', id)
                .select()
                .single();

            if (standardError) throw standardError;
            return standardData;
        }

        // RPC returns the data directly (as JSONB, need to cast or wrap?)
        // The RPC returns just the JSON object of the row.
        return data as unknown as Dormitory;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('dormitories')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getDensity(): Promise<any[]> {
        const dorms = await this.getAll();

        const colors = [
            '#8b5cf6', // Violet
            '#10b981', // Emerald
            '#3b82f6', // Blue
            '#f59e0b', // Amber
            '#f43f5e', // Rose
        ];

        return dorms.map((d, i) => ({
            name: d.name,
            value: d.current_occupancy,
            color: colors[i % colors.length]
        }));
    }
};
