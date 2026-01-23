'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getCurrentUser,
    clearSession,
    User
} from '@/lib/auth';
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
    category: 'Operasional' | 'Gaji' | 'Pembangunan' | 'Pendidikan' | 'Lainnya';
    description: string;
    amount: number;
    pic: string;
}

import { financeService } from '@/lib/services/finance';

// ============================================
// Types & Data
// ============================================

interface Expense {
    id: string;
    date: string;
    category: 'Operasional' | 'Gaji' | 'Pembangunan' | 'Pendidikan' | 'Lainnya';
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
                pic: formData.pic
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

    const categoryColors: Record<string, string> = {
        'operasional': 'bg-blue-100 text-blue-700',
        'gaji': 'bg-purple-100 text-purple-700',
        'pemeliharaan': 'bg-amber-100 text-amber-700',
        'pengadaan': 'bg-rose-100 text-rose-700',
        'kegiatan': 'bg-emerald-100 text-emerald-700',
        'lainnya': 'bg-gray-100 text-gray-700',
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-[60] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-medium">Pengeluaran berhasil dicatat!</span>
                </div>
            )}

            {/* Create Expense Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                            <h3 className="text-xl font-bold text-gray-800">Catat Pengeluaran</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{CATEGORIES_MAPPING[c]}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    placeholder="Jelaskan pengeluaran..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominal</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
                                    placeholder="0"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Penanggung Jawab (PIC)</label>
                                <input
                                    type="text"
                                    value={formData.pic}
                                    onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                                    placeholder="Nama penanggung jawab"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-3 flex-shrink-0">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={isCreating || !formData.description || !formData.amount}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    'Simpan'
                                )}
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
                                    <TrendingDown className="w-7 h-7 text-red-600" />
                                    Pengeluaran
                                </h1>
                                <p className="text-gray-500">
                                    Catat dan kelola semua pengeluaran pesantren
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-500/30"
                            >
                                <Plus className="w-5 h-5" />
                                Catat Pengeluaran
                            </button>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 text-white mb-6">
                        <p className="text-red-100 text-sm mb-1">Total Pengeluaran (Tefilter)</p>
                        <p className="text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
                        <div className="flex items-center gap-2 mt-2 text-red-100">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
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
                                    placeholder="Cari deskripsi atau PIC..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                            </div>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                            >
                                <option value="all">Semua Kategori</option>
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c}>{CATEGORIES_MAPPING[c]}</option>
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
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Tanggal</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Kategori</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Deskripsi</th>
                                        <th className="text-right p-4 text-sm font-semibold text-gray-600">Nominal</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">PIC</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredExpenses.map(exp => (
                                        <tr key={exp.id} className="hover:bg-gray-50">
                                            <td className="p-4 text-gray-600 text-sm">{exp.date}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[exp.category]}`}>
                                                    {CATEGORIES_MAPPING[exp.category] || exp.category}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-800">{exp.description}</td>
                                            <td className="p-4 text-right font-semibold text-red-600">{formatCurrency(exp.amount)}</td>
                                            <td className="p-4 text-gray-600 text-sm">{exp.pic}</td>
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
