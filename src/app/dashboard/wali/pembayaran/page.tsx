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

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_santri') {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchInitialData(currentUser.id);
        });
        return () => cancelAnimationFrame(timer);
    }, [router]);

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
            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto">
                    {/* Header Section - Slimmer */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
                            <div>
                                <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight leading-none">Keuangan <span className="text-emerald-500">& Tagihan</span></h1>
                                <p className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">Kelola iuran dan pantau riwayat bayar</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {children.length > 1 && (
                                <div className="flex bg-[#0c0c0c] p-1.5 rounded-2xl border border-white/5 shadow-2xl overflow-x-auto no-scrollbar w-full sm:w-auto">
                                    {children.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => fetchChildFinance(c)}
                                            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${activeChild?.id === c.id
                                                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30'
                                                : 'text-neutral-600 hover:text-neutral-400'
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
                        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-3xl p-16 text-center shadow-lg">
                            <Users className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-white">Sistem Belum Sinkron</h3>
                        </div>
                    ) : (
                        <>
                            {/* Outstanding Bill / Success Banner - Slimmer */}
                            {pendingBills.length > 0 ? (
                                <div className="bg-gradient-to-br from-orange-600 to-orange-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-lg backdrop-blur-md border border-white/5">
                                                <Clock className="w-3.5 h-3.5 text-orange-200" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-orange-100">Tagihan Aktif</span>
                                            </div>
                                            <div>
                                                <p className="text-orange-100/60 text-[10px] font-black uppercase tracking-widest mb-1">{pendingBills[0].description}</p>
                                                <h2 className="text-4xl font-black tracking-tighter mb-3">{formatCurrency(pendingBills[0].amount)}</h2>
                                                <div className="flex items-center gap-2 text-orange-200 text-[10px] font-bold bg-[#000]/10 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                                                    Due: <span className="text-white ml-0.5">{formatDate(pendingBills[0].dueDate)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="px-8 py-4 bg-white text-orange-950 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-3 active:scale-95 group/btn">
                                            <CreditCard className="w-4 h-4" />
                                            Bayar Sekarang
                                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                    <Receipt className="absolute top-1/2 right-0 -translate-y-1/2 w-48 h-48 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-emerald-600 to-emerald-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden group">
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-lg backdrop-blur-md border border-white/5">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-100">Status Aman</span>
                                            </div>
                                            <h3 className="text-xl md:text-2xl font-black tracking-tight uppercase">Semua Tagihan Tuntas</h3>
                                            <p className="text-emerald-100/70 font-medium text-[11px] md:text-sm max-w-lg">
                                                Jazaakumullahu Khairan atas kedisiplinan Bapak/Ibu.
                                            </p>
                                        </div>
                                        <div className="px-3 py-1.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/5 flex items-center gap-2 w-fit">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                            <span className="font-black uppercase tracking-widest text-[8px]">Terverifikasi</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Transaction List */}
                            <div className="bg-[#0c0c0c] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden min-h-0 h-fit mb-10">
                                <div className="p-6 lg:p-8 border-b border-white/5 bg-black/40 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                        <HistoryIcon className="w-4 h-4 text-emerald-500" />
                                        Log Riwayat Transaksi
                                    </h3>
                                </div>

                                {/* Mobile Cards (lg:hidden) */}
                                <div className="lg:hidden p-4 space-y-4">
                                    {paymentHistory.length === 0 ? (
                                        <div className="py-20 text-center opacity-20">
                                            <Receipt className="w-10 h-10 mx-auto mb-2" />
                                            <p className="text-[8px] font-black uppercase tracking-widest">Belum Ada Transaksi</p>
                                        </div>
                                    ) : (
                                        paymentHistory.map((item) => (
                                            <div key={item.id} className="bg-black border border-white/5 rounded-[2rem] p-6 space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center font-black text-emerald-500 text-sm border border-white/5">
                                                            <Wallet className="w-5 h-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-black text-xs text-white uppercase tracking-tight leading-none truncate pr-2">{item.description}</h4>
                                                            <p className="text-[8px] font-black text-neutral-800 uppercase tracking-widest mt-1.5">{formatDate(item.date)}</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                const { default: jsPDF } = await import('jspdf');
                                                                const doc = new jsPDF();
                                                                doc.setFontSize(22);
                                                                doc.setTextColor(34, 197, 94);
                                                                doc.text("SMART PESANTREN", 105, 20, { align: "center" });
                                                                doc.setFontSize(10);
                                                                doc.setTextColor(100);
                                                                doc.text("Kwitansi Pembayaran Resmi", 105, 26, { align: "center" });
                                                                doc.text(`No. Ref: #${item.id.substring(0, 8).toUpperCase()}`, 20, 45);
                                                                doc.text(`Deskripsi: ${item.description}`, 20, 52);
                                                                doc.text(`Santri: ${activeChild?.name}`, 20, 59);
                                                                doc.text(`Nominal: ${formatCurrency(item.amount)}`, 20, 66);
                                                                doc.text(`Status: LUNAS`, 20, 73);
                                                                doc.save(`Kwitansi_${item.id.substring(0, 8)}.pdf`);
                                                            } catch (error) {
                                                                console.error("Download failed:", error);
                                                            }
                                                        }}
                                                        className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-neutral-600 border border-white/5 active:scale-90"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between bg-neutral-900/50 p-4 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-white">{formatCurrency(item.amount)}</span>
                                                        <span className="text-[8px] font-black text-neutral-700 uppercase tracking-widest">• {item.method || 'Transfer'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Berhasil
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Desktop View: Table (hidden lg:block) */}
                                <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-black border-b border-white/5">
                                                <th className="px-8 py-6 text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em]">Keterangan</th>
                                                <th className="px-8 py-6 text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] text-center w-40">Nominal</th>
                                                <th className="px-8 py-6 text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] text-center w-32">Status</th>
                                                <th className="px-8 py-6 text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] text-center w-32">Tanggal</th>
                                                <th className="px-8 py-6 text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] text-center w-32">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 bg-black/20 text-white">
                                            {paymentHistory.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-24 text-center text-[10px] font-black text-neutral-800 uppercase tracking-widest italic">Belum ada riwayat transaksi.</td>
                                                </tr>
                                            ) : (
                                                paymentHistory.map((item) => (
                                                    <tr key={item.id} className="hover:bg-emerald-600/[0.02] transition-all group">
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-emerald-600/5 border border-white/5 rounded-xl flex items-center justify-center">
                                                                    <Wallet className="w-4 h-4 text-emerald-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-sm uppercase tracking-tight leading-none group-hover:text-emerald-500 transition-colors">{item.description}</p>
                                                                    <p className="text-[9px] font-black text-neutral-800 uppercase tracking-widest mt-2">{item.method || 'TRANSFER BANK'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-center font-black text-sm text-white tracking-tight">{formatCurrency(item.amount)}</td>
                                                        <td className="px-8 py-5 text-center">
                                                            <span className="px-4 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 w-fit mx-auto">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Sukses
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5 text-center text-[10px] font-black text-neutral-500 uppercase italic">{formatDate(item.date)}</td>
                                                        <td className="px-8 py-5 text-center">
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        const { default: jsPDF } = await import('jspdf');
                                                                        const doc = new jsPDF();
                                                                        doc.setFontSize(22);
                                                                        doc.setTextColor(34, 197, 94);
                                                                        doc.text("SMART PESANTREN", 105, 20, { align: "center" });
                                                                        doc.setFontSize(10);
                                                                        doc.setTextColor(100);
                                                                        doc.text("Kwitansi Pembayaran Resmi", 105, 26, { align: "center" });
                                                                        doc.text(`No. Ref: #${item.id.substring(0, 8).toUpperCase()}`, 20, 45);
                                                                        doc.text(`Deskripsi: ${item.description}`, 20, 52);
                                                                        doc.text(`Santri: ${activeChild?.name}`, 20, 59);
                                                                        doc.text(`Nominal: ${formatCurrency(item.amount)}`, 20, 66);
                                                                        doc.text(`Status: LUNAS`, 20, 73);
                                                                        doc.save(`Kwitansi_${item.id.substring(0, 8)}.pdf`);
                                                                    } catch (error) {
                                                                        console.error("Download failed:", error);
                                                                    }
                                                                }}
                                                                className="p-3 bg-neutral-900 text-neutral-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all border border-white/5 active:scale-90"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 4px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
