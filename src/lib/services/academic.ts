// Subjects and Schedules Services
import { supabase } from '../supabase';
import type {
    Subject, SubjectInsert, SubjectUpdate,
    Schedule, ScheduleInsert, ScheduleUpdate,
    AcademicYear
} from '@/types/database.types';

// ============================================
// SUBJECTS SERVICE
// ============================================

export const subjectsService = {
    async getAll(activeOnly: boolean = true): Promise<Subject[]> {
        let query = supabase
            .from('subjects')
            .select('*')
            .order('name');

        if (activeOnly) query = query.eq('is_active', true);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<Subject | null> {
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    async getByCategory(category: string): Promise<Subject[]> {
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('category', category)
            .eq('is_active', true)
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async create(subject: SubjectInsert): Promise<Subject> {
        console.log('Creating subject with data:', subject);
        const { data, error } = await supabase
            .from('subjects')
            .insert(subject)
            .select()
            .single();
        if (error) {
            console.error('Supabase error creating subject:', JSON.stringify(error, null, 2));
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            throw error;
        }
        return data;
    },

    async update(id: string, updates: SubjectUpdate): Promise<Subject> {
        const { data, error } = await supabase
            .from('subjects')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        // Hard delete - hapus permanen dari database
        const { error } = await supabase
            .from('subjects')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async getCategories(): Promise<string[]> {
        const { data, error } = await supabase
            .from('subjects')
            .select('category')
            .eq('is_active', true);

        if (error) throw error;
        const categories = new Set(data?.map(s => s.category).filter(Boolean));
        return Array.from(categories) as string[];
    },
};

// ============================================
// SCHEDULES SERVICE
// ============================================

export interface ScheduleWithRelations extends Schedule {
    class?: { id: string; name: string } | null;
    subject?: { id: string; name: string; code: string | null } | null;
    teacher?: { id: string; name: string } | null;
}

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const schedulesService = {
    async getAll(): Promise<ScheduleWithRelations[]> {
        const { data, error } = await supabase
            .from('schedules')
            .select(`
                *,
                class:classes(id, name),
                subject:subjects(id, name, code),
                teacher:teachers(id, name)
            `)
            .order('day_of_week')
            .order('start_time');

        if (error) throw error;
        return data || [];
    },

    async getByClass(classId: string): Promise<ScheduleWithRelations[]> {
        const { data, error } = await supabase
            .from('schedules')
            .select(`
                *,
                subject:subjects(id, name, code),
                teacher:teachers(id, name)
            `)
            .eq('class_id', classId)
            .order('day_of_week')
            .order('start_time');

        if (error) throw error;
        return data || [];
    },

    async getByTeacher(teacherId: string): Promise<ScheduleWithRelations[]> {
        const { data, error } = await supabase
            .from('schedules')
            .select(`
                *,
                class:classes(id, name),
                subject:subjects(id, name, code)
            `)
            .eq('teacher_id', teacherId)
            .order('day_of_week')
            .order('start_time');

        if (error) throw error;
        return data || [];
    },

    async getByDay(dayOfWeek: number, classId?: string): Promise<ScheduleWithRelations[]> {
        let query = supabase
            .from('schedules')
            .select(`
                *,
                class:classes(id, name),
                subject:subjects(id, name, code),
                teacher:teachers(id, name)
            `)
            .eq('day_of_week', dayOfWeek)
            .order('start_time');

        if (classId) query = query.eq('class_id', classId);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async create(schedule: ScheduleInsert): Promise<Schedule> {
        const { data, error } = await supabase
            .from('schedules')
            .insert(schedule)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id: string, updates: ScheduleUpdate): Promise<Schedule> {
        const { data, error } = await supabase
            .from('schedules')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async checkConflict(classId: string, dayOfWeek: number, startTime: string, endTime: string, excludeId?: string): Promise<boolean> {
        let query = supabase
            .from('schedules')
            .select('id')
            .eq('class_id', classId)
            .eq('day_of_week', dayOfWeek)
            .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

        if (excludeId) query = query.neq('id', excludeId);

        const { data, error } = await query;
        if (error) throw error;
        return (data?.length || 0) > 0;
    },

    getDayName(dayOfWeek: number): string {
        return DAY_NAMES[dayOfWeek] || 'Unknown';
    },

    getDayNames(): string[] {
        return DAY_NAMES;
    },
};

// ============================================
// ACADEMIC YEAR SERVICE
// ============================================

export const academicYearService = {
    async getAll(): Promise<AcademicYear[]> {
        const { data, error } = await supabase
            .from('academic_years')
            .select('*')
            .order('start_date', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getActive(): Promise<AcademicYear | null> {
        console.log('Fetching active academic year...');
        const { data, error } = await supabase
            .from('academic_years')
            .select('*')
            .eq('is_active', true)
            .order('start_date', { ascending: false }); // Take the latest if multiple active

        if (error) {
            console.error('Error fetching active academic year:', error);
            return null;
        }

        const activeYear = data && data.length > 0 ? data[0] : null;
        console.log('Active academic year found:', activeYear);
        return activeYear;
    }
};
