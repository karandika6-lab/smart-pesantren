-- ═══════════════════════════════════════════════════════════════════════════════
-- SMART PESANTREN - MASTER SETUP SQL
-- Satu file lengkap untuk setup database baru
-- Jalankan di Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 01: EXTENSIONS & SETUP
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 02: CORE TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Pesantren (Multi-Tenant)
CREATE TABLE IF NOT EXISTS public.pesantren (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email TEXT,
    logo_url TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'santri',
    phone VARCHAR(20),
    avatar_url TEXT,
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles (Multi-role support)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN (
        'super_admin', 'admin_keuangan', 'admin_akademik', 
        'kesantrian', 'admin_absensi', 'wali_kelas', 
        'ustadz', 'wali_santri', 'santri'
    )),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Login Activity
CREATE TABLE IF NOT EXISTS public.login_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_email TEXT,
    user_role TEXT,
    pesantren_id UUID,
    login_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 03: AKADEMIK TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Academic Years
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(20) NOT NULL,
    semester VARCHAR(10) DEFAULT 'ganjil',
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT false,
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teachers
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nip VARCHAR(50),
    name TEXT NOT NULL,
    gender VARCHAR(1) DEFAULT 'L',
    phone VARCHAR(20),
    email TEXT,
    address TEXT,
    specialization TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active',
    photo_url TEXT,
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    grade_level INT,
    grade VARCHAR(20),
    homeroom_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    capacity INT DEFAULT 40,
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nis VARCHAR(50),
    name TEXT NOT NULL,
    gender VARCHAR(1) DEFAULT 'L',
    birth_date DATE,
    birth_place TEXT,
    birth_info TEXT,
    address TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    dormitory_id UUID,
    parent_name TEXT,
    parent_phone VARCHAR(20),
    parent_user_id UUID,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active',
    photo_url TEXT,
    available_roles TEXT[] DEFAULT ARRAY['santri', 'wali_santri'],
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20),
    name TEXT NOT NULL,
    category VARCHAR(50),
    description TEXT,
    credits INT DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME,
    end_time TIME,
    room VARCHAR(50),
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grades
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    semester INT CHECK (semester IN (1, 2)),
    tugas_score DECIMAL(5,2),
    uts_score DECIMAL(5,2),
    uas_score DECIMAL(5,2),
    final_score DECIMAL(5,2),
    grade_letter VARCHAR(2),
    notes TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hafalan Progress
CREATE TABLE IF NOT EXISTS public.hafalan_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    surah_number INT NOT NULL,
    surah_name TEXT NOT NULL,
    juz INT,
    start_ayat INT DEFAULT 1,
    end_ayat INT,
    verses_memorized INT DEFAULT 0,
    total_verses INT,
    status TEXT DEFAULT 'memorizing',
    grade VARCHAR(2),
    last_test_date DATE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rapor Settings
CREATE TABLE IF NOT EXISTS public.rapor_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    yayasan_name TEXT DEFAULT 'YAYASAN PONDOK PESANTREN',
    school_name TEXT DEFAULT 'PONDOK PESANTREN',
    school_name_arabic TEXT DEFAULT '',
    address TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    website TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    pengasuh_pondok_name TEXT DEFAULT '',
    pengasuh_pondok_nip TEXT DEFAULT '',
    headmaster_name TEXT,
    headmaster_nip VARCHAR(50),
    active_semester INT DEFAULT 1,
    academic_year TEXT DEFAULT '2024/2025',
    report_city TEXT DEFAULT '',
    rapor_date DATE,
    passing_grade DECIMAL(5,2) DEFAULT 70,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pesantren_id)
);

-- Attendance Summary
CREATE TABLE IF NOT EXISTS public.attendance_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
    total_days INT DEFAULT 0,
    present_days INT DEFAULT 0,
    sick_days INT DEFAULT 0,
    permitted_days INT DEFAULT 0,
    absent_days INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 04: KEUANGAN TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Invoice Types
CREATE TABLE IF NOT EXISTS public.invoice_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_period TEXT CHECK (recurrence_period IN ('monthly', 'semester', 'yearly')),
    is_active BOOLEAN DEFAULT true,
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    invoice_type_id UUID REFERENCES public.invoice_types(id) ON DELETE SET NULL,
    invoice_type TEXT,
    invoice_number TEXT,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'unpaid')),
    paid_amount DECIMAL(12,2) DEFAULT 0,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    period TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT CHECK (payment_method IN ('cash', 'transfer', 'tunai', 'gateway')),
    reference_number TEXT,
    notes TEXT,
    received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 05: KESANTRIAN TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Dormitories
CREATE TABLE IF NOT EXISTS public.dormitories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    building TEXT,
    capacity INT DEFAULT 0,
    current_occupancy INT DEFAULT 0,
    supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    gender VARCHAR(1) CHECK (gender IN ('L', 'P')),
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK to students.dormitory_id
DO $$ BEGIN
    ALTER TABLE public.students ADD CONSTRAINT students_dormitory_fk 
    FOREIGN KEY (dormitory_id) REFERENCES public.dormitories(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Violations
CREATE TABLE IF NOT EXISTS public.violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    violation_date DATE DEFAULT CURRENT_DATE,
    category TEXT CHECK (category IN ('ringan', 'sedang', 'berat')),
    type TEXT,
    description TEXT,
    points INT DEFAULT 0,
    punishment TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    attendance_id UUID,
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    permission_type TEXT CHECK (permission_type IN ('pulang', 'keluar', 'sakit', 'kegiatan', 'lainnya')),
    type TEXT,
    reason TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 06: ABSENSI TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT DEFAULT 'class' CHECK (type IN ('class', 'prayer', 'activity')),
    session TEXT,
    status TEXT NOT NULL CHECK (status IN ('hadir', 'sakit', 'izin', 'alpha', 'telat')),
    check_in_time TIME,
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, date, type)
);

-- Attendance Sessions
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('academic', 'prayer', 'activity', 'other')),
    start_time TIME,
    end_time TIME,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK for violations.attendance_id
DO $$ BEGIN
    ALTER TABLE public.violations ADD CONSTRAINT violations_attendance_fk 
    FOREIGN KEY (attendance_id) REFERENCES public.attendance(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 07: PARENT PORTAL TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Student Guardians
CREATE TABLE IF NOT EXISTS public.student_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'parent',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, guardian_id)
);

-- Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_roles TEXT[],
    priority TEXT DEFAULT 'normal',
    is_active BOOLEAN DEFAULT true,
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 08: INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_profiles_pesantren ON profiles(pesantren_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_nis ON students(nis);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_teachers_nip ON teachers(nip);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_invoices_student ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_violations_student ON violations(student_id);
CREATE INDEX IF NOT EXISTS idx_schedules_class ON schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_login_activity_date ON login_activity(login_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

SELECT 'BAGIAN 01-08: Tables & Indexes Created!' as status;

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 09: RLS POLICIES (SIMPLE & SAFE)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE pesantren ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE hafalan_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE dormitories ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Simple Policies (Anti-recursion) - All authenticated users can access
CREATE POLICY "pesantren_all" ON pesantren FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "profiles_all" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "user_roles_all" ON user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "activity_logs_all" ON activity_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "login_activity_all" ON login_activity FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "academic_years_all" ON academic_years FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "teachers_all" ON teachers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "classes_all" ON classes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "students_all" ON students FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "subjects_all" ON subjects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "schedules_all" ON schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "grades_all" ON grades FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hafalan_all" ON hafalan_progress FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rapor_settings_all" ON rapor_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "attendance_summary_all" ON attendance_summary FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "invoice_types_all" ON invoice_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "invoices_all" ON invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "payments_all" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "expenses_all" ON expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dormitories_all" ON dormitories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "violations_all" ON violations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "permissions_all" ON permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "attendance_all" ON attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "attendance_sessions_all" ON attendance_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "student_guardians_all" ON student_guardians FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "announcements_all" ON announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "notifications_all" ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 10: HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_pesantren()
RETURNS UUID AS $$
  SELECT pesantren_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_has_role(check_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = check_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_has_any_role(check_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ANY(check_roles));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 11: RPC FUNCTIONS - AUTHENTICATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- Handle New User (Anti-Error Trigger Function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, pesantren_id, phone, is_active, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'santri'),
    (NEW.raw_user_meta_data->>'pesantren_id')::UUID,
    NEW.raw_user_meta_data->>'phone',
    true,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    updated_at = NOW();
  
  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role, is_primary)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'santri'), true)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin Create User
CREATE OR REPLACE FUNCTION admin_create_user(
    p_email TEXT,
    p_password TEXT,
    p_name TEXT,
    p_role TEXT,
    p_pesantren_id UUID DEFAULT NULL,
    p_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_user_id UUID;
    v_available_roles TEXT[];
    v_final_pesantren_id UUID;
BEGIN
    v_final_pesantren_id := COALESCE(p_pesantren_id, (SELECT id FROM pesantren LIMIT 1));
    
    IF p_role = 'santri' THEN
        v_available_roles := ARRAY['santri', 'wali_santri'];
    ELSE
        v_available_roles := ARRAY[p_role];
    END IF;

    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    
    IF v_user_id IS NOT NULL THEN
        RETURN v_user_id;
    END IF;

    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_user_meta_data, raw_app_meta_data, role, aud, created_at, updated_at,
        confirmation_token, recovery_token
    ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        p_email,
        extensions.crypt(p_password, extensions.gen_salt('bf')),
        now(),
        jsonb_build_object('name', p_name, 'role', p_role, 'pesantren_id', v_final_pesantren_id::TEXT, 'phone', p_phone, 'available_roles', v_available_roles),
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        'authenticated',
        'authenticated',
        now(), now(), '', ''
    )
    RETURNING id INTO v_user_id;
    
    -- Create identity for the user
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (v_user_id, v_user_id, jsonb_build_object('sub', v_user_id, 'email', p_email), 'email', v_user_id, now(), now(), now());

    RETURN v_user_id;
END;
$$;

-- Automated Registration
CREATE OR REPLACE FUNCTION automated_registration(p_type TEXT, p_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_user_id UUID;
    v_record_id UUID;
    v_pesantren_id UUID;
    v_email TEXT;
    v_pass TEXT;
    v_name TEXT;
    v_nis TEXT;
    v_class_id UUID;
BEGIN
    v_pesantren_id := COALESCE(
        (p_data->>'pesantren_id')::UUID,
        (SELECT pesantren_id FROM profiles WHERE id = auth.uid()),
        (SELECT id FROM pesantren LIMIT 1)
    );

    IF p_type = 'student' THEN
        v_name := p_data->>'name';
        v_nis := p_data->>'nis';
        v_email := COALESCE(p_data->>'email', 'santri.' || v_nis || '@pesantren.local');
        v_pass := COALESCE(p_data->>'password', v_nis || '123');
        v_class_id := (p_data->>'class_id')::UUID;
        
        IF EXISTS (SELECT 1 FROM students WHERE nis = v_nis) THEN
            RETURN jsonb_build_object('success', false, 'message', 'NIS ' || v_nis || ' sudah terdaftar');
        END IF;
        
        IF COALESCE((p_data->>'create_student_account')::BOOLEAN, true) THEN
            v_user_id := admin_create_user(v_email, v_pass, v_name, 'santri', v_pesantren_id, p_data->>'parent_phone');
        END IF;
        
        INSERT INTO students (user_id, nis, name, gender, class_id, pesantren_id, parent_name, parent_phone, birth_info, address, status, available_roles)
        VALUES (v_user_id, v_nis, v_name, COALESCE(p_data->>'gender', 'L'), v_class_id, v_pesantren_id, p_data->>'parent_name', p_data->>'parent_phone', p_data->>'birth_info', p_data->>'address', 'active', ARRAY['santri', 'wali_santri'])
        RETURNING id INTO v_record_id;

        RETURN jsonb_build_object('success', true, 'student_id', v_record_id, 'user_id', v_user_id, 'email', v_email, 'password', v_pass, 'pesantren_id', v_pesantren_id, 'message', 'Santri berhasil ditambahkan');
        
    ELSIF p_type = 'teacher' THEN
        v_name := p_data->>'name';
        v_email := COALESCE(p_data->>'email', 'guru.' || replace(lower(v_name), ' ', '.') || '@pesantren.local');
        v_pass := COALESCE(p_data->>'password', 'guru123');
        
        v_user_id := admin_create_user(v_email, v_pass, v_name, 'ustadz', v_pesantren_id, p_data->>'phone');
        
        INSERT INTO teachers (user_id, name, nip, phone, email, specialization, gender, is_active, pesantren_id, status)
        VALUES (v_user_id, v_name, p_data->>'nip', p_data->>'phone', v_email, p_data->>'specialization', COALESCE(p_data->>'gender', 'L'), true, v_pesantren_id, 'active')
        RETURNING id INTO v_record_id;

        RETURN jsonb_build_object('success', true, 'teacher_id', v_record_id, 'user_id', v_user_id, 'email', v_email, 'password', v_pass, 'pesantren_id', v_pesantren_id, 'message', 'Guru berhasil ditambahkan');
    END IF;

    RETURN jsonb_build_object('success', false, 'message', 'Tipe tidak valid');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Delete User Complete (Protected Super Admin)
CREATE OR REPLACE FUNCTION delete_user_complete(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email FROM auth.users WHERE id = target_user_id;
    
    -- PROTECT SUPER ADMIN
    IF v_email = 'karandika6@gmail.com' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Super Admin tidak dapat dihapus');
    END IF;
    
    -- Delete from teachers
    DELETE FROM teachers WHERE user_id = target_user_id;
    -- Delete from students
    DELETE FROM students WHERE user_id = target_user_id;
    -- Delete from profiles (will cascade to user_roles)
    DELETE FROM profiles WHERE id = target_user_id;
    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = target_user_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'User berhasil dihapus');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Admin Reset Password
CREATE OR REPLACE FUNCTION admin_reset_password(target_user_id UUID, new_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    UPDATE auth.users
    SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
        updated_at = now()
    WHERE id = target_user_id;
    
    -- Invalidate all sessions
    DELETE FROM auth.sessions WHERE user_id = target_user_id;
    DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Password berhasil direset');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 12: RPC FUNCTIONS - LOGIN & DASHBOARD
-- ═══════════════════════════════════════════════════════════════════════════════

-- Get User Roles
CREATE OR REPLACE FUNCTION get_user_roles(user_email TEXT)
RETURNS TABLE(role TEXT, pesantren_id UUID)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT p.role::TEXT, p.pesantren_id FROM profiles p
    JOIN auth.users u ON p.id = u.id WHERE u.email = user_email;
END;
$$;

-- Validate User Role
CREATE OR REPLACE FUNCTION validate_user_role(user_email TEXT, selected_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur JOIN profiles p ON ur.user_id = p.id
    WHERE p.email = user_email AND ur.role = selected_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle User Login
CREATE OR REPLACE FUNCTION handle_user_login(p_role TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO login_activity (user_id, user_email, user_role, pesantren_id)
    SELECT auth.uid(), email, COALESCE(p_role, role), pesantren_id FROM profiles WHERE id = auth.uid();
END;
$$;

-- Record Login
CREATE OR REPLACE FUNCTION record_login(p_user_id UUID, p_email TEXT, p_role TEXT, p_pesantren_id UUID DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO login_activity (user_id, user_email, user_role, pesantren_id) VALUES (p_user_id, p_email, p_role, p_pesantren_id);
END;
$$;

-- Get Login Traffic 7 Days
CREATE OR REPLACE FUNCTION get_login_traffic_7days()
RETURNS TABLE(day_name TEXT, login_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH days AS (SELECT generate_series(CURRENT_DATE - 6, CURRENT_DATE, '1 day'::interval)::date as day),
    counts AS (SELECT DATE(login_at) as login_day, COUNT(*) as cnt FROM login_activity WHERE login_at >= NOW() - INTERVAL '7 days' GROUP BY DATE(login_at))
    SELECT TO_CHAR(d.day, 'Dy'), COALESCE(c.cnt, 0)::BIGINT FROM days d LEFT JOIN counts c ON d.day = c.login_day ORDER BY d.day;
END;
$$;

-- Get Pesantren Growth 6 Months
CREATE OR REPLACE FUNCTION get_pesantren_growth_6months()
RETURNS TABLE(month_name TEXT, count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH months AS (SELECT generate_series(DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months', DATE_TRUNC('month', CURRENT_DATE), '1 month'::interval)::date as month),
    counts AS (SELECT DATE_TRUNC('month', created_at)::date as month, COUNT(*) as cnt FROM pesantren GROUP BY DATE_TRUNC('month', created_at))
    SELECT TO_CHAR(m.month, 'Mon'), COALESCE(c.cnt, 0)::BIGINT FROM months m LEFT JOIN counts c ON m.month = c.month ORDER BY m.month;
END;
$$;

-- Get Akademik Dashboard Stats
CREATE OR REPLACE FUNCTION get_akademik_dashboard_stats()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_students', (SELECT COUNT(*) FROM students WHERE status = 'active'),
        'total_teachers', (SELECT COUNT(*) FROM teachers WHERE is_active = true),
        'total_classes', (SELECT COUNT(*) FROM classes),
        'total_subjects', (SELECT COUNT(*) FROM subjects WHERE is_active = true),
        'active_academic_year', (SELECT name FROM academic_years WHERE is_active = true LIMIT 1)
    ) INTO v_stats;
    RETURN v_stats;
END;
$$;

-- Set Active Academic Year
CREATE OR REPLACE FUNCTION set_active_academic_year(p_year_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE academic_years SET is_active = false WHERE is_active = true;
    UPDATE academic_years SET is_active = true WHERE id = p_year_id;
    RETURN true;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 13: RPC FUNCTIONS - ABSENSI
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_class_attendance_status(p_class_id UUID, p_date DATE, p_session TEXT DEFAULT NULL, p_type TEXT DEFAULT 'class')
RETURNS TABLE (student_id UUID, student_name TEXT, class_name TEXT, nis TEXT, status TEXT, notes TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, c.name, s.nis, a.status, a.notes
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN attendance a ON s.id = a.student_id AND a.date = p_date AND ((p_session IS NOT NULL AND a.session = p_session) OR (p_session IS NULL AND a.type = p_type))
    WHERE (p_class_id IS NULL OR s.class_id = p_class_id) AND s.status = 'active'
    ORDER BY c.name, s.name;
END;
$$;

CREATE OR REPLACE FUNCTION submit_class_attendance(p_date DATE, p_attendance_list JSONB, p_recorded_by UUID, p_pesantren_id UUID DEFAULT NULL, p_session TEXT DEFAULT NULL, p_type TEXT DEFAULT 'class')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE item jsonb; rec_count INT := 0; v_pesantren_id UUID;
BEGIN
    v_pesantren_id := COALESCE(p_pesantren_id, (SELECT pesantren_id FROM profiles WHERE id = p_recorded_by));
    FOR item IN SELECT * FROM jsonb_array_elements(p_attendance_list) LOOP
        INSERT INTO attendance (student_id, date, type, session, status, notes, recorded_by, pesantren_id, updated_at)
        VALUES ((item->>'student_id')::UUID, p_date, p_type, p_session, item->>'status', item->>'notes', p_recorded_by, v_pesantren_id, NOW())
        ON CONFLICT (student_id, date, type) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, session = EXCLUDED.session, updated_at = NOW();
        rec_count := rec_count + 1;
    END LOOP;
    RETURN jsonb_build_object('success', true, 'message', format('Berhasil memproses absensi %s siswa', rec_count), 'count', rec_count);
EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 14: RPC FUNCTIONS - KESANTRIAN & PARENT
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_dormitory_safe(p_id UUID, p_name TEXT, p_building TEXT, p_capacity INT, p_supervisor_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_result JSONB;
BEGIN
  UPDATE dormitories SET name = p_name, building = p_building, capacity = p_capacity, supervisor_id = p_supervisor_id, updated_at = NOW() WHERE id = p_id
  RETURNING to_jsonb(dormitories.*) INTO v_result;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION get_my_children_ids()
RETURNS UUID[] LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN ARRAY(SELECT student_id FROM student_guardians WHERE guardian_id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION get_parent_dashboard_summary()
RETURNS TABLE (student_id UUID, student_name TEXT, class_name TEXT, nis TEXT, total_bill_unpaid NUMERIC, violation_points INT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, c.name, s.nis,
        COALESCE((SELECT SUM(amount) FROM invoices i WHERE i.student_id = s.id AND i.status = 'pending'), 0),
        COALESCE((SELECT SUM(points)::INT FROM violations v WHERE v.student_id = s.id), 0)
    FROM students s LEFT JOIN classes c ON s.class_id = c.id
    WHERE s.id IN (SELECT unnest(get_my_children_ids()));
END;
$$;

CREATE OR REPLACE FUNCTION link_guardian_to_student(p_guardian_email TEXT, p_student_nis TEXT, p_relationship TEXT DEFAULT 'parent')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_guardian_id UUID; v_student_id UUID;
BEGIN
    SELECT id INTO v_guardian_id FROM profiles WHERE email = p_guardian_email;
    IF v_guardian_id IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'Email Wali tidak ditemukan'); END IF;
    SELECT id INTO v_student_id FROM students WHERE nis = p_student_nis;
    IF v_student_id IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'NIS Santri tidak ditemukan'); END IF;
    INSERT INTO student_guardians (student_id, guardian_id, relationship) VALUES (v_student_id, v_guardian_id, p_relationship) ON CONFLICT DO NOTHING;
    RETURN jsonb_build_object('success', true, 'message', 'Berhasil menghubungkan');
END;
$$;

-- Rapor Settings Functions
CREATE OR REPLACE FUNCTION get_or_create_rapor_settings(p_pesantren_id UUID)
RETURNS SETOF rapor_settings LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_settings rapor_settings; v_pesantren RECORD;
BEGIN
    SELECT * INTO v_settings FROM rapor_settings WHERE pesantren_id = p_pesantren_id;
    IF v_settings IS NOT NULL THEN RETURN NEXT v_settings; RETURN; END IF;
    SELECT * INTO v_pesantren FROM pesantren WHERE id = p_pesantren_id;
    IF v_pesantren IS NULL THEN RETURN; END IF;
    INSERT INTO rapor_settings (pesantren_id, school_name, address, phone, logo_url)
    VALUES (p_pesantren_id, COALESCE(v_pesantren.name, 'PONDOK PESANTREN'), COALESCE(v_pesantren.address, ''), COALESCE(v_pesantren.phone, ''), COALESCE(v_pesantren.logo_url, ''))
    RETURNING * INTO v_settings;
    RETURN NEXT v_settings;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 15: VIEWS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW view_student_violation_points AS
SELECT s.id AS student_id, s.name AS student_name, s.class_id, c.name AS class_name,
    COALESCE(SUM(v.points), 0) AS total_points, COUNT(v.id) AS violation_count, s.pesantren_id
FROM students s LEFT JOIN classes c ON s.class_id = c.id LEFT JOIN violations v ON s.id = v.student_id
GROUP BY s.id, s.name, s.class_id, c.name, s.pesantren_id;

CREATE OR REPLACE VIEW view_finance_monthly_summary AS
SELECT TO_CHAR(date_trunc('month', t_date), 'YYYY-MM') AS month_year, pesantren_id,
    SUM(CASE WHEN t_type = 'income' THEN amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN t_type = 'expense' THEN amount ELSE 0 END) AS total_expense
FROM (
    SELECT payment_date AS t_date, amount, 'income' AS t_type, pesantren_id FROM payments
    UNION ALL SELECT expense_date AS t_date, amount, 'expense' AS t_type, pesantren_id FROM expenses
) AS combined GROUP BY date_trunc('month', t_date), pesantren_id ORDER BY month_year DESC;

GRANT SELECT ON view_student_violation_points TO authenticated;
GRANT SELECT ON view_finance_monthly_summary TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 16: TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_teachers_updated_at ON teachers;
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_grades_updated_at ON grades;
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-Create Violation on Prayer Alpha
CREATE OR REPLACE FUNCTION handle_attendance_violation() RETURNS TRIGGER AS $$
DECLARE v_points INT := 0; v_desc TEXT := '';
BEGIN
    DELETE FROM violations WHERE attendance_id = NEW.id;
    IF NEW.type = 'prayer' THEN
        IF NEW.status = 'alpha' THEN v_points := 5; v_desc := 'Tidak mengikuti jamaah (Alpha)';
        ELSIF NEW.status = 'telat' THEN v_points := 2; v_desc := 'Terlambat jamaah (Telat)'; END IF;
        IF v_points > 0 THEN
            INSERT INTO violations (pesantren_id, student_id, category, description, points, violation_date, attendance_id, status)
            VALUES (NEW.pesantren_id, NEW.student_id, 'ringan', v_desc || COALESCE(' - Sesi: ' || NEW.session, ''), v_points, NEW.date, NEW.id, 'pending');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_attendance_violation ON attendance;
CREATE TRIGGER trigger_attendance_violation AFTER INSERT OR UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION handle_attendance_violation();

-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 17: SAMPLE DATA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert Default Pesantren
INSERT INTO pesantren (id, name, address, phone) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Pondok Pesantren Modern Roudhotur Ridwan', 'Jl. Pesantren No. 1', '021-1234567')
ON CONFLICT DO NOTHING;

-- Insert Super Admin (PROTECTED - Cannot be deleted)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, role, aud, created_at, updated_at)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '00000000-0000-0000-0000-000000000000',
    'karandika6@gmail.com',
    extensions.crypt('admin123', extensions.gen_salt('bf')),
    now(),
    '{"name": "Super Admin", "role": "super_admin", "pesantren_id": "00000000-0000-0000-0000-000000000001"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    'authenticated', 'authenticated', now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Insert Super Admin Identity
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
    '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "email": "karandika6@gmail.com"}'::jsonb,
    'email', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now(), now(), now())
ON CONFLICT DO NOTHING;

-- Insert Super Admin Profile
INSERT INTO profiles (id, email, name, role, pesantren_id, is_active, status)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'karandika6@gmail.com', 'Super Admin', 'super_admin', '00000000-0000-0000-0000-000000000001', true, 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert Super Admin Role
INSERT INTO user_roles (user_id, role, is_primary)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'super_admin', true)
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert Default Invoice Types
INSERT INTO invoice_types (name, amount, is_recurring, recurrence_period, pesantren_id) VALUES
    ('SPP Bulanan', 500000, true, 'monthly', '00000000-0000-0000-0000-000000000001'),
    ('Uang Makan', 300000, true, 'monthly', '00000000-0000-0000-0000-000000000001'),
    ('Uang Gedung', 2000000, false, NULL, '00000000-0000-0000-0000-000000000001'),
    ('Uang Kitab', 250000, false, NULL, '00000000-0000-0000-0000-000000000001'),
    ('Seragam', 750000, false, NULL, '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

SELECT '══════════════════════════════════════════════════════════════' as line;
SELECT '✅ SMART PESANTREN - MASTER SETUP COMPLETE!' as status;
SELECT '══════════════════════════════════════════════════════════════' as line;
SELECT 'Super Admin: karandika6@gmail.com / admin123' as info1;
SELECT 'Pesantren: Pondok Pesantren Modern Roudhotur Ridwan' as info2;
SELECT '══════════════════════════════════════════════════════════════' as line;
