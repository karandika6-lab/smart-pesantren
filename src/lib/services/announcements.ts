import { supabase } from '../supabase';
import { broadcastNotification } from './notificationUtils';
import { getPesantrenId } from './helpers';

export interface Announcement {
    id: string;
    title: string;
    content: string;
    target_roles: string[];
    priority: 'normal' | 'high' | 'urgent';
    is_active: boolean;
    created_at: string;
    created_by?: string;
}

export const announcementsService = {
    async getAll() {
        const pesantrenId = await getPesantrenId();
        let query = supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (pesantrenId) {
            query = query.eq('pesantren_id', pesantrenId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async create(announcement: {
        title: string;
        content: string;
        targetRoles: string[];
        priority?: 'normal' | 'high' | 'urgent';
    }) {
        const pesantrenId = await getPesantrenId();
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('announcements')
            .insert({
                title: announcement.title,
                content: announcement.content,
                target_roles: announcement.targetRoles,
                priority: announcement.priority || 'normal',
                pesantren_id: pesantrenId,
                created_by: user?.id,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        // Trigger Push Notification Broadcast (Fire and forget)
        broadcastNotification({
            title: `Pengumuman: ${announcement.title}`,
            message: announcement.content,
            targetRoles: announcement.targetRoles,
            pesantrenId: pesantrenId || undefined
        });

        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
