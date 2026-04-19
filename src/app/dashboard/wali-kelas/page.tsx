'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    clearSession,
    User,
} from '@/lib/auth';
import {
    Users,
    Activity,
    Clock,
    TrendingUp,
    ShieldAlert,
    ChevronRight,
    Search,
    Phone,
    CheckCircle2,
    Shield,
    Calendar
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
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';

// ============================================
// Mock Data
// ============================================







import { homeroomService } from '@/lib/services/homeroom';
import { Loader2 } from 'lucide-react';

export default function WaliKelasDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Real Data State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [classInfo, setClassInfo] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [gradeData, setGradeData] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [violationList, setViolationList] = useState<any[]>([]);

    const fetchData = useCallback(async (teacherId: string) => {
        try {
            const info = await homeroomService.getClassInfo(teacherId);
            if (!info) {
                setClassInfo({ name: 'Belum Ada Kelas' });
                setIsLoading(false);
                return;
            }
            setClassInfo(info);

            // Fetch with individual error handling
            try {
                const attendance = await homeroomService.getAttendanceSummary(info.id);
                setAttendanceData(attendance);
            } catch (err) {
                console.warn('Attendance data unavailable:', err);
                setAttendanceData([]);
            }

            try {
                const grades = await homeroomService.getGradeSummary(info.id);
                setGradeData(grades);
            } catch (err) {
                console.warn('Grade data unavailable:', err);
                setGradeData([]);
            }

            try {
                const violations = await homeroomService.getTopViolations(info.id);
                setViolationList(violations);
            } catch (err) {
                console.warn('Violation data unavailable:', err);
                setViolationList([]);
            }

            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching homeroom data:', err);
            setClassInfo({ name: 'Error loading class' });
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_kelas') {
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-transparent flex flex-col">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64 flex-1">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-6 lg:space-y-10">
                    {/* Header Section - Modern Gradient */}
                    <div className="bg-gradient-to-br from-fuchsia-950 via-purple-900 to-pink-950 rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-10 border border-fuchsia-500/20 shadow-2xl relative overflow-hidden group">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-500/10 rounded-full -mr-20 -mt-20 blur-3xl mix-blend-overlay" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8">
                            <div className="flex items-center gap-4 lg:gap-6">
                                <div className="w-12 h-12 lg:w-20 lg:h-20 bg-white/10 rounded-xl lg:rounded-3xl border border-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
                                    <Shield className="w-6 h-6 lg:w-10 lg:h-10 text-fuchsia-300" />
                                </div>
                                <div>
                                    <h1 className="text-lg lg:text-3xl font-black text-white tracking-tight leading-none uppercase drop-shadow-xl">
                                        Portal <span className="text-fuchsia-400">Wali Kelas</span>
                                    </h1>
                                    <p className="text-fuchsia-100/50 font-bold uppercase tracking-[0.2em] text-[8px] lg:text-[10px] mt-1 lg:mt-2 shadow-black/10">
                                        Kelas {classInfo?.name || 'Monitoring'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex shrink-0">
                                <div className="px-4 py-2 lg:px-6 lg:py-3.5 bg-white/10 border border-white/10 shadow-lg rounded-xl lg:rounded-2xl text-white text-[10px] lg:text-sm font-black flex items-center gap-2 lg:gap-3 backdrop-blur-md uppercase tracking-widest">
                                    <Calendar className="w-4 h-4 text-fuchsia-400" />
                                    2024/2025
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Attendance Pie Chart */}
                        <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-neutral-800 shadow-2xl flex flex-col h-[380px] relative overflow-hidden group transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                <Activity className="w-48 h-48 text-indigo-500" />
                            </div>
                            <div className="mb-6 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                        <Activity className="w-7 h-7 text-indigo-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-extrabold text-white">Kehadiran</h3>
                                        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] mt-1">Harian Santri</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={attendanceData}
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {attendanceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity outline-none shadow-glow" />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#111', borderRadius: '20px', border: '1px solid #333', color: '#fff' }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            align="center"
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Grade Bar Chart */}
                        <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-neutral-800 shadow-2xl flex flex-col h-[380px] relative overflow-hidden group transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                <TrendingUp className="w-48 h-48 text-indigo-500" />
                            </div>
                            <div className="mb-6 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                                        <TrendingUp className="w-7 h-7 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-extrabold text-white">Rata-Rata Nilai</h3>
                                        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] mt-1">Pencapaian Mapel</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={gradeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a" />
                                        <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666', fontWeight: 800 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                                        <RechartsTooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 12 }}
                                            contentStyle={{ backgroundColor: '#111', borderRadius: '20px', border: '1px solid #333', color: '#fff' }}
                                        />
                                        <Bar dataKey="score" fill="#6366f1" radius={[12, 12, 12, 12]} barSize={32}>
                                            {gradeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#818cf8'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
                        {/* Violations List Widget */}
                        <div className="lg:col-span-1 bg-[#0c0c0c] p-5 rounded-2xl border border-neutral-800 shadow-2xl group transition-all">
                            <div className="mb-10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20 shadow-sm">
                                        <ShieldAlert className="w-6 h-6 text-rose-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-white text-lg">Disiplin</h3>
                                        <p className="text-[10px] text-rose-500 font-black uppercase tracking-[0.2em]">Poin Pelanggaran</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                {violationList.length === 0 ? (
                                    <div className="text-center py-10 opacity-60">
                                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                        </div>
                                        <p className="text-white text-sm font-black uppercase tracking-widest">Semua Aman</p>
                                    </div>
                                ) : (
                                    violationList.map((std, i) => (
                                        <div key={i} className="group cursor-default">
                                            <div className="flex justify-between items-center text-sm mb-3">
                                                <span className="font-extrabold text-neutral-300 group-hover:text-indigo-500 transition-colors uppercase tracking-tight">{std.name}</span>
                                                <span className="font-black text-rose-500 tabular-nums px-3 py-1 bg-rose-500/10 rounded-lg">{std.points}</span>
                                            </div>
                                            <div className="h-4 w-full bg-neutral-900 rounded-full overflow-hidden p-1 border border-neutral-800 shadow-inner">
                                                <div
                                                    className={`h-full ${std.points > 40 ? 'bg-gradient-to-r from-rose-600 to-rose-500' : 'bg-gradient-to-r from-indigo-600 to-indigo-500'} rounded-full transition-all duration-1000 shadow-sm`}
                                                    style={{ width: `${Math.min(std.points, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <button
                                onClick={() => router.push('/dashboard/wali-kelas/pelanggaran')}
                                className="w-full mt-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-black uppercase tracking-[0.2em] text-[9px] rounded-xl transition-all flex items-center justify-center gap-3 group border border-neutral-800"
                            >
                                Rekap Lengkap
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-neutral-600" />
                            </button>
                        </div>

                        {/* Quick Actions (MODERNIZED) */}
                        <div className="lg:col-span-2 bg-[#0c0c0c] p-5 rounded-2xl border border-neutral-800 shadow-2xl transition-all">
                            <div className="mb-8 flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-full border border-indigo-500/20 flex items-center justify-center">
                                    <Search className="w-6 h-6 text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-white text-lg">Aksi Cepat</h3>
                                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em]">Navigasi Utama</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {[
                                    { label: 'Daftar Santri', sub: 'Profil & Perwalian', icon: Users, href: '/dashboard/wali-kelas/santri', color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                                    { label: 'Capaian Nilai', sub: 'Performa Akademik', icon: TrendingUp, href: '/dashboard/wali-kelas/nilai', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                                    { label: 'Rekap Absensi', sub: 'Log Presensi Harian', icon: Clock, href: '/dashboard/wali-kelas/absensi', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                                    { label: 'Hubungi Wali', sub: 'Komunikasi Ortu', icon: Phone, href: '/dashboard/wali-kelas/chat', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                                ].map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => router.push(item.href)}
                                        className={`p-6 bg-neutral-900/50 hover:bg-neutral-900 border ${item.border} rounded-2xl cursor-pointer transition-all flex flex-col gap-4 active:scale-95 shadow-sm group`}
                                    >
                                        <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                                            <item.icon className={`w-7 h-7 ${item.color}`} />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-white text-lg mb-1">{item.label}</h4>
                                            <p className="text-[10px] text-neutral-500 font-black leading-relaxed uppercase tracking-widest">{item.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

