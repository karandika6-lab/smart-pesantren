'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Download,
    Filter,
    Plus,
    Minus,
    History,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    AlertCircle
} from 'lucide-react';
import { pocketMoneyService } from '@/lib/services/finance/pocketMoney';
import { studentsService, StudentWithRelations } from '@/lib/services/students';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
import * as XLSX from 'xlsx';

// Define types locally if needed or rely on inferred
interface AccountWithStudent {
    id: string; // account id
    student: {
        id: string;
        name: string;
        nis: string;
        class: { name: string } | null;
    };
    balance: number;
    status: string;
    updated_at: string;
}

export default function TabunganPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [accounts, setAccounts] = useState<AccountWithStudent[]>([]);

    // Using explicit any to bypass checking initial mock structure mismatch vs real structure
    // In real app, proper interfaces in single location is best.
    const [selectedAccount, setSelectedAccount] = useState<AccountWithStudent | null>(null);
    const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal' | null>(null);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        totalBalance: 0,
        depositToday: 0,
        withdrawalToday: 0
    });

    const loadData = async () => {
        try {
            const [accs, statistics] = await Promise.all([
                pocketMoneyService.getAllAccounts(),
                pocketMoneyService.getStats()
            ]);

            // Map data to match UI expectations if necessary, or just use as is
            // Service returns array of accounts with joined student data
            setAccounts(accs as any);
            setStats(statistics);
        } catch (error) {
            console.error('Failed to load pocket money data', error);
        }
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            loadData();
        }
        setIsLoading(false);
    }, []);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleTransaction = async () => {
        if (!amount || !selectedAccount) return;

        setIsSubmitting(true);
        try {
            const numAmount = parseInt(amount.replace(/\D/g, ''));

            await pocketMoneyService.createTransaction({
                studentId: selectedAccount.student.id,
                type: transactionType!,
                amount: numAmount,
                description
            });

            // Refresh data
            await loadData();

            setIsSubmitting(false);
            setTransactionType(null);
            setAmount('');
            setDescription('');
            setSelectedAccount(null);
        } catch (error) {
            console.error('Transaction failed', error);
            alert('Gagal memproses transaksi');
            setIsSubmitting(false);
        }
    };

    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(num);
    };

    const handleExport = async () => {
        try {
            // Prepare data
            const dataToExport = filteredAccounts.map(acc => ({
                'Nama Santri': acc.student.name,
                'NIS': acc.student.nis,
                'Kelas': acc.student.class?.name || '-',
                'Saldo': acc.balance,
                'Status': acc.status === 'active' ? 'Aktif' : 'Nonaktif',
                'Terakhir Update': new Date(acc.updated_at).toLocaleDateString('id-ID')
            }));

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(dataToExport);

            // Adjust column widths
            const wscols = [
                { wch: 30 }, // Name
                { wch: 15 }, // NIS
                { wch: 15 }, // Class
                { wch: 15 }, // Balance
                { wch: 10 }, // Status
                { wch: 20 }  // Date
            ];
            ws['!cols'] = wscols;

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Tabungan Santri");

            const fileName = `Tabungan_Santri_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Check platform
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

                // Dynamic imports for Capacitor modules
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
                        title: 'Export Tabungan',
                        text: 'Berikut data tabungan santri.',
                        url: result.uri,
                        dialogTitle: 'Simpan ke...'
                    });
                } catch (e) {
                    console.error('File write error', e);
                    // Fallback to cache directory
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
                XLSX.writeFile(wb, fileName);
            }

        } catch (error) {
            console.error('Export failed', error);
            alert('Gagal melakukan export data');
        }
    };

    const filteredAccounts = accounts.filter(acc =>
        acc.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.student.nis.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) return null;

    return (
        <div className="min-h-screen">
            {user && (
                <Sidebar
                    user={user}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    onLogout={handleLogout}
                />
            )}

            <div className="lg:pl-64">
                {user && <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />}

                <main className="p-4 lg:p-8 space-y-6">
                    {/* Header Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-100 dark:border-white/10 p-6 rounded-2xl relative overflow-hidden group shadow-sm transition-all hover:border-emerald-500/30">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Wallet size={60} className="dark:text-white" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Dana Terhimpun</p>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatRupiah(stats.totalBalance)}</h3>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-100 dark:border-white/10 p-6 rounded-2xl relative overflow-hidden group shadow-sm transition-all hover:border-emerald-500/30">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <ArrowUpRight size={60} className="text-emerald-500" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Deposit Hari Ini</p>
                                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(stats.depositToday)}</h3>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-100 dark:border-white/10 p-6 rounded-2xl relative overflow-hidden group shadow-sm transition-all hover:border-rose-500/30">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <ArrowDownLeft size={60} className="text-rose-500" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Penarikan Hari Ini</p>
                                <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatRupiah(stats.withdrawalToday)}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
                        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Daftar Tabungan Santri</h2>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Cari santri..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-emerald-500/20 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
                                    />
                                </div>
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                >
                                    <Download size={16} />
                                    <span>Export</span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Santri</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Kelas</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Saldo</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                                    {filteredAccounts.map((acc) => (
                                        <tr key={acc.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {acc.student.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800 dark:text-gray-200">{acc.student.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{acc.student.nis}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                {acc.student.class?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`font-medium ${acc.balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                    {formatRupiah(acc.balance)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${acc.status === 'active'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                    }`}>
                                                    {acc.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAccount(acc);
                                                            setTransactionType('deposit');
                                                        }}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-500/20"
                                                        title="Deposit"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAccount(acc);
                                                            setTransactionType('withdrawal');
                                                        }}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-200 dark:border-rose-500/20"
                                                        title="Tarik Tunai"
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <button
                                                        className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 rounded-lg transition-colors"
                                                        title="Riwayat"
                                                    >
                                                        <History size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredAccounts.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                                Tidak ada data santri ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Transaction Modal */}
                    {transactionType && selectedAccount && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-white/10 p-6 animate-in zoom-in-95 duration-200">
                                <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">
                                    {transactionType === 'deposit' ? 'Deposit Saldo' : 'Tarik Tunai'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    {selectedAccount.student.name} - {selectedAccount.student.class?.name || 'Kelas Tidak Diketahui'}
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Nominal (Rp)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">Rp</span>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold dark:text-white"
                                                placeholder="0"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Keterangan</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                                            placeholder={transactionType === 'deposit' ? "Contoh: Titipan Ayah Bulan Ini" : "Contoh: Jajan Sore"}
                                            rows={2}
                                        />
                                    </div>

                                    {transactionType === 'withdrawal' && (
                                        <div className="flex items-start gap-2 p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm">
                                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                            <p>Saldo saat ini: <strong>{formatRupiah(selectedAccount.balance)}</strong>. <br />Penarikan melebihi saldo akan dicatat sebagai kasbon (minus).</p>
                                        </div>
                                    )}

                                    <div className="flex gap-3 mt-6">
                                        <button
                                            onClick={() => setTransactionType(null)}
                                            className="flex-1 px-4 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={handleTransaction}
                                            disabled={!amount || isSubmitting}
                                            className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl
                                                ${transactionType === 'deposit'
                                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25'
                                                    : 'bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 shadow-rose-500/25'
                                                }
                                            `}
                                        >
                                            {isSubmitting ? 'Memproses...' : (transactionType === 'deposit' ? 'Simpan Deposit' : 'Tarik Saldo')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
