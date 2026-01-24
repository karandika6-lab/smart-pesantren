'use client';

import { useEffect, useState } from 'react';
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
    TrendingUp,
    Shield,
    Calendar,
    Heart,
    Star,
    Activity,
    LayoutGrid,
    ChevronRight,
    BookOpen,
    Trophy
} from 'lucide-react';
import { studentDashboardService } from '@/lib/services/student-dashboard';

export default function WaliSantriDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeYear, setActiveYear] = useState<any>(null);

    // Data State
    const [isLoading, setIsLoading] = useState(true);
    const [children, setChildren] = useState<ChildSummary[]>([]);
    const [hafalanData, setHafalanData] = useState<Record<string, any>>({});
    const [error, setError] = useState('');

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_santri') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchDashboardData();
    }, [router]);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const [data, year] = await Promise.all([
                parentService.getDashboardSummary(),
                academicYearService.getActive()
            ]);
            setChildren(data);
            setActiveYear(year);

            // Fetch Hafalan data for each child
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
            setError('Gagal memuat data anak.');
        } finally {
            setIsLoading(false);
        }
    };

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
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="w-full px-4 sm:px-6 py-8 lg:p-10 space-y-10 max-w-[1600px] mx-auto overflow-x-hidden">
                    {/* Welcome Banner (Premium Midnight Orange Variant) */}
                    <div className={`relative group overflow-hidden rounded-[2rem] sm:rounded-[3rem] bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 sm:p-8 lg:p-12 shadow-2xl ${children.length === 1 ? 'lg:max-w-7xl' : children.length === 2 ? 'max-w-6xl' : ''}`}>
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-orange-600/5 rounded-full blur-[100px] group-hover:bg-orange-600/10 transition-colors duration-1000"></div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8">
                            <div className="space-y-3 sm:space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-orange-500 border border-orange-500/20">
                                    <Heart className="w-3 h-3 fill-current" />
                                    Portal Wali Santri
                                </div>
                                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                                    Ahlan wa Sahlan, <br />
                                    <span className="text-orange-500 underline decoration-orange-500/30 underline-offset-4 sm:underline-offset-8">Bapak/Ibu {user.name.split(' ')[0]}</span>
                                </h1>
                                <p className="text-neutral-500 font-medium max-w-lg text-sm sm:text-lg leading-relaxed">
                                    Pantau terus perkembangan buah hati Anda demi masa depan yang lebih barokah.
                                </p>
                            </div>

                            <div className="hidden lg:block">
                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-orange-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="w-44 h-44 bg-neutral-900/50 backdrop-blur-md rounded-[3.5rem] border border-neutral-800/50 flex items-center justify-center rotate-6 group-hover:rotate-0 transition-transform duration-700 shadow-2xl">
                                        <Users className="w-20 h-20 text-orange-500 opacity-80" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2 ${children.length === 1 ? 'lg:max-w-7xl' : children.length === 2 ? 'max-w-6xl' : ''}`}>
                        <div>
                            <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black tracking-[0.3em] mb-2 uppercase">
                                <Activity className="w-4 h-4" />
                                Monitoring Real-time
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-none">
                                Amanah <span className="text-orange-500">Pendidikan</span>
                            </h2>
                            <p className="text-neutral-500 text-sm mt-3 font-medium">Pantau data akademik dan kedisiplinan buah hati secara langsung.</p>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-3 bg-[#0a0a0a] border border-neutral-800 rounded-2xl text-orange-500 font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl">
                            <Star className="w-4 h-4 fill-current animate-pulse shrink-0" />
                            {children.length} Santri Terdaftar
                        </div>
                    </div>

                    {children.length === 0 ? (
                        <div className="bg-[#0a0a0a] border border-neutral-800/50 rounded-[3rem] p-20 text-center shadow-2xl">
                            <div className="w-24 h-24 bg-neutral-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-neutral-800">
                                <Users className="w-12 h-12 text-neutral-700" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Belum Ada Nama Tertaut</h3>
                            <p className="text-neutral-500 max-w-sm mx-auto mb-10 font-medium leading-relaxed">
                                Mohon bersabar, data putra/putri Anda sedang diselaraskan oleh Admin Pesantren.
                            </p>
                            <button className="px-10 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-700 transition-all active:scale-95 shadow-[0_0_30px_rgba(234,88,12,0.3)]">
                                Hubungi Layanan Informasi
                            </button>
                        </div>
                    ) : (
                        <div className={`grid grid-cols-1 ${children.length === 1 ? 'lg:grid-cols-12 max-w-7xl' : children.length === 2 ? 'lg:grid-cols-2 max-w-6xl' : 'lg:grid-cols-3'} gap-6 lg:gap-10`}>
                            {children.map((child) => (
                                <div
                                    key={child.student_id}
                                    className={`group relative flex flex-col lg:flex-row bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[2.5rem] sm:rounded-[4.5rem] overflow-hidden transition-all duration-700 hover:border-orange-500/30 hover:shadow-[0_45px_100px_-25px_rgba(234,88,12,0.12)] ${children.length === 1 ? 'lg:col-span-12' : 'lg:col-span-1'}`}
                                >
                                    {/* Main Info Side */}
                                    <div className={`flex-1 p-6 sm:p-10 lg:p-14 ${children.length === 1 ? 'lg:border-r lg:border-white/5' : ''}`}
                                        onClick={() => router.push(`/dashboard/wali/profil?id=${child.student_id}`)}
                                        style={{ cursor: 'pointer' }}>
                                        <div className="flex items-start justify-between mb-8 sm:mb-12">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-orange-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                                <div className="relative w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center text-2xl sm:text-4xl font-black text-white shadow-2xl group-hover:scale-110 transition-transform duration-700">
                                                    {child.student_name.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 sm:gap-3">
                                                <div className="px-4 py-2 sm:px-6 sm:py-3 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-[9px] sm:text-[11px] font-black text-orange-500 uppercase tracking-widest shadow-lg">
                                                    {child.class_name || 'Formal'}
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                                    Aktif
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 sm:space-y-4">
                                            <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight group-hover:text-orange-400 transition-colors uppercase">
                                                {child.student_name}
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <Shield className="w-5 h-5 text-orange-500/40" />
                                                <p className="text-[10px] sm:text-[12px] font-bold text-neutral-600 uppercase tracking-[0.4em]">NIS: {child.nis}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-14 mb-8 sm:mb-10">
                                            <div className="p-5 sm:p-7 rounded-3xl sm:rounded-[3rem] bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors space-y-2 sm:space-y-3 relative overflow-hidden">
                                                <div className="absolute -right-3 -bottom-3 opacity-[0.04] rotate-12">
                                                    <CreditCard className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                                                </div>
                                                <div className="text-[9px] sm:text-[11px] font-black text-neutral-600 uppercase tracking-widest">Syahriah</div>
                                                <div className={`text-sm sm:text-base font-black flex items-center gap-2.5 ${Number(child.total_bill_unpaid) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    {Number(child.total_bill_unpaid) > 0 ? (
                                                        <>
                                                            Ada Tagihan
                                                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                                                        </>
                                                    ) : 'Lunas'}
                                                </div>
                                            </div>
                                            <div className="p-5 sm:p-7 rounded-3xl sm:rounded-[3rem] bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors space-y-2 sm:space-y-3 relative overflow-hidden">
                                                <div className="absolute -right-3 -bottom-3 opacity-[0.04] rotate-12">
                                                    <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                                                </div>
                                                <div className="text-[9px] sm:text-[11px] font-black text-neutral-600 uppercase tracking-widest">Kedisiplinan</div>
                                                <div className={`text-sm sm:text-base font-black ${child.violation_points > 20 ? 'text-rose-500' : 'text-emerald-400'}`}>
                                                    {child.violation_points} <span className="text-xs opacity-60 font-medium lowercase">Poin</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full py-5 sm:py-6 bg-orange-600 text-white rounded-2xl sm:rounded-[2rem] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[9px] sm:text-[10px] flex items-center justify-center gap-4 transition-all duration-300 hover:bg-orange-700 shadow-[0_25px_50px_-15px_rgba(234,88,12,0.4)]">
                                            Pantau Detail Dashboard
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                        </div>
                                    </div>

                                    {/* Hafalan Progress Side (Conditional based on count) */}
                                    {children.length === 1 && (
                                        <div className="flex-1 bg-white/[0.01] backdrop-blur-3xl p-6 sm:p-10 lg:p-14 flex flex-col justify-center border-t lg:border-t-0 border-white/5">
                                            <div className="space-y-6 sm:space-y-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-600/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-orange-500/20">
                                                        <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-black uppercase tracking-widest text-xs sm:text-sm">Progres Hafalan</h4>
                                                        <p className="text-neutral-600 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Capaian Kurikulum Tahfidz</p>
                                                    </div>
                                                </div>

                                                <div className="bg-black/20 border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 space-y-5 sm:space-y-6">
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                                                        <div>
                                                            <p className="text-[9px] sm:text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1 sm:mb-2">{hafalanData[child.student_id]?.unitLabel || 'Unit'} Terakhir</p>
                                                            <p className="text-2xl sm:text-3xl font-black text-white">{hafalanData[child.student_id]?.currentJuz || '...'}</p>
                                                        </div>
                                                        <div className="sm:text-right">
                                                            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 bg-orange-600/10 border border-orange-500/20 rounded-full text-orange-500 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest">
                                                                <Trophy className="w-3 h-3 fill-current" />
                                                                {hafalanData[child.student_id]?.completed || 0} {hafalanData[child.student_id]?.unitLabel || 'Unit'} Selesai
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="flex justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
                                                            <span className="text-neutral-500">Progres {hafalanData[child.student_id]?.unitLabel || 'Unit'} {hafalanData[child.student_id]?.currentJuz || '...'}</span>
                                                            <span className="text-orange-500">{hafalanData[child.student_id]?.progress || 0}%</span>
                                                        </div>
                                                        <div className="h-4 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 p-0.5">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-orange-600 to-amber-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(234,88,12,0.4)]"
                                                                style={{ width: `${hafalanData[child.student_id]?.progress || 0}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 sm:pt-4 flex items-center gap-3 sm:gap-4 text-neutral-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">
                                                        <Calendar className="w-4 h-4 text-neutral-700" />
                                                        Update: {hafalanData[child.student_id]?.lastUpdate ? new Date(hafalanData[child.student_id].lastUpdate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Belum ada data'}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => router.push('/dashboard/wali/hafalan')}
                                                    className="w-full py-2 sm:py-4 text-neutral-500 hover:text-white font-black uppercase tracking-[0.3em] text-[8px] sm:text-[9px] flex items-center justify-center gap-3 transition-colors group/hafalan"
                                                >
                                                    Lihat Riwayat Setoran
                                                    <ChevronRight className="w-4 h-4 group-hover/hafalan:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Ambient Decoration */}
                                    <div className="absolute -bottom-12 -right-12 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-all duration-1000 group-hover:-translate-y-6">
                                        <GraduationCap className="w-64 h-64 text-orange-500 -rotate-12" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick Access Info */}
                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10 ${children.length === 1 ? 'lg:max-w-7xl' : children.length === 2 ? 'max-w-6xl' : ''}`}>
                        {/* Billing Card */}
                        <div
                            className="p-6 sm:p-8 rounded-3xl sm:rounded-[3.5rem] bg-white/5 backdrop-blur-xl border border-white/10 flex items-center gap-5 sm:gap-8 group hover:border-orange-500/30 hover:bg-white/[0.08] transition-all cursor-pointer shadow-xl relative overflow-hidden"
                            onClick={() => router.push('/dashboard/wali/pembayaran')}
                        >
                            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-orange-600/10 rounded-2xl sm:rounded-3xl flex items-center justify-center text-orange-500 border border-orange-500/10 shadow-[0_0_30px_rgba(234,88,12,0.1)] group-hover:bg-orange-600 group-hover:text-white transition-all shrink-0">
                                <CreditCard className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                                <h4 className="text-white font-extrabold tracking-tight uppercase text-base sm:text-xl group-hover:text-orange-500 transition-colors leading-tight">Administrasi Keuangan</h4>
                                <p className="text-neutral-500 text-[10px] sm:text-sm font-medium mt-1 sm:mt-1.5 leading-relaxed opacity-80">Pantau iuran SPP & riwayat pembayaran.</p>
                            </div>
                            <div className="hidden sm:flex w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 shrink-0">
                                <ArrowRight className="w-5 h-5 text-orange-500" />
                            </div>
                        </div>

                        {/* Attendance Card */}
                        <div
                            className="p-6 sm:p-8 rounded-3xl sm:rounded-[3.5rem] bg-white/5 backdrop-blur-xl border border-white/10 flex items-center gap-5 sm:gap-8 group hover:border-amber-500/30 hover:bg-white/[0.08] transition-all cursor-pointer shadow-xl relative overflow-hidden"
                            onClick={() => router.push('/dashboard/wali/absensi')}
                        >
                            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-amber-600/10 rounded-2xl sm:rounded-3xl flex items-center justify-center text-amber-500 border border-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.1)] group-hover:bg-amber-600 group-hover:text-white transition-all shrink-0">
                                <Calendar className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                                <h4 className="text-white font-extrabold tracking-tight uppercase text-base sm:text-xl group-hover:text-amber-500 transition-colors leading-tight">Riwayat Kehadiran</h4>
                                <p className="text-neutral-500 text-[10px] sm:text-sm font-medium mt-1 sm:mt-1.5 leading-relaxed opacity-80">Cek absensi & kedisiplinan harian santri.</p>
                            </div>
                            <div className="hidden sm:flex w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 shrink-0">
                                <ArrowRight className="w-5 h-5 text-amber-500" />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
