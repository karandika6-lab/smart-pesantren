'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    clearSession,
    User
} from '@/lib/auth';
import {
    Calendar,
    Users,
    Activity,
    AlertCircle,
    TrendingUp,
    Clock,
    ClipboardCheck,
    History,
    ArrowRight,
    LayoutDashboard,
    ScanLine
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip
} from 'recharts';

import { attendanceService } from '@/lib/services/attendance';
import { sessionsService, AttendanceSession } from '@/lib/services/sessions';
import { Loader2 } from 'lucide-react';

export default function AbsensiDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Real Data State
    const [stats, setStats] = useState({
        totalStudents: 0,
        presentToday: 0,
        sickPermissionToday: 0,
        alphaToday: 0
    });
    const [presenceMeter, setPresenceMeter] = useState(100);
    const [sessionAlpha, setSessionAlpha] = useState<{ name: string; alpha: number }[]>([]);
    const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [s, meter, alpha, currentSession] = await Promise.all([
                attendanceService.getStats(),
                attendanceService.getPresenceMeter(),
                attendanceService.getSessionAlpha(),
                sessionsService.getCurrentSession()
            ]);

            setStats(s);
            setPresenceMeter(meter);
            setSessionAlpha(alpha);
            setActiveSession(currentSession);
            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching attendance data:', err);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_absensi' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchData();
        });
        return () => cancelAnimationFrame(timer);
    }, [router, fetchData]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    const GAUGE_DATA = [
        { name: 'Hadir', value: presenceMeter },
        { name: 'Absen', value: 100 - presenceMeter },
    ];

    const COLORS = ['#0891b2', '#e5e7eb']; // Cyan-600 and Gray

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64 flex-1">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-6 lg:space-y-10">
                    {/* Header - Modern Gradient */}
                    <div className="bg-gradient-to-br from-cyan-950 via-blue-900 to-sky-950 rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-10 border border-cyan-500/20 shadow-2xl relative overflow-hidden group">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full -mr-20 -mt-20 blur-3xl mix-blend-overlay" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8">
                            <div className="flex items-center gap-4 lg:gap-6">
                                <div className="w-12 h-12 lg:w-20 lg:h-20 bg-white/10 rounded-xl lg:rounded-3xl border border-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
                                    <LayoutDashboard className="w-6 h-6 lg:w-10 lg:h-10 text-cyan-300" />
                                </div>
                                <div>
                                    <h1 className="text-lg lg:text-3xl font-black text-white tracking-tight leading-none uppercase drop-shadow-xl">
                                        Analytics <span className="text-cyan-400">Dashboard</span>
                                    </h1>
                                    <p className="text-cyan-100/50 font-bold uppercase tracking-[0.2em] text-[8px] lg:text-[10px] mt-1 lg:mt-2 shadow-black/10">Monitoring Kehadiran Real-time</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 lg:px-6 lg:py-3.5 rounded-xl lg:rounded-2xl border border-white/10 shadow-lg backdrop-blur-md">
                                <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-300" />
                                <span className="font-bold text-white tracking-wider text-[10px] lg:text-sm uppercase font-mono">
                                    {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Top Stats: 4 Cards - Mobile 2 Columns */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[
                            { label: 'Total Santri', value: stats.totalStudents.toString(), icon: Users, color: 'blue' },
                            { label: 'Santri Hadir', value: stats.presentToday.toString(), icon: Activity, color: 'emerald' },
                            { label: 'Sakit / Izin', value: stats.sickPermissionToday.toString(), icon: AlertCircle, color: 'amber' },
                            { label: 'Alpha Hari Ini', value: stats.alphaToday.toString(), icon: TrendingUp, color: 'red' },
                        ].map((stat, i) => (
                            <div key={i} className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-${stat.color}-200`}>
                                <div className={`p-3 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl w-fit mb-4`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-800 mb-1">{stat.value}</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest truncate">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Middle Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Gauge Chart (Left) */}
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-800">Meteran Kehadiran</h3>
                                <p className="text-sm text-gray-500">Tingkat kehadiran santri pada sesi aktif.</p>
                            </div>
                            <div className="relative h-[250px] w-full mt-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={GAUGE_DATA}
                                            cx="50%"
                                            cy="75%"
                                            startAngle={180}
                                            endAngle={0}
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {GAUGE_DATA.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Absolute Label Overlay */}
                                <div className="absolute inset-0 flex items-end justify-center pb-10 pointer-events-none">
                                    <div className="text-center">
                                        <p className="text-5xl font-black text-gray-800 leading-none">{presenceMeter}%</p>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Hadir</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bar Chart (Right) */}
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-800">Ketidakhadiran per Sesi</h3>
                                <p className="text-sm text-gray-500">Jumlah santri yang tidak hadir tanpa keterangan.</p>
                            </div>
                            <div className="h-[250px] w-full mt-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sessionAlpha} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#9ca3af' }}
                                        />
                                        <RechartsTooltip
                                            cursor={{ fill: '#fef2f2' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="alpha" fill="#0891b2" radius={[6, 6, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Card 1: Sesi Aktif */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 group hover:border-cyan-200 transition-all">
                            <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <Clock className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sesi Saat Ini</p>
                                    {activeSession ? (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase animate-pulse">Berlangsung</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-black rounded-full uppercase">Tidak Aktif</span>
                                    )}
                                </div>
                                <h4 className="text-2xl font-black text-gray-800">
                                    {activeSession ? activeSession.name : 'Tidak Ada Sesi Aktif'}
                                </h4>
                                <div className="flex items-center gap-2 text-gray-500 font-medium">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                        {activeSession
                                            ? `${activeSession.start_time?.slice(0, 5)} - ${activeSession.end_time?.slice(0, 5) || '?'}`
                                            : '-- : --'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Aksi Cepat */}
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
                                <button
                                    onClick={() => router.push('/dashboard/akademik/absensi/scan')}
                                    className="flex items-center justify-between p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 transition-all group lg:min-h-[100px]"
                                >
                                    <div className="flex flex-col items-start gap-2">
                                        <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                                            <ScanLine className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="font-bold text-sm">Scan QR</span>
                                    </div>
                                    <ArrowRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard/absensi/input')}
                                    className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 text-white rounded-2xl hover:bg-gray-800 transition-all group lg:min-h-[100px]"
                                >
                                    <div className="flex flex-col items-start gap-2">
                                        <div className="p-2 bg-gray-800 rounded-xl group-hover:scale-110 transition-transform">
                                            <ClipboardCheck className="w-5 h-5 text-cyan-400" />
                                        </div>
                                        <span className="font-bold text-sm">Manual</span>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard/absensi/rekap')}
                                    className="flex items-center justify-between p-4 bg-white border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all group lg:min-h-[100px]"
                                >
                                    <div className="flex flex-col items-start gap-2">
                                        <div className="p-2 bg-cyan-50 rounded-xl group-hover:scale-110 transition-transform">
                                            <History className="w-5 h-5 text-cyan-600" />
                                        </div>
                                        <span className="font-bold text-sm">Rekap</span>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
