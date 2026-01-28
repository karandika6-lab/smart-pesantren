export type PocketMoneyAccount = {
    id: string;
    student_id: string;
    balance: number;
    status: 'active' | 'frozen';
    last_transaction_at: string | null;
    created_at: string;
    updated_at: string;
};

export type PocketMoneyTransaction = {
    id: string;
    account_id: string;
    amount: number;
    transaction_type: 'deposit' | 'withdrawal' | 'correction';
    description: string;
    performed_by: string;
    reference_id: string | null;
    created_at: string;
};
