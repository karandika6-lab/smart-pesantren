-- SQL Migration to support Realtime Push Notifications & FCM

-- 1. Create user_fcm_tokens table
CREATE TABLE IF NOT EXISTS public.user_fcm_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL,
    device_info TEXT, -- Optional, e.g., 'Android', 'Chrome'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, fcm_token)
);

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT DEFAULT 'general', -- 'absensi', 'hafalan', 'rapor', dsb
    related_id TEXT, -- ID to lookup the related resource
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: In Supabase, if you want to use Realtime for a table, you must enable it
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 3. Row Level Security (RLS)
ALTER TABLE public.user_fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Policies for user_fcm_tokens
-- Users can see their own tokens
CREATE POLICY "Users can view own fcm tokens" ON public.user_fcm_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own fcm tokens" ON public.user_fcm_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tokens (e.g. on logout)
CREATE POLICY "Users can delete own fcm tokens" ON public.user_fcm_tokens
    FOR DELETE USING (auth.uid() = user_id);


-- 5. Policies for notifications
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admins/System can insert notifications (Assuming backend scripts use service_role which bypasses RLS)
-- We don't necessarily need an INSERT policy for users unless they send to others.

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Setup Triggers for updated_at
CREATE TRIGGER set_fcm_tokens_updated_at
BEFORE UPDATE ON public.user_fcm_tokens
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
