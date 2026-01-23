-- RPC for Parent Portal Dashboard Summary
-- This function retrieves a summary for all children linked to the current logged-in parent.
-- It works by checking both the 'parent_user_id' in students table and the 'student_guardians' table.

CREATE OR REPLACE FUNCTION get_parent_dashboard_summary()
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    class_name TEXT,
    nis TEXT,
    total_bill_unpaid NUMERIC,
    violation_points INT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH linked_students AS (
        -- Get students from direct parent_user_id link
        SELECT s.id, s.name, s.nis, s.class_id
        FROM public.students s
        WHERE s.parent_user_id = auth.uid()
        
        UNION
        
        -- Get students from student_guardians table link
        SELECT s.id, s.name, s.nis, s.class_id
        FROM public.students s
        JOIN public.student_guardians sg ON s.id = sg.student_id
        WHERE sg.guardian_id = auth.uid()
    )
    SELECT 
        ls.id as student_id,
        ls.name::TEXT as student_name,
        COALESCE(c.name, 'Reguler')::TEXT as class_name,
        COALESCE(ls.nis, '-')::TEXT as nis,
        COALESCE((
            SELECT SUM(i.amount) 
            FROM public.invoices i 
            WHERE i.student_id = ls.id AND i.status != 'paid'
        ), 0)::NUMERIC as total_bill_unpaid,
        COALESCE((
            SELECT SUM(v.points) 
            FROM public.violations v 
            WHERE v.student_id = ls.id
        ), 0)::INT as violation_points
    FROM 
        linked_students ls
    LEFT JOIN 
        public.classes c ON ls.class_id = c.id;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_parent_dashboard_summary() TO authenticated;
