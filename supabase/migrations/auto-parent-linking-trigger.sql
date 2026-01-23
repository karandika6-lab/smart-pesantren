-- ═══════════════════════════════════════════════════════════════════════════════
-- AUTO PARENT LINKING TRIGGER
-- ═══════════════════════════════════════════════════════════════════════════════
-- Trigger ini akan OTOMATIS mengatur parent_user_id setiap kali:
-- 1. Santri baru ditambahkan
-- 2. Santri diupdate dan user_id berubah
--
-- JALANKAN SQL INI SATU KALI DI SUPABASE SQL EDITOR
-- ═══════════════════════════════════════════════════════════════════════════════

-- STEP 1: Buat Function untuk Auto Link Parent
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auto_link_parent_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika santri punya user_id tapi belum ada parent_user_id
    -- Otomatis link parent_user_id = user_id (sehingga akun bisa switch role ke wali)
    IF NEW.user_id IS NOT NULL AND NEW.parent_user_id IS NULL THEN
        NEW.parent_user_id := NEW.user_id;
        
        -- Juga tambahkan role wali_santri ke user tersebut
        INSERT INTO user_roles (user_id, role, is_primary)
        VALUES (NEW.user_id, 'wali_santri', false)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 2: Buat Trigger di Tabel Students
-- ═══════════════════════════════════════════════════════════════════════════════

-- Hapus trigger lama jika ada (untuk menghindari duplikat)
DROP TRIGGER IF EXISTS trigger_auto_link_parent ON students;

-- Buat trigger baru (akan dijalankan SEBELUM INSERT atau UPDATE)
CREATE TRIGGER trigger_auto_link_parent
    BEFORE INSERT OR UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION auto_link_parent_user_id();

-- STEP 3: Fix Semua Data yang Sudah Ada
-- ═══════════════════════════════════════════════════════════════════════════════

-- Update semua santri yang belum punya parent_user_id
UPDATE students 
SET parent_user_id = user_id
WHERE user_id IS NOT NULL 
AND parent_user_id IS NULL;

-- Tambahkan role wali_santri untuk semua user yang terkait
INSERT INTO user_roles (user_id, role, is_primary)
SELECT DISTINCT user_id, 'wali_santri', false
FROM students 
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFIKASI
-- ═══════════════════════════════════════════════════════════════════════════════

-- Cek apakah trigger sudah terpasang
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'trigger_auto_link_parent';

-- Cek santri yang sudah ter-link
SELECT 
    s.name as santri,
    s.user_id IS NOT NULL as punya_akun,
    s.parent_user_id IS NOT NULL as parent_linked,
    CASE WHEN s.parent_user_id = s.user_id THEN 'Self-Link' ELSE 'External Wali' END as link_type
FROM students s
WHERE s.status = 'active'
ORDER BY s.name;

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE! Sekarang setiap santri baru otomatis akan ter-link
-- ═══════════════════════════════════════════════════════════════════════════════
