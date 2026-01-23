-- ═══════════════════════════════════════════════════════════
-- DIAGNOSTIC & FIX: User karandika1@gmail.com
-- ═══════════════════════════════════════════════════════════

-- 1. Cek user di auth.users
SELECT id, email, email_confirmed_at, created_at, raw_user_meta_data
FROM auth.users 
WHERE email = 'karandika1@gmail.com';

-- 2. Cek user di profiles
SELECT id, email, name, role, pesantren_id, is_active, status
FROM profiles 
WHERE email = 'karandika1@gmail.com';

-- 3. Cek user di user_roles
SELECT ur.role, ur.is_primary
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
WHERE p.email = 'karandika1@gmail.com';

-- 4. FIX: Pastikan profile dan role ada
DO $$
DECLARE
    v_user_id UUID;
    v_pesantren_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'karandika1@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User tidak ditemukan di auth.users!';
        RETURN;
    END IF;
    
    -- Ensure profile exists
    INSERT INTO profiles (id, email, name, role, pesantren_id, is_active, status)
    VALUES (v_user_id, 'karandika1@gmail.com', 'Admin Akademik', 'admin_akademik', v_pesantren_id, true, 'active')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'admin_akademik', 
        pesantren_id = v_pesantren_id,
        is_active = true,
        status = 'active';
    
    -- Ensure user_roles exists
    INSERT INTO user_roles (user_id, role, is_primary)
    VALUES (v_user_id, 'admin_akademik', true)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Confirm email if not confirmed
    UPDATE auth.users 
    SET email_confirmed_at = NOW()
    WHERE id = v_user_id AND email_confirmed_at IS NULL;
    
    RAISE NOTICE 'User karandika1@gmail.com fixed!';
END $$;

-- 5. Verify fix
SELECT 
    u.email,
    u.email_confirmed_at,
    p.role,
    p.is_active,
    ur.role as user_role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'karandika1@gmail.com';

SELECT '✅ User diagnostic and fix complete!' as status;
