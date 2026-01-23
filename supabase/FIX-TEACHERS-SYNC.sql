-- ═══════════════════════════════════════════════════════════
-- FIX: Sync users to teachers table & fix class constraint
-- ═══════════════════════════════════════════════════════════

-- 1. Make homeroom_teacher_id optional (nullable)
ALTER TABLE classes 
DROP CONSTRAINT IF EXISTS classes_homeroom_teacher_id_fkey;

ALTER TABLE classes 
ALTER COLUMN homeroom_teacher_id DROP NOT NULL;

ALTER TABLE classes 
ADD CONSTRAINT classes_homeroom_teacher_id_fkey 
FOREIGN KEY (homeroom_teacher_id) 
REFERENCES teachers(id) 
ON DELETE SET NULL;

-- 2. Add unique constraint on user_id if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'teachers_user_id_key'
    ) THEN
        ALTER TABLE teachers ADD CONSTRAINT teachers_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 3. Sync existing users with role 'ustadz' or 'wali_kelas' to teachers table
INSERT INTO teachers (user_id, name, email, is_active, pesantren_id, status)
SELECT 
    p.id,
    p.name,
    p.email,
    p.is_active,
    p.pesantren_id,
    p.status
FROM profiles p
WHERE p.role IN ('ustadz', 'wali_kelas')
  AND NOT EXISTS (SELECT 1 FROM teachers t WHERE t.user_id = p.id)
ON CONFLICT (user_id) DO NOTHING;

-- 4. Verify sync
SELECT 
    'Profiles with ustadz/wali_kelas role' as category,
    COUNT(*) as count
FROM profiles 
WHERE role IN ('ustadz', 'wali_kelas')
UNION ALL
SELECT 
    'Teachers in teachers table' as category,
    COUNT(*) as count
FROM teachers;

SELECT '✅ Teachers synced and constraint fixed!' as status;
SELECT 'You can now create classes with or without homeroom teacher' as note;
