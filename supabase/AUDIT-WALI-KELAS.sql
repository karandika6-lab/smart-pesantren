-- ═══════════════════════════════════════════════════════════
-- AUDIT: Wali Kelas Assignment Issue
-- ═══════════════════════════════════════════════════════════

-- 1. Cek user Ustadz Ridwan Sururi di semua tabel
SELECT '=== AUTH.USERS ===' as section;
SELECT id, email, raw_user_meta_data->>'role' as metadata_role
FROM auth.users 
WHERE email LIKE '%ridwan%';

SELECT '=== PROFILES ===' as section;
SELECT id, email, name, role, is_active
FROM profiles 
WHERE email LIKE '%ridwan%';

SELECT '=== USER_ROLES ===' as section;
SELECT ur.user_id, p.email, ur.role, ur.is_primary
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
WHERE p.email LIKE '%ridwan%'
ORDER BY ur.is_primary DESC, ur.role;

SELECT '=== TEACHERS ===' as section;
SELECT t.id as teacher_id, t.user_id, t.name, t.email, t.is_active
FROM teachers t
WHERE t.email LIKE '%ridwan%';

SELECT '=== CLASSES (Homeroom Assignment) ===' as section;
SELECT 
    c.id as class_id,
    c.name as class_name,
    c.homeroom_teacher_id,
    t.name as teacher_name,
    t.user_id as teacher_user_id,
    p.role as profile_role,
    array_agg(DISTINCT ur.role) as user_roles
FROM classes c
LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
LEFT JOIN profiles p ON t.user_id = p.id
LEFT JOIN user_roles ur ON t.user_id = ur.user_id
WHERE t.email LIKE '%ridwan%'
GROUP BY c.id, c.name, c.homeroom_teacher_id, t.name, t.user_id, p.role;

-- 2. Cek apakah trigger berjalan
SELECT '=== TRIGGER STATUS ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_assign_wali_kelas';

-- 3. Test manual assignment
SELECT '=== MANUAL TEST: Assign wali_kelas role ===' as section;
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get user_id for Ridwan
    SELECT t.user_id INTO v_user_id
    FROM teachers t
    WHERE t.email LIKE '%ridwan%'
    LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- Add wali_kelas role
        INSERT INTO user_roles (user_id, role, is_primary)
        VALUES (v_user_id, 'wali_kelas', false)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Added wali_kelas role to user_id: %', v_user_id;
    ELSE
        RAISE NOTICE 'User not found in teachers table';
    END IF;
END $$;

-- 4. Verify final state
SELECT '=== FINAL VERIFICATION ===' as section;
SELECT 
    p.email,
    p.role as primary_role,
    array_agg(DISTINCT ur.role ORDER BY ur.role) as all_roles,
    CASE 
        WHEN 'wali_kelas' = ANY(array_agg(ur.role)) THEN 'CAN LOGIN AS WALI KELAS ✅'
        ELSE 'CANNOT LOGIN AS WALI KELAS ❌'
    END as wali_kelas_access
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE p.email LIKE '%ridwan%'
GROUP BY p.id, p.email, p.role;

SELECT '✅ Audit complete!' as status;
