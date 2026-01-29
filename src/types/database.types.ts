export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    graphql_public: {
        Tables: {
            [_ in never]: never
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            graphql: {
                Args: {
                    extensions?: Json
                    operationName?: string
                    query?: string
                    variables?: Json
                }
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
    public: {
        Tables: {
            academic_years: {
                Row: {
                    created_at: string | null
                    end_date: string | null
                    id: string
                    is_active: boolean | null
                    name: string
                    pesantren_id: string | null
                    semester: string | null
                    start_date: string | null
                }
                Insert: {
                    created_at?: string | null
                    end_date?: string | null
                    id?: string
                    is_active?: boolean | null
                    name: string
                    pesantren_id?: string | null
                    semester?: string | null
                    start_date?: string | null
                }
                Update: {
                    created_at?: string | null
                    end_date?: string | null
                    id?: string
                    is_active?: boolean | null
                    name?: string
                    pesantren_id?: string | null
                    semester?: string | null
                    start_date?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "academic_years_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "academic_years_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                ]
            }
            activity_logs: {
                Row: {
                    action: string
                    created_at: string | null
                    details: Json | null
                    entity_id: string | null
                    entity_type: string | null
                    id: string
                    ip_address: string | null
                    pesantren_id: string | null
                    user_id: string | null
                }
                Insert: {
                    action: string
                    created_at?: string | null
                    details?: Json | null
                    entity_id?: string | null
                    entity_type?: string | null
                    id?: string
                    ip_address?: string | null
                    pesantren_id?: string | null
                    user_id?: string | null
                }
                Update: {
                    action?: string
                    created_at?: string | null
                    details?: Json | null
                    entity_id?: string | null
                    entity_type?: string | null
                    id?: string
                    ip_address?: string | null
                    pesantren_id?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "activity_logs_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "activity_logs_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "activity_logs_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            announcements: {
                Row: {
                    content: string
                    created_at: string | null
                    created_by: string | null
                    id: string
                    is_active: boolean | null
                    pesantren_id: string | null
                    priority: string | null
                    target_roles: string[] | null
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    content: string
                    created_at?: string | null
                    created_by?: string | null
                    id?: string
                    is_active?: boolean | null
                    pesantren_id?: string | null
                    priority?: string | null
                    target_roles?: string[] | null
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    content?: string
                    created_at?: string | null
                    created_by?: string | null
                    id?: string
                    is_active?: boolean | null
                    pesantren_id?: string | null
                    priority?: string | null
                    target_roles?: string[] | null
                    title?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "announcements_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "announcements_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "announcements_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                ]
            }
            attendance: {
                Row: {
                    check_in_time: string | null
                    created_at: string | null
                    date: string
                    id: string
                    notes: string | null
                    pesantren_id: string | null
                    recorded_by: string | null
                    session: string | null
                    status: string
                    student_id: string | null
                    type: string | null
                    updated_at: string | null
                }
                Insert: {
                    check_in_time?: string | null
                    created_at?: string | null
                    date: string
                    id?: string
                    notes?: string | null
                    pesantren_id?: string | null
                    recorded_by?: string | null
                    session?: string | null
                    status: string
                    student_id?: string | null
                    type?: string | null
                    updated_at?: string | null
                }
                Update: {
                    check_in_time?: string | null
                    created_at?: string | null
                    date?: string
                    id?: string
                    notes?: string | null
                    pesantren_id?: string | null
                    recorded_by?: string | null
                    session?: string | null
                    status?: string
                    student_id?: string | null
                    type?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "attendance_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "attendance_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "attendance_recorded_by_fkey"
                        columns: ["recorded_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "attendance_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "students"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "attendance_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "view_student_violation_points"
                        referencedColumns: ["student_id"]
                    },
                ]
            }
            attendance_sessions: {
                Row: {
                    category: string
                    created_at: string | null
                    end_time: string | null
                    id: string
                    is_active: boolean | null
                    name: string
                    pesantren_id: string | null
                    start_time: string | null
                }
                Insert: {
                    category: string
                    created_at?: string | null
                    end_time?: string | null
                    id?: string
                    is_active?: boolean | null
                    name: string
                    pesantren_id?: string | null
                    start_time?: string | null
                }
                Update: {
                    category?: string
                    created_at?: string | null
                    end_time?: string | null
                    id?: string
                    is_active?: boolean | null
                    name?: string
                    pesantren_id?: string | null
                    start_time?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "attendance_sessions_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "attendance_sessions_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                ]
            }
            attendance_summary: {
                Row: {
                    absent_days: number | null
                    academic_year_id: string | null
                    created_at: string | null
                    id: string
                    permitted_days: number | null
                    present_days: number | null
                    sick_days: number | null
                    student_id: string | null
                    total_days: number | null
                    updated_at: string | null
                }
                Insert: {
                    absent_days?: number | null
                    academic_year_id?: string | null
                    created_at?: string | null
                    id?: string
                    permitted_days?: number | null
                    present_days?: number | null
                    sick_days?: number | null
                    student_id?: string | null
                    total_days?: number | null
                    updated_at?: string | null
                }
                Update: {
                    absent_days?: number | null
                    academic_year_id?: string | null
                    created_at?: string | null
                    id?: string
                    permitted_days?: number | null
                    present_days?: number | null
                    sick_days?: number | null
                    student_id?: string | null
                    total_days?: number | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "attendance_summary_academic_year_id_fkey"
                        columns: ["academic_year_id"]
                        isOneToOne: false
                        referencedRelation: "academic_years"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "attendance_summary_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "students"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "attendance_summary_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "view_student_violation_points"
                        referencedColumns: ["student_id"]
                    },
                ]
            }
            classes: {
                Row: {
                    academic_year_id: string | null
                    capacity: number | null
                    created_at: string | null
                    grade: string | null
                    grade_level: number | null
                    homeroom_teacher_id: string | null
                    id: string
                    name: string
                    pesantren_id: string | null
                }
                Insert: {
                    academic_year_id?: string | null
                    capacity?: number | null
                    created_at?: string | null
                    grade?: string | null
                    grade_level?: number | null
                    homeroom_teacher_id?: string | null
                    id?: string
                    name: string
                    pesantren_id?: string | null
                }
                Update: {
                    academic_year_id?: string | null
                    capacity?: number | null
                    created_at?: string | null
                    grade?: string | null
                    grade_level?: number | null
                    homeroom_teacher_id?: string | null
                    id?: string
                    name?: string
                    pesantren_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "classes_academic_year_id_fkey"
                        columns: ["academic_year_id"]
                        isOneToOne: false
                        referencedRelation: "academic_years"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "classes_homeroom_teacher_id_fkey"
                        columns: ["homeroom_teacher_id"]
                        isOneToOne: false
                        referencedRelation: "teachers"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "classes_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "classes_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                ]
            }
            dormitories: {
                Row: {
                    building: string | null
                    capacity: number | null
                    created_at: string | null
                    current_occupancy: number | null
                    gender: string | null
                    id: string
                    name: string
                    pesantren_id: string | null
                    supervisor_id: string | null
                    updated_at: string | null
                }
                Insert: {
                    building?: string | null
                    capacity?: number | null
                    created_at?: string | null
                    current_occupancy?: number | null
                    gender?: string | null
                    id?: string
                    name: string
                    pesantren_id?: string | null
                    supervisor_id?: string | null
                    updated_at?: string | null
                }
                Update: {
                    building?: string | null
                    capacity?: number | null
                    created_at?: string | null
                    current_occupancy?: number | null
                    gender?: string | null
                    id?: string
                    name?: string
                    pesantren_id?: string | null
                    supervisor_id?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "dormitories_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "dormitories_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "dormitories_supervisor_id_fkey"
                        columns: ["supervisor_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            expenses: {
                Row: {
                    amount: number
                    approved_by: string | null
                    category: string
                    created_at: string | null
                    description: string
                    expense_date: string
                    id: string
                    notes: string | null
                    pesantren_id: string | null
                    receipt_url: string | null
                    recorded_by: string | null
                }
                Insert: {
                    amount: number
                    approved_by?: string | null
                    category: string
                    created_at?: string | null
                    description: string
                    expense_date?: string
                    id?: string
                    notes?: string | null
                    pesantren_id?: string | null
                    receipt_url?: string | null
                    recorded_by?: string | null
                }
                Update: {
                    amount?: number
                    approved_by?: string | null
                    category?: string
                    created_at?: string | null
                    description?: string
                    expense_date?: string
                    id?: string
                    notes?: string | null
                    pesantren_id?: string | null
                    receipt_url?: string | null
                    recorded_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "expenses_approved_by_fkey"
                        columns: ["approved_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "expenses_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "expenses_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "expenses_recorded_by_fkey"
                        columns: ["recorded_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            grades: {
                Row: {
                    academic_year_id: string | null
                    class_id: string | null
                    created_at: string | null
                    final_score: number | null
                    grade_letter: string | null
                    id: string
                    is_published: boolean | null
                    notes: string | null
                    semester: number | null
                    student_id: string | null
                    subject_id: string | null
                    teacher_id: string | null
                    tugas_score: number | null
                    uas_score: number | null
                    updated_at: string | null
                    uts_score: number | null
                }
                Insert: {
                    academic_year_id?: string | null
                    class_id?: string | null
                    created_at?: string | null
                    final_score?: number | null
                    grade_letter?: string | null
                    id?: string
                    is_published?: boolean | null
                    notes?: string | null
                    semester?: number | null
                    student_id?: string | null
                    subject_id?: string | null
                    teacher_id?: string | null
                    tugas_score?: number | null
                    uas_score?: number | null
                    updated_at?: string | null
                    uts_score?: number | null
                }
                Update: {
                    academic_year_id?: string | null
                    class_id?: string | null
                    created_at?: string | null
                    final_score?: number | null
                    grade_letter?: string | null
                    id?: string
                    is_published?: boolean | null
                    notes?: string | null
                    semester?: number | null
                    student_id?: string | null
                    subject_id?: string | null
                    teacher_id?: string | null
                    tugas_score?: number | null
                    uas_score?: number | null
                    updated_at?: string | null
                    uts_score?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "grades_academic_year_id_fkey"
                        columns: ["academic_year_id"]
                        isOneToOne: false
                        referencedRelation: "academic_years"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "grades_class_id_fkey"
                        columns: ["class_id"]
                        isOneToOne: false
                        referencedRelation: "classes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "grades_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "students"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "grades_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "view_student_violation_points"
                        referencedColumns: ["student_id"]
                    },
                    {
                        foreignKeyName: "grades_subject_id_fkey"
                        columns: ["subject_id"]
                        isOneToOne: false
                        referencedRelation: "subjects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "grades_teacher_id_fkey"
                        columns: ["teacher_id"]
                        isOneToOne: false
                        referencedRelation: "teachers"
                        referencedColumns: ["id"]
                    },
                ]
            }
            hafalan_programs: {
                Row: {
                    assigned_by: string | null
                    assigned_date: string | null
                    created_at: string | null
                    hafalan_type_id: string
                    id: string
                    notes: string | null
                    status: string | null
                    student_id: string
                    target_completion_date: string | null
                    updated_at: string | null
                }
                Insert: {
                    assigned_by?: string | null
                    assigned_date?: string | null
                    created_at?: string | null
                    hafalan_type_id: string
                    id?: string
                    notes?: string | null
                    status?: string | null
                    student_id: string
                    target_completion_date?: string | null
                    updated_at?: string | null
                }
                Update: {
                    assigned_by?: string | null
                    assigned_date?: string | null
                    created_at?: string | null
                    hafalan_type_id?: string
                    id?: string
                    notes?: string | null
                    status?: string | null
                    student_id?: string
                    target_completion_date?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "hafalan_programs_hafalan_type_id_fkey"
                        columns: ["hafalan_type_id"]
                        isOneToOne: false
                        referencedRelation: "hafalan_types"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "hafalan_programs_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "students"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "hafalan_programs_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "view_student_violation_points"
                        referencedColumns: ["student_id"]
                    },
                ]
            }
            hafalan_progress: {
                Row: {
                    created_at: string | null
                    evaluated_at: string | null
                    evaluated_by: string | null
                    grade: string | null
                    id: string
                    notes: string | null
                    program_id: string
                    progress_percentage: number | null
                    student_id: string
                    unit_name: string | null
                    unit_number: number
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    evaluated_at?: string | null
                    evaluated_by?: string | null
                    grade?: string | null
                    id?: string
                    notes?: string | null
                    program_id: string
                    progress_percentage?: number | null
                    student_id: string
                    unit_name?: string | null
                    unit_number: number
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    evaluated_at?: string | null
                    evaluated_by?: string | null
                    grade?: string | null
                    id?: string
                    notes?: string | null
                    program_id?: string
                    progress_percentage?: number | null
                    student_id?: string
                    unit_name?: string | null
                    unit_number?: number
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "hafalan_progress_program_id_fkey"
                        columns: ["program_id"]
                        isOneToOne: false
                        referencedRelation: "hafalan_programs"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "hafalan_progress_student_id_fkey1"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "students"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "hafalan_progress_student_id_fkey1"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "view_student_violation_points"
                        referencedColumns: ["student_id"]
                    },
                ]
            }
            hafalan_progress_old: {
                Row: {
                    created_at: string | null
                    end_ayat: number | null
                    grade: string | null
                    id: string
                    juz: number | null
                    last_test_date: string | null
                    notes: string | null
                    start_ayat: number | null
                    status: string | null
                    student_id: string | null
                    surah_name: string
                    surah_number: number
                    teacher_id: string | null
                    total_verses: number | null
                    updated_at: string | null
                    verses_memorized: number | null
                }
                Insert: {
                    created_at?: string | null
                    end_ayat?: number | null
                    grade?: string | null
                    id?: string
                    juz?: number | null
                    last_test_date?: string | null
                    notes?: string | null
                    start_ayat?: number | null
                    status?: string | null
                    student_id?: string | null
                    surah_name: string
                    surah_number: number
                    teacher_id?: string | null
                    total_verses?: number | null
                    updated_at?: string | null
                    verses_memorized?: number | null
                }
                Update: {
                    created_at?: string | null
                    end_ayat?: number | null
                    grade?: string | null
                    id?: string
                    juz?: number | null
                    last_test_date?: string | null
                    notes?: string | null
                    start_ayat?: number | null
                    status?: string | null
                    student_id?: string | null
                    surah_name?: string
                    surah_number?: number
                    teacher_id?: string | null
                    total_verses?: number | null
                    updated_at?: string | null
                    verses_memorized?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "hafalan_progress_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "students"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "hafalan_progress_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "view_student_violation_points"
                        referencedColumns: ["student_id"]
                    },
                    {
                        foreignKeyName: "hafalan_progress_teacher_id_fkey"
                        columns: ["teacher_id"]
                        isOneToOne: false
                        referencedRelation: "teachers"
                        referencedColumns: ["id"]
                    },
                ]
            }
            hafalan_types: {
                Row: {
                    category: string
                    created_at: string | null
                    description: string | null
                    id: string
                    is_active: boolean | null
                    name: string
                    total_units: number
                    unit_name: string
                    updated_at: string | null
                }
                Insert: {
                    category: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    is_active?: boolean | null
                    name: string
                    total_units: number
                    unit_name: string
                    updated_at?: string | null
                }
                Update: {
                    category?: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    is_active?: boolean | null
                    name?: string
                    total_units?: number
                    unit_name?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            invoice_types: {
                Row: {
                    amount: number
                    created_at: string | null
                    id: string
                    is_active: boolean | null
                    is_recurring: boolean | null
                    name: string
                    pesantren_id: string | null
                    recurrence_period: string | null
                }
                Insert: {
                    amount: number
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    is_recurring?: boolean | null
                    name: string
                    pesantren_id?: string | null
                    recurrence_period?: string | null
                }
                Update: {
                    amount?: number
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    is_recurring?: boolean | null
                    name?: string
                    pesantren_id?: string | null
                    recurrence_period?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "invoice_types_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "invoice_types_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                ]
            }
            invoices: {
                Row: {
                    academic_year_id: string | null
                    amount: number
                    created_at: string | null
                    created_by: string | null
                    description: string
                    due_date: string
                    id: string
                    invoice_number: string | null
                    invoice_type: string | null
                    invoice_type_id: string | null
                    paid_amount: number | null
                    period: string | null
                    pesantren_id: string | null
                    status: string | null
                    student_id: string | null
                    updated_at: string | null
                }
                Insert: {
                    academic_year_id?: string | null
                    amount: number
                    created_at?: string | null
                    created_by?: string | null
                    description: string
                    due_date: string
                    id?: string
                    invoice_number?: string | null
                    invoice_type?: string | null
                    invoice_type_id?: string | null
                    paid_amount?: number | null
                    period?: string | null
                    pesantren_id?: string | null
                    status?: string | null
                    student_id?: string | null
                    updated_at?: string | null
                }
                Update: {
                    academic_year_id?: string | null
                    amount?: number
                    created_at?: string | null
                    created_by?: string | null
                    description?: string
                    due_date?: string
                    id?: string
                    invoice_number?: string | null
                    invoice_type?: string | null
                    invoice_type_id?: string | null
                    paid_amount?: number | null
                    period?: string | null
                    pesantren_id?: string | null
                    status?: string | null
                    student_id?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "invoices_academic_year_id_fkey"
                        columns: ["academic_year_id"]
                        isOneToOne: false
                        referencedRelation: "academic_years"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "invoices_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "invoices_invoice_type_id_fkey"
                        columns: ["invoice_type_id"]
                        isOneToOne: false
                        referencedRelation: "invoice_types"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "invoices_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "invoices_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "invoices_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "students"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "invoices_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "view_student_violation_points"
                        referencedColumns: ["student_id"]
                    },
                ]
            }
            login_activity: {
                Row: {
                    id: string
                    login_at: string | null
                    pesantren_id: string | null
                    user_email: string | null
                    user_id: string | null
                    user_role: string | null
                }
                Insert: {
                    id?: string
                    login_at?: string | null
                    pesantren_id?: string | null
                    user_email?: string | null
                    user_id?: string | null
                    user_role?: string | null
                }
                Update: {
                    id?: string
                    login_at?: string | null
                    pesantren_id?: string | null
                    user_email?: string | null
                    user_id?: string | null
                    user_role?: string | null
                }
                Relationships: []
            }
            login_logs: {
                Row: {
                    email: string | null
                    id: string
                    ip_address: string | null
                    login_time: string | null
                    pesantren_id: string | null
                    role: string | null
                    user_agent: string | null
                    user_id: string | null
                }
                Insert: {
                    email?: string | null
                    id?: string
                    ip_address?: string | null
                    login_time?: string | null
                    pesantren_id?: string | null
                    role?: string | null
                    user_agent?: string | null
                    user_id?: string | null
                }
                Update: {
                    email?: string | null
                    id?: string
                    ip_address?: string | null
                    login_time?: string | null
                    pesantren_id?: string | null
                    role?: string | null
                    user_agent?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "login_logs_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "login_logs_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notifications: {
                Row: {
                    created_at: string | null
                    id: string
                    is_read: boolean | null
                    link: string | null
                    message: string
                    title: string
                    type: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    is_read?: boolean | null
                    link?: string | null
                    message: string
                    title: string
                    type?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    is_read?: boolean | null
                    link?: string | null
                    message?: string
                    title?: string
                    type?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            payments: {
                Row: {
                    amount: number
                    created_at: string | null
                    id: string
                    invoice_id: string | null
                    notes: string | null
                    payment_date: string
                    payment_method: string | null
                    pesantren_id: string | null
                    received_by: string | null
                    reference_number: string | null
                    student_id: string | null
                }
                Insert: {
                    amount: number
                    created_at?: string | null
                    id?: string
                    invoice_id?: string | null
                    notes?: string | null
                    payment_date?: string
                    payment_method?: string | null
                    pesantren_id?: string | null
                    received_by?: string | null
                    reference_number?: string | null
                    student_id?: string | null
                }
                Update: {
                    amount?: number
                    created_at?: string | null
                    id?: string
                    invoice_id?: string | null
                    notes?: string | null
                    payment_date?: string
                    payment_method?: string | null
                    pesantren_id?: string | null
                    received_by?: string | null
                    reference_number?: string | null
                    student_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "payments_invoice_id_fkey"
                        columns: ["invoice_id"]
                        isOneToOne: false
                        referencedRelation: "invoices"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payments_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payments_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payments_received_by_fkey"
                        columns: ["received_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payments_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "students"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payments_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "view_student_violation_points"
                        referencedColumns: ["student_id"]
                    },
                ]
            }
            permissions: {
                Row: {
                    approved_at: string | null
                    approved_by: string | null
                    created_at: string | null
                    end_date: string
                    id: string
                    notes: string | null
                    permission_type: string | null
                    pesantren_id: string | null
                    reason: string
                    start_date: string
                    status: string | null
                    student_id: string | null
                    type: string | null
                    updated_at: string | null
                }
                Insert: {
                    approved_at?: string | null
                    approved_by?: string | null
                    created_at?: string | null
                    end_date: string
                    id?: string
                    notes?: string | null
                    permission_type?: string | null
                    pesantren_id?: string | null
                    reason: string
                    start_date: string
                    status?: string | null
                    student_id?: string | null
                    type?: string | null
                    updated_at?: string | null
                }
                Update: {
                    approved_at?: string | null
                    approved_by?: string | null
                    created_at?: string | null
                    end_date?: string
                    id?: string
                    notes?: string | null
                    permission_type?: string | null
                    pesantren_id?: string | null
                    reason?: string
                    start_date?: string
                    status?: string | null
                    student_id?: string | null
                    type?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "permissions_approved_by_fkey"
                        columns: ["approved_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "permissions_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "permissions_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "permissions_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "students"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "permissions_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "view_student_violation_points"
                        referencedColumns: ["student_id"]
                    },
                ]
            }
            pesantren: {
                Row: {
                    address: string | null
                    created_at: string | null
                    email: string | null
                    id: string
                    logo_url: string | null
                    name: string
                    phone: string | null
                    updated_at: string | null
                    website: string | null
                }
                Insert: {
                    address?: string | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    logo_url?: string | null
                    name: string
                    phone?: string | null
                    updated_at?: string | null
                    website?: string | null
                }
                Update: {
                    address?: string | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    logo_url?: string | null
                    name?: string
                    phone?: string | null
                    updated_at?: string | null
                    website?: string | null
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    email: string
                    id: string
                    is_active: boolean | null
                    name: string
                    pesantren_id: string | null
                    phone: string | null
                    role: string | null
                    status: string | null
                    updated_at: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    email: string
                    id: string
                    is_active?: boolean | null
                    name: string
                    pesantren_id?: string | null
                    phone?: string | null
                    role?: string | null
                    status?: string | null
                    updated_at?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    email?: string
                    id?: string
                    is_active?: boolean | null
                    name?: string
                    pesantren_id?: string | null
                    phone?: string | null
                    role?: string | null
                    status?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "profiles_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                ]
            }
            rapor_settings: {
                Row: {
                    academic_year: string | null
                    active_semester: number | null
                    address: string | null
                    created_at: string | null
                    email: string | null
                    headmaster_name: string | null
                    headmaster_nip: string | null
                    id: string
                    logo_url: string | null
                    passing_grade: number | null
                    pengasuh_pondok_name: string | null
                    pengasuh_pondok_nip: string | null
                    pesantren_id: string | null
                    phone: string | null
                    rapor_date: string | null
                    report_city: string | null
                    school_name: string | null
                    school_name_arabic: string | null
                    updated_at: string | null
                    website: string | null
                    yayasan_name: string | null
                }
                Insert: {
                    academic_year?: string | null
                    active_semester?: number | null
                    address?: string | null
                    created_at?: string | null
                    email?: string | null
                    headmaster_name?: string | null
                    headmaster_nip?: string | null
                    id?: string
                    logo_url?: string | null
                    passing_grade?: number | null
                    pengasuh_pondok_name?: string | null
                    pengasuh_pondok_nip?: string | null
                    pesantren_id?: string | null
                    phone?: string | null
                    rapor_date?: string | null
                    report_city?: string | null
                    school_name?: string | null
                    school_name_arabic?: string | null
                    updated_at?: string | null
                    website?: string | null
                    yayasan_name?: string | null
                }
                Update: {
                    academic_year?: string | null
                    active_semester?: number | null
                    address?: string | null
                    created_at?: string | null
                    email?: string | null
                    headmaster_name?: string | null
                    headmaster_nip?: string | null
                    id?: string
                    logo_url?: string | null
                    passing_grade?: number | null
                    pengasuh_pondok_name?: string | null
                    pengasuh_pondok_nip?: string | null
                    pesantren_id?: string | null
                    phone?: string | null
                    rapor_date?: string | null
                    report_city?: string | null
                    school_name?: string | null
                    school_name_arabic?: string | null
                    updated_at?: string | null
                    website?: string | null
                    yayasan_name?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "rapor_settings_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: true
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "rapor_settings_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: true
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                ]
            }
            schedules: {
                Row: {
                    academic_year_id: string | null
                    class_id: string | null
                    created_at: string | null
                    day_of_week: number | null
                    end_time: string | null
                    id: string
                    pesantren_id: string | null
                    room: string | null
                    start_time: string | null
                    subject_id: string | null
                    teacher_id: string | null
                }
                Insert: {
                    academic_year_id?: string | null
                    class_id?: string | null
                    created_at?: string | null
                    day_of_week?: number | null
                    end_time?: string | null
                    id?: string
                    pesantren_id?: string | null
                    room?: string | null
                    start_time?: string | null
                    subject_id?: string | null
                    teacher_id?: string | null
                }
                Update: {
                    academic_year_id?: string | null
                    class_id?: string | null
                    created_at?: string | null
                    day_of_week?: number | null
                    end_time?: string | null
                    id?: string
                    pesantren_id?: string | null
                    room?: string | null
                    start_time?: string | null
                    subject_id?: string | null
                    teacher_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "schedules_academic_year_id_fkey"
                        columns: ["academic_year_id"]
                        isOneToOne: false
                        referencedRelation: "academic_years"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "schedules_class_id_fkey"
                        columns: ["class_id"]
                        isOneToOne: false
                        referencedRelation: "classes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "schedules_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "schedules_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "schedules_subject_id_fkey"
                        columns: ["subject_id"]
                        isOneToOne: false
                        referencedRelation: "subjects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "schedules_teacher_id_fkey"
                        columns: ["teacher_id"]
                        isOneToOne: false
                        referencedRelation: "teachers"
                        referencedColumns: ["id"]
                    },
                ]
            }
            student_guardians: {
                Row: {
                    created_at: string | null
                    guardian_id: string | null
                    id: string
                    relationship: string | null
                    student_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    guardian_id?: string | null
                    id?: string
                    relationship?: string | null
                    student_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    guardian_id?: string | null
                    id?: string
                    relationship?: string | null
                    student_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "student_guardians_guardian_id_fkey"
                        columns: ["guardian_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "student_guardians_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "students"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "student_guardians_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "view_student_violation_points"
                        referencedColumns: ["student_id"]
                    },
                ]
            }
            students: {
                Row: {
                    address: string | null
                    available_roles: string[] | null
                    birth_date: string | null
                    birth_info: string | null
                    birth_place: string | null
                    class_id: string | null
                    created_at: string | null
                    dormitory_id: string | null
                    enrollment_date: string | null
                    gender: string | null
                    id: string
                    name: string
                    nis: string | null
                    parent_name: string | null
                    parent_phone: string | null
                    parent_user_id: string | null
                    pesantren_id: string | null
                    photo_url: string | null
                    status: string | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    address?: string | null
                    available_roles?: string[] | null
                    birth_date?: string | null
                    birth_info?: string | null
                    birth_place?: string | null
                    class_id?: string | null
                    created_at?: string | null
                    dormitory_id?: string | null
                    enrollment_date?: string | null
                    gender?: string | null
                    id?: string
                    name: string
                    nis?: string | null
                    parent_name?: string | null
                    parent_phone?: string | null
                    parent_user_id?: string | null
                    pesantren_id?: string | null
                    photo_url?: string | null
                    status?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    address?: string | null
                    available_roles?: string[] | null
                    birth_date?: string | null
                    birth_info?: string | null
                    birth_place?: string | null
                    class_id?: string | null
                    created_at?: string | null
                    dormitory_id?: string | null
                    enrollment_date?: string | null
                    gender?: string | null
                    id?: string
                    name?: string
                    nis?: string | null
                    parent_name?: string | null
                    parent_phone?: string | null
                    parent_user_id?: string | null
                    pesantren_id?: string | null
                    photo_url?: string | null
                    status?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "students_class_id_fkey"
                        columns: ["class_id"]
                        isOneToOne: false
                        referencedRelation: "classes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "students_dormitory_fk"
                        columns: ["dormitory_id"]
                        isOneToOne: false
                        referencedRelation: "dormitories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "students_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "students_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                ]
            }
            subjects: {
                Row: {
                    category: string | null
                    code: string | null
                    created_at: string | null
                    credits: number | null
                    description: string | null
                    id: string
                    is_active: boolean | null
                    name: string
                    pesantren_id: string | null
                }
                Insert: {
                    category?: string | null
                    code?: string | null
                    created_at?: string | null
                    credits?: number | null
                    description?: string | null
                    id?: string
                    is_active?: boolean | null
                    name: string
                    pesantren_id?: string | null
                }
                Update: {
                    category?: string | null
                    code?: string | null
                    created_at?: string | null
                    credits?: number | null
                    description?: string | null
                    id?: string
                    is_active?: boolean | null
                    name?: string
                    pesantren_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "subjects_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "subjects_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                ]
            }
            system_settings: {
                Row: {
                    active_academic_year_id: string | null
                    allow_registration: boolean | null
                    app_name: string | null
                    auto_backup: boolean | null
                    created_at: string | null
                    email_notifications: boolean | null
                    id: string
                    logo_url: string | null
                    maintenance_mode: boolean | null
                    primary_color: string | null
                    session_timeout: number | null
                    sms_notifications: boolean | null
                    tagline: string | null
                    updated_at: string | null
                }
                Insert: {
                    active_academic_year_id?: string | null
                    allow_registration?: boolean | null
                    app_name?: string | null
                    auto_backup?: boolean | null
                    created_at?: string | null
                    email_notifications?: boolean | null
                    id?: string
                    logo_url?: string | null
                    maintenance_mode?: boolean | null
                    primary_color?: string | null
                    session_timeout?: number | null
                    sms_notifications?: boolean | null
                    tagline?: string | null
                    updated_at?: string | null
                }
                Update: {
                    active_academic_year_id?: string | null
                    allow_registration?: boolean | null
                    app_name?: string | null
                    auto_backup?: boolean | null
                    created_at?: string | null
                    email_notifications?: boolean | null
                    id?: string
                    logo_url?: string | null
                    maintenance_mode?: boolean | null
                    primary_color?: string | null
                    session_timeout?: number | null
                    sms_notifications?: boolean | null
                    tagline?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "system_settings_active_academic_year_id_fkey"
                        columns: ["active_academic_year_id"]
                        isOneToOne: false
                        referencedRelation: "academic_years"
                        referencedColumns: ["id"]
                    },
                ]
            }
            teachers: {
                Row: {
                    address: string | null
                    created_at: string | null
                    email: string | null
                    gender: string | null
                    id: string
                    is_active: boolean | null
                    join_date: string | null
                    name: string
                    nip: string | null
                    pesantren_id: string | null
                    phone: string | null
                    photo_url: string | null
                    specialization: string | null
                    status: string | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    address?: string | null
                    created_at?: string | null
                    email?: string | null
                    gender?: string | null
                    id?: string
                    is_active?: boolean | null
                    join_date?: string | null
                    name: string
                    nip?: string | null
                    pesantren_id?: string | null
                    phone?: string | null
                    photo_url?: string | null
                    specialization?: string | null
                    status?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    address?: string | null
                    created_at?: string | null
                    email?: string | null
                    gender?: string | null
                    id?: string
                    is_active?: boolean | null
                    join_date?: string | null
                    name?: string
                    nip?: string | null
                    pesantren_id?: string | null
                    phone?: string | null
                    photo_url?: string | null
                    specialization?: string | null
                    status?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "teachers_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "teachers_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_roles: {
                Row: {
                    created_at: string | null
                    id: string
                    is_primary: boolean | null
                    role: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    is_primary?: boolean | null
                    role: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    is_primary?: boolean | null
                    role?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_roles_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            violations: {
                Row: {
                    attendance_id: string | null
                    category: string | null
                    completed_at: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    pesantren_id: string | null
                    points: number | null
                    punishment: string | null
                    reported_by: string | null
                    status: string | null
                    student_id: string | null
                    type: string | null
                    updated_at: string | null
                    violation_date: string | null
                }
                Insert: {
                    attendance_id?: string | null
                    category?: string | null
                    completed_at?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    pesantren_id?: string | null
                    points?: number | null
                    punishment?: string | null
                    reported_by?: string | null
                    status?: string | null
                    student_id?: string | null
                    type?: string | null
                    updated_at?: string | null
                    violation_date?: string | null
                }
                Update: {
                    attendance_id?: string | null
                    category?: string | null
                    completed_at?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    pesantren_id?: string | null
                    points?: number | null
                    punishment?: string | null
                    reported_by?: string | null
                    status?: string | null
                    student_id?: string | null
                    type?: string | null
                    updated_at?: string | null
                    violation_date?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "violations_attendance_fk"
                        columns: ["attendance_id"]
                        isOneToOne: false
                        referencedRelation: "attendance"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "violations_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "violations_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "violations_reported_by_fkey"
                        columns: ["reported_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "violations_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "students"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "violations_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "view_student_violation_points"
                        referencedColumns: ["student_id"]
                    },
                ]
            }
        }
        Views: {
            view_finance_monthly_summary: {
                Row: {
                    month_year: string | null
                    pesantren_id: string | null
                    total_expense: number | null
                    total_income: number | null
                }
                Relationships: []
            }
            view_pesantren_dashboard_stats: {
                Row: {
                    address: string | null
                    created_at: string | null
                    id: string | null
                    logo_url: string | null
                    name: string | null
                    phone: string | null
                    total_classes: number | null
                    total_students: number | null
                    total_teachers: number | null
                    total_users: number | null
                }
                Insert: {
                    address?: string | null
                    created_at?: string | null
                    id?: string | null
                    logo_url?: string | null
                    name?: string | null
                    phone?: string | null
                    total_classes?: never
                    total_students?: never
                    total_teachers?: never
                    total_users?: never
                }
                Update: {
                    address?: string | null
                    created_at?: string | null
                    id?: string | null
                    logo_url?: string | null
                    name?: string | null
                    phone?: string | null
                    total_classes?: never
                    total_students?: never
                    total_teachers?: never
                    total_users?: never
                }
                Relationships: []
            }
            view_student_violation_points: {
                Row: {
                    class_id: string | null
                    class_name: string | null
                    pesantren_id: string | null
                    student_id: string | null
                    student_name: string | null
                    total_points: number | null
                    violation_count: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "students_class_id_fkey"
                        columns: ["class_id"]
                        isOneToOne: false
                        referencedRelation: "classes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "students_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "pesantren"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "students_pesantren_id_fkey"
                        columns: ["pesantren_id"]
                        isOneToOne: false
                        referencedRelation: "view_pesantren_dashboard_stats"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Functions: {
            admin_reset_password: {
                Args: { new_password: string; target_user_id: string }
                Returns: Json
            }
            delete_user_complete: { Args: { target_user_id: string }; Returns: Json }
            get_akademik_dashboard_stats: { Args: never; Returns: Json }
            get_class_attendance_status: {
                Args: {
                    p_class_id: string
                    p_date: string
                    p_session?: string
                    p_type?: string
                }
                Returns: {
                    class_name: string
                    nis: string
                    notes: string
                    status: string
                    student_id: string
                    student_name: string
                }[]
            }
            get_login_traffic_7days: {
                Args: never
                Returns: {
                    day_name: string
                    login_count: number
                }[]
            }
            get_my_children_ids: { Args: never; Returns: string[] }
            get_my_pesantren: { Args: never; Returns: string }
            get_or_create_rapor_settings: {
                Args: { p_pesantren_id: string }
                Returns: {
                    academic_year: string | null
                    active_semester: number | null
                    address: string | null
                    created_at: string | null
                    email: string | null
                    headmaster_name: string | null
                    headmaster_nip: string | null
                    id: string
                    logo_url: string | null
                    passing_grade: number | null
                    pengasuh_pondok_name: string | null
                    pengasuh_pondok_nip: string | null
                    pesantren_id: string | null
                    phone: string | null
                    rapor_date: string | null
                    report_city: string | null
                    school_name: string | null
                    school_name_arabic: string | null
                    updated_at: string | null
                    website: string | null
                    yayasan_name: string | null
                }[]
                SetofOptions: {
                    from: "*"
                    to: "rapor_settings"
                    isOneToOne: false
                    isSetofReturn: true
                }
            }
            get_parent_dashboard_summary: {
                Args: never
                Returns: {
                    class_name: string
                    nis: string
                    student_id: string
                    student_name: string
                    total_bill_unpaid: number
                    violation_points: number
                }[]
            }
            get_pesantren_growth_6months: {
                Args: never
                Returns: {
                    count: number
                    month_name: string
                }[]
            }
            get_super_admin_stats: { Args: never; Returns: Json }
            get_user_role: { Args: never; Returns: string }
            get_user_roles: {
                Args: { user_email: string }
                Returns: {
                    pesantren_id: string
                    role: string
                }[]
            }
            handle_user_login: {
                Args: { p_ip_address?: string; p_role?: string; p_user_agent?: string }
                Returns: Json
            }
            link_guardian_to_student: {
                Args: {
                    p_guardian_email: string
                    p_relationship?: string
                    p_student_nis: string
                }
                Returns: Json
            }
            log_activity: {
                Args: {
                    p_action: string
                    p_details?: Json
                    p_entity_id?: string
                    p_entity_type?: string
                }
                Returns: string
            }
            record_login: {
                Args: {
                    p_email: string
                    p_pesantren_id?: string
                    p_role: string
                    p_user_id: string
                }
                Returns: undefined
            }
            set_active_academic_year: {
                Args: { p_year_id: string }
                Returns: boolean
            }
            submit_class_attendance: {
                Args: {
                    p_attendance_list: Json
                    p_date: string
                    p_pesantren_id?: string
                    p_recorded_by: string
                    p_session?: string
                    p_type?: string
                }
                Returns: Json
            }
            update_dormitory_safe: {
                Args: {
                    p_building: string
                    p_capacity: number
                    p_id: string
                    p_name: string
                    p_supervisor_id: string
                }
                Returns: Json
            }
            user_has_any_role: { Args: { check_roles: string[] }; Returns: boolean }
            user_has_role: { Args: { check_role: string }; Returns: boolean }
            validate_user_role: {
                Args: { selected_role: string; user_email: string }
                Returns: boolean
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    graphql_public: {
        Enums: {},
    },
    public: {
        Enums: {},
    },
} as const

// Helper Exports
export type Class = Tables<'classes'>
export type ClassInsert = TablesInsert<'classes'>
export type ClassUpdate = TablesUpdate<'classes'>
export type AcademicYear = Tables<'academic_years'>
export type Subject = Tables<'subjects'>
export type Student = Tables<'students'>
export type Teacher = Tables<'teachers'>
export type Profile = Tables<'profiles'>
