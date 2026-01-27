'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getCurrentUser,
    clearSession,
    User
} from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    FileSpreadsheet,
    Loader2,
    AlertCircle,
    PieChart,
    ArrowLeft,
    FileText,
    Calendar
} from 'lucide-react';

import { financeService } from '@/lib/services/finance';
import * as XLSX from 'xlsx';

interface IncomeItem {
    type: string;
    amount: number;
}

interface ExpenseItem {
    category: string;
    amount: number;
}

interface ReportData {
    summary: {
        totalInvoiced: number;
        totalPaid: number;
        totalUnpaid: number;
        totalExpense: number;
        netIncome: number;
        collectionRate: number;
    };
    invoiceCount: {
        total: number;
        paid: number;
        partial: number;
        pending: number;
    };
    incomeByType: IncomeItem[];
    expenseByCategory: ExpenseItem[];
}


export default function LaporanPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Set default dates to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);
    const [isLoading, setIsLoading] = useState(true);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    const fetchReport = useCallback(async () => {
        try {
            setIsLoading(true);
            // Sync before report to ensure accuracy
            await financeService.syncInvoiceStatuses();
            const data = await financeService.getReport({ startDate, endDate });
            setReportData(data);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_keuangan' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchReport();
    }, [router, fetchReport]);

    const handleExport = async () => {
        try {
            const data = await financeService.getExportData(startDate, endDate);

            // 1. Summary Sheet
            const summaryData = [
                ['Laporan Keuangan Smart Pesantren'],
                [`Periode: ${startDate} s/d ${endDate}`],
                [''],
                ['Ringkasan Pemasukan & Pengeluaran'],
                ['Total Tagihan', formatCurrency(summary.totalInvoiced)],
                ['Total Pemasukan (Terbayar)', formatCurrency(summary.totalPaid)],
                ['Total Pengeluaran', formatCurrency(summary.totalExpense)],
                ['Laba Bersih / Surplus', formatCurrency(summary.netIncome)],
                ['Total Tunggakan', formatCurrency(summary.totalUnpaid)]
            ];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const wsSummary = XLSX.utils.aoa_to_sheet(summaryData as any);

            // 2. Invoices Sheet (Detailed)
            const invoiceRows = data.invoices.map((inv: any) => {
                const totalPaid = (inv.payments || []).reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);
                const remaining = Number(inv.amount) - totalPaid;
                return {
                    'Invoice ID': inv.id,
                    'Tanggal': new Date(inv.created_at).toLocaleDateString('id-ID'),
                    'Nama Santri': inv.students?.name || 'Unknown',
                    'Kelas': inv.students?.classes?.name || '-',
                    'Jenis Tagihan': inv.invoice_type,
                    'Nominal Tagihan': Number(inv.amount),
                    'Sudah Bayar': totalPaid,
                    'Sisa Tagihan': remaining,
                    'Status': inv.status === 'paid' ? 'Lunas' : (inv.status === 'partial' ? 'Cicilan' : 'Belum Lunas'),
                    'Jatuh Tempo': new Date(inv.due_date).toLocaleDateString('id-ID')
                };
            });
            const wsInvoices = XLSX.utils.json_to_sheet(invoiceRows);

            // 3. Expenses Sheet
            const expenseRows = data.expenses.map((exp: {
                expense_date: string;
                category: string;
                description: string;
                amount: number;
                pic?: string;
            }) => ({
                'Tanggal': new Date(exp.expense_date).toLocaleDateString('id-ID'),
                'Kategori': exp.category,
                'Deskripsi': exp.description,
                'Nominal': Number(exp.amount),
                'PIC': exp.pic || '-'
            }));
            const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);

            // Create Workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");
            XLSX.utils.book_append_sheet(wb, wsInvoices, "Data Tagihan");
            XLSX.utils.book_append_sheet(wb, wsExpenses, "Data Pengeluaran");

            const fileName = `Laporan_Keuangan_${startDate}_${endDate}.xlsx`;

            // Check if running on Android/Native
            if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

                // Dynamic import for Capacitor modules
                const { Filesystem, Directory } = await import('@capacitor/filesystem');
                const { Share } = await import('@capacitor/share');

                try {
                    const result = await Filesystem.writeFile({
                        path: fileName,
                        data: wbout,
                        directory: Directory.Documents,
                        recursive: true
                    });

                    await Share.share({
                        title: 'Export Laporan',
                        text: 'Berikut laporan keuangan pesantren.',
                        url: result.uri,
                        dialogTitle: 'Simpan Laporan Ke...'
                    });
                } catch (e) {
                    // Fallback to cache
                    console.error('Documents write failed, trying cache', e);
                    const cacheResult = await Filesystem.writeFile({
                        path: fileName,
                        data: wbout,
                        directory: Directory.Cache
                    });
                    await Share.share({
                        url: cacheResult.uri
                    });
                }
            } else {
                // Browser default
                XLSX.writeFile(wb, fileName);
            }

        } catch (error) {
            console.error('Export failed:', error);
            alert('Gagal mengexport data: ' + (error instanceof Error ? error.message : String(error)));
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const formatCurrency = (amount: number | undefined | null) => {
        if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (!user || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase tracking-widest font-black text-emerald-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                    <span>Menyiapkan Laporan Keuangan...</span>
                </div>
            </div>
        );
    }

    const summary = reportData?.summary || {
        totalInvoiced: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        totalExpense: 0,
        netIncome: 0,
        collectionRate: 0
    };

    const invoiceCount = reportData?.invoiceCount || {
        total: 0,
        paid: 0,
        partial: 0,
        pending: 0
    };

    const incomeByType = reportData?.incomeByType || [];
    const expenseByCategory = reportData?.expenseByCategory || [];

    return (
        <div className="min-h-screen bg-gray-50">
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
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    <FileText className="w-6 lg:w-7 h-6 lg:h-7 text-emerald-600" />
                                    Laporan Keuangan
                                </h1>
                                <p className="text-gray-500 text-sm lg:text-base">
                                    Ringkasan dan export laporan keuangan
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    <span className="hidden sm:inline">Export</span> CSV
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Date Filter */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-5 h-5" />
                                <span className="font-medium text-sm">Periode:</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm"
                                />
                                <span className="text-gray-400 text-sm">s/d</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm"
                                />
                                <button
                                    onClick={fetchReport}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-xl transition-all active:scale-95"
                                >
                                    Filter
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6">
                        {/* Total Terbayar */}
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-white">
                            <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-4">
                                <div className="w-8 lg:w-12 h-8 lg:h-12 bg-white/20 rounded-lg lg:rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-4 lg:w-6 h-4 lg:h-6" />
                                </div>
                                <div>
                                    <p className="text-emerald-100 text-xs lg:text-sm">Total Terbayar</p>
                                    <p className="text-lg lg:text-2xl font-bold">{formatCurrency(summary.totalPaid)}</p>
                                </div>
                            </div>
                            <div className="text-xs lg:text-sm text-emerald-100">
                                {invoiceCount.paid} tagihan lunas
                            </div>
                        </div>

                        {/* Total Pengeluaran */}
                        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-white">
                            <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-4">
                                <div className="w-8 lg:w-12 h-8 lg:h-12 bg-white/20 rounded-lg lg:rounded-xl flex items-center justify-center">
                                    <TrendingDown className="w-4 lg:w-6 h-4 lg:h-6" />
                                </div>
                                <div>
                                    <p className="text-red-100 text-xs lg:text-sm">Total Pengeluaran</p>
                                    <p className="text-lg lg:text-2xl font-bold">{formatCurrency(summary.totalExpense)}</p>
                                </div>
                            </div>
                            <div className="text-xs lg:text-sm text-red-100">
                                {expenseByCategory.length} kategori
                            </div>
                        </div>

                        {/* Laba Bersih */}
                        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-white">
                            <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-4">
                                <div className="w-8 lg:w-12 h-8 lg:h-12 bg-white/20 rounded-lg lg:rounded-xl flex items-center justify-center">
                                    <Wallet className="w-4 lg:w-6 h-4 lg:h-6" />
                                </div>
                                <div>
                                    <p className="text-violet-100 text-xs lg:text-sm">Laba Bersih</p>
                                    <p className="text-lg lg:text-2xl font-bold">{formatCurrency(summary.netIncome)}</p>
                                </div>
                            </div>
                            <div className="text-xs lg:text-sm text-violet-100">
                                Margin {summary.collectionRate}%
                            </div>
                        </div>

                        {/* Tunggakan */}
                        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-white">
                            <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-4">
                                <div className="w-8 lg:w-12 h-8 lg:h-12 bg-white/20 rounded-lg lg:rounded-xl flex items-center justify-center">
                                    <AlertCircle className="w-4 lg:w-6 h-4 lg:h-6" />
                                </div>
                                <div>
                                    <p className="text-amber-100 text-xs lg:text-sm">Tunggakan</p>
                                    <p className="text-lg lg:text-2xl font-bold">{formatCurrency(summary.totalUnpaid)}</p>
                                </div>
                            </div>
                            <div className="text-xs lg:text-sm text-amber-100">
                                {invoiceCount.pending + invoiceCount.partial} tagihan
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Income Breakdown */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-6">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                Pemasukan per Jenis
                            </h3>
                            {incomeByType.length > 0 ? (
                                <div className="space-y-3">
                                    {incomeByType.map((item: IncomeItem, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <span className="text-gray-700 text-sm font-medium">{item.type || 'Lainnya'}</span>
                                            <span className="text-emerald-600 font-semibold">{formatCurrency(item.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 italic text-center py-8">Tidak ada data pemasukan</p>
                            )}
                        </div>

                        {/* Expense Breakdown */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-6">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                                Pengeluaran per Kategori
                            </h3>
                            {expenseByCategory.length > 0 ? (
                                <div className="space-y-3">
                                    {expenseByCategory.map((item: ExpenseItem, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <span className="text-gray-700 text-sm font-medium capitalize">{item.category || 'Lainnya'}</span>
                                            <span className="text-red-600 font-semibold">{formatCurrency(item.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 italic text-center py-8">Tidak ada data pengeluaran</p>
                            )}
                        </div>
                    </div>

                    {/* Invoice Statistics */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-6">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-blue-600" />
                            Statistik Tagihan
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-xl">
                                <p className="text-2xl lg:text-3xl font-bold text-blue-600">{invoiceCount.total}</p>
                                <p className="text-sm text-gray-500">Total Tagihan</p>
                            </div>
                            <div className="text-center p-4 bg-emerald-50 rounded-xl">
                                <p className="text-2xl lg:text-3xl font-bold text-emerald-600">{invoiceCount.paid}</p>
                                <p className="text-sm text-gray-500">Lunas</p>
                            </div>
                            <div className="text-center p-4 bg-amber-50 rounded-xl">
                                <p className="text-2xl lg:text-3xl font-bold text-amber-600">{invoiceCount.partial}</p>
                                <p className="text-sm text-gray-500">Cicilan</p>
                            </div>
                            <div className="text-center p-4 bg-red-600 rounded-xl shadow-lg shadow-red-500/20">
                                <p className="text-2xl lg:text-3xl font-bold text-white">{invoiceCount.pending}</p>
                                <p className="text-sm text-red-100">Belum Bayar</p>
                            </div>
                        </div>

                        {/* Collection Rate Progress */}
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">Tingkat Koleksi Pembayaran</span>
                                <span className="text-sm font-semibold text-emerald-600">{summary.collectionRate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(summary.collectionRate, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
