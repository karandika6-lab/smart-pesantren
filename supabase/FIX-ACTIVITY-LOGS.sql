-- ═══════════════════════════════════════════════════════════
-- FIX: Add missing ip_address column to activity_logs
-- ═══════════════════════════════════════════════════════════

-- 1. Add ip_address column if not exists
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- 2. Verify table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activity_logs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Reload
NOTIFY pgrst, 'reload schema';

SELECT '✅ activity_logs table updated with ip_address column!' as status;
