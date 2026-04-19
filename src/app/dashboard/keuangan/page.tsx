'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getCurrentUser,
    clearSession,
    User
} from '@/lib/auth';
import {
    ChartCard,
    CashflowChart,
    InvoiceStatusChart,
    DailyIncomeChart,
    PaymentMethodChart
} from '@/components/charts';
import {
    Wallet,
    Receipt,
    TrendingDown,
    DollarSign,
    PiggyBank,
    ArrowUpRight,
    Plus,
    Send,
    CheckCircle2,
    AlertCircle,
    X,
    Loader2
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';

// ============================================
// Types
// ============================================

interface Transaction {
    id: string;
    studentName: string;
    type: string;
    amount: number;
    date: string;
    status: 'success' | 'pending';
}

interface UnpaidStudent {
    id: string;
    name: string;
    class: string;
    type: string;
    amount: number;
    dueDate: string;
    parentPhone: string;
}

interface CashflowData {
    name: string;
    income: number;
    expense: number;
}

interface InvoiceStatusData {
    name: string;
    value: number;
    color: string;
}

interface DailyIncomeData {
    day: string;
    amount: number;
}

interface PaymentMethodData {
    name: string;
    value: number;
    color: string;
}

interface ClassItem {
    id: string;
    name: string;
}

interface StudentItem {
    id: string;
    name: string;
    nis: string;
}

interface InvoiceTypeItem {
    id: string;
    name: string;
    amount: number;
}

import { financeService, FinanceStats } from '@/lib/services/finance';
import { studentsService } from '@/lib/services/students';
import { classesService } from '@/lib/services/classes';

// ============================================
// Mock Data (kept for now as it's used in form and not fetched)
// ============================================

const INVOICE_TYPES = [
    { id: 'spp', name: 'SPP Bulanan', amount: 500000 },
    { id: 'gedung', name: 'Uang Gedung', amount: 2000000 },
    { id: 'makan', name: 'Uang Makan', amount: 300000 },
    { id: 'kitab', name: 'Uang Kitab', amount: 250000 },
    { id: 'seragam', name: 'Seragam', amount: 750000 },
];


export default function KeuanganDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Real Data State
    const [stats, setStats] = useState<FinanceStats>({
        incomeThisMonth: 0,
        expenseThisMonth: 0,
        unpaidCount: 0,
        balance: 0,
        paidCount: 0,
        partialCount: 0
    });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [unpaidStudents, setUnpaidStudents] = useState<UnpaidStudent[]>([]);
    const [cashflowData, setCashflowData] = useState<CashflowData[]>([]);
    const [invoiceStatusData, setInvoiceStatusData] = useState<InvoiceStatusData[]>([]);
    const [dailyIncomeData, setDailyIncomeData] = useState<DailyIncomeData[]>([]);
    const [paymentMethodData, setPaymentMethodData] = useState<PaymentMethodData[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [invoiceTypes, setInvoiceTypes] = useState<InvoiceTypeItem[]>([]);

    // Invoice form state
    const [invoiceForm, setInvoiceForm] = useState({
        targetType: 'class', // 'class' or 'individual'
        class: '',
        studentId: '',
        invoiceType: '',
        amount: 0,
        dueDate: '',
        notes: '',
    });

    // Reminder state
    const [sendingReminder, setSendingReminder] = useState<string | null>(null);
    const [reminderSent, setReminderSent] = useState<string[]>([]);

    const [students, setStudents] = useState<StudentItem[]>([]);

    const fetchData = useCallback(async () => {
        try {
            // First, sync invoice statuses to fix any inconsistencies
            await financeService.syncInvoiceStatuses();

            const [
                fStats,
                recentTx,
                unpaid,
                cashflow,
                statusDist,
                methodDist,
                dailyInc,
                allClasses,
                allStudents,
                allTypes
            ] = await Promise.all([
                financeService.getStats(),
                financeService.getRecentTransactions(),
                financeService.getUnpaidInvoices(),
                financeService.getCashflow(),
                financeService.getInvoiceStatusDistribution(),
                financeService.getPaymentMethodDistribution(),
                financeService.getDailyIncome(30),
                classesService.getAll(),
                studentsService.getAll(),
                financeService.getInvoiceTypes()
            ]);

            setStats(fStats);
            setTransactions(recentTx);
            setUnpaidStudents(unpaid);
            setCashflowData(cashflow);
            setInvoiceStatusData(statusDist);
            setPaymentMethodData(methodDist);
            setDailyIncomeData(dailyInc);
            setClasses(allClasses.map(c => ({ id: c.id, name: c.name })));
            setStudents(allStudents.map(s => ({ id: s.id, name: s.name, nis: s.nis || '' })));
            setInvoiceTypes(allTypes);

            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching finance data:', err);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_keuangan' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchData();
    }, [router, fetchData]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleSendReminder = async (studentId: string) => {
        setSendingReminder(studentId);
        // In a real app, this would trigger a WhatsApp/Email API
        await new Promise(r => setTimeout(r, 1000));
        setSendingReminder(null);
        setReminderSent([...reminderSent, studentId]);
        alert('Pengingat telah dikirim ke Wali Santri via WhatsApp (Simulasi).');
    };

    const handleCreateInvoice = async () => {
        if (invoiceForm.targetType === 'class' && !invoiceForm.class) {
            alert('Harap pilih kelas!');
            return;
        }
        if (invoiceForm.targetType === 'individual' && !invoiceForm.studentId) {
            alert('Harap pilih santri!');
            return;
        }
        if (!invoiceForm.invoiceType || !invoiceForm.amount || !invoiceForm.dueDate) {
            alert('Harap isi semua kolom yang wajib.');
            return;
        }

        try {
            setIsLoading(true);
            await financeService.createInvoice({
                targetType: invoiceForm.targetType,
                studentId: invoiceForm.studentId,
                classId: invoiceForm.class,
                invoiceType: invoiceForm.invoiceType,
                amount: invoiceForm.amount,
                dueDate: invoiceForm.dueDate,
                notes: invoiceForm.notes
            });

            alert('Invoice berhasil dibuat!');
            setShowInvoiceModal(false);
            setInvoiceForm({
                targetType: 'class',
                class: '',
                studentId: '',
                invoiceType: '',
                amount: 0,
                dueDate: '',
                notes: '',
            });
            fetchData();
        } catch (err: unknown) {
            console.error('Error creating invoice:', err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            alert('Gagal membuat invoice: ' + message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase tracking-widest font-black text-emerald-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                    <span>Loading Finansial...</span>
                </div>
            </div>
        );
    }

    // Format currency
    const formatCurrency = (amount: number) => {
        if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };


    return (
        <div className="min-h-screen bg-gray-50">
            {/* Invoice Modal */}
            {showInvoiceModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Buat Tagihan Baru</h3>
                                <p className="text-sm text-gray-500">Buat tagihan SPP atau biaya lainnya</p>
                            </div>
                            <button onClick={() => setShowInvoiceModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Target Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Tagihan</label>
                                <select
                                    value={invoiceForm.targetType}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, targetType: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                >
                                    <option value="all">Semua Santri</option>
                                    <option value="class">Per Kelas</option>
                                    <option value="individual">Per Santri</option>
                                </select>
                            </div>

                            {/* Class Selection */}
                            {invoiceForm.targetType === 'class' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Kelas</label>
                                    <select
                                        value={invoiceForm.class}
                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, class: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    >
                                        <option value="">Pilih Kelas</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Student Selection */}
                            {invoiceForm.targetType === 'individual' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Santri</label>
                                    <select
                                        value={invoiceForm.studentId}
                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, studentId: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    >
                                        <option value="">Pilih Santri</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.nis})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Invoice Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Tagihan</label>
                                <select
                                    value={invoiceForm.invoiceType}
                                    onChange={(e) => {
                                        const type = INVOICE_TYPES.find(t => t.id === e.target.value);
                                        setInvoiceForm({
                                            ...invoiceForm,
                                            invoiceType: e.target.value,
                                            amount: type?.amount || 0
                                        });
                                    }}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                                >
                                    <option value="">-- Pilih Jenis --</option>
                                    {invoiceTypes.length > 0 ? (
                                        invoiceTypes.map(type => (
                                            <option key={type.id} value={type.name}>{type.name} - {formatCurrency(type.amount)}</option>
                                        ))
                                    ) : (
                                        INVOICE_TYPES.map(type => (
                                            <option key={type.id} value={type.name}>{type.name} - {formatCurrency(type.amount)}</option>
                                        ))
                                    )}
                                </select>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominal</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                                    <input
                                        type="number"
                                        value={invoiceForm.amount}
                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: parseInt(e.target.value) || 0 })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jatuh Tempo</label>
                                <input
                                    type="date"
                                    value={invoiceForm.dueDate}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan (Opsional)</label>
                                <textarea
                                    rows={2}
                                    value={invoiceForm.notes}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                                    placeholder="Catatan tambahan..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setShowInvoiceModal(false)}
                                className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreateInvoice}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Receipt className="w-5 h-5" />
                                Buat Tagihan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 max-w-[1600px] mx-auto">
                    {/* Welcome Banner - Modern Gradient & High Contrast */}
                    <div className="bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-950 rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-10 text-white mb-6 lg:mb-10 shadow-2xl overflow-hidden relative border border-emerald-500/20 group">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-3xl mix-blend-overlay" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8">
                            <div>
                                <div className="flex items-center gap-3 lg:gap-5">
                                    <div className="w-10 h-10 lg:w-16 lg:h-16 bg-white/10 rounded-xl lg:rounded-2xl border border-white/20 shadow-inner backdrop-blur-md flex items-center justify-center">
                                        <Wallet className="w-5 h-5 lg:w-8 lg:h-8 text-emerald-300" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg lg:text-3xl font-black tracking-tight leading-none uppercase drop-shadow-lg">
                                            Portal <span className="text-emerald-300">Keuangan</span>
                                        </h2>
                                        <p className="text-emerald-200/50 text-[8px] lg:text-[10px] font-bold uppercase tracking-[0.2em] mt-1 lg:mt-2 shadow-black/10">Finance & Payments</p>
                                    </div>
                                </div>
                                <p className="text-emerald-100/60 text-sm lg:text-base font-medium mt-4 lg:mt-6 max-w-xl hidden sm:block leading-relaxed">
                                    Kelola SPP, pembayaran, dan laporan keuangan pesantren secara transparan dan akuntabel.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowInvoiceModal(true)}
                                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 lg:px-8 lg:py-4 bg-white text-emerald-900 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95"
                            >
                                <Plus className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600" />
                                Buat Tagihan
                            </button>
                        </div>
                    </div>

                    {/* Financial Summary Cards - Mobile 2 Columns */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                            <p className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">{formatCurrency(stats.incomeThisMonth)}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Pemasukan</p>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm transition-all hover:border-red-200 hover:shadow-md">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                                    <TrendingDown className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                            <p className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">{formatCurrency(stats.expenseThisMonth)}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Pengeluaran</p>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm transition-all hover:border-amber-200 hover:shadow-md">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                                    <Receipt className="w-6 h-6 text-amber-600" />
                                </div>
                            </div>
                            <p className="text-3xl font-black text-gray-800 tracking-tight">{stats.unpaidCount}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Belum Lunas</p>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                                    <PiggyBank className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <p className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">{formatCurrency(stats.balance)}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Saldo Kas</p>
                        </div>
                    </div>

                    {/* Data Visualization Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <ChartCard
                            title="Arus Kas (Cashflow)"
                            subtitle="Pemasukan vs Pengeluaran"
                            className="lg:col-span-2"
                        >
                            <CashflowChart data={cashflowData} height={300} />
                        </ChartCard>

                        <ChartCard
                            title="Status Tagihan"
                            subtitle="Perbandingan lunas & belum bayar"
                        >
                            <InvoiceStatusChart data={invoiceStatusData} height={260} />
                            <div className="flex justify-center gap-6 mt-2">
                                {invoiceStatusData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="text-sm text-gray-600">{d.name} ({d.value})</span>
                                    </div>
                                ))}
                            </div>
                        </ChartCard>
                    </div>

                    {/* Second Row of Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <ChartCard
                            title="Trend Pemasukan Harian"
                            subtitle="30 hari terakhir"
                            className="lg:col-span-2"
                        >
                            <DailyIncomeChart data={dailyIncomeData} height={280} />
                        </ChartCard>

                        <ChartCard
                            title="Metode Pembayaran"
                            subtitle="Distribusi metode pembayaran"
                        >
                            <PaymentMethodChart data={paymentMethodData} height={280} />
                        </ChartCard>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Transactions */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-800">Transaksi Terbaru</h3>
                                <Link
                                    href="/dashboard/keuangan/pembayaran"
                                    className="text-sm text-emerald-600 font-medium hover:underline"
                                >
                                    Lihat Semua
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-600">Santri</th>
                                            <th className="text-left p-4 text-sm font-semibold text-gray-600">Jenis</th>
                                            <th className="text-right p-4 text-sm font-semibold text-gray-600">Nominal</th>
                                            <th className="text-center p-4 text-sm font-semibold text-gray-600">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {transactions.map(tx => (
                                            <tr key={tx.id} className="hover:bg-gray-50">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                                                            <span className="text-sm font-medium text-emerald-600">{tx.studentName.charAt(0)}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-800">{tx.studentName}</p>
                                                            <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('id-ID')}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-600 uppercase text-xs font-bold tracking-wider">{tx.type}</td>
                                                <td className="p-4 text-right font-semibold text-gray-800">{formatCurrency(tx.amount)}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${tx.status === 'success'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {tx.status === 'success' ? 'Lunas' : 'Pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {transactions.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-gray-400">Belum ada transaksi</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Unpaid Students */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <h3 className="font-semibold text-gray-800">Belum Bayar</h3>
                                </div>
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                    {unpaidStudents.length}
                                </span>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                                {unpaidStudents.map(student => (
                                    <div key={student.id} className="p-4">
                                        <div className="flex items-start justify-between mb-2 gap-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-gray-800 truncate">{student.name}</p>
                                                <p className="text-sm text-gray-500">Kelas {student.class} • {student.type}</p>
                                            </div>
                                            <p className="font-semibold text-gray-800 whitespace-nowrap">{formatCurrency(student.amount)}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-red-600">Jatuh tempo: {new Date(student.dueDate).toLocaleDateString('id-ID')}</span>
                                            <button
                                                onClick={() => handleSendReminder(student.id)}
                                                disabled={sendingReminder === student.id || reminderSent.includes(student.id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${reminderSent.includes(student.id)
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                                                    }`}
                                            >
                                                {sendingReminder === student.id ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Mengirim...
                                                    </>
                                                ) : reminderSent.includes(student.id) ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Terkirim
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        Ingatkan
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {unpaidStudents.length === 0 && (
                                    <div className="p-8 text-center text-gray-400 italic text-sm">Semua tagihan lunas!</div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
