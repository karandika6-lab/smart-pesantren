'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { parentService, ChildSummary } from '@/lib/services/parent';
import { academicYearService } from '@/lib/services/academic';
import {
    Loader2,
    Users,
    CreditCard,
    AlertTriangle,
    GraduationCap,
    ArrowRight,
    Shield,
    Calendar,
    Heart,
    Star,
    Activity,
    ChevronRight,
    BookOpen,
    Trophy
} from 'lucide-react';
import { studentDashboardService } from '@/lib/services/student-dashboard';

export default function WaliSantriDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Data State
    const [isLoading, setIsLoading] = useState(true);
    const [children, setChildren] = useState<ChildSummary[]>([]);
    const [hafalanData, setHafalanData] = useState<Record<string, any>>({});
    const [activeYear, setActiveYear] = useState<any>(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            setIsLoading(true);
            const { financeService } = await import('@/lib/services/finance');
            await financeService.syncInvoiceStatuses();

            const [data, year] = await Promise.all([
                parentService.getDashboardSummary(),
                academicYearService.getActive()
            ]);
            setChildren(data);
            if (activeYear === null) setActiveYear(year);

            if (data.length > 0) {
                const hafalanPromises = data.map(child =>
                    studentDashboardService.getHafalanData(child.student_id)
                        .then(hData => ({ id: child.student_id, data: hData }))
                );
                const hResults = await Promise.all(hafalanPromises);
                const hMap: Record<string, any> = {};
                hResults.forEach(res => {
                    hMap[res.id] = res.data;
                });
                setHafalanData(hMap);
            }
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        } finally {
            setIsLoading(false);
        }
    }, [activeYear]);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_santri') {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchDashboardData();
        });
        return () => cancelAnimationFrame(timer);
    }, [router, fetchDashboardData]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (isLoading && children.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin opacity-40" />
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Menyelaraskan Portal Wali...</p>
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

                <main className="w-full px-4 sm:px-6 py-6 lg:p-8 space-y-8 max-w-[1400px] mx-auto overflow-x-hidden">
                    {/* Personalized Welcome Banner */}
                    <div className="relative group overflow-hidden rounded-2xl lg:rounded-[2.5rem] bg-gradient-to-br from-amber-950/80 via-orange-900/60 to-yellow-950/80 border border-orange-500/20 p-4 lg:p-10 shadow-xl">
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl mix-blend-overlay"></div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-orange-200 border border-white/5 backdrop-blur-sm">
                                    <Heart className="w-3.5 h-3.5 fill-current" />
                                    Portal Wali v2
                                </div>
                                <h1 className="text-lg lg:text-3xl font-black text-white tracking-tight leading-none uppercase drop-shadow-xl">
                                    Ahlan, <span className="text-orange-300">Bapak/Ibu {user.name.split(' ')[0]}</span> 👋
                                </h1>
                                <p className="text-orange-100/60 font-medium max-w-xl text-[11px] lg:text-sm leading-relaxed hidden sm:block font-bold">
                                    Pantau terus perkembangan buah hati Anda demi masa depan yang lebih barokah.
                                </p>
                            </div>

                            <div className="hidden lg:block">
                                <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white/5 backdrop-blur-md rounded-2xl lg:rounded-3xl border border-white/10 flex items-center justify-center rotate-3 group-hover:rotate-0 transition-all duration-700">
                                    <Users className="w-8 h-8 lg:w-12 lg:h-12 text-orange-200" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
                        <div>
                            <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black tracking-[0.3em] mb-1 uppercase">
                                <Activity className="w-4 h-4" />
                                Monitoring Real-time
                            </div>
                            <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">
                                Amanah <span className="text-orange-500">Pendidikan</span>
                            </h2>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-2.5 bg-[#0a0a0a] border border-neutral-800 rounded-xl text-orange-500 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg">
                            <Star className="w-4 h-4 fill-current animate-pulse shrink-0" />
                            {children.length} Santri Terdaftar
                        </div>
                    </div>

                    {/* Children Grid - Slimmer Cards */}
                    <div className={`grid grid-cols-1 ${children.length === 1 ? 'lg:grid-cols-12' : children.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
                        {children.map((child) => (
                            <div
                                key={child.student_id}
                                className={`group relative flex flex-col lg:flex-row bg-[#0a0a0a] border border-neutral-800 rounded-3xl overflow-hidden transition-all duration-500 hover:border-orange-500/30 hover:shadow-2xl ${children.length === 1 ? 'lg:col-span-12' : 'lg:col-span-1'}`}
                            >
                                <div className={`flex-1 p-6 sm:p-8 lg:p-10 ${children.length === 1 ? 'lg:border-r lg:border-white/5' : ''}`}
                                    onClick={() => router.push(`/dashboard/wali/profil?id=${child.student_id}`)}
                                    style={{ cursor: 'pointer' }}>

                                    <div className="flex items-start justify-between mb-6 sm:mb-8">
                                        <div className="relative">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-600 to-amber-700 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black text-white shadow-lg">
                                                {child.student_name.charAt(0)}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-[9px] font-black text-orange-500 uppercase tracking-widest">
                                                {child.class_name || 'Formal'}
                                            </div>
                                            <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/5 rounded-md text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                Aktif
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight group-hover:text-orange-500 transition-colors uppercase">
                                            {child.student_name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-neutral-700" />
                                            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">NIS: {child.nis}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 group-hover:border-neutral-700 transition-colors">
                                            <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1">Syahriah</p>
                                            <p className={`text-[10px] font-black flex items-center gap-1.5 ${Number(child.total_bill_unpaid) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {Number(child.total_bill_unpaid) > 0 ? 'Tagihan' : 'Lunas'}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 group-hover:border-neutral-700 transition-colors">
                                            <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1">Disiplin</p>
                                            <p className={`text-[10px] font-black ${child.violation_points > 20 ? 'text-rose-500' : 'text-emerald-400'}`}>
                                                {child.violation_points} <span className="opacity-50 lowercase">Poin</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full py-4 bg-orange-600 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[9px] flex items-center justify-center gap-3 transition-all duration-300 hover:bg-orange-700 shadow-lg">
                                        Pantau Detail
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>

                                {children.length === 1 && (
                                    <div className="flex-1 bg-[#0c0c0c] p-6 sm:p-8 lg:p-10 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-neutral-800">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-orange-500/5 rounded-xl flex items-center justify-center border border-orange-500/10">
                                                    <BookOpen className="w-5 h-5 text-orange-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-black uppercase tracking-widest text-[10px]">Progres Hafalan</h4>
                                                    <p className="text-neutral-600 text-[8px] font-bold uppercase tracking-[0.1em] mt-0.5 whitespace-nowrap">Kurikulum Tahfidz</p>
                                                </div>
                                            </div>

                                            <div className="bg-black/40 border border-neutral-800 rounded-2xl p-5 space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1">{hafalanData[child.student_id]?.unitLabel || 'Unit'} Terakhir</p>
                                                        <p className="text-lg font-black text-white">{hafalanData[child.student_id]?.currentJuz || '...'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-600/10 border border-orange-500/10 rounded-full text-orange-500 font-bold text-[8px] uppercase tracking-widest">
                                                            <Trophy className="w-2.5 h-2.5 fill-current" />
                                                            {hafalanData[child.student_id]?.completed || 0} Selesai
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                                                        <span className="text-neutral-500">Progres</span>
                                                        <span className="text-orange-500">{hafalanData[child.student_id]?.progress || 0}%</span>
                                                    </div>
                                                    <div className="h-2 bg-neutral-900 rounded-full overflow-hidden p-0.5">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-orange-600 to-amber-500 rounded-full transition-all duration-1000"
                                                            style={{ width: `${hafalanData[child.student_id]?.progress || 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => router.push('/dashboard/wali/hafalan')}
                                                className="w-full text-neutral-600 hover:text-white font-black uppercase tracking-[0.2em] text-[8px] flex items-center justify-center gap-2 transition-colors group/hafalan"
                                            >
                                                Lihat Riwayat
                                                <ChevronRight className="w-3.5 h-3.5 group-hover/hafalan:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Quick Access - Slimmer Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div
                            className="p-5 rounded-3xl bg-[#0a0a0a] border border-neutral-800 flex items-center gap-5 group hover:border-orange-500/30 hover:bg-neutral-900 transition-all cursor-pointer shadow-lg"
                            onClick={() => router.push('/dashboard/wali/pembayaran')}
                        >
                            <div className="w-14 h-14 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/10 group-hover:bg-orange-600 group-hover:text-white transition-all shrink-0">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-black tracking-tight uppercase text-sm group-hover:text-orange-500 transition-colors">Keuangan</h4>
                                <p className="text-neutral-600 text-xs font-medium mt-0.5">Pantau iuran & riwayat pembayaran.</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-neutral-800 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                        </div>

                        <div
                            className="p-5 rounded-3xl bg-[#0a0a0a] border border-neutral-800 flex items-center gap-5 group hover:border-amber-500/30 hover:bg-neutral-900 transition-all cursor-pointer shadow-lg"
                            onClick={() => router.push('/dashboard/wali/absensi')}
                        >
                            <div className="w-14 h-14 bg-amber-600/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/10 group-hover:bg-amber-600 group-hover:text-white transition-all shrink-0">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-black tracking-tight uppercase text-sm group-hover:text-amber-500 transition-colors">Kehadiran</h4>
                                <p className="text-neutral-600 text-xs font-medium mt-0.5">Cek absensi & kedisiplinan harian.</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-neutral-800 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
