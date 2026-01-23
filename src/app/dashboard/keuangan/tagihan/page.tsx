'use client';

import { useEffect, useState } from 'react';
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
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    Download,
    Loader2,
    X
} from 'lucide-react';

import { financeService } from '@/lib/services/finance';
import { classesService } from '@/lib/services/classes';
import { studentsService } from '@/lib/services/students';

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

    const [invoices, setInvoices] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [invoiceTypes, setInvoiceTypes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
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

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_keuangan' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchInitialData();
    }, [router]);

    useEffect(() => {
        fetchInvoices();
    }, [filterStatus, filterType]);

    const fetchInitialData = async () => {
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
            setStudents(stdRes.data || []);
            setInvoiceTypes(types);

            // Set default type if available
            if (types.length > 0) {
                setFormData(prev => ({ ...prev, type: types[0].name, amount: types[0].amount }));
            }

            fetchInvoices();
        } catch (error) {
            console.error('Error fetching initial data:', error);
            setIsLoading(false);
        }
    };

    const fetchInvoices = async () => {
        try {
            setIsLoading(true);
            const data = await financeService.getAllInvoices({
                status: filterStatus === 'lunas' ? 'paid' : (filterStatus === 'belum' ? 'pending' : (filterStatus === 'cicilan' ? 'partial' : 'all')),
                type: filterType
            });
            setInvoices(data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleMarkAsPaid = async () => {
        if (!selectedInvoice || paymentAmount <= 0) return alert('Masukkan nominal pembayaran!');
        try {
            setIsProcessing(true);
            const result = await financeService.processPayment({
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
        } catch (error: any) {
            console.error('Error creating invoice:', error);
            setIsCreating(false);
            const errorMsg = error.message || (typeof error === 'object' ? JSON.stringify(error) : 'Gagal membuat tagihan');
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
        <div className="min-h-screen bg-gray-50">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-[60] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-medium">Tagihan berhasil dibuat!</span>
                </div>
            )}

            {/* Create Invoice Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">Buat Tagihan Baru</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Tagihan</label>
                                <select
                                    value={formData.targetType}
                                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                >
                                    <option value="all">Semua Santri</option>
                                    <option value="class">Per Kelas</option>
                                    <option value="individual">Per Santri</option>
                                </select>
                            </div>
                            {formData.targetType === 'individual' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Santri</label>
                                    <select
                                        value={formData.studentId}
                                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    >
                                        <option value="">Pilih Santri</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.nis})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {formData.targetType === 'class' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Kelas</label>
                                    <select
                                        value={formData.classId}
                                        onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    >
                                        <option value="">Pilih Kelas</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>Kelas {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Tagihan</label>
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
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                >
                                    {invoiceTypes.map(t => (
                                        <option key={t.id} value={t.name}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Jatuh Tempo</label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominal</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan (Opsional)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 min-h-[80px]"
                                    placeholder="Contoh: SPP Bulan Januari"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl flex items-center justify-center gap-2"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Membuat...
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
                <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">Proses Pembayaran</h3>
                            <p className="text-gray-500 text-sm mt-1">{selectedInvoice.santriName}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Info Tagihan */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Total Tagihan</span>
                                    <span className="font-semibold text-gray-800">{formatCurrency(selectedInvoice.amount)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Sudah Dibayar</span>
                                    <span className="font-semibold text-amber-600">{formatCurrency(paidSoFar)}</span>
                                </div>
                                <hr className="border-gray-200" />
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Sisa Tagihan</span>
                                    <span className="font-bold text-red-600">{formatCurrency(selectedInvoice.amount - paidSoFar)}</span>
                                </div>
                            </div>

                            {/* Input Nominal Pembayaran */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominal Pembayaran</label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(parseInt(e.target.value) || 0)}
                                    placeholder="Masukkan nominal"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => setPaymentAmount(selectedInvoice.amount - paidSoFar)}
                                        className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
                                    >
                                        Bayar Lunas
                                    </button>
                                    <button
                                        onClick={() => setPaymentAmount(Math.floor((selectedInvoice.amount - paidSoFar) / 2))}
                                        className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
                                    >
                                        Setengah
                                    </button>
                                </div>
                            </div>

                            {paymentAmount > 0 && (
                                <div className="text-sm text-center p-2 rounded-lg bg-blue-50 text-blue-700">
                                    {paymentAmount >= (selectedInvoice.amount - paidSoFar)
                                        ? '✅ Tagihan akan LUNAS'
                                        : `⏳ Sisa setelah bayar: ${formatCurrency(selectedInvoice.amount - paidSoFar - paymentAmount)}`
                                    }
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => { setShowPaymentModal(false); setPaymentAmount(0); setPaidSoFar(0); }}
                                className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleMarkAsPaid}
                                disabled={isProcessing || paymentAmount <= 0}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
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
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    <Receipt className="w-7 h-7 text-emerald-600" />
                                    SPP & Tagihan
                                </h1>
                                <p className="text-gray-500">
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
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{invoices.filter(i => i.status === 'lunas').length}</p>
                                    <p className="text-sm text-gray-500">Lunas</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{invoices.filter(i => i.status === 'belum').length}</p>
                                    <p className="text-sm text-gray-500">Belum Bayar</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{invoices.filter(i => i.status === 'cicilan').length}</p>
                                    <p className="text-sm text-gray-500">Cicilan</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari santri atau invoice..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'lunas' | 'belum' | 'cicilan')}
                                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                            >
                                <option value="all">Semua Status</option>
                                <option value="lunas">Lunas</option>
                                <option value="belum">Belum Bayar</option>
                                <option value="cicilan">Cicilan</option>
                            </select>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                            >
                                <option value="all">Semua Jenis</option>
                                {invoiceTypes.map(t => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Invoice ID</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Santri</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Kelas</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Jenis</th>
                                        <th className="text-right p-4 text-sm font-semibold text-gray-600">Nominal</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Status</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Jatuh Tempo</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredInvoices.map(inv => (
                                        <tr key={inv.id} className="hover:bg-gray-50">
                                            <td className="p-4 font-mono text-sm text-gray-800">{inv.id}</td>
                                            <td className="p-4 font-medium text-gray-800">{inv.santriName}</td>
                                            <td className="p-4 text-gray-600">{inv.class}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                                    {inv.type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-medium text-gray-800">{formatCurrency(inv.amount)}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${inv.status === 'lunas'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : inv.status === 'cicilan'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {inv.status === 'lunas' ? 'Lunas' : inv.status === 'cicilan' ? 'Cicilan' : 'Belum Bayar'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600 text-sm">{new Date(inv.dueDate).toLocaleDateString('id-ID')}</td>
                                            <td className="p-4 text-center">
                                                {inv.status !== 'lunas' && (
                                                    <button
                                                        onClick={async () => {
                                                            setSelectedInvoice(inv);
                                                            // Fetch existing payments for this invoice
                                                            const { data: payments } = await supabase
                                                                .from('payments')
                                                                .select('amount')
                                                                .eq('invoice_id', inv.id);
                                                            const totalPaid = (payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
                                                            setPaidSoFar(totalPaid);
                                                            setPaymentAmount(inv.amount - totalPaid);
                                                            setShowPaymentModal(true);
                                                        }}
                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                                                    >
                                                        Bayar
                                                    </button>
                                                )}
                                                {inv.status === 'lunas' && (
                                                    <span className="text-xs text-gray-400 italic">Selesai</span>
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
