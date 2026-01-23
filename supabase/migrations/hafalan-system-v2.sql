-- ============================================
-- FLEXIBLE HAFALAN SYSTEM - DATABASE MIGRATION
-- ============================================
-- Description: Create new tables for flexible hafalan system
-- Author: Smart Pesantren Development Team
-- Date: 2026-01-21
-- Version: 1.0
-- ============================================

-- SAFETY: This migration is designed to be NON-DESTRUCTIVE
-- It creates new tables without dropping existing ones
-- Existing hafalan_progress table will be migrated later

BEGIN;

-- ============================================
-- 1. CREATE hafalan_types TABLE
-- ============================================
-- Master table for all types of memorization programs

CREATE TABLE IF NOT EXISTS hafalan_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    total_units INTEGER NOT NULL CHECK (total_units > 0),
    unit_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_category CHECK (category IN ('quran', 'doa', 'mufrodat', 'hadits', 'nadhom', 'other'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hafalan_types_category ON hafalan_types(category);
CREATE INDEX IF NOT EXISTS idx_hafalan_types_active ON hafalan_types(is_active);

-- Add comment
COMMENT ON TABLE hafalan_types IS 'Master table for different types of memorization programs (Al-Quran, Tahlil, Yasin, Mufrodat, etc.)';

-- ============================================
-- 2. CREATE hafalan_programs TABLE
-- ============================================
-- Programs assigned to individual students

CREATE TABLE IF NOT EXISTS hafalan_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    hafalan_type_id UUID NOT NULL REFERENCES hafalan_types(id) ON DELETE RESTRICT,
    assigned_by UUID,  -- User ID who assigned (no FK constraint)
    assigned_date DATE DEFAULT CURRENT_DATE,
    target_completion_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: One student cannot have duplicate programs
    CONSTRAINT unique_student_hafalan UNIQUE(student_id, hafalan_type_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hafalan_programs_student ON hafalan_programs(student_id);
CREATE INDEX IF NOT EXISTS idx_hafalan_programs_type ON hafalan_programs(hafalan_type_id);
CREATE INDEX IF NOT EXISTS idx_hafalan_programs_status ON hafalan_programs(status);
CREATE INDEX IF NOT EXISTS idx_hafalan_programs_assigned_by ON hafalan_programs(assigned_by);

-- Add comment
COMMENT ON TABLE hafalan_programs IS 'Memorization programs assigned to individual students';

-- ============================================
-- 3. CREATE NEW hafalan_progress TABLE
-- ============================================
-- Rename existing table first (backup)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hafalan_progress') THEN
        ALTER TABLE hafalan_progress RENAME TO hafalan_progress_old;
    END IF;
END $$;

-- Create new hafalan_progress table
CREATE TABLE hafalan_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES hafalan_programs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    unit_number INTEGER NOT NULL CHECK (unit_number > 0),
    unit_name VARCHAR(100),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    grade VARCHAR(5) CHECK (grade IN ('A', 'B', 'C', 'D', 'E')),
    notes TEXT,
    evaluated_by UUID,  -- User ID who evaluated (no FK constraint)
    evaluated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: One progress record per program per unit
    CONSTRAINT unique_program_unit UNIQUE(program_id, unit_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hafalan_progress_program ON hafalan_progress(program_id);
CREATE INDEX IF NOT EXISTS idx_hafalan_progress_student ON hafalan_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_hafalan_progress_evaluated_by ON hafalan_progress(evaluated_by);

-- Add comment
COMMENT ON TABLE hafalan_progress IS 'Progress tracking for each unit of memorization programs';

-- ============================================
-- 4. SEED INITIAL HAFALAN TYPES
-- ============================================
-- Insert common hafalan types used in pesantren

INSERT INTO hafalan_types (name, description, category, total_units, unit_name) VALUES
('Al-Qur''an 30 Juz', 'Hafalan Al-Qur''an lengkap 30 Juz dari Juz 1 sampai Juz 30', 'quran', 30, 'Juz'),
('Juz Amma', 'Hafalan Juz 30 (Juz Amma) - Surah pendek dari An-Naba'' sampai An-Nas', 'quran', 1, 'Juz'),
('Tahlil', 'Hafalan bacaan Tahlil lengkap untuk acara kematian', 'doa', 1, 'Paket'),
('Yasin', 'Hafalan Surat Yasin lengkap 83 ayat', 'quran', 1, 'Surah'),
('Mufrodat Dasar', 'Hafalan 500 kosakata bahasa Arab dasar untuk pemula', 'mufrodat', 10, 'Bab'),
('Mufrodat Menengah', 'Hafalan 1000 kosakata bahasa Arab tingkat menengah', 'mufrodat', 20, 'Bab'),
('Doa Harian', 'Hafalan doa-doa harian (bangun tidur, makan, belajar, dll)', 'doa', 20, 'Doa'),
('Hadits Arbain Nawawi', 'Hafalan 40 Hadits Imam Nawawi', 'hadits', 40, 'Hadits'),
('Nadhom Imriti', 'Hafalan Nadhom Imriti (Ilmu Nahwu)', 'nadhom', 12, 'Bab'),
('Nadhom Alfiyah', 'Hafalan Alfiyah Ibnu Malik (Ilmu Nahwu)', 'nadhom', 20, 'Bab'),
('Asmaul Husna', 'Hafalan 99 Nama Allah (Asmaul Husna)', 'doa', 1, 'Paket'),
('Surat Pilihan', 'Hafalan surat-surat pilihan (Al-Mulk, Ar-Rahman, Al-Waqi''ah, dll)', 'quran', 10, 'Surah')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 5. CREATE UPDATED_AT TRIGGER
-- ============================================
-- Auto-update updated_at timestamp

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
DROP TRIGGER IF EXISTS update_hafalan_types_updated_at ON hafalan_types;
CREATE TRIGGER update_hafalan_types_updated_at
    BEFORE UPDATE ON hafalan_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hafalan_programs_updated_at ON hafalan_programs;
CREATE TRIGGER update_hafalan_programs_updated_at
    BEFORE UPDATE ON hafalan_programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hafalan_progress_updated_at ON hafalan_progress;
CREATE TRIGGER update_hafalan_progress_updated_at
    BEFORE UPDATE ON hafalan_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE hafalan_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE hafalan_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hafalan_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hafalan_types
-- Everyone can view active hafalan types
CREATE POLICY "Everyone can view active hafalan types"
    ON hafalan_types
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Admin akademik can manage all hafalan types (INSERT, UPDATE, DELETE)
-- Note: Role check will be done at application level
CREATE POLICY "Authenticated users can manage hafalan types"
    ON hafalan_types
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- RLS Policies for hafalan_programs
-- All authenticated users can view and manage programs
-- Role-based access control will be enforced at application level
CREATE POLICY "Authenticated users can manage programs"
    ON hafalan_programs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- RLS Policies for hafalan_progress
-- All authenticated users can manage progress
-- Role-based access control will be enforced at application level
CREATE POLICY "Authenticated users can manage progress"
    ON hafalan_progress
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

COMMIT;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify tables are created successfully
-- 3. Test RLS policies
-- 4. Implement backend services
-- 5. Build frontend pages
