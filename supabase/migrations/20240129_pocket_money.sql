-- Create pocket money accounts table
CREATE TABLE IF NOT EXISTS public.pocket_money_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id)
);

-- Create pocket money transactions table
CREATE TABLE IF NOT EXISTS public.pocket_money_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.pocket_money_accounts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_pocket_money_accounts_student_id ON public.pocket_money_accounts(student_id);
CREATE INDEX IF NOT EXISTS idx_pocket_money_transactions_account_id ON public.pocket_money_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_pocket_money_transactions_created_at ON public.pocket_money_transactions(created_at);

-- RLS Policies
ALTER TABLE public.pocket_money_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pocket_money_transactions ENABLE ROW LEVEL SECURITY;

-- Policies (Adjust based on your specific RLS needs)
CREATE POLICY "Enable read parent/admin" ON public.pocket_money_accounts FOR SELECT USING (true);
CREATE POLICY "Enable all for admin" ON public.pocket_money_accounts FOR ALL USING (true);

CREATE POLICY "Enable read parent/admin transactions" ON public.pocket_money_transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert admin transactions" ON public.pocket_money_transactions FOR INSERT WITH CHECK (true);
