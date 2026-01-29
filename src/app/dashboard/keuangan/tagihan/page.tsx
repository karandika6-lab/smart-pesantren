'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    getCurrentUser,
    clearSession,
    syncUserSession,
    User
} from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    ArrowLeft,
    Receipt,
    Plus,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    Download,
    Loader2,
    X
} from 'lucide-react';

import { financeService } from '@/lib/services/finance';

interface SimpleClass { id: string; name: string; }
interface SimpleStudent { id: string; name: string; nis: string; }
interface InvoiceType { id: string; name: string; amount: number; }
interface Invoice {
    id: string;
    studentId: string;
    amount: number;
    status: string;
    santriName: string;
    class: string;
    type: string;
    dueDate: string;
    description?: string;
    created_at?: string;
    paid_amount?: number;
}

// ============================================
// Types & Data
// ============================================

// Remove hardcoded types, used dynamic types instead

export default function TagihanPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'lunas' | 'belum' | 'cicilan'>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [classes, setClasses] = useState<SimpleClass[]>([]);
    const [students, setStudents] = useState<SimpleStudent[]>([]);
    const [invoiceTypes, setInvoiceTypes] = useState<InvoiceType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paidSoFar, setPaidSoFar] = useState(0);

    // Form state
    const [formData, setFormData] = useState({
        targetType: 'class',
        classId: '',
        studentId: '',
        type: 'SPP Bulanan',
        dueDate: new Date().toISOString().split('T')[0],
        amount: 500000,
        notes: ''
    });

    const fetchInvoices = useCallback(async () => {
        try {
            setIsLoading(true);
            // Sync before fetching to ensure data accuracy
            await financeService.syncInvoiceStatuses();

            const data = await financeService.getAllInvoices({
                status: filterStatus === 'lunas' ? 'paid' : (filterStatus === 'belum' ? 'pending' : (filterStatus === 'cicilan' ? 'partial' : 'all')),
                type: filterType
            });
            setInvoices(data as unknown as Invoice[]);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setIsLoading(false);
        }
    }, [filterStatus, filterType]);

    const fetchInitialData = useCallback(async () => {
        try {
            // First, sync user session to make sure pesantrenId is up to date
            const updatedUser = await syncUserSession();
            if (updatedUser) setUser(updatedUser);

            const [clsRes, stdRes, types] = await Promise.all([
                supabase.from('classes').select('id, name').order('name'),
                supabase.from('students').select('id, name, nis').order('name'),
                financeService.getInvoiceTypes()
            ]);

            setClasses(clsRes.data || []);
            setStudents((stdRes.data || []).map(s => ({ ...s, nis: s.nis || '' })));
            setInvoiceTypes(types as unknown as InvoiceType[]);

            // Set default type if available
            if (types.length > 0) {
                setFormData(prev => ({ ...prev, type: types[0].name, amount: types[0].amount }));
            }

            // fetchInvoices(); // Handled by separate useEffect
        } catch (error) {
            console.error('Error fetching initial data:', error);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_keuangan' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchInitialData();
        });
        return () => cancelAnimationFrame(timer);
    }, [router, fetchInitialData]);

    useEffect(() => {
        const timer = requestAnimationFrame(() => {
            fetchInvoices();
        });
        return () => cancelAnimationFrame(timer);
    }, [fetchInvoices]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleMarkAsPaid = async () => {
        if (!selectedInvoice || paymentAmount <= 0) return alert('Masukkan nominal pembayaran!');
        try {
            setIsProcessing(true);
            await financeService.processPayment({
                invoice_id: selectedInvoice.id,
                amount: paymentAmount,
                payment_method: 'tunai',
                notes: 'Dibayar secara manual melalui admin'
            });
            setShowPaymentModal(false);
            setSelectedInvoice(null);
            setPaymentAmount(0);
            setPaidSoFar(0);
            setIsProcessing(false);
            setShowSuccess(true);
            fetchInvoices();
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Error processing payment:', error);
            setIsProcessing(false);
            alert('Gagal memproses pembayaran');
        }
    };

    const handleCreate = async () => {
        if (formData.targetType === 'class' && !formData.classId) return alert('Pilih kelas!');
        if (formData.targetType === 'individual' && !formData.studentId) return alert('Pilih santri!');

        try {
            setIsCreating(true);
            const result = await financeService.createInvoice({
                targetType: formData.targetType,
                classId: formData.classId,
                studentId: formData.studentId,
                invoiceType: formData.type,
                amount: formData.amount,
                dueDate: formData.dueDate,
                notes: formData.notes
            });

            setIsCreating(false);
            setShowModal(false);
            setShowSuccess(true);
            fetchInvoices();
            setTimeout(() => setShowSuccess(false), 3000);

            if (result.count > 1) {
                alert(`Berhasil membuat ${result.count} tagihan!`);
            }
        } catch (error: unknown) {
            console.error('Error creating invoice:', error);
            setIsCreating(false);
            const errorMsg = error instanceof Error ? error.message : (typeof error === 'object' ? JSON.stringify(error) : 'Gagal membuat tagihan');
            alert('Gagal: ' + errorMsg);
        }
    };


    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase tracking-widest font-black text-emerald-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                    <span>Loading Data Tagihan...</span>
                </div>
            </div>
        );
    }

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.santriName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.type.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-[60] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-medium">Tagihan berhasil dibuat!</span>
                </div>
            )}

            {/* Create Invoice Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col transition-all scale-100">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Buat Tagihan Baru</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-neutral-500" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                            <div>
                                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 px-1">Target Tagihan</label>
                                <select
                                    value={formData.targetType}
                                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium appearance-none"
                                >
                                    <option value="all" className="bg-neutral-900">Semua Santri</option>
                                    <option value="class" className="bg-neutral-900">Per Kelas</option>
                                    <option value="individual" className="bg-neutral-900">Per Santri</option>
                                </select>
                            </div>
                            {formData.targetType === 'individual' && (
                                <div>
                                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 px-1">Pilih Santri</label>
                                    <select
                                        value={formData.studentId}
                                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                                    >
                                        <option value="" className="bg-neutral-900">Pilih Santri</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id} className="bg-neutral-900">{s.name} ({s.nis})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {formData.targetType === 'class' && (
                                <div>
                                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 px-1">Pilih Kelas</label>
                                    <select
                                        value={formData.classId}
                                        onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                                    >
                                        <option value="" className="bg-neutral-900">Pilih Kelas</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id} className="bg-neutral-900">Kelas {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 px-1">Jenis Tagihan</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => {
                                        const type = invoiceTypes.find(t => t.name === e.target.value);
                                        setFormData({
                                            ...formData,
                                            type: e.target.value,
                                            amount: type ? type.amount : formData.amount
                                        });
                                    }}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                                >
                                    {invoiceTypes.map(t => (
                                        <option key={t.id} value={t.name} className="bg-neutral-900">{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 px-1">Jatuh Tempo</label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 px-1">Nominal</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-black text-lg"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 px-1">Catatan (Opsional)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 min-h-[100px] transition-all font-medium"
                                    placeholder="Contoh: SPP Bulan Januari"
                                />
                            </div>
                        </div>
                        <div className="p-8 border-t border-white/5 flex gap-4 bg-white/[0.02]">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-4 border border-white/10 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white/5 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] disabled:opacity-50"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    'Buat Tagihan'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal dengan Cicilan */}
            {showPaymentModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4 transition-all duration-300">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden transition-all scale-100 flex flex-col">
                        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Proses Pembayaran</h3>
                            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-2">{selectedInvoice.santriName}</p>
                        </div>
                        <div className="p-8 space-y-6">
                            {/* Info Tagihan */}
                            <div className="bg-black/40 rounded-2xl p-6 space-y-4 border border-white/5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Total Tagihan</span>
                                    <span className="font-black text-white">{formatCurrency(selectedInvoice.amount)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Sudah Dibayar</span>
                                    <span className="font-black text-amber-500">{formatCurrency(paidSoFar)}</span>
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Sisa Tagihan</span>
                                    <span className="font-black text-rose-500 text-lg">{formatCurrency(selectedInvoice.amount - paidSoFar)}</span>
                                </div>
                            </div>

                            {/* Input Nominal Pembayaran */}
                            <div>
                                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3 px-1">Nominal Pembayaran</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(parseInt(e.target.value) || 0)}
                                        placeholder="Masukkan nominal"
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-black text-xl transition-all"
                                    />
                                </div>
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

                            {paymentAmount > 0 && (
                                <div className={`text-[10px] font-black uppercase tracking-widest text-center py-3 rounded-xl border ${paymentAmount >= (selectedInvoice.amount - paidSoFar)
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
                                onClick={handleMarkAsPaid}
                                disabled={isProcessing || paymentAmount <= 0}
                                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] disabled:opacity-50"
                            >
                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Bayar ${formatCurrency(paymentAmount)}`}
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

                <main className="p-4 lg:p-8">
                    {/* Breadcrumb & Title */}
                    <div className="mb-6">
                        <Link
                            href="/dashboard/keuangan"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Dashboard
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <Receipt className="w-7 h-7 text-emerald-500" />
                                    SPP & Tagihan
                                </h1>
                                <p className="text-neutral-500">
                                    Kelola semua tagihan santri
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-500/30"
                            >
                                <Plus className="w-5 h-5" />
                                Buat Tagihan Baru
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/10 shadow-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{invoices.filter(i => i.status === 'lunas').length}</p>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Lunas</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20">
                                    <XCircle className="w-6 h-6 text-rose-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{invoices.filter(i => i.status === 'belum').length}</p>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Belum Bayar</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                                    <Clock className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{invoices.filter(i => i.status === 'cicilan').length}</p>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Cicilan</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white/[0.02] rounded-2xl border border-white/10 shadow-2xl p-6 mb-8">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="w-5 h-5 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari santri atau invoice..."
                                    className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                                />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'lunas' | 'belum' | 'cicilan')}
                                className="px-5 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium cursor-pointer"
                            >
                                <option value="all" className="bg-neutral-900 text-white">Semua Status</option>
                                <option value="lunas" className="bg-neutral-900 text-white">Lunas</option>
                                <option value="belum" className="bg-neutral-900 text-white">Belum Bayar</option>
                                <option value="cicilan" className="bg-neutral-900 text-white">Cicilan</option>
                            </select>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-5 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium cursor-pointer"
                            >
                                <option value="all" className="bg-neutral-900 text-white">Semua Jenis</option>
                                {invoiceTypes.map(t => (
                                    <option key={t.id} value={t.name} className="bg-neutral-900 text-white">{t.name}</option>
                                ))}
                            </select>
                            <button className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                                <Download className="w-4 h-4 text-emerald-500" />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white/[0.02] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-white/[0.02] border-b border-white/10">
                                    <tr>
                                        <th className="text-left p-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Invoice ID</th>
                                        <th className="text-left p-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Santri</th>
                                        <th className="text-left p-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Kelas</th>
                                        <th className="text-left p-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Jenis</th>
                                        <th className="text-right p-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Nominal</th>
                                        <th className="text-center p-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Status</th>
                                        <th className="text-left p-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Jatuh Tempo</th>
                                        <th className="text-center p-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                    {filteredInvoices.map(inv => (
                                        <tr key={inv.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="p-6 font-mono text-xs text-neutral-400">{inv.id.slice(0, 8)}...</td>
                                            <td className="p-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{inv.santriName}</span>
                                                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">SANTRI ID: {inv.studentId.slice(0, 5)}</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                                    {inv.class}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                                                    {inv.type}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right font-black text-white text-base">
                                                {formatCurrency(inv.amount)}
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border shadow-lg ${inv.status === 'lunas'
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5'
                                                    : inv.status === 'cicilan'
                                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/5'
                                                        : 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/5'
                                                    }`}>
                                                    {inv.status === 'lunas' ? 'Lunas' : inv.status === 'cicilan' ? 'Cicilan' : 'Belum Bayar'}
                                                </span>
                                            </td>
                                            <td className="p-6 text-neutral-400 text-[11px] font-bold uppercase tracking-widest">
                                                {new Date(inv.dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="p-4 text-center">
                                                {inv.status !== 'lunas' && (
                                                    <button
                                                        onClick={async () => {
                                                            setSelectedInvoice(inv);
                                                            const { data: payments } = await supabase
                                                                .from('payments')
                                                                .select('amount')
                                                                .eq('invoice_id', inv.id);
                                                            const totalPaid = (payments || []).reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);
                                                            setPaidSoFar(totalPaid);
                                                            setPaymentAmount(inv.amount - totalPaid);
                                                            setShowPaymentModal(true);
                                                        }}
                                                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_15px_30px_-10px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95"
                                                    >
                                                        Bayar
                                                    </button>
                                                )}
                                                {inv.status === 'lunas' && (
                                                    <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] italic">Selesai</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredInvoices.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="p-12 text-center text-gray-400 italic">
                                                Tidak ada data tagihan ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
