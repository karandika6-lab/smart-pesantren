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
    User as UserIcon,
    X
} from 'lucide-react';

import { financeService } from '@/lib/services/finance';

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
    const [invoices, setInvoices] = useState<any[]>([]);
    const [recentPayments, setRecentPayments] = useState<any[]>([]);

    // Payment Modal
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
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
        setUser(currentUser);
        fetchData();
    }, [router]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [allInvoices, payments] = await Promise.all([
                financeService.getAllInvoices(),
                financeService.getRecentPayments(10)
            ]);
            // Filter only unpaid invoices
            setInvoices(allInvoices.filter((i: any) => i.status !== 'lunas'));
            setRecentPayments(payments);
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

    const openPaymentModal = async (invoice: any) => {
        setSelectedInvoice(invoice);
        // Fetch existing payments for this invoice
        const { data: payments } = await supabase
            .from('payments')
            .select('amount')
            .eq('invoice_id', invoice.id);
        const totalPaid = (payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
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
        <div className="min-h-screen bg-gray-50">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-[60] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-medium">Pembayaran berhasil diproses!</span>
                </div>
            )}

            {/* Payment Modal dengan Cicilan */}
            {showPaymentModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Proses Pembayaran</h3>
                                <p className="text-gray-500 text-sm mt-1">{selectedInvoice.santriName}</p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
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

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'tunai', label: 'Tunai', icon: Wallet },
                                        { id: 'transfer', label: 'Transfer', icon: Building2 },
                                        { id: 'qris', label: 'QRIS', icon: Smartphone },
                                    ].map(method => (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id)}
                                            className={`p-3 border rounded-xl flex flex-col items-center gap-1 transition-colors ${paymentMethod === method.id
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <method.icon className="w-5 h-5" />
                                            <span className="text-xs font-medium">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan (Opsional)</label>
                                <input
                                    type="text"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder="Catatan pembayaran..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
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
                        <div className="p-6 border-t border-gray-100 flex gap-3 flex-shrink-0">
                            <button
                                onClick={() => { setShowPaymentModal(false); setPaymentAmount(0); setPaidSoFar(0); }}
                                className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleProcessPayment}
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
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <CreditCard className="w-7 h-7 text-emerald-600" />
                            Input Pembayaran
                        </h1>
                        <p className="text-gray-500">
                            Proses pembayaran manual dari wali santri
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Invoices List */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                                {/* Header & Filters */}
                                <div className="p-4 border-b border-gray-100">
                                    <div className="flex flex-col md:flex-row gap-3">
                                        <div className="relative flex-1">
                                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Cari nama santri..."
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                            />
                                        </div>
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value as any)}
                                            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                                        >
                                            <option value="all">Semua</option>
                                            <option value="belum">Belum Bayar</option>
                                            <option value="cicilan">Cicilan</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Scrollable List */}
                                <div className="max-h-[60vh] overflow-y-auto">
                                    {filteredInvoices.length > 0 ? (
                                        <div className="divide-y divide-gray-100">
                                            {filteredInvoices.map(inv => (
                                                <div key={inv.id} className="p-4 hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <UserIcon className="w-5 h-5 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{inv.santriName}</p>
                                                            <p className="text-xs text-gray-500">{inv.type} • {inv.class}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                                        <div className="text-right">
                                                            <p className="font-semibold text-gray-800">{formatCurrency(inv.amount)}</p>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === 'cicilan'
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {inv.status === 'cicilan' ? 'Cicilan' : 'Belum Bayar'}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => openPaymentModal(inv)}
                                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg whitespace-nowrap"
                                                        >
                                                            Bayar
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center text-gray-400">
                                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>Tidak ada tagihan tertunggak</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Payments */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-gray-400" />
                                    Transaksi Terakhir
                                </h3>
                                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                                    {recentPayments.length > 0 ? (
                                        recentPayments.map((payment, idx) => (
                                            <div key={idx} className="p-3 bg-gray-50 rounded-xl">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-gray-800 text-sm">{payment.santriName}</p>
                                                        <p className="text-xs text-gray-500">{payment.timestamp}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-emerald-600 text-sm">{formatCurrency(payment.amount)}</p>
                                                        <p className="text-xs text-gray-400 capitalize">{payment.method}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 italic text-center py-4">Belum ada transaksi</p>
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
