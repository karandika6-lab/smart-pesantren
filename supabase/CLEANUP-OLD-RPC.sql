-- ═══════════════════════════════════════════════════════════
-- CLEANUP: Remove old unsafe RPC functions
-- ═══════════════════════════════════════════════════════════
-- Run this after implementing Auth Admin API solution

-- 1. Drop old user creation functions (UNSAFE)
DROP FUNCTION IF EXISTS public.create_user_by_admin(TEXT, TEXT, TEXT, TEXT, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.admin_create_user(TEXT, TEXT, TEXT, TEXT, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.automated_registration(TEXT, JSONB) CASCADE;

-- 2. Keep these functions (they are safe and useful):
-- - delete_user_complete (has Super Admin protection)
-- - admin_reset_password (safe operation)
-- - get_user_roles (read-only)
-- - log_activity (logging only)

-- 3. Verify cleanup
SELECT 
    routine_name, 
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- Reload schema
NOTIFY pgrst, 'reload schema';

SELECT '✅ Old RPC functions removed!' as status;
SELECT 'User creation now uses Supabase Auth Admin API (production-ready)' as note;
