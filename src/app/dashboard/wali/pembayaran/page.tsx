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
                        <div>
                            <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black tracking-[0.3em] mb-1 uppercase">
                                <Activity className="w-4 h-4" />
                                Financial Administration
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                                Administrasi & <span className="text-orange-500">Iuran</span>
                            </h1>
                            <p className="text-neutral-500 text-xs mt-1 font-medium">Kelola tagihan pendidikan dan pantau riwayat iuran.</p>
                        </div>

                        {children.length > 1 && (
                            <div className="flex bg-[#0a0a0a] p-1 rounded-xl border border-neutral-800 shadow-lg overflow-x-auto no-scrollbar">
                                {children.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => fetchChildFinance(c)}
                                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${activeChild?.id === c.id
                                            ? 'bg-orange-600 text-white shadow-lg'
                                            : 'text-neutral-600 hover:text-neutral-300'
                                            }`}
                                    >
                                        {c.name.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        )}
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

                            {/* Payment History - Slimmer Table */}
                            <div className="bg-[#0a0a0a] rounded-3xl border border-neutral-800 shadow-xl overflow-hidden min-h-0 h-fit">
                                <div className="p-4 md:p-6 border-b border-neutral-800/50 bg-neutral-900/10 flex items-center justify-between">
                                    <h3 className="text-[10px] md:text-xs font-black text-white uppercase tracking-wider md:tracking-widest flex items-center gap-1.5 md:gap-2">
                                        <Receipt className="w-3.5 h-3.5 text-orange-500" />
                                        Riwayat <span className="hidden sm:inline">Transaksi</span>
                                        <span className="sm:hidden">Trx</span>
                                    </h3>
                                    <div className="px-3 py-1.5 bg-[#050505] border border-neutral-800 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest text-neutral-600">
                                        Update <span className="hidden sm:inline">Terbaru</span>
                                        <span className="sm:hidden">Info</span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto custom-scrollbar">
                                    {paymentHistory.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-24 opacity-20">
                                            <Receipt className="w-12 h-12 mb-4" />
                                            <p className="font-black uppercase tracking-widest text-[9px]">Belum Ada Data</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left">
                                            <thead className="bg-[#0e0e0e] border-b border-neutral-800">
                                                <tr>
                                                    <th className="px-6 py-4 text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Deskripsi</th>
                                                    <th className="px-6 py-4 text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center w-32">Nominal</th>
                                                    <th className="px-6 py-4 text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center w-28">Status</th>
                                                    <th className="px-6 py-4 text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center w-28">Tanggal</th>
                                                    <th className="px-6 py-4 text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em] w-16"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-800/10">
                                                {paymentHistory.map((item) => (
                                                    <tr key={item.id} className="hover:bg-neutral-900/10 transition-all group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center group-hover:border-orange-500/30 transition-all">
                                                                    <Wallet className="w-3.5 h-3.5 text-neutral-600 group-hover:text-orange-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-white text-xs uppercase tracking-tight">{item.description}</p>
                                                                    <p className="text-[8px] font-black text-neutral-700 uppercase tracking-widest mt-1">{item.method || 'Transfer'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center font-black text-white text-[11px] tracking-tight">{formatCurrency(item.amount)}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 rounded-lg text-[8px] font-black uppercase tracking-widest mx-auto w-fit">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Sukses
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-[9px] font-bold text-neutral-600 uppercase tracking-widest">{formatDate(item.date)}</td>
                                                        <td className="px-6 py-4 text-right">
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
                                                                className="p-2 bg-neutral-900 text-neutral-700 rounded-lg hover:bg-neutral-800 hover:text-white transition-all border border-neutral-800"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
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
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 4px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
