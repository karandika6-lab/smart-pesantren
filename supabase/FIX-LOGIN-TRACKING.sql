-- ═══════════════════════════════════════════════════════════
-- FIX: Login Traffic Tracking System (Drop View First)
-- ═══════════════════════════════════════════════════════════

-- 1. Drop existing view if exists
DROP VIEW IF EXISTS login_logs CASCADE;

-- 2. Drop all versions of handle_user_login function
DROP FUNCTION IF EXISTS handle_user_login() CASCADE;
DROP FUNCTION IF EXISTS handle_user_login(TEXT) CASCADE;
DROP FUNCTION IF EXISTS handle_user_login(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS handle_user_login(TEXT, TEXT, TEXT) CASCADE;

-- 2. Create login_logs TABLE
CREATE TABLE IF NOT EXISTS login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT,
    login_time TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    pesantren_id UUID REFERENCES pesantren(id) ON DELETE SET NULL
);

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_login_logs_login_time ON login_logs(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);

-- 4. Enable RLS
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "login_logs_select" ON login_logs;
CREATE POLICY "login_logs_select" 
ON login_logs FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "login_logs_insert" ON login_logs;
CREATE POLICY "login_logs_insert" 
ON login_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 6. Create or replace handle_user_login function
CREATE OR REPLACE FUNCTION handle_user_login(
    p_role TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
    v_pesantren_id UUID;
BEGIN
    -- Get current user info
    v_user_id := auth.uid();
    
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = v_user_id;
    
    SELECT pesantren_id INTO v_pesantren_id
    FROM profiles
    WHERE id = v_user_id;
    
    -- Insert login log
    INSERT INTO login_logs (user_id, email, role, ip_address, user_agent, pesantren_id)
    VALUES (v_user_id, v_email, p_role, p_ip_address, p_user_agent, v_pesantren_id);
    
    RETURN json_build_object(
        'success', true,
        'user_id', v_user_id,
        'timestamp', NOW()
    );
EXCEPTION WHEN OTHERS THEN
    -- Don't fail login if logging fails
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant permissions
GRANT SELECT, INSERT ON login_logs TO authenticated;
GRANT EXECUTE ON FUNCTION handle_user_login TO authenticated;

-- 8. Seed some dummy login data for testing (last 7 days)
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
    v_pesantren_id UUID;
    i INT;
    random_count INT;
BEGIN
    -- Get a sample user
    SELECT id, email INTO v_user_id, v_email
    FROM auth.users
    LIMIT 1;
    
    SELECT pesantren_id INTO v_pesantren_id
    FROM profiles
    WHERE id = v_user_id;
    
    IF v_user_id IS NOT NULL THEN
        -- Insert login logs for last 7 days
        FOR i IN 0..6 LOOP
            random_count := floor(random() * 10 + 1)::INT; -- 1-10 logins per day
            FOR j IN 1..random_count LOOP
                INSERT INTO login_logs (user_id, email, role, login_time, pesantren_id)
                VALUES (
                    v_user_id,
                    v_email,
                    'super_admin',
                    NOW() - (i || ' days')::INTERVAL + (random() * 24 || ' hours')::INTERVAL,
                    v_pesantren_id
                );
            END LOOP;
        END LOOP;
    END IF;
END $$;

-- 9. Verify data
SELECT 
    DATE(login_time) as login_date,
    COUNT(*) as login_count
FROM login_logs
WHERE login_time >= NOW() - INTERVAL '7 days'
GROUP BY DATE(login_time)
ORDER BY login_date DESC;

SELECT '✅ Login tracking system fixed!' as status;
SELECT 'Refresh dashboard to see login traffic chart' as note;
