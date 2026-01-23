-- ===================================================
-- DIAGNOSTIC-USER.sql
-- Ganti email di bawah ini dengan email guru yang bermasalah
-- ===================================================

WITH target_email AS (
    SELECT '140894@ustadz.pesantren.id' AS email 
)
SELECT 
    'PROFILES' as table_source,
    id, 
    email, 
    role, 
    name 
FROM profiles 
WHERE email = (SELECT email FROM target_email)

UNION ALL

SELECT 
    'TEACHERS' as table_source,
    user_id as id, 
    email, 
    'ustadz'::text as role, 
    name 
FROM teachers 
WHERE email = (SELECT email FROM target_email)

UNION ALL

SELECT 
    'AUTH.USERS' as table_source,
    id, 
    email, 
    role, 
    raw_user_meta_data->>'name' as name 
FROM auth.users 
WHERE email = (SELECT email FROM target_email);
