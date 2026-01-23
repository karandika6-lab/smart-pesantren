-- ═══════════════════════════════════════════════════════════
-- AUTO-ASSIGN: Wali Kelas Role when assigned to class
-- ═══════════════════════════════════════════════════════════

-- Function to auto-assign wali_kelas role when teacher becomes homeroom teacher
CREATE OR REPLACE FUNCTION auto_assign_wali_kelas_role()
RETURNS TRIGGER AS $$
DECLARE
    v_teacher_user_id UUID;
BEGIN
    -- If homeroom_teacher_id is set (not null)
    IF NEW.homeroom_teacher_id IS NOT NULL THEN
        -- Get user_id from teachers table
        SELECT user_id INTO v_teacher_user_id 
        FROM teachers 
        WHERE id = NEW.homeroom_teacher_id;
        
        IF v_teacher_user_id IS NOT NULL THEN
            -- Add wali_kelas role if not exists
            INSERT INTO user_roles (user_id, role, is_primary)
            VALUES (v_teacher_user_id, 'wali_kelas', false)
            ON CONFLICT (user_id, role) DO NOTHING;
            
            -- Update profile role to wali_kelas if still ustadz
            UPDATE profiles 
            SET role = 'wali_kelas'
            WHERE id = v_teacher_user_id 
              AND role = 'ustadz';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on classes table
DROP TRIGGER IF EXISTS trigger_auto_assign_wali_kelas ON classes;
CREATE TRIGGER trigger_auto_assign_wali_kelas
    AFTER INSERT OR UPDATE OF homeroom_teacher_id ON classes
    FOR EACH ROW
    WHEN (NEW.homeroom_teacher_id IS NOT NULL)
    EXECUTE FUNCTION auto_assign_wali_kelas_role();

-- Fix existing wali kelas (retroactive)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT DISTINCT c.homeroom_teacher_id, t.user_id
        FROM classes c
        JOIN teachers t ON c.homeroom_teacher_id = t.id
        WHERE c.homeroom_teacher_id IS NOT NULL
    LOOP
        -- Add wali_kelas role
        INSERT INTO user_roles (user_id, role, is_primary)
        VALUES (r.user_id, 'wali_kelas', false)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Update profile role
        UPDATE profiles 
        SET role = 'wali_kelas'
        WHERE id = r.user_id 
          AND role = 'ustadz';
    END LOOP;
END $$;

-- Verify
SELECT 
    p.name,
    p.email,
    p.role as profile_role,
    array_agg(DISTINCT ur.role) as all_roles,
    CASE WHEN c.id IS NOT NULL THEN 'Wali Kelas: ' || cl.name ELSE 'Bukan Wali Kelas' END as status
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN teachers t ON p.id = t.user_id
LEFT JOIN classes cl ON t.id = cl.homeroom_teacher_id
LEFT JOIN classes c ON t.id = c.homeroom_teacher_id
WHERE p.role IN ('ustadz', 'wali_kelas')
GROUP BY p.id, p.name, p.email, p.role, c.id, cl.name
ORDER BY p.name;

SELECT '✅ Auto-assign wali_kelas role enabled!' as status;
SELECT 'Teachers assigned as homeroom will automatically get wali_kelas role' as note;
