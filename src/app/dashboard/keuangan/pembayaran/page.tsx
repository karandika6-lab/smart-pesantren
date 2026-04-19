'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    getCurrentUser,
    clearSession,
    User
} from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    ArrowLeft,
    CreditCard,
    Search,
    CheckCircle2,
    Loader2,
    Wallet,
    Building2,
    Smartphone,
    Clock,
    History,
    User as UserIcon,
    X
} from 'lucide-react';

import { financeService } from '@/lib/services/finance';

interface Invoice {
    id: string;
    studentId: string;
    santriName: string;
    class: string;
    type: string;
    amount: number;
    status: 'lunas' | 'cicilan' | 'belum';
    dueDate: string;
    notes?: string;
}

interface RecentPayment {
    id: string;
    santriName: string;
    amount: number;
    method: string;
    timestamp: string;
    status: string;
}

export default function PembayaranPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'belum' | 'cicilan'>('all');

    // All unpaid invoices list
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);

    // Payment Modal
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paidSoFar, setPaidSoFar] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('tunai');
    const [paymentNotes, setPaymentNotes] = useState('');

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_keuangan' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchData();
        });
        return () => cancelAnimationFrame(timer);
    }, [router]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [allInvoices, payments] = await Promise.all([
                financeService.getAllInvoices(),
                financeService.getRecentPayments(10)
            ]);
            // Filter only unpaid invoices
            setInvoices((allInvoices as Invoice[]).filter((i: Invoice) => i.status !== 'lunas'));
            setRecentPayments(payments as RecentPayment[]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const openPaymentModal = async (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        // Fetch existing payments for this invoice
        const { data: payments } = await supabase
            .from('payments')
            .select('amount')
            .eq('invoice_id', invoice.id);
        const totalPaid = (payments || []).reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);
        setPaidSoFar(totalPaid);
        setPaymentAmount(invoice.amount - totalPaid);
        setShowPaymentModal(true);
    };

    const handleProcessPayment = async () => {
        if (!selectedInvoice || paymentAmount <= 0) return alert('Masukkan nominal pembayaran!');
        try {
            setIsProcessing(true);
            await financeService.processPayment({
                invoice_id: selectedInvoice.id,
                amount: paymentAmount,
                payment_method: paymentMethod,
                notes: paymentNotes
            });
            setShowPaymentModal(false);
            setSelectedInvoice(null);
            setPaymentAmount(0);
            setPaidSoFar(0);
            setPaymentNotes('');
            setIsProcessing(false);
            setShowSuccess(true);
            fetchData();
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Error processing payment:', error);
            setIsProcessing(false);
            alert('Gagal memproses pembayaran');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Filter invoices
    const filteredInvoices = invoices.filter(inv => {
        const matchSearch = inv.santriName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.id?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
        return matchSearch && matchStatus;
    });

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase tracking-widest font-black text-emerald-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                    <span>Loading Data Pembayaran...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-[60] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-medium">Pembayaran berhasil diproses!</span>
                </div>
            )}

            {/* Payment Modal dengan Cicilan */}
            {showPaymentModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4 transition-all duration-300">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden transition-all scale-100 flex flex-col">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Proses Pembayaran</h3>
                                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-2">{selectedInvoice.santriName}</p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-neutral-500" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                            {/* Info Tagihan */}
                            <div className="bg-black/40 rounded-2xl p-6 space-y-4 border border-white/5">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Total Tagihan</span>
                                    <span className="font-black text-white">{formatCurrency(selectedInvoice.amount)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Sudah Dibayar</span>
                                    <span className="font-black text-amber-500">{formatCurrency(paidSoFar)}</span>
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Sisa Tagihan</span>
                                    <span className="font-black text-rose-500 text-lg">{formatCurrency(selectedInvoice.amount - paidSoFar)}</span>
                                </div>
                            </div>

                            {/* Input Nominal Pembayaran */}
                            <div>
                                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3 px-1">Nominal Pembayaran</label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(parseInt(e.target.value, 10) || 0)}
                                    placeholder="Masukkan nominal"
                                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-black text-xl transition-all"
                                />
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => setPaymentAmount(selectedInvoice.amount - paidSoFar)}
                                        className="flex-1 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-500/20"
                                    >
                                        Bayar Lunas
                                    </button>
                                    <button
                                        onClick={() => setPaymentAmount(Math.floor((selectedInvoice.amount - paidSoFar) / 2))}
                                        className="flex-1 py-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-amber-500/20"
                                    >
                                        Setengah
                                    </button>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4 px-1">Metode Pembayaran</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'tunai', label: 'Tunai', icon: Wallet },
                                        { id: 'transfer', label: 'Transfer', icon: Building2 },
                                        { id: 'qris', label: 'QRIS', icon: Smartphone },
                                    ].map(method => (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id)}
                                            className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition-all group ${paymentMethod === method.id
                                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-[0_10px_20px_-5px_rgba(16,185,129,0.2)]'
                                                : 'border-white/10 bg-black/20 text-neutral-500 hover:bg-white/5'
                                                }`}
                                        >
                                            <method.icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${paymentMethod === method.id ? 'text-emerald-500' : ''}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3 px-1">Catatan (Opsional)</label>
                                <input
                                    type="text"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder="Catatan pembayaran..."
                                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                                />
                            </div>

                            {paymentAmount > 0 && (
                                <div className={`text-[10px] font-black uppercase tracking-widest text-center py-4 rounded-2xl border ${paymentAmount >= (selectedInvoice.amount - paidSoFar)
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                    }`}>
                                    {paymentAmount >= (selectedInvoice.amount - paidSoFar)
                                        ? '✅ Status akan menjadi LUNAS'
                                        : `⏳ Sisa tagihan: ${formatCurrency(selectedInvoice.amount - paidSoFar - paymentAmount)}`
                                    }
                                </div>
                            )}
                        </div>
                        <div className="p-8 border-t border-white/5 flex gap-4 bg-white/[0.02]">
                            <button
                                onClick={() => { setShowPaymentModal(false); setPaymentAmount(0); setPaidSoFar(0); }}
                                className="flex-1 py-4 border border-white/10 text-neutral-500 font-bold text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white/5 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleProcessPayment}
                                disabled={isProcessing || paymentAmount <= 0}
                                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] disabled:opacity-50 active:scale-95"
                            >
                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Proses ${formatCurrency(paymentAmount)}`}
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

                <main className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-6 lg:space-y-10">
                    <div className="mb-2 lg:mb-4">
                        <Link
                            href="/dashboard/keuangan"
                            className="inline-flex items-center gap-2 text-xs lg:text-sm text-neutral-500 hover:text-white transition-all uppercase font-black tracking-widest"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Portal
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 lg:gap-6">
                            <div className="w-12 h-12 lg:w-20 lg:h-20 bg-emerald-500/10 rounded-xl lg:rounded-3xl flex items-center justify-center border border-emerald-500/20 shadow-inner backdrop-blur-md">
                                <CreditCard className="w-6 h-6 lg:w-10 lg:h-10 text-emerald-500" />
                            </div>
                            <div>
                                <h1 className="text-lg lg:text-3xl font-black text-white uppercase tracking-tight leading-none drop-shadow-xl">
                                    Input <span className="text-emerald-500">Pembayaran</span>
                                </h1>
                                <p className="text-neutral-500 text-[8px] lg:text-[10px] font-bold uppercase tracking-[0.2em] mt-1 lg:mt-2 shadow-black/10">
                                    Proses manual wali santri
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Invoices List */}
                        <div className="lg:col-span-2">
                            <div className="bg-white/[0.02] rounded-2xl lg:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
                                {/* Header & Filters */}
                                <div className="p-4 lg:p-6 border-b border-white/5 bg-white/[0.01]">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="relative flex-1">
                                            <Search className="w-5 h-5 text-neutral-600 absolute left-4 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Cari nama santri..."
                                                className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                                            />
                                        </div>
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'belum' | 'cicilan')}
                                            className="px-6 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer"
                                        >
                                            <option value="all" className="bg-neutral-900">Semua</option>
                                            <option value="belum" className="bg-neutral-900">Belum Bayar</option>
                                            <option value="cicilan" className="bg-neutral-900">Cicilan</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Scrollable List */}
                                <div className="max-h-[65vh] overflow-y-auto custom-scrollbar">
                                    {filteredInvoices.length > 0 ? (
                                        <div className="divide-y divide-white/[0.05]">
                                            {filteredInvoices.map(inv => (
                                                <div key={inv.id} className="p-6 hover:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-colors group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/5 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/5">
                                                            <UserIcon className="w-6 h-6 text-neutral-500 group-hover:text-emerald-500 transition-colors" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight text-lg">{inv.santriName}</p>
                                                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mt-1">{inv.type} • {inv.class}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                                        <div className="text-right">
                                                            <p className="font-black text-white text-lg">{formatCurrency(inv.amount)}</p>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border mt-1 inline-block ${inv.status === 'cicilan'
                                                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                                }`}>
                                                                {inv.status === 'cicilan' ? 'Cicilan' : 'Belum Bayar'}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => openPaymentModal(inv)}
                                                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_15px_30px_-10px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95"
                                                        >
                                                            Bayar
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-20 text-center text-neutral-600">
                                            <Clock className="w-16 h-16 mx-auto mb-6 opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Tidak ada tagihan tertunggak</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Payments */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/[0.02] rounded-2xl lg:rounded-[2.5rem] border border-white/10 shadow-2xl p-6 lg:p-8 sticky top-8">
                                <h3 className="font-black text-white text-[10px] lg:text-xs uppercase tracking-[0.2em] mb-6 lg:mb-8 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <History className="w-5 h-5 text-emerald-500" />
                                        <span>Terakhir</span>
                                    </div>
                                    <span className="text-[10px] text-neutral-600 font-bold bg-white/5 px-2 py-1 rounded-md">Live</span>
                                </h3>
                                <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                                    {recentPayments.length > 0 ? (
                                        recentPayments.map((payment, idx) => (
                                            <div key={idx} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/5 transition-colors group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="font-black text-white text-sm uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{payment.santriName}</p>
                                                        <p className="text-[10px] font-bold text-neutral-600 mt-1 uppercase tracking-widest">{payment.timestamp}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-emerald-500 text-sm">{formatCurrency(payment.amount)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-md text-[9px] font-black text-neutral-500 uppercase tracking-widest group-hover:border-emerald-500/20 group-hover:text-emerald-500 transition-all">
                                                        {payment.method}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10">
                                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] italic">Belum ada transaksi</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
