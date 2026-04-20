'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    clearSession,
    User,
} from '@/lib/auth';
import {
    BookOpen,
    Users,
    ClipboardCheck,
    Calendar,
    Activity,
    Clock,
    MapPin,
    GraduationCap,
    TrendingUp,
    ChevronRight,
    ScanLine
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    AreaChart,
    Area,
} from 'recharts';

import { ustadzService } from '@/lib/services/ustadz';

export default function UstadzDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Real Data State
    const [stats, setStats] = useState({ totalStudents: 0, totalSubjects: 0, activeSchedules: 0, totalHafalan: 0 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [hafalanProgress, setHafalanProgress] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [todaySchedule, setTodaySchedule] = useState<any[]>([]);

    const fetchData = useCallback(async (userId: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const [dataStats, dist, hafalan, schedule] = await Promise.all([
                ustadzService.getDashboardStats(userId),
                ustadzService.getGradeDistribution(userId),
                ustadzService.getHafalanProgress(userId),
                ustadzService.getTodaySchedule(userId)
            ]);

            setStats(dataStats);
            setGradeDistribution(dist);
            setHafalanProgress(hafalan);
            setTodaySchedule(schedule);
        } catch (err: unknown) {
            console.error('Dashboard Fetch Error:', err);
            setError('Gagal memuat data dashboard.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'ustadz') {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchData(currentUser.id);
        });
        return () => cancelAnimationFrame(timer);
    }, [router, fetchData]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-2 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mb-4" />
                    <p className="text-neutral-500 text-[10px] font-medium tracking-[0.2em] uppercase">Memuat Dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-300 font-sans selection:bg-indigo-500/30">
            {/* Inject Modern Font */}

            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 space-y-6 lg:space-y-10 max-w-[1400px] mx-auto">
                    {/* Welcome Banner - Modern Gradient */}
                    <div className="bg-gradient-to-br from-blue-950 via-indigo-900 to-slate-950 rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-10 border border-blue-500/20 shadow-2xl relative overflow-hidden mb-6 lg:mb-10 group">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl mix-blend-overlay" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8">
                            <div>
                                <div className="flex items-center gap-2 text-blue-300 text-[8px] lg:text-xs font-black tracking-[0.2em] mb-2 lg:mb-4 uppercase shadow-black/10">
                                    <Activity className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                    Portal Ustadz
                                </div>
                                <h1 className="text-lg lg:text-3xl font-black text-white tracking-tight uppercase leading-none drop-shadow-xl">
                                    Ahlan, <span className="text-blue-400">{user.name.split(' ')[0]}</span> 👋
                                </h1>
                                <p className="text-blue-100/60 text-[10px] lg:text-base font-medium mt-4 lg:mt-6 max-w-xl block leading-relaxed italic opacity-80">
                                    Kelola kegiatan belajar mengajar dan pantau perkembangan santri.
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/dashboard/ustadz/jadwal')}
                                className="hidden md:flex group relative px-5 py-2.5 lg:px-8 lg:py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-full font-black shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all transform hover:scale-105 active:scale-95 items-center gap-2 lg:gap-3 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
                                <Calendar className="w-4 h-4 lg:w-5 lg:h-5 relative z-10" />
                                <span className="uppercase tracking-widest text-[10px] lg:text-sm relative z-10">Lihat Jadwal Mengajar</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid - Mobile 2 Columns */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[
                            { label: 'Santri', value: stats.totalStudents, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                            { label: 'Mapel', value: stats.totalSubjects, icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            { label: 'Jadwal', value: stats.activeSchedules, icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            { label: 'Hafalan', value: stats.totalHafalan, icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                        ].map((s, i) => (
                            <div key={i} className="bg-[#0a0a0a] p-4 lg:p-6 rounded-2xl border border-neutral-800/40 flex items-center gap-3 lg:gap-5 group">
                                <div className={`w-9 h-9 lg:w-12 lg:h-12 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>
                                    <s.icon className="w-4 h-4 lg:w-6 lg:h-6" />
                                </div>
                                <div>
                                    <p className="text-[9px] lg:text-[11px] font-bold text-neutral-500 uppercase tracking-wider">{s.label}</p>
                                    <h4 className="text-lg lg:text-2xl font-bold text-white tracking-tight leading-none mt-0.5">{s.value}</h4>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                        {/* Charts Area */}
                        <div className="lg:col-span-8 space-y-6 lg:space-y-8">
                            {/* Academic Chart - Shorter in Mobile */}
                            <div className="bg-[#0a0a0a] p-5 lg:p-8 rounded-[2rem] border border-neutral-800/40">
                                <div className="flex items-center justify-between mb-6 lg:mb-10">
                                    <h3 className="text-xs lg:text-sm font-bold text-white flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                                        Sebaran Nilai
                                    </h3>
                                    <span className="text-[9px] font-medium text-neutral-600 uppercase tracking-widest">Akademik</span>
                                </div>
                                <div className="h-[220px] lg:h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={gradeDistribution}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#171717" />
                                            <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#525252', fontWeight: 600 }} dy={5} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#525252' }} />
                                            <RechartsTooltip
                                                cursor={{ fill: '#ffffff05' }}
                                                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', fontSize: '12px' }}
                                            />
                                            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={35} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Hafalan Chart - Shorter in Mobile */}
                            <div className="bg-[#0a0a0a] p-5 lg:p-8 rounded-[2rem] border border-neutral-800/40">
                                <div className="flex items-center justify-between mb-6 lg:mb-10">
                                    <h3 className="text-xs lg:text-sm font-bold text-white flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-emerald-500" />
                                        Update Hafalan
                                    </h3>
                                    <span className="text-[9px] font-medium text-neutral-600 uppercase tracking-widest">Pekanan</span>
                                </div>
                                <div className="h-[220px] lg:h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={hafalanProgress}>
                                            <defs>
                                                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#171717" />
                                            <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#525252', fontWeight: 600 }} dy={5} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#525252' }} />
                                            <RechartsTooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '12px' }} />
                                            <Area type="monotone" dataKey="average" stroke="#10b981" strokeWidth={2} fill="url(#areaGrad)" dot={{ r: 3, fill: '#10b981' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Area */}
                        <div className="lg:col-span-4 space-y-6 lg:space-y-8">
                            {/* Schedule Slim Card */}
                            <div className="bg-[#0a0a0a] p-5 lg:p-6 rounded-[2rem] border border-neutral-800/40 flex flex-col">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-xs lg:text-sm font-bold text-white flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-amber-500" />
                                        Jadwal Hari Ini
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {todaySchedule.length === 0 ? (
                                        <div className="py-8 flex flex-col items-center justify-center border border-dashed border-neutral-800/60 rounded-2xl">
                                            <p className="text-[10px] font-medium text-neutral-600">Tidak ada jadwal</p>
                                        </div>
                                    ) : (
                                        todaySchedule.map((s, i) => (
                                            <div key={i} className="p-4 bg-neutral-900/20 rounded-2xl border border-neutral-800/40 group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[9px] font-bold text-indigo-400/80 tracking-tighter">{s.time}</span>
                                                    <span className="px-2 py-0.5 bg-neutral-800/50 rounded text-[8px] font-bold text-neutral-500 uppercase">{s.class}</span>
                                                </div>
                                                <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors truncate uppercase tracking-tight">{s.subject}</h4>
                                                <div className="mt-2 flex items-center gap-1.5 text-neutral-600 text-[9px] font-medium uppercase">
                                                    <MapPin className="w-3 h-3" />
                                                    {s.room}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions - List Style for Mobile */}
                            <div className="space-y-3">
                                <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-[0.2em] px-2 mb-1">Aksi Cepat</p>
                                <div className="grid grid-cols-1 gap-2.5">
                                    {[
                                        { label: 'Input Tahfidz', path: '/dashboard/ustadz/tahfidz', icon: BookOpen, color: 'bg-indigo-600', sub: 'Setoran Halaqoh' },
                                        { label: 'Input Nilai', path: '/dashboard/ustadz/nilai', icon: ClipboardCheck, color: 'bg-[#0e0e0e]', sub: 'Update Akademik' },
                                        { label: 'Absensi Kamera', path: '/dashboard/akademik/absensi/scan', icon: ScanLine, color: 'bg-emerald-600/20 text-emerald-500', sub: 'Scan QR Santri' },
                                        { label: 'Database Santri', path: '/dashboard/ustadz/santri', icon: Users, color: 'bg-[#0e0e0e]', sub: 'Binaan Saya' },
                                    ].map((a, i) => (
                                        <button
                                            key={i}
                                            onClick={() => router.push(a.path)}
                                            className={`w-full p-4 rounded-2xl ${a.color} border border-neutral-800/50 flex items-center justify-between group transition-all active:scale-[0.98]`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center">
                                                    <a.icon className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <span className="text-xs font-bold text-white block leading-none">{a.label}</span>
                                                    <span className="text-[9px] text-neutral-500 font-medium mt-1 block">{a.sub}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-white transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
                
                body {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    -webkit-font-smoothing: antialiased;
                    letter-spacing: -0.01em;
                }
                .scrollbar-none::-webkit-scrollbar { display: none; }
                
                /* Selection Color */
                ::selection {
                    background: rgba(99, 102, 241, 0.2);
                    color: #fff;
                }
            `}</style>
        </div>
    );
}
