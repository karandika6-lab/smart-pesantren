-- Create Tahfidz Records Table
CREATE TABLE IF NOT EXISTS public.tahfidz_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pesantren_id UUID REFERENCES public.pesantren(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    juz_number INT NOT NULL CHECK (juz_number >= 1 AND juz_number <= 30),
    surah_name TEXT NOT NULL,
    ayah_start INT,
    ayah_end INT,
    grade VARCHAR(20),     -- e.g. Mumtaz, Jayyid Jiddan, Jayyid, Maqbul
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Index for frequent queries
CREATE INDEX IF NOT EXISTS idx_tahfidz_pesantren ON public.tahfidz_records(pesantren_id);
CREATE INDEX IF NOT EXISTS idx_tahfidz_student ON public.tahfidz_records(student_id);
CREATE INDEX IF NOT EXISTS idx_tahfidz_recorded_at ON public.tahfidz_records(recorded_at DESC);

-- Enable RLS
ALTER TABLE public.tahfidz_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy 1: Super Admins can see all records
CREATE POLICY "Super Admins can view all tahfidz records" 
ON public.tahfidz_records FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- Policy 2: Branch Admins and Ustadz can see records in their Pesantren
CREATE POLICY "Staff can view their pesantren's tahfidz records" 
ON public.tahfidz_records FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND pesantren_id = tahfidz_records.pesantren_id
        AND role IN ('admin', 'ustadz')
    )
);

-- Policy 3: Allow insertion/updates by Ustadz & Admin in same pesantren
CREATE POLICY "Staff can insert tahfidz records"
ON public.tahfidz_records FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND pesantren_id = tahfidz_records.pesantren_id
        AND role IN ('admin', 'ustadz', 'super_admin')
    )
);

CREATE POLICY "Staff can update tahfidz records"
ON public.tahfidz_records FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND pesantren_id = tahfidz_records.pesantren_id
        AND role IN ('admin', 'ustadz', 'super_admin')
    )
);

-- Enable realtime
alter publication supabase_realtime add table public.tahfidz_records;
