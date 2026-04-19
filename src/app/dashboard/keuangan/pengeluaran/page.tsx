'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
import { financeService } from '@/lib/services/finance';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    ArrowLeft,
    TrendingDown,
    Plus,
    Search,
    CheckCircle2,
    Loader2,
    X,
    Download,
    Calendar
} from 'lucide-react';

// ============================================
// Types & Data
// ============================================

interface Expense {
    id: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    pic: string;
}

const CATEGORIES_MAPPING: Record<string, string> = {
    'gaji': 'Gaji',
    'operasional': 'Operasional',
    'pemeliharaan': 'Pemeliharaan',
    'pengadaan': 'Pengadaan',
    'kegiatan': 'Kegiatan',
    'lainnya': 'Lainnya'
};

const CATEGORIES = Object.keys(CATEGORIES_MAPPING);

export default function PengeluaranPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [expenses, setExpenses] = useState<Expense[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        category: 'operasional',
        description: '',
        amount: 0,
        pic: '',
    });

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
            const data = await financeService.getAllExpenses();
            setExpenses(data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleCreate = async () => {
        try {
            setIsCreating(true);
            await financeService.createExpense({
                category: formData.category,
                description: formData.description,
                amount: formData.amount,
                expense_date: formData.date,
                pic: formData.pic // Pic will be handled by service (mapped to notes)
            });

            setIsCreating(false);
            setShowModal(false);
            setFormData({ date: new Date().toISOString().split('T')[0], category: 'operasional', description: '', amount: 0, pic: '' });
            setShowSuccess(true);
            fetchData();
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Error creating expense:', error);
            setIsCreating(false);
            alert('Gagal mencatat pengeluaran');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase tracking-widest font-black text-emerald-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                    <span>Loading Data Pengeluaran...</span>
                </div>
            </div>
        );
    }

    const filteredExpenses = expenses.filter(exp => {
        const matchSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exp.pic.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCategory = filterCategory === 'all' || exp.category === filterCategory;
        return matchSearch && matchCategory;
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);



    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-[60] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-medium">Pengeluaran berhasil dicatat!</span>
                </div>
            )}

            {/* Create Expense Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 transition-all duration-500">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-[3rem] w-full max-w-lg shadow-[0_30px_100px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col transition-all scale-100 animate-slide-up max-h-[90vh]">
                        <div className="p-6 lg:p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.01]">
                            <div>
                                <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tight">Catat Pengeluaran</h3>
                                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">Dokumentasikan pengeluaran unit hari ini</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-all active:scale-90">
                                <X className="w-5 h-5 lg:w-6 lg:h-6 text-neutral-500" />
                            </button>
                        </div>
                        <div className="p-6 lg:p-8 space-y-6 lg:space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                            <div>
                                <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-3 px-1">Tanggal Transaksi</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-3 px-1">Kategori Pengeluaran</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-bold appearance-none cursor-pointer"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c} className="bg-neutral-900 border-none">{CATEGORIES_MAPPING[c]}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-3 px-1">Deskripsi / Keterangan</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    placeholder="Jelaskan detail pengeluaran..."
                                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all min-h-[100px] font-medium placeholder:text-neutral-700"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-3 px-1">Nominal (Rp)</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                                        placeholder="0"
                                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-black text-xl tracking-tighter"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-3 px-1">PIC Terkait</label>
                                    <input
                                        type="text"
                                        value={formData.pic}
                                        onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                                        placeholder="Nama petugas..."
                                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-bold placeholder:text-neutral-700"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 lg:p-8 border-t border-white/5 flex gap-4 flex-shrink-0 bg-white/[0.01]">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-4 border border-white/10 text-neutral-500 font-bold text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white/5 transition-all active:scale-95"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={isCreating || !formData.description || !formData.amount}
                                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_20px_50px_-10px_rgba(16,185,129,0.3)] active:scale-95 transition-all"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Simpan Data'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <Sidebar
                user={user as User}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64">
                <DashboardHeader user={user as User} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-6 lg:space-y-10">
                    {/* Breadcrumb & Title */}
                    <div className="mb-2 lg:mb-4">
                        <Link
                            href="/dashboard/keuangan"
                            className="inline-flex items-center gap-2 text-xs lg:text-sm text-neutral-500 hover:text-white transition-all uppercase font-black tracking-widest"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Portal
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8">
                        <div className="flex items-center gap-4 lg:gap-6">
                            <div className="w-12 h-12 lg:w-20 lg:h-20 bg-rose-500/10 rounded-xl lg:rounded-3xl flex items-center justify-center border border-rose-500/20 shadow-inner backdrop-blur-md">
                                <TrendingDown className="w-6 h-6 lg:w-10 lg:h-10 text-rose-500" />
                            </div>
                            <div>
                                <h1 className="text-lg lg:text-3xl font-black text-white uppercase tracking-tight leading-none drop-shadow-xl">
                                    Pengeluaran <span className="text-rose-400">Kas</span>
                                </h1>
                                <p className="text-neutral-500 text-[8px] lg:text-[10px] font-bold uppercase tracking-[0.2em] mt-1 lg:mt-2 shadow-black/10">
                                    Dokumentasi Kas Keluar
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 lg:px-8 lg:py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] lg:text-xs uppercase tracking-widest rounded-xl lg:rounded-2xl transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
                        >
                            <Plus className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                            Catat Baru
                        </button>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-gradient-to-br from-red-600 to-rose-900 rounded-xl lg:rounded-2xl p-4 lg:p-8 text-white mb-6 lg:mb-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-[60px] -mr-16 -mt-16 transition-colors group-hover:bg-white/10" />
                        <div className="relative z-10">
                            <p className="text-[8px] lg:text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-2 px-1">Total Pengeluaran (Tefilter)</p>
                            <div className="flex flex-wrap items-center gap-3 lg:gap-6 px-1">
                                <p className="text-2xl lg:text-4xl font-black tracking-tighter">{formatCurrency(totalExpenses)}</p>
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 lg:px-4 lg:py-2 rounded-xl border border-white/10 backdrop-blur-md">
                                    <Calendar className="w-3 h-3 lg:w-4 lg:h-4 text-rose-200 opacity-60" />
                                    <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl lg:rounded-[2rem] p-4 lg:p-8 mb-6 lg:mb-10 shadow-2xl">
                        <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
                            <div className="relative flex-1">
                                <Search className="w-5 h-5 text-neutral-600 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari deskripsi atau PIC..."
                                    className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                                />
                            </div>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="px-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer"
                            >
                                <option value="all" className="bg-neutral-900">Semua Kategori</option>
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c} className="bg-neutral-900">{CATEGORIES_MAPPING[c]}</option>
                                ))}
                            </select>
                            <button
                                onClick={async () => {
                                    try {
                                        const dataToExport = filteredExpenses.map(exp => ({
                                            Tanggal: new Date(exp.date).toLocaleDateString('id-ID'),
                                            Kategori: CATEGORIES_MAPPING[exp.category] || exp.category,
                                            Deskripsi: exp.description,
                                            Nominal: exp.amount,
                                            PIC: exp.pic
                                        }));

                                        const wb = XLSX.utils.book_new();
                                        const ws = XLSX.utils.json_to_sheet(dataToExport);

                                        // Add formatting 
                                        const wscols = [
                                            { wch: 15 }, // Tanggal
                                            { wch: 15 }, // Kategori
                                            { wch: 40 }, // Deskripsi
                                            { wch: 15 }, // Nominal
                                            { wch: 20 }, // PIC
                                        ];
                                        ws['!cols'] = wscols;

                                        XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran");
                                        const fileName = `Laporan_Pengeluaran_${new Date().toISOString().split('T')[0]}.xlsx`;

                                        // Check if running on Android/Native
                                        if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
                                            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

                                            // Dynamic import for Capacitor modules to avoid SSR issues
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
                                                    text: 'Berikut laporan pengeluaran pesantren.',
                                                    url: result.uri,
                                                    dialogTitle: 'Simpan Laporan Ke...'
                                                });
                                            } catch (e) {
                                                // Fallback if direct write fails (e.g. permission), try cache
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
                                            // Web / Browser default
                                            XLSX.writeFile(wb, fileName);
                                        }
                                    } catch (error) {
                                        console.error('Error exporting data:', error);
                                        alert('Gagal mengekspor data: ' + (error instanceof Error ? error.message : String(error)));
                                    }
                                }}
                                className="flex items-center gap-3 px-8 py-4 border border-white/10 rounded-2xl text-neutral-400 font-bold text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
                            >
                                <Download className="w-5 h-5" />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl lg:rounded-[2.5rem] shadow-2xl overflow-hidden mb-12">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="text-left p-4 lg:p-8 text-[9px] lg:text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Tanggal</th>
                                        <th className="text-left p-4 lg:p-8 text-[9px] lg:text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Kategori</th>
                                        <th className="text-left p-4 lg:p-8 text-[9px] lg:text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Deskripsi</th>
                                        <th className="text-right p-4 lg:p-8 text-[9px] lg:text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Nominal</th>
                                        <th className="text-left p-4 lg:p-8 text-[9px] lg:text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">PIC</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                    {filteredExpenses.map(exp => (
                                        <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-4 lg:p-8 text-neutral-400 text-[10px] lg:text-[11px] font-bold uppercase tracking-widest">{exp.date}</td>
                                            <td className="p-4 lg:p-8">
                                                <span className={`px-3 py-1 lg:px-4 lg:py-1.5 rounded-lg lg:rounded-xl text-[8px] lg:text-[9px] font-black uppercase tracking-widest border ${exp.category === 'operasional' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    exp.category === 'gaji' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                                        exp.category === 'pemeliharaan' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                            exp.category === 'pengadaan' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                                exp.category === 'kegiatan' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                                    'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'}`}>
                                                    {CATEGORIES_MAPPING[exp.category] || exp.category}
                                                </span>
                                            </td>
                                            <td className="p-4 lg:p-8 text-white font-black tracking-tight leading-tight uppercase text-xs lg:text-sm whitespace-nowrap lg:whitespace-normal max-w-[150px] lg:max-w-none truncate lg:overflow-visible">
                                                {exp.description}
                                            </td>
                                            <td className="p-4 lg:p-8 text-right font-black text-rose-500 text-sm lg:text-xl tracking-tighter">{formatCurrency(exp.amount)}</td>
                                            <td className="p-4 lg:p-8 text-neutral-500 text-[10px] lg:text-[11px] font-bold uppercase tracking-widest">
                                                <div className="flex items-center gap-2 lg:gap-3">
                                                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                                    {exp.pic}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
