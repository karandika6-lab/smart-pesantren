-- ═══════════════════════════════════════════════════════════
-- FIX: Revert profile role & keep multi-role system
-- ═══════════════════════════════════════════════════════════

-- 1. Revert all wali_kelas back to ustadz in profiles (primary role)
UPDATE profiles 
SET role = 'ustadz'
WHERE role = 'wali_kelas';

-- 2. Ensure all ustadz have ustadz role in user_roles
INSERT INTO user_roles (user_id, role, is_primary)
SELECT id, 'ustadz', true
FROM profiles
WHERE role = 'ustadz'
ON CONFLICT (user_id, role) DO UPDATE SET is_primary = true;

-- 3. Add wali_kelas as SECONDARY role for homeroom teachers
INSERT INTO user_roles (user_id, role, is_primary)
SELECT DISTINCT t.user_id, 'wali_kelas', false
FROM classes c
JOIN teachers t ON c.homeroom_teacher_id = t.id
WHERE c.homeroom_teacher_id IS NOT NULL
ON CONFLICT (user_id, role) DO UPDATE SET is_primary = false;

-- 4. Update trigger to NOT change profile role
CREATE OR REPLACE FUNCTION auto_assign_wali_kelas_role()
RETURNS TRIGGER AS $$
DECLARE
    v_teacher_user_id UUID;
BEGIN
    IF NEW.homeroom_teacher_id IS NOT NULL THEN
        SELECT user_id INTO v_teacher_user_id 
        FROM teachers 
        WHERE id = NEW.homeroom_teacher_id;
        
        IF v_teacher_user_id IS NOT NULL THEN
            -- Only add wali_kelas to user_roles (don't change profile role)
            INSERT INTO user_roles (user_id, role, is_primary)
            VALUES (v_teacher_user_id, 'wali_kelas', false)
            ON CONFLICT (user_id, role) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify multi-role setup
SELECT 
    p.name,
    p.email,
    p.role as primary_role,
    array_agg(DISTINCT ur.role ORDER BY ur.role) as all_roles,
    CASE WHEN c.id IS NOT NULL THEN 'Wali Kelas: ' || cl.name ELSE '-' END as homeroom_class
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN teachers t ON p.id = t.user_id
LEFT JOIN classes cl ON t.id = cl.homeroom_teacher_id
LEFT JOIN classes c ON t.id = c.homeroom_teacher_id
WHERE p.role IN ('ustadz', 'wali_kelas')
GROUP BY p.id, p.name, p.email, p.role, c.id, cl.name
ORDER BY p.name;

SELECT '✅ Multi-role system fixed!' as status;
SELECT 'Primary role: ustadz, Secondary role: wali_kelas (if assigned)' as note;
