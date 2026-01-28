import { supabase } from '../../supabase';
import { PocketMoneyAccount, PocketMoneyTransaction } from '@/types/pocketMoney';
import { studentsService } from '../students';

export type CreateTransactionParams = {
    studentId: string; // We use studentId to find the account
    type: 'deposit' | 'withdrawal';
    amount: number;
    description: string;
};

export const pocketMoneyService = {
    /**
     * Get all accounts for all active students.
     * Merges students list with their pocket money account details.
     */
    async getAllAccounts() {
        // 1. Get all active students
        const students = await studentsService.getAll({ status: 'active' });

        // 2. Get all existing accounts
        const { data: accounts, error } = await supabase
            .from('pocket_money_accounts')
            .select('*');

        if (error) throw error;

        // 3. Merge data
        // Result should look like AccountWithStudent
        const mergedData = students.map(student => {
            const account = accounts?.find(acc => acc.student_id === student.id);
            return {
                id: account?.id || `temp_${student.id}`, // specific ID or temp if not exists
                student: {
                    id: student.id,
                    name: student.name,
                    nis: student.nis,
                    class: student.class || null
                },
                balance: account ? Number(account.balance) : 0,
                status: account?.status || 'active',
                updated_at: account?.updated_at || new Date().toISOString()
            };
        });

        return mergedData;
    },

    /**
     * Get account by Student ID, create if not exists
     */
    async getAccountByStudentId(studentId: string): Promise<PocketMoneyAccount> {
        // Try to find existing
        const { data, error } = await supabase
            .from('pocket_money_accounts')
            .select('*')
            .eq('student_id', studentId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'Row not found'

        if (data) return data;

        // Create new if not found
        const { data: newData, error: createError } = await supabase
            .from('pocket_money_accounts')
            .insert({
                student_id: studentId,
                balance: 0,
                status: 'active'
            })
            .select()
            .single();

        if (createError) throw createError;
        return newData;
    },

    /**
     * Create a new transaction (Deposit or Withdrawal)
     */
    async createTransaction({ studentId, type, amount, description }: CreateTransactionParams) {
        // 1. Get or create account
        const account = await this.getAccountByStudentId(studentId);

        // 2. Calculate new balance
        const newBalance = type === 'deposit'
            ? Number(account.balance) + amount
            : Number(account.balance) - amount;

        // 3. Update Account
        const { error: updateError } = await supabase
            .from('pocket_money_accounts')
            .update({
                balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('id', account.id);

        if (updateError) throw updateError;

        // 4. Insert Transaction Log
        const { data: txData, error: txError } = await supabase
            .from('pocket_money_transactions')
            .insert({
                account_id: account.id,
                type,
                amount,
                description,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (txError) {
            console.error('Transaction log failed', txError);
            throw txError;
        }

        return txData;
    },

    /**
     * Get transaction history for a specific student
     */
    async getTransactions(studentId: string) {
        const account = await this.getAccountByStudentId(studentId);

        const { data, error } = await supabase
            .from('pocket_money_transactions')
            .select('*')
            .eq('account_id', account.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get stats for Dashboard
     */
    async getStats() {
        const { data: accounts } = await supabase.from('pocket_money_accounts').select('balance');
        const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;

        // Get today's transactions
        const today = new Date().toISOString().split('T')[0];
        const { data: transactions } = await supabase
            .from('pocket_money_transactions')
            .select('amount, type')
            .gte('created_at', `${today}T00:00:00`);

        const depositToday = transactions
            ?.filter(t => t.type === 'deposit')
            .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        const withdrawalToday = transactions
            ?.filter(t => t.type === 'withdrawal')
            .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        return {
            totalBalance,
            depositToday,
            withdrawalToday
        };
    }
};
