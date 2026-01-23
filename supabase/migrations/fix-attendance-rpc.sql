-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: Attendance RPC Functions
-- ═══════════════════════════════════════════════════════════════════════════════
-- Jalankan SQL ini jika ada error "Error fetching class attendance: {}"
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. RPC untuk Get Class Attendance Status
CREATE OR REPLACE FUNCTION get_class_attendance_status(
    p_class_id UUID, 
    p_date DATE, 
    p_session TEXT DEFAULT NULL, 
    p_type TEXT DEFAULT 'class'
)
RETURNS TABLE (
    student_id UUID, 
    student_name TEXT, 
    class_name TEXT, 
    nis TEXT, 
    status TEXT, 
    notes TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id, 
        s.name::TEXT, 
        c.name::TEXT, 
        s.nis::TEXT, 
        a.status::TEXT, 
        a.notes::TEXT
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN attendance a ON s.id = a.student_id 
        AND a.date = p_date 
        AND (
            (p_session IS NOT NULL AND a.session = p_session) 
            OR (p_session IS NULL AND a.type = p_type)
        )
    WHERE (p_class_id IS NULL OR s.class_id = p_class_id) 
    AND s.status = 'active'
    ORDER BY c.name, s.name;
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION get_class_attendance_status(UUID, DATE, TEXT, TEXT) TO authenticated;

-- 2. RPC untuk Submit Attendance
CREATE OR REPLACE FUNCTION submit_class_attendance(
    p_date DATE, 
    p_attendance_list JSONB, 
    p_recorded_by UUID, 
    p_pesantren_id UUID DEFAULT NULL, 
    p_session TEXT DEFAULT NULL, 
    p_type TEXT DEFAULT 'class'
)
RETURNS JSONB 
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
    item jsonb; 
    rec_count INT := 0; 
    v_pesantren_id UUID;
BEGIN
    v_pesantren_id := COALESCE(p_pesantren_id, (SELECT pesantren_id FROM profiles WHERE id = p_recorded_by));
    
    FOR item IN SELECT * FROM jsonb_array_elements(p_attendance_list) LOOP
        INSERT INTO attendance (student_id, date, type, session, status, notes, recorded_by, pesantren_id, updated_at)
        VALUES (
            (item->>'student_id')::UUID, 
            p_date, 
            p_type, 
            p_session, 
            item->>'status', 
            item->>'notes', 
            p_recorded_by, 
            v_pesantren_id, 
            NOW()
        )
        ON CONFLICT (student_id, date, type) DO UPDATE SET 
            status = EXCLUDED.status, 
            notes = EXCLUDED.notes, 
            session = EXCLUDED.session, 
            updated_at = NOW();
        rec_count := rec_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true, 
        'message', format('Berhasil memproses absensi %s siswa', rec_count), 
        'count', rec_count
    );
EXCEPTION WHEN OTHERS THEN 
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION submit_class_attendance(DATE, JSONB, UUID, UUID, TEXT, TEXT) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFIKASI: Cek apakah function sudah ada
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_class_attendance_status', 'submit_class_attendance');
