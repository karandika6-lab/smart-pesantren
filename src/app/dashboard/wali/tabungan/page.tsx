'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    Calendar,
    Download
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
import { pocketMoneyService } from '@/lib/services/finance/pocketMoney';
import { parentService } from '@/lib/services/parent';

export default function WaliTabunganPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [account, setAccount] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [childName, setChildName] = useState('');
    const [childNis, setChildNis] = useState('');

    useEffect(() => {
        const loadData = async () => {
            const currentUser = getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.replace('/login');
                return; // Stop execution
            }

            try {
                // 1. Get linked child (assume single child for now or pick first)
                const children = await parentService.getDashboardSummary();
                if (children.length > 0) {
                    const firstChild = children[0];
                    setChildName(firstChild.student_name);
                    setChildNis(firstChild.nis);

                    // 2. Get Account & Transactions using the Real Service
                    const acc = await pocketMoneyService.getAccountByStudentId(firstChild.student_id);
                    setAccount(acc);

                    const txs = await pocketMoneyService.getTransactions(firstChild.student_id);
                    setTransactions(txs);
                }
            } catch (error) {
                console.error("Failed to load pocket money data", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [router]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(num);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (isLoading) return null;

    // Calculate totals for summary cards from real data
    const totalDeposits = transactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalWithdrawals = transactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + Number(t.amount), 0);


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505]">
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
                    {/* Welcome Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Tabungan & Uang Saku</h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                Pantau saldo dan riwayat penggunaan uang saku ananda
                            </p>
                        </div>
                        {/* 
                           Top Up button is purely informational for now or could link to a payment Gateway later.
                           For "Titip Uang", usually parents transfer to school account and admin inputs it.
                        */}
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20">
                                <Wallet size={18} />
                                <span>Informasi Top Up</span>
                            </button>
                        </div>
                    </div>

                    {/* Balance Card - Hero */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-500/20">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-indigo-100 font-medium mb-1">Saldo Tersedia</p>
                                        <h2 className="text-4xl font-bold tracking-tight">
                                            {account ? formatRupiah(Number(account.balance)) : 'Rp 0'}
                                        </h2>
                                    </div>
                                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                                        <Wallet className="w-8 h-8 text-white" />
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center gap-2 text-indigo-100/80 text-sm">
                                    <span>Santri:</span>
                                    <span className="font-semibold text-white">{childName} ({childNis})</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                                        <ArrowUpRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Pemasukan</p>
                                        <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{formatRupiah(totalDeposits)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl">
                                        <ArrowDownLeft className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Pengeluaran</p>
                                        <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{formatRupiah(totalWithdrawals)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
                        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <History size={20} className="text-gray-500" />
                                Riwayat Transaksi
                            </h3>
                            <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1">
                                <Download size={14} />
                                Download Laporan
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Tanggal</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Keterangan</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Jenis</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                                    {transactions.length > 0 ? (
                                        transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {formatDate(tx.created_at)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200 font-medium whitespace-nowrap">
                                                    {tx.description || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.type === 'deposit'
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                            : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400'
                                                        }`}>
                                                        {tx.type === 'deposit' ? 'Pemasukan' : 'Pengeluaran'}
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-4 text-right font-bold text-sm whitespace-nowrap ${tx.type === 'deposit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                                    }`}>
                                                    {tx.type === 'deposit' ? '+' : '-'}{formatRupiah(Number(tx.amount))}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                                Belum ada riwayat transaksi
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
