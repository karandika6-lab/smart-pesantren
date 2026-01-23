-- ═══════════════════════════════════════════════════════════
-- PERMANENT FIX: Disable problematic trigger & manual sync
-- ═══════════════════════════════════════════════════════════

-- 1. MATIKAN TRIGGER yang bermasalah
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- 2. Hapus fungsi trigger lama
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 3. Buat fungsi trigger yang BENAR-BENAR AMAN (tidak akan error)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Jangan lakukan apapun yang bisa error
  -- Profile akan dibuat manual oleh RPC function
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. JANGAN pasang trigger lagi (biarkan kosong)
-- Kita akan handle profile creation di RPC function saja

-- 5. Fix semua user yang sudah ada
DO $$
DECLARE
    r RECORD;
    v_pesantren_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    FOR r IN SELECT id, email, raw_user_meta_data FROM auth.users
    LOOP
        -- Ensure profile exists
        INSERT INTO profiles (id, email, name, role, pesantren_id, is_active, status)
        VALUES (
            r.id,
            r.email,
            COALESCE(r.raw_user_meta_data->>'name', split_part(r.email, '@', 1)),
            COALESCE(r.raw_user_meta_data->>'role', 'santri'),
            COALESCE((r.raw_user_meta_data->>'pesantren_id')::UUID, v_pesantren_id),
            true,
            'active'
        )
        ON CONFLICT (id) DO UPDATE 
        SET is_active = true, status = 'active';
        
        -- Ensure user_roles exists
        INSERT INTO user_roles (user_id, role, is_primary)
        VALUES (r.id, COALESCE(r.raw_user_meta_data->>'role', 'santri'), true)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Confirm email
        UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = r.id AND email_confirmed_at IS NULL;
    END LOOP;
    
    RAISE NOTICE 'All users synced!';
END $$;

-- 6. Reload
NOTIFY pgrst, 'reload schema';

SELECT '✅ Trigger disabled, all users fixed!' as status;
SELECT 'Try login again now.' as instruction;
