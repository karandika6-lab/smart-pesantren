
// Finance Service - COMPLETE RESTORED VERSION
import { supabase } from '../supabase';

export interface FinanceStats {
    incomeThisMonth: number;
    expenseThisMonth: number;
    balance: number;
    unpaidCount: number;
    paidCount: number;
    partialCount: number;
}

export interface CreateInvoiceParams {
    targetType: string;
    studentId?: string;
    classId?: string;
    invoiceType: string;
    amount: number | string;
    dueDate: string;
    notes?: string;
}

interface DBInvoice {
    id: string;
    student_id: string;
    invoice_type: string;
    amount: number;
    paid_amount: number;
    status: string;
    due_date: string;
    notes?: string;
    students?: {
        name: string;
        classes?: {
            name: string;
        };
        parent_phone?: string;
    };
}

export const financeService = {
    async getInvoiceTypes() {
        const { data } = await supabase.from('invoice_types').select('*').order('name');
        return data || [
            { id: '1', name: 'SPP Bulanan', amount: 250000 },
            { id: '2', name: 'Uang Makan', amount: 150000 },
            { id: '3', name: 'Iuran Lainnya', amount: 0 }
        ];
    },
    async getAllInvoices(filters?: { status?: string; type?: string }) {
        let query = supabase
            .from('invoices')
            .select('*, students(name, class_id, classes(name))')
            .order('created_at', { ascending: false });

        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }

        if (filters?.type && filters.type !== 'all') {
            query = query.eq('invoice_type', filters.type);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data as unknown as DBInvoice[] || []).map((i) => ({
            id: i.id,
            studentId: i.student_id,
            santriName: i.students?.name || 'Santri Terhapus',
            class: i.students?.classes?.name || 'Umum',
            type: i.invoice_type,
            amount: i.amount,
            paidAmount: i.paid_amount || 0,
            remainingAmount: Math.max(0, i.amount - (i.paid_amount || 0)),
            status: i.status === 'paid' ? 'lunas' : (i.status === 'partial' ? 'cicilan' : 'belum'),
            dueDate: i.due_date,
            notes: i.notes
        }));
    },

    async createInvoice(params: CreateInvoiceParams) {
        const { requirePesantrenId } = await import('./helpers');
        const pesantrenId = await requirePesantrenId();

        interface InvoicePayload {
            student_id: string;
            invoice_number: string;
            invoice_type: string;
            description: string;
            amount: number;
            due_date: string;
            status: string;
            pesantren_id: string;
        }

        let payload: InvoicePayload[] = [];

        if (params.targetType === 'individual') {
            if (!params.studentId || params.studentId === "") {
                throw new Error('Pilih santri terlebih dahulu!');
            }

            payload = [{
                student_id: params.studentId,
                invoice_number: `INV-${Date.now()}`,
                invoice_type: params.invoiceType,
                description: params.notes || params.invoiceType,
                amount: Number(params.amount),
                due_date: params.dueDate,
                status: 'pending',
                pesantren_id: pesantrenId
            }];
        } else if (params.targetType === 'class') {
            if (!params.classId || params.classId === "") {
                throw new Error('Pilih kelas terlebih dahulu!');
            }

            const { data: students, error: sError } = await supabase
                .from('students')
                .select('id')
                .eq('class_id', params.classId)
                .eq('status', 'active');

            if (sError) throw sError;
            if (!students || students.length === 0) throw new Error('Tidak ada santri aktif di kelas ini!');

            payload = students.map(s => ({
                student_id: s.id,
                invoice_number: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                invoice_type: params.invoiceType,
                description: params.notes || params.invoiceType,
                amount: Number(params.amount),
                due_date: params.dueDate,
                status: 'pending',
                pesantren_id: pesantrenId
            }));
        } else if (params.targetType === 'all') {
            // Buat tagihan untuk SEMUA santri aktif
            const { data: students, error: sError } = await supabase
                .from('students')
                .select('id')
                .eq('status', 'active')
                .eq('pesantren_id', pesantrenId);

            if (sError) throw sError;
            if (!students || students.length === 0) throw new Error('Tidak ada santri aktif!');

            payload = students.map(s => ({
                student_id: s.id,
                invoice_number: `INV-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                invoice_type: params.invoiceType,
                description: params.notes || params.invoiceType,
                amount: Number(params.amount),
                due_date: params.dueDate,
                status: 'pending',
                pesantren_id: pesantrenId
            }));
        }

        const { data, error } = await supabase
            .from('invoices')
            .insert(payload)
            .select();

        if (error) throw new Error(`GAGAL SIMPAN: ${error.message}`);
        return { count: payload.length, data };
    },

    async searchStudents(query: string) {
        const { data } = await supabase
            .from('students')
            .select('id, name, nis')
            .or(`name.ilike.%${query}%,nis.ilike.%${query}%`)
            .limit(10);
        return data || [];
    },

    async processPayment(payment: {
        invoice_id: string;
        amount: number;
        payment_method: string;
        notes?: string;
    }) {
        const { requirePesantrenId } = await import('./helpers');
        const pesantrenId = await requirePesantrenId();

        // 1. Get invoice details
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('student_id, amount, paid_amount')
            .eq('id', payment.invoice_id)
            .single();

        if (invoiceError || !invoice) {
            console.error('Invoice fetch error:', invoiceError);
            throw new Error('Invoice tidak ditemukan');
        }

        // 2. Calculate total paid (from paid_amount field + new payment)
        const currentPaidAmount = Number(invoice.paid_amount) || 0;
        const newTotalPaid = currentPaidAmount + Number(payment.amount);

        // 3. Insert new payment
        const { error: pError } = await supabase.from('payments').insert({
            invoice_id: payment.invoice_id,
            student_id: invoice.student_id,
            pesantren_id: pesantrenId,
            amount: payment.amount,
            payment_method: payment.payment_method,
            notes: payment.notes
        });

        if (pError) {
            console.error('Payment insert error:', pError);
            throw new Error(`Gagal menyimpan pembayaran: ${pError.message}`);
        }

        // 4. Determine new status based on payment
        const invoiceAmount = Number(invoice.amount);
        let newStatus = 'pending';
        if (newTotalPaid >= invoiceAmount) {
            newStatus = 'paid';
        } else if (newTotalPaid > 0) {
            newStatus = 'partial';
        }

        // 5. Update invoice status AND paid_amount
        const { error: updateError } = await supabase
            .from('invoices')
            .update({
                status: newStatus,
                paid_amount: newTotalPaid
            })
            .eq('id', payment.invoice_id);

        if (updateError) {
            console.error('Invoice update error:', updateError);
            // Don't throw - payment already recorded, but log the issue
        }

        // Trigger Notification (Fire and forget)
        try {
            const { sendNotification } = await import('./notificationUtils');
            const { data: student } = await supabase
                .from('students')
                .select('name')
                .eq('id', invoice.student_id)
                .single();
            
            const formatter = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            });

            sendNotification({
                studentId: invoice.student_id,
                title: 'Pembayaran Berhasil',
                message: `Terima kasih! Pembayaran untuk ${student?.name || 'Putra/Putri Anda'} sebesar ${formatter.format(payment.amount)} telah kami terima.`,
                type: 'keuangan'
            });
        } catch (notifErr) {
            console.error('Failed to trigger payment notification:', notifErr);
        }

        console.log(`Payment processed: Invoice ${payment.invoice_id} updated to ${newStatus}, paid: ${newTotalPaid}/${invoiceAmount}`);

        return { newStatus, totalPaid: newTotalPaid, remaining: invoiceAmount - newTotalPaid };
    },

    async getRecentPayments(limit: number = 5) {
        const { data } = await supabase
            .from('payments')
            .select('*')
            .order('payment_date', { ascending: false })
            .limit(limit);

        const { data: students } = await supabase.from('students').select('id, name');
        const studentMap = new Map(students?.map(s => [s.id, s.name]));

        return (data || []).map(p => ({
            id: p.id,
            santriName: studentMap.get(p.student_id) || 'Santri',
            amount: p.amount,
            method: p.payment_method,
            timestamp: new Date(p.payment_date).toLocaleString('id-ID'),
            status: 'success'
        }));
    },

    // Dashboard Methods
    async getStats(startDate?: string, endDate?: string) {
        if (!startDate || !endDate) {
            // Original Dashboard Logic (Unfiltered / Current Month Focus)
            const { data: payments } = await supabase.from('payments').select('amount, payment_date');
            const { data: expenses } = await supabase.from('expenses').select('amount, expense_date');
            const { data: invoices } = await supabase.from('invoices').select('status, amount, paid_amount');

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const totalIncome = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
            const totalExpense = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);

            const incomeThisMonth = (payments || [])
                .filter(p => {
                    const d = new Date(p.payment_date);
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                })
                .reduce((sum, p) => sum + Number(p.amount), 0);

            const expenseThisMonth = (expenses || [])
                .filter(e => {
                    const d = new Date(e.expense_date);
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                })
                .reduce((sum, e) => sum + Number(e.amount), 0);

            // Calculate total unpaid amount
            const totalUnpaidAmount = (invoices || [])
                .filter(i => i.status === 'pending' || i.status === 'partial')
                .reduce((sum, i) => sum + (Number(i.amount) - (Number(i.paid_amount) || 0)), 0);

            return {
                incomeThisMonth,
                expenseThisMonth,
                balance: totalIncome - totalExpense,
                unpaidCount: invoices?.filter(i => i.status === 'pending').length || 0,
                paidCount: invoices?.filter(i => i.status === 'paid').length || 0,
                partialCount: invoices?.filter(i => i.status === 'partial').length || 0
            };
        } else {
            // Range Filtered Logic
            const endOfDay = endDate + 'T23:59:59';
            const { data: payments } = await supabase.from('payments').select('amount')
                .gte('payment_date', startDate).lte('payment_date', endOfDay);
            const { data: expenses } = await supabase.from('expenses').select('amount')
                .gte('expense_date', startDate).lte('expense_date', endOfDay);
            // For counts, we filter invoices created in this range, OR assume snapshot?
            // User wants "Laporan", usually implies activity in that period.
            // But "Tagihan Belum Lunas" is a stock metric (current debt).
            // However, to keep it consistent with "Periode", we'll count invoices CREATED in period.
            const { data: invoices } = await supabase.from('invoices').select('status')
                .gte('created_at', startDate).lte('created_at', endOfDay);

            const income = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
            const expense = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);

            return {
                incomeThisMonth: income, // Reuse key for compatibility, represents Range Income
                expenseThisMonth: expense,
                balance: income - expense, // Net Range Income
                unpaidCount: invoices?.filter(i => i.status === 'pending').length || 0,
                paidCount: invoices?.filter(i => i.status === 'paid').length || 0,
                partialCount: invoices?.filter(i => i.status === 'partial').length || 0
            };
        }
    },

    async getExportData(startDate: string, endDate: string) {
        const endOfDay = endDate + 'T23:59:59';

        // 1. Invoices with Student, Class, and Payments info
        const { data: invoices } = await supabase
            .from('invoices')
            .select('*, students(name, class_id, classes(name)), payments(amount)')
            .gte('created_at', startDate)
            .lte('created_at', endOfDay)
            .order('created_at', { ascending: false });

        // 2. Expenses
        const { data: expenses } = await supabase
            .from('expenses')
            .select('*')
            .gte('expense_date', startDate)
            .lte('expense_date', endOfDay)
            .order('expense_date', { ascending: false });

        return { invoices: invoices || [], expenses: expenses || [] };
    },

    async getRecentTransactions() {
        const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .order('payment_date', { ascending: false })
            .limit(10);

        const { data: students } = await supabase.from('students').select('id, name');
        const studentMap = new Map(students?.map(s => [s.id, s.name]));

        return (payments || []).map(p => ({
            id: p.id,
            type: 'income',
            studentName: studentMap.get(p.student_id) || 'Santri',
            description: `Pembayaran dari ${studentMap.get(p.student_id) || 'Santri'}`,
            amount: p.amount,
            date: p.payment_date,
            status: 'success' as const
        }));
    },

    async getUnpaidInvoices() {
        const { data } = await supabase
            .from('invoices')
            .select('*, students(name, parent_phone, classes(name))')
            .eq('status', 'pending')
            .order('due_date', { ascending: true })
            .limit(10);

        return (data as unknown as DBInvoice[] || []).map((i) => ({
            id: i.id,
            name: i.students?.name || 'Santri',
            class: i.students?.classes?.name || '-',
            amount: i.amount,
            dueDate: i.due_date,
            type: i.invoice_type,
            parentPhone: i.students?.parent_phone || '-'
        }));
    },

    async getCashflow() {
        // Get payments and expenses for last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setDate(1); // Start of month
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // Go back 5 more months (total 6)

        const [paymentsRes, expensesRes] = await Promise.all([
            supabase.from('payments').select('amount, payment_date').gte('payment_date', sixMonthsAgo.toISOString()),
            supabase.from('expenses').select('amount, expense_date').gte('expense_date', sixMonthsAgo.toISOString())
        ]);

        const payments = paymentsRes.data || [];
        const expenses = expensesRes.data || [];

        // Helper to get YYYY-MM key
        const getMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        // Helper to format display month
        const formatMonth = (d: Date) => d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });

        // Group by month
        const monthData: Record<string, { income: number; expense: number; label: string }> = {};

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = getMonthKey(d);
            monthData[key] = { income: 0, expense: 0, label: formatMonth(d) };
        }

        // Sum payments by month
        payments.forEach(p => {
            const d = new Date(p.payment_date);
            const key = getMonthKey(d);
            if (monthData[key]) {
                monthData[key].income += Number(p.amount);
            }
        });

        // Sum expenses by month
        expenses.forEach(e => {
            const d = new Date(e.expense_date);
            const key = getMonthKey(d);
            if (monthData[key]) {
                monthData[key].expense += Number(e.amount);
            }
        });

        return Object.values(monthData).map(data => ({
            name: data.label,
            income: data.income,
            expense: data.expense
        }));
    },

    async getInvoiceStatusDistribution() {
        const { data } = await supabase.from('invoices').select('status');
        const counts = { paid: 0, pending: 0, partial: 0 };
        data?.forEach(i => {
            if (i.status === 'paid') counts.paid++;
            else if (i.status === 'partial') counts.partial++;
            else counts.pending++;
        });

        return [
            { name: 'Lunas', value: counts.paid, color: '#10b981' },
            { name: 'Belum Bayar', value: counts.pending, color: '#ef4444' },
            { name: 'Cicilan', value: counts.partial, color: '#f59e0b' }
        ];
    },

    async getPaymentMethodDistribution() {
        const { data } = await supabase.from('payments').select('payment_method, amount');
        const methods: Record<string, number> = {};
        data?.forEach(p => {
            methods[p.payment_method] = (methods[p.payment_method] || 0) + Number(p.amount);
        });

        const colors: Record<string, string> = {
            'tunai': '#10b981',
            'transfer': '#3b82f6',
            'qris': '#8b5cf6'
        };

        return Object.entries(methods).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: colors[name] || '#6b7280'
        }));
    },

    async getDailyIncome(days: number = 30) {
        // Get payments for last N days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: payments } = await supabase
            .from('payments')
            .select('amount, payment_date')
            .gte('payment_date', startDate.toISOString())
            .order('payment_date', { ascending: true });

        // Group by date
        const dailyData: Record<string, { amount: number; label: string }> = {};

        // Helper to get YYYY-MM-DD key (local date string)
        const getDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        // Initialize all days with 0
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = getDateKey(d);
            dailyData[key] = {
                amount: 0,
                label: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
            };
        }

        // Sum payments by date
        (payments || []).forEach(p => {
            const d = new Date(p.payment_date);
            const key = getDateKey(d);
            // Also try +1 day key just in case of UTC mismatch, or better: parse correctly
            // If payment_date is UTC string '2025-01-18T14:00:00Z', new Date() parses it to local time.
            // If the transaction was today, it should match today's key.

            if (dailyData[key]) {
                dailyData[key].amount += Number(p.amount);
            }
        });

        return Object.values(dailyData).map(data => ({
            day: data.label,
            amount: data.amount
        }));
    },

    async getUnpaidInvoicesByStudent(studentId: string) {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('student_id', studentId)
            .neq('status', 'paid')
            .order('due_date', { ascending: true });

        if (error) throw error;
        return (data || []).map(i => ({
            id: i.id,
            type: i.invoice_type,
            amount: i.amount,
            dueDate: i.due_date
        }));
    },

    async getPaymentsByStudent(studentId: string) {
        const { data } = await supabase
            .from('payments')
            .select('*')
            .eq('student_id', studentId)
            .order('payment_date', { ascending: false });

        return (data || []).map(p => ({
            id: p.id,
            description: p.notes || 'Pembayaran',
            amount: p.amount,
            method: p.payment_method,
            date: p.payment_date,
            status: 'success'
        }));
    },

    async getExpenses() {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('expense_date', { ascending: false });

        if (error) throw error;
        return (data || []).map(e => ({
            id: e.id,
            date: e.expense_date,
            category: e.category,
            description: e.description,
            amount: e.amount,
            pic: (e.notes?.startsWith('PIC: ') ? e.notes.replace('PIC: ', '') : null) || 'Staf Keuangan'
        }));
    },

    async createExpense(expense: {
        date?: string;
        expense_date?: string;
        category: string;
        description: string;
        amount: number;
        pic?: string;
    }) {
        const { requirePesantrenId } = await import('./helpers');
        const pesantrenId = await requirePesantrenId();

        // Map pic to notes since column doesn't exist
        const { pic, ...dbExpense } = expense;
        const notes = pic ? `PIC: ${pic}` : undefined;

        const { error } = await supabase.from('expenses').insert({
            ...dbExpense,
            notes,
            pesantren_id: pesantrenId
        });
        if (error) throw error;
    },

    async getIncomeByMethod() {
        return this.getPaymentMethodDistribution();
    },

    async getAllExpenses() {
        return this.getExpenses();
    },

    async getReport(period?: { startDate?: string; endDate?: string }) {
        let invoicesQuery = supabase.from('invoices').select('*');
        let paymentsQuery = supabase.from('payments').select('*');
        let expensesQuery = supabase.from('expenses').select('*');

        if (period?.startDate && period?.endDate) {
            const endOfDay = period.endDate + 'T23:59:59';
            invoicesQuery = invoicesQuery.gte('created_at', period.startDate).lte('created_at', endOfDay);
            paymentsQuery = paymentsQuery.gte('payment_date', period.startDate).lte('payment_date', endOfDay);
            expensesQuery = expensesQuery.gte('expense_date', period.startDate).lte('expense_date', endOfDay);
        }

        // Get all invoices and payments for the period
        const [invoicesRes, paymentsRes, expensesRes] = await Promise.all([
            invoicesQuery,
            paymentsQuery,
            expensesQuery
        ]);

        const invoices = invoicesRes.data || [];
        const payments = paymentsRes.data || [];
        const expenses = expensesRes.data || [];

        const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.amount), 0);
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // Accurate total unpaid: Invoiced amount minus paid_amount on invoices
        // We use full set of relevant invoices to calculate total debt
        const totalUnpaid = invoices.reduce((sum, i) => sum + (Number(i.amount) - (Number(i.paid_amount) || 0)), 0);

        // Group by type
        const byType: Record<string, number> = {};
        invoices.forEach(i => {
            byType[i.invoice_type] = (byType[i.invoice_type] || 0) + Number(i.amount);
        });

        // Group expenses by category
        const byCategory: Record<string, number> = {};
        expenses.forEach(e => {
            byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
        });

        return {
            summary: {
                totalInvoiced,
                totalPaid,
                totalUnpaid,
                totalExpense,
                netIncome: totalPaid - totalExpense,
                collectionRate: totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0
            },
            incomeByType: Object.entries(byType).map(([type, amount]) => ({ type, amount })),
            expenseByCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
            invoiceCount: {
                total: invoices.length,
                paid: invoices.filter(i => i.status === 'paid').length,
                partial: invoices.filter(i => i.status === 'partial').length,
                pending: invoices.filter(i => i.status === 'pending').length
            },
            recentPayments: payments.slice(0, 10).map(p => ({
                id: p.id,
                amount: p.amount,
                method: p.payment_method,
                date: p.payment_date
            })),
            recentExpenses: expenses.slice(0, 10).map(e => ({
                id: e.id,
                amount: e.amount,
                category: e.category,
                description: e.description,
                date: e.expense_date
            }))
        };
    },

    /**
     * Sync all invoice statuses based on actual payments
     * This fixes any inconsistencies where payments exist but invoice status wasn't updated
     */
    async syncInvoiceStatuses() {
        // Get all invoices that are not paid
        const { data: invoices, error: invError } = await supabase
            .from('invoices')
            .select('id, amount, status, paid_amount')
            .neq('status', 'paid');

        if (invError) {
            console.error('Error fetching invoices:', invError);
            throw invError;
        }

        if (!invoices || invoices.length === 0) {
            return { fixed: 0, message: 'No invoices need syncing' };
        }

        let fixedCount = 0;

        for (const invoice of invoices) {
            // Get total payments for this invoice
            const { data: payments } = await supabase
                .from('payments')
                .select('amount')
                .eq('invoice_id', invoice.id);

            const totalPaid = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
            const invoiceAmount = Number(invoice.amount);

            // Determine correct status
            let correctStatus = 'pending';
            if (totalPaid >= invoiceAmount) {
                correctStatus = 'paid';
            } else if (totalPaid > 0) {
                correctStatus = 'partial';
            }

            // Update if status is wrong or paid_amount is wrong
            if (invoice.status !== correctStatus || Number(invoice.paid_amount || 0) !== totalPaid) {
                const { error: updateError } = await supabase
                    .from('invoices')
                    .update({
                        status: correctStatus,
                        paid_amount: totalPaid
                    })
                    .eq('id', invoice.id);

                if (!updateError) {
                    fixedCount++;
                    console.log(`Fixed invoice ${invoice.id}: ${invoice.status} -> ${correctStatus}, paid: ${totalPaid}`);
                }
            }
        }

        return { fixed: fixedCount, message: `Synced ${fixedCount} invoice(s)` };
    }
};
