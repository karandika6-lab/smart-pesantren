-- ═══════════════════════════════════════════════════════════
-- FASE 1 AUDIT: Super Admin Dashboard & Features
-- ═══════════════════════════════════════════════════════════

-- 1. CHECK: Pesantren Data (untuk chart)
SELECT '=== PESANTREN DATA ===' as section;
SELECT 
    id,
    name,
    address,
    phone,
    created_at
FROM pesantren
ORDER BY created_at DESC;

-- 2. CHECK: User Statistics (untuk dashboard metrics)
SELECT '=== USER STATISTICS ===' as section;
SELECT 
    role,
    COUNT(*) as total,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive
FROM profiles
GROUP BY role
ORDER BY total DESC;

-- 3. CHECK: Students Statistics (untuk chart)
SELECT '=== STUDENTS STATISTICS ===' as section;
SELECT 
    status,
    gender,
    COUNT(*) as total
FROM students
GROUP BY status, gender
ORDER BY status, gender;

-- 4. CHECK: Teachers Statistics (untuk chart)
SELECT '=== TEACHERS STATISTICS ===' as section;
SELECT 
    is_active,
    COUNT(*) as total
FROM teachers
GROUP BY is_active;

-- 5. CHECK: Classes Statistics (untuk chart)
SELECT '=== CLASSES STATISTICS ===' as section;
SELECT 
    c.grade_level,
    COUNT(DISTINCT c.id) as total_classes,
    COUNT(DISTINCT s.id) as total_students,
    AVG(CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END) * 100 as fill_rate
FROM classes c
LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
GROUP BY c.grade_level
ORDER BY c.grade_level;

-- 6. CHECK: Activity Logs (untuk recent activity)
SELECT '=== RECENT ACTIVITY LOGS ===' as section;
SELECT 
    al.action,
    al.entity_type,
    p.name as user_name,
    al.created_at
FROM activity_logs al
LEFT JOIN profiles p ON al.user_id = p.id
ORDER BY al.created_at DESC
LIMIT 10;

-- 7. CHECK: System Settings
SELECT '=== SYSTEM SETTINGS ===' as section;
SELECT * FROM system_settings WHERE id = 'global';

-- 8. CHECK: Academic Years
SELECT '=== ACADEMIC YEARS ===' as section;
SELECT 
    name,
    start_date,
    end_date,
    is_active
FROM academic_years
ORDER BY start_date DESC;

-- 9. CHECK: Missing Data (untuk seed)
SELECT '=== DATA COMPLETENESS CHECK ===' as section;
SELECT 
    'Pesantren' as table_name,
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 0 THEN '❌ EMPTY - NEED SEED' ELSE '✅ HAS DATA' END as status
FROM pesantren
UNION ALL
SELECT 
    'Students',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '❌ EMPTY - NEED SEED' ELSE '✅ HAS DATA' END
FROM students
UNION ALL
SELECT 
    'Teachers',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '❌ EMPTY - NEED SEED' ELSE '✅ HAS DATA' END
FROM teachers
UNION ALL
SELECT 
    'Classes',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '❌ EMPTY - NEED SEED' ELSE '✅ HAS DATA' END
FROM classes
UNION ALL
SELECT 
    'Academic Years',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '❌ EMPTY - NEED SEED' ELSE '✅ HAS DATA' END
FROM academic_years;

-- 10. CHECK: RLS Policies for Super Admin Access
SELECT '=== RLS POLICIES CHECK ===' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('pesantren', 'activity_logs', 'system_settings', 'profiles')
ORDER BY tablename, policyname;

SELECT '✅ FASE 1 AUDIT COMPLETE!' as status;
