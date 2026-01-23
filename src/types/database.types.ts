// Database Types for Smart Pesantren
// Auto-generated types for Supabase tables

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type UserRole =
    | 'super_admin'
    | 'admin_keuangan'
    | 'admin_akademik'
    | 'kesantrian'
    | 'admin_absensi'
    | 'wali_kelas'
    | 'ustadz'
    | 'wali_santri'
    | 'santri';

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    name: string;
                    role: UserRole;
                    phone: string | null;
                    avatar_url: string | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    name: string;
                    role: UserRole;
                    phone?: string | null;
                    avatar_url?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    name?: string;
                    role?: UserRole;
                    phone?: string | null;
                    avatar_url?: string | null;
                    is_active?: boolean;
                    updated_at?: string;
                };
            };
            academic_years: {
                Row: {
                    id: string;
                    name: string;
                    start_date: string;
                    end_date: string;
                    is_active: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    start_date: string;
                    end_date: string;
                    is_active?: boolean;
                    created_at?: string;
                };
                Update: {
                    name?: string;
                    start_date?: string;
                    end_date?: string;
                    is_active?: boolean;
                };
            };
            classes: {
                Row: {
                    id: string;
                    name: string;
                    grade_level: number;
                    homeroom_teacher_id: string | null;
                    academic_year_id: string | null;
                    capacity: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    grade_level: number;
                    homeroom_teacher_id?: string | null;
                    academic_year_id?: string | null;
                    capacity?: number;
                    created_at?: string;
                };
                Update: {
                    name?: string;
                    grade_level?: number;
                    homeroom_teacher_id?: string | null;
                    academic_year_id?: string | null;
                    capacity?: number;
                };
            };
            students: {
                Row: {
                    id: string;
                    user_id: string | null;
                    nis: string;
                    name: string;
                    gender: 'L' | 'P' | null;
                    birth_date: string | null;
                    birth_place: string | null;
                    address: string | null;
                    parent_name: string | null;
                    parent_phone: string | null;
                    parent_user_id: string | null;
                    class_id: string | null;
                    dormitory_id: string | null;
                    enrollment_date: string;
                    status: 'active' | 'graduated' | 'dropped';
                    photo_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    nis: string;
                    name: string;
                    gender?: 'L' | 'P' | null;
                    birth_date?: string | null;
                    birth_place?: string | null;
                    address?: string | null;
                    parent_name?: string | null;
                    parent_phone?: string | null;
                    parent_user_id?: string | null;
                    class_id?: string | null;
                    dormitory_id?: string | null;
                    enrollment_date?: string;
                    status?: 'active' | 'graduated' | 'dropped';
                    photo_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    user_id?: string | null;
                    nis?: string;
                    name?: string;
                    gender?: 'L' | 'P' | null;
                    birth_date?: string | null;
                    birth_place?: string | null;
                    address?: string | null;
                    parent_name?: string | null;
                    parent_phone?: string | null;
                    parent_user_id?: string | null;
                    class_id?: string | null;
                    dormitory_id?: string | null;
                    status?: 'active' | 'graduated' | 'dropped';
                    photo_url?: string | null;
                    updated_at?: string;
                };
            };
            teachers: {
                Row: {
                    id: string;
                    user_id: string | null;
                    nip: string | null;
                    name: string;
                    gender: 'L' | 'P' | null;
                    phone: string | null;
                    email: string | null;
                    address: string | null;
                    specialization: string | null;
                    join_date: string;
                    is_active: boolean;
                    photo_url: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    nip?: string | null;
                    name: string;
                    gender?: 'L' | 'P' | null;
                    phone?: string | null;
                    email?: string | null;
                    address?: string | null;
                    specialization?: string | null;
                    join_date?: string;
                    is_active?: boolean;
                    photo_url?: string | null;
                    created_at?: string;
                };
                Update: {
                    user_id?: string | null;
                    nip?: string | null;
                    name?: string;
                    gender?: 'L' | 'P' | null;
                    phone?: string | null;
                    email?: string | null;
                    address?: string | null;
                    specialization?: string | null;
                    is_active?: boolean;
                    photo_url?: string | null;
                };
            };
            subjects: {
                Row: {
                    id: string;
                    code: string;
                    name: string;
                    category: string | null;
                    credit_hours: number;
                    is_active: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    code: string;
                    name: string;
                    category?: string | null;
                    credit_hours?: number;
                    is_active?: boolean;
                    created_at?: string;
                };
                Update: {
                    code?: string;
                    name?: string;
                    category?: string | null;
                    credit_hours?: number;
                    is_active?: boolean;
                };
            };
            dormitories: {
                Row: {
                    id: string;
                    name: string;
                    building: string | null;
                    capacity: number | null;
                    current_occupancy: number;
                    supervisor_id: string | null;
                    gender: 'L' | 'P' | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    building?: string | null;
                    capacity?: number | null;
                    current_occupancy?: number;
                    supervisor_id?: string | null;
                    gender?: 'L' | 'P' | null;
                    created_at?: string;
                };
                Update: {
                    name?: string;
                    building?: string | null;
                    capacity?: number | null;
                    current_occupancy?: number;
                    supervisor_id?: string | null;
                    gender?: 'L' | 'P' | null;
                };
            };
            schedules: {
                Row: {
                    id: string;
                    class_id: string;
                    subject_id: string;
                    teacher_id: string | null;
                    day_of_week: number;
                    start_time: string;
                    end_time: string;
                    room: string | null;
                    academic_year_id: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    class_id: string;
                    subject_id: string;
                    teacher_id?: string | null;
                    day_of_week: number;
                    start_time: string;
                    end_time: string;
                    room?: string | null;
                    academic_year_id?: string | null;
                    created_at?: string;
                };
                Update: {
                    class_id?: string;
                    subject_id?: string;
                    teacher_id?: string | null;
                    day_of_week?: number;
                    start_time?: string;
                    end_time?: string;
                    room?: string | null;
                    academic_year_id?: string | null;
                };
            };
            grades: {
                Row: {
                    id: string;
                    student_id: string;
                    subject_id: string;
                    teacher_id: string | null;
                    academic_year_id: string | null;
                    semester: 1 | 2;
                    uh1: number | null;
                    uh2: number | null;
                    uts: number | null;
                    uas: number | null;
                    final_grade: number | null;
                    grade_letter: string | null;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    student_id: string;
                    subject_id: string;
                    teacher_id?: string | null;
                    academic_year_id?: string | null;
                    semester: 1 | 2;
                    uh1?: number | null;
                    uh2?: number | null;
                    uts?: number | null;
                    uas?: number | null;
                    final_grade?: number | null;
                    grade_letter?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    student_id?: string;
                    subject_id?: string;
                    teacher_id?: string | null;
                    semester?: 1 | 2;
                    uh1?: number | null;
                    uh2?: number | null;
                    uts?: number | null;
                    uas?: number | null;
                    final_grade?: number | null;
                    grade_letter?: string | null;
                    notes?: string | null;
                    updated_at?: string;
                };
            };
            hafalan_progress: {
                Row: {
                    id: string;
                    student_id: string;
                    surah_number: number;
                    surah_name: string;
                    juz: number | null;
                    verses_memorized: number;
                    total_verses: number;
                    status: 'not_started' | 'in_progress' | 'completed' | 'muroja_ah';
                    last_test_date: string | null;
                    last_test_grade: number | null;
                    teacher_id: string | null;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    student_id: string;
                    surah_number: number;
                    surah_name: string;
                    juz?: number | null;
                    verses_memorized?: number;
                    total_verses: number;
                    status?: 'not_started' | 'in_progress' | 'completed' | 'muroja_ah';
                    last_test_date?: string | null;
                    last_test_grade?: number | null;
                    teacher_id?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    surah_number?: number;
                    surah_name?: string;
                    juz?: number | null;
                    verses_memorized?: number;
                    total_verses?: number;
                    status?: 'not_started' | 'in_progress' | 'completed' | 'muroja_ah';
                    last_test_date?: string | null;
                    last_test_grade?: number | null;
                    teacher_id?: string | null;
                    notes?: string | null;
                    updated_at?: string;
                };
            };
            attendance: {
                Row: {
                    id: string;
                    student_id: string;
                    date: string;
                    type: 'class' | 'prayer' | 'activity';
                    status: 'hadir' | 'sakit' | 'izin' | 'alpha';
                    check_in_time: string | null;
                    notes: string | null;
                    recorded_by: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    student_id: string;
                    date: string;
                    type: 'class' | 'prayer' | 'activity';
                    status: 'hadir' | 'sakit' | 'izin' | 'alpha';
                    check_in_time?: string | null;
                    notes?: string | null;
                    recorded_by?: string | null;
                    created_at?: string;
                };
                Update: {
                    date?: string;
                    type?: 'class' | 'prayer' | 'activity';
                    status?: 'hadir' | 'sakit' | 'izin' | 'alpha';
                    check_in_time?: string | null;
                    notes?: string | null;
                    recorded_by?: string | null;
                };
            };
            violations: {
                Row: {
                    id: string;
                    student_id: string;
                    date: string;
                    type: string;
                    description: string | null;
                    points: number;
                    punishment: string | null;
                    status: 'pending' | 'completed' | 'cancelled';
                    recorded_by: string | null;
                    completed_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    student_id: string;
                    date?: string;
                    type: string;
                    description?: string | null;
                    points?: number;
                    punishment?: string | null;
                    status?: 'pending' | 'completed' | 'cancelled';
                    recorded_by?: string | null;
                    completed_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    date?: string;
                    type?: string;
                    description?: string | null;
                    points?: number;
                    punishment?: string | null;
                    status?: 'pending' | 'completed' | 'cancelled';
                    completed_at?: string | null;
                };
            };
            permissions: {
                Row: {
                    id: string;
                    student_id: string;
                    type: 'pulang' | 'keluar' | 'sakit' | 'lainnya';
                    reason: string;
                    start_date: string;
                    end_date: string;
                    status: 'pending' | 'approved' | 'rejected' | 'completed';
                    approved_by: string | null;
                    approved_at: string | null;
                    notes: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    student_id: string;
                    type: 'pulang' | 'keluar' | 'sakit' | 'lainnya';
                    reason: string;
                    start_date: string;
                    end_date: string;
                    status?: 'pending' | 'approved' | 'rejected' | 'completed';
                    approved_by?: string | null;
                    approved_at?: string | null;
                    notes?: string | null;
                    created_at?: string;
                };
                Update: {
                    type?: 'pulang' | 'keluar' | 'sakit' | 'lainnya';
                    reason?: string;
                    start_date?: string;
                    end_date?: string;
                    status?: 'pending' | 'approved' | 'rejected' | 'completed';
                    approved_by?: string | null;
                    approved_at?: string | null;
                    notes?: string | null;
                };
            };
            invoice_types: {
                Row: {
                    id: string;
                    name: string;
                    amount: number;
                    is_recurring: boolean;
                    recurrence_period: 'monthly' | 'semester' | 'yearly' | null;
                    is_active: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    amount: number;
                    is_recurring?: boolean;
                    recurrence_period?: 'monthly' | 'semester' | 'yearly' | null;
                    is_active?: boolean;
                    created_at?: string;
                };
                Update: {
                    name?: string;
                    amount?: number;
                    is_recurring?: boolean;
                    recurrence_period?: 'monthly' | 'semester' | 'yearly' | null;
                    is_active?: boolean;
                };
            };
            invoices: {
                Row: {
                    id: string;
                    student_id: string;
                    invoice_type_id: string | null;
                    description: string;
                    amount: number;
                    due_date: string;
                    status: 'unpaid' | 'partial' | 'paid' | 'overdue';
                    paid_amount: number;
                    academic_year_id: string | null;
                    period: string | null;
                    created_by: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    student_id: string;
                    invoice_type_id?: string | null;
                    description: string;
                    amount: number;
                    due_date: string;
                    status?: 'unpaid' | 'partial' | 'paid' | 'overdue';
                    paid_amount?: number;
                    academic_year_id?: string | null;
                    period?: string | null;
                    created_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    invoice_type_id?: string | null;
                    description?: string;
                    amount?: number;
                    due_date?: string;
                    status?: 'unpaid' | 'partial' | 'paid' | 'overdue';
                    paid_amount?: number;
                    period?: string | null;
                    updated_at?: string;
                };
            };
            payments: {
                Row: {
                    id: string;
                    invoice_id: string;
                    student_id: string | null;
                    amount: number;
                    payment_date: string;
                    payment_method: 'cash' | 'transfer' | 'gateway' | null;
                    reference_number: string | null;
                    notes: string | null;
                    received_by: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    invoice_id: string;
                    student_id?: string | null;
                    amount: number;
                    payment_date?: string;
                    payment_method?: 'cash' | 'transfer' | 'gateway' | null;
                    reference_number?: string | null;
                    notes?: string | null;
                    received_by?: string | null;
                    created_at?: string;
                };
                Update: {
                    amount?: number;
                    payment_date?: string;
                    payment_method?: 'cash' | 'transfer' | 'gateway' | null;
                    reference_number?: string | null;
                    notes?: string | null;
                };
            };
            expenses: {
                Row: {
                    id: string;
                    category: string;
                    description: string;
                    amount: number;
                    expense_date: string;
                    receipt_url: string | null;
                    approved_by: string | null;
                    recorded_by: string | null;
                    notes: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    category: string;
                    description: string;
                    amount: number;
                    expense_date?: string;
                    receipt_url?: string | null;
                    approved_by?: string | null;
                    recorded_by?: string | null;
                    notes?: string | null;
                    created_at?: string;
                };
                Update: {
                    category?: string;
                    description?: string;
                    amount?: number;
                    expense_date?: string;
                    receipt_url?: string | null;
                    approved_by?: string | null;
                    notes?: string | null;
                };
            };
            activity_logs: {
                Row: {
                    id: string;
                    user_id: string | null;
                    action: string;
                    entity_type: string | null;
                    entity_id: string | null;
                    details: Json | null;
                    ip_address: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    action: string;
                    entity_type?: string | null;
                    entity_id?: string | null;
                    details?: Json | null;
                    ip_address?: string | null;
                    created_at?: string;
                };
                Update: {
                    action?: string;
                    entity_type?: string | null;
                    entity_id?: string | null;
                    details?: Json | null;
                };
            };
        };
        Views: {};
        Functions: {};
        Enums: {
            user_role: UserRole;
        };
    };
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Student = Database['public']['Tables']['students']['Row'];
export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type StudentUpdate = Database['public']['Tables']['students']['Update'];

export type Teacher = Database['public']['Tables']['teachers']['Row'];
export type TeacherInsert = Database['public']['Tables']['teachers']['Insert'];
export type TeacherUpdate = Database['public']['Tables']['teachers']['Update'];

export type Class = Database['public']['Tables']['classes']['Row'];
export type ClassInsert = Database['public']['Tables']['classes']['Insert'];
export type ClassUpdate = Database['public']['Tables']['classes']['Update'];

export type Subject = Database['public']['Tables']['subjects']['Row'];
export type SubjectInsert = Database['public']['Tables']['subjects']['Insert'];
export type SubjectUpdate = Database['public']['Tables']['subjects']['Update'];

export type Schedule = Database['public']['Tables']['schedules']['Row'];
export type ScheduleInsert = Database['public']['Tables']['schedules']['Insert'];
export type ScheduleUpdate = Database['public']['Tables']['schedules']['Update'];

export type Grade = Database['public']['Tables']['grades']['Row'];
export type GradeInsert = Database['public']['Tables']['grades']['Insert'];
export type GradeUpdate = Database['public']['Tables']['grades']['Update'];

export type HafalanProgress = Database['public']['Tables']['hafalan_progress']['Row'];
export type HafalanProgressInsert = Database['public']['Tables']['hafalan_progress']['Insert'];
export type HafalanProgressUpdate = Database['public']['Tables']['hafalan_progress']['Update'];

export type Attendance = Database['public']['Tables']['attendance']['Row'];
export type AttendanceInsert = Database['public']['Tables']['attendance']['Insert'];
export type AttendanceUpdate = Database['public']['Tables']['attendance']['Update'];

export type Dormitory = Database['public']['Tables']['dormitories']['Row'];
export type DormitoryInsert = Database['public']['Tables']['dormitories']['Insert'];
export type DormitoryUpdate = Database['public']['Tables']['dormitories']['Update'];

export type Violation = Database['public']['Tables']['violations']['Row'];
export type ViolationInsert = Database['public']['Tables']['violations']['Insert'];
export type ViolationUpdate = Database['public']['Tables']['violations']['Update'];

export type Permission = Database['public']['Tables']['permissions']['Row'];
export type PermissionInsert = Database['public']['Tables']['permissions']['Insert'];
export type PermissionUpdate = Database['public']['Tables']['permissions']['Update'];

export type InvoiceType = Database['public']['Tables']['invoice_types']['Row'];
export type InvoiceTypeInsert = Database['public']['Tables']['invoice_types']['Insert'];
export type InvoiceTypeUpdate = Database['public']['Tables']['invoice_types']['Update'];

export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];

export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export type Expense = Database['public']['Tables']['expenses']['Row'];
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];

export type AcademicYear = Database['public']['Tables']['academic_years']['Row'];
export type AcademicYearInsert = Database['public']['Tables']['academic_years']['Insert'];
export type AcademicYearUpdate = Database['public']['Tables']['academic_years']['Update'];

export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
export type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert'];
