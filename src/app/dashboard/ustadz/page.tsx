'use client';

import { useEffect, useState } from 'react';
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
    ArrowRight,
    Activity,
    Clock,
    MapPin,
    GraduationCap,
    Zap,
    TrendingUp,
    ChevronRight
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
    const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
    const [hafalanProgress, setHafalanProgress] = useState<any[]>([]);
    const [todaySchedule, setTodaySchedule] = useState<any[]>([]);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'ustadz') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchData(currentUser.id);
    }, [router]);

    const fetchData = async (userId: string) => {
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
        } catch (err: any) {
            console.error('Dashboard Fetch Error:', err);
            setError('Gagal memuat data dashboard.');
        } finally {
            setIsLoading(false);
        }
    };

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
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8 space-y-6 lg:space-y-10 max-w-[1400px] mx-auto">
                    {/* Header - Slimmer for Mobile */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold tracking-widest uppercase mb-1">
                                <Activity className="w-3.5 h-3.5" />
                                Portal Ustadz
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                                Ahlan, <span className="text-indigo-500">{user.name.split(' ')[0]}</span> 👋
                            </h1>
                        </div>
                        <div className="flex md:hidden items-center gap-2 text-[10px] font-bold text-neutral-500">
                            <Calendar className="w-3 h-3" />
                            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                    </div>

                    {/* Stats Grid - Slim & Horizontal-styled for Mobile */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
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
