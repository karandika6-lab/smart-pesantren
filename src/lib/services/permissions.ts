import { supabase } from '../supabase';

export interface Permission {
    id: string;
    student_id: string;
    permission_type: 'pulang' | 'keluar' | 'sakit' | 'lainnya'; // Updated column name
    reason: string;
    start_date: string;
    end_date: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    approved_by?: string | null;
    created_at: string;
    updated_at: string;
}

export interface PermissionWithRelations extends Permission {
    students?: {
        id: string;
        name: string;
        parent_name?: string;
        parent_phone?: string;
        classes?: {
            id: string;
            name: string;
        } | null;
    } | null;
}

export const permissionsService = {
    async getAll(): Promise<PermissionWithRelations[]> {
        const { data, error } = await supabase
            .from('permissions')
            .select(`
                *,
                students (
                    id,
                    name,
                    parent_name,
                    parent_phone,
                    classes (
                        id,
                        name
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as unknown as PermissionWithRelations[];
    },

    async getPending(): Promise<PermissionWithRelations[]> {
        const { data, error } = await supabase
            .from('permissions')
            .select(`
                *,
                students (
                    id,
                    name,
                    parent_name,
                    parent_phone,
                    classes (
                        id,
                        name
                    )
                )
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as unknown as PermissionWithRelations[];
    },

    async getHistory(): Promise<PermissionWithRelations[]> {
        const { data, error } = await supabase
            .from('permissions')
            .select(`
                *,
                students (
                    id,
                    name,
                    parent_name,
                    parent_phone,
                    classes (
                        id,
                        name
                    )
                )
            `)
            .neq('status', 'pending')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return (data || []) as unknown as PermissionWithRelations[];
    },

    async create(permission: {
        student_id: string;
        permission_type: 'pulang' | 'keluar' | 'sakit' | 'kegiatan';
        reason: string;
        start_date: string;
        end_date: string;
    }): Promise<void> {
        const { getPesantrenId } = await import('./helpers');
        const pesantrenId = await getPesantrenId();

        // Get current user for approved_by since it's an admin action
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('permissions')
            .insert({
                student_id: permission.student_id,
                permission_type: permission.permission_type,
                reason: permission.reason,
                start_date: permission.start_date,
                end_date: permission.end_date,
                status: 'approved', // Auto-approve for manual input
                approved_by: user?.id,
                pesantren_id: pesantrenId
            });

        if (error) throw error;
    },

    async updateStatus(id: string, status: 'approved' | 'rejected' | 'completed', handledBy?: string): Promise<void> {
        const { error } = await supabase
            .from('permissions')
            .update({
                status,
                approved_by: handledBy || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
    }
};
