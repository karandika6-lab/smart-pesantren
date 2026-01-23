'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
import {
    Wallet,
    Receipt,
    CreditCard,
    Calendar,
    ArrowRight,
    Download,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Loader2,
    Users,
    Activity,
    ChevronRight,
    LayoutGrid,
    History as HistoryIcon,
    ShieldCheck
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { guardianService } from '@/lib/services/guardian';
import { financeService } from '@/lib/services/finance';

export default function PembayaranPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [children, setChildren] = useState<any[]>([]);
    const [activeChild, setActiveChild] = useState<any>(null);
    const [pendingBills, setPendingBills] = useState<any[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_santri') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchInitialData(currentUser.id);
    }, [router]);

    const fetchInitialData = async (parentId: string) => {
        try {
            const childrenList = await guardianService.getChildren(parentId);
            setChildren(childrenList);
            if (childrenList.length > 0) {
                await fetchChildFinance(childrenList[0]);
            } else {
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Error fetching initial data:', err);
            setIsLoading(false);
        }
    };

    const fetchChildFinance = async (child: any) => {
        setIsLoading(true);
        setActiveChild(child);
        try {
            const [bills, payments] = await Promise.all([
                financeService.getUnpaidInvoicesByStudent(child.id),
                financeService.getPaymentsByStudent(child.id)
            ]);
            setPendingBills(bills);
            setPaymentHistory(payments);
        } catch (err) {
            console.error('Error fetching finance data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (isLoading && !activeChild) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin opacity-40" />
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Mengamankan Transaksi Keuangan...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-400 font-sans selection:bg-orange-500/30">
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 space-y-10 max-w-[1500px] mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-orange-500 text-xs font-bold tracking-[0.2em] mb-2 uppercase">
                                <Activity className="w-4 h-4" />
                                Financial Administration
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                Administrasi & <span className="text-orange-500">Iuran Pembayaran</span>
                            </h1>
                            <p className="text-neutral-500 text-sm mt-2 font-medium">Kelola tagihan pendidikan dan pantau riwayat iuran pesantren.</p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4">
                            {children.length > 1 && (
                                <div className="flex bg-[#0a0a0a] p-1.5 rounded-2xl border border-neutral-800 shadow-xl overflow-x-auto no-scrollbar">
                                    {children.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => fetchChildFinance(c)}
                                            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${activeChild?.id === c.id
                                                ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]'
                                                : 'text-neutral-600 hover:text-neutral-300'
                                                }`}
                                        >
                                            {c.name.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {!activeChild ? (
                        <div className="bg-[#0a0a0a] border border-neutral-800/50 rounded-[3rem] p-24 text-center shadow-2xl">
                            <Users className="w-20 h-20 text-neutral-800 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-white">Sistem Belum Sinkron</h3>
                            <p className="text-neutral-500 mt-2 font-medium">Data keuangan sedang divalidasi oleh departemen administrasi.</p>
                        </div>
                    ) : (
                        <>
                            {/* Outstanding Bill / Success Banner */}
                            {pendingBills.length > 0 ? (
                                <div className="bg-gradient-to-br from-orange-600 to-orange-950 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-orange-950/20 relative overflow-hidden group">
                                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 bg-white/10 w-fit px-5 py-2 rounded-2xl backdrop-blur-md border border-white/5">
                                                <Clock className="w-4 h-4 text-orange-200" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-100">Tagihan Belum Terbayar</span>
                                            </div>
                                            <div>
                                                <p className="text-orange-100/60 text-xs font-black uppercase tracking-widest mb-2">{pendingBills[0].description}</p>
                                                <h2 className="text-6xl font-black tracking-tighter mb-4">{formatCurrency(pendingBills[0].amount)}</h2>
                                                <div className="flex items-center gap-2 text-orange-200 text-xs font-bold bg-[#000]/20 w-fit px-4 py-2 rounded-xl border border-white/5">
                                                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                                                    Batas Pembayaran: <span className="text-white ml-1">{formatDate(pendingBills[0].dueDate)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="px-10 py-6 bg-white text-orange-950 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:scale-105 transition-all flex items-center justify-center gap-4 active:scale-95 group/btn">
                                            <CreditCard className="w-5 h-5" />
                                            Selesaikan Pembayaran
                                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                    <Receipt className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-emerald-600 to-emerald-950 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-emerald-950/20 relative overflow-hidden group">
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 bg-white/10 w-fit px-5 py-2 rounded-2xl backdrop-blur-md border border-white/5">
                                                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Status Administrasi Aman</span>
                                            </div>
                                            <h3 className="text-3xl font-black tracking-tight uppercase">Semua Tagihan Telah Tuntas</h3>
                                            <p className="text-emerald-100/70 font-medium text-lg max-w-xl">
                                                Jazaakumullahu Khairan Katsira atas kedisiplinan Bapak/Ibu dalam mendukung operasional pesantren.
                                            </p>
                                        </div>
                                        <div className="p-8 bg-white/10 rounded-[2rem] backdrop-blur-md border border-white/5 flex flex-col items-center gap-3 min-w-[160px]">
                                            <CheckCircle2 className="w-12 h-12 text-emerald-300" />
                                            <span className="font-black uppercase tracking-widest text-[10px]">Lunas Terverifikasi</span>
                                        </div>
                                    </div>
                                    <HistoryIcon className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
                                </div>
                            )}

                            {/* Payment History List */}
                            <div className="bg-[#0a0a0a] rounded-[2.5rem] border border-neutral-800/40 shadow-2xl overflow-hidden min-h-[400px]">
                                <div className="p-8 border-b border-neutral-800/50 bg-neutral-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-black text-white uppercase tracking-[0.2em] text-sm flex items-center gap-3">
                                            <Receipt className="w-5 h-5 text-orange-500" />
                                            Riwayat Transaksi Iuran
                                        </h3>
                                        <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-1 ml-8">Daftar seluruh pembayaran yang telah tervalidasi sistem.</p>
                                    </div>
                                    <div className="flex items-center gap-3 px-6 py-3 bg-[#050505] border border-neutral-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-500 shadow-inner">
                                        <Calendar className="w-4 h-4 text-neutral-700" />
                                        Update: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                    </div>
                                </div>

                                <div className="overflow-x-auto custom-scrollbar">
                                    {paymentHistory.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-32 opacity-30">
                                            <Receipt className="w-16 h-16 mb-6" />
                                            <p className="font-black uppercase tracking-[0.2em] text-[10px]">Belum Ada Data Transaksi</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left">
                                            <thead className="bg-[#0e0e0e] border-b border-neutral-800/50">
                                                <tr>
                                                    <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Deskripsi Pembayaran</th>
                                                    <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">Nominal</th>
                                                    <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">Status</th>
                                                    <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">Tanggal</th>
                                                    <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] w-16"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-800/20">
                                                {paymentHistory.map((item) => (
                                                    <tr key={item.id} className="hover:bg-neutral-900/30 transition-all group">
                                                        <td className="px-8 py-7">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center group-hover:border-orange-500/30 transition-all shadow-inner">
                                                                    <Wallet className="w-4 h-4 text-neutral-600 group-hover:text-orange-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-white text-sm uppercase tracking-tight">{item.description}</p>
                                                                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] mt-1.5">{item.method || 'Transfer Bank Manual'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-7 text-center font-black text-white text-sm tracking-tight">{formatCurrency(item.amount)}</td>
                                                        <td className="px-8 py-7 text-center">
                                                            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 rounded-xl text-[9px] font-black uppercase tracking-widest mx-auto w-fit shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                Sukses
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-7 text-center text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{formatDate(item.date)}</td>
                                                        <td className="px-8 py-7 text-right">
                                                            <button className="p-2.5 bg-neutral-900 text-neutral-600 rounded-xl hover:bg-neutral-800 hover:text-white transition-all border border-neutral-800 shadow-xl active:scale-90">
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #262626; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
