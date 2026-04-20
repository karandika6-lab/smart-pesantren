import { supabase } from '../supabase';

export interface ChildSummary {
    student_id: string;
    student_name: string;
    class_name: string | null;
    nis: string | null;
    total_bill_unpaid: number;
    violation_points: number;
}

export const parentService = {
    // Get dashboard summary for all linked children
    async getDashboardSummary(): Promise<ChildSummary[]> {
        const { data, error } = await supabase.rpc('get_parent_dashboard_summary');

        if (error) {
            console.error('Error fetching parent dashboard:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            throw error;
        }

        return data || [];
    },

    // In the future: Method to link student (if we allow self-claim)
    // async claimStudent(nis: string, birthDate: string) { ... }

    async getChildDetails(studentId: string) {
        try {
            const [student, invoices, violations] = await Promise.all([
                supabase.from('students').select('*, classes(name)').eq('id', studentId).single(),
                supabase.from('invoices').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
                supabase.from('violations').select('*').eq('student_id', studentId).order('violation_date', { ascending: false })
            ]);

            return {
                student: student.data,
                invoices: invoices.data || [],
                violations: violations.data || []
            };
        } catch (error) {
            console.error('Error fetching child details:', error);
            throw error;
        }
    }
};
