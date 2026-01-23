-- ═══════════════════════════════════════════════════════════
-- EMERGENCY: Delete problematic user karandika1@gmail.com
-- ═══════════════════════════════════════════════════════════

-- 1. Hapus dari user_roles
DELETE FROM user_roles 
WHERE user_id IN (SELECT id FROM profiles WHERE email = 'karandika1@gmail.com');

-- 2. Hapus dari profiles
DELETE FROM profiles WHERE email = 'karandika1@gmail.com';

-- 3. Hapus dari auth.identities
DELETE FROM auth.identities 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'karandika1@gmail.com');

-- 4. Hapus dari auth.users
DELETE FROM auth.users WHERE email = 'karandika1@gmail.com';

-- Verify deletion
SELECT COUNT(*) as remaining_users FROM auth.users WHERE email = 'karandika1@gmail.com';

SELECT '✅ User karandika1@gmail.com deleted!' as status;
SELECT 'Now create user via Supabase Dashboard instead.' as instruction;
