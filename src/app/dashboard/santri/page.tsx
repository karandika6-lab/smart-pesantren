'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
import {
    LayoutDashboard,
    TrendingUp,
    Calendar,
    BookOpen,
    Clock,
    User as UserIcon,
    Award,
    Target,
    MapPin,
    GraduationCap,
    Star,
    Users,
    ChevronRight,
    Search,
    Activity,
    Loader2
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

import { studentDashboardService } from '@/lib/services/student-dashboard';
import { academicYearService } from '@/lib/services/academic';
import { supabase } from '@/lib/supabase';

const COLORS = ['#6366f1', '#1f1f1f'];

export default function SantriDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Real Data State
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [gpaHistory, setGPAHistory] = useState<any[]>([]);
    const [hafalanData, setHafalanData] = useState<any>(null);
    const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
    const [topScore, setTopScore] = useState<any>(null);
    const [disciplinePoints, setDisciplinePoints] = useState<number>(100);
    const [recentViolations, setRecentViolations] = useState<any[]>([]);
    const [activeYear, setActiveYear] = useState<any>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'santri') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchData(currentUser.id);
    }, [router]);

    const fetchData = async (userId: string) => {
        try {
            setIsLoading(true);
            const { data: student, error: sError } = await supabase
                .from('students')
                .select('*, classes(name)')
                .eq('user_id', userId)
                .maybeSingle();

            if (sError) throw sError;

            if (!student) {
                console.warn('No student record found for this user ID:', userId);
                setStudentInfo(null);
                setIsLoading(false);
                return;
            }

            setStudentInfo(student);

            const [gpa, hafalan, schedule, top, points, recentV, year] = await Promise.all([
                studentDashboardService.getGPAHistory(student.id).catch(e => { console.error('GPA Fetch Error:', e); return []; }),
                studentDashboardService.getHafalanData(student.id).catch(e => { console.error('Hafalan Fetch Error:', e); return null; }),
                studentDashboardService.getTodaySchedule(student.id).catch(e => { console.error('Schedule Fetch Error:', e); return []; }),
                studentDashboardService.getTopScore(student.id).catch(e => { console.error('Top Score Fetch Error:', e); return null; }),
                studentDashboardService.getDisciplinePoints(student.id).catch(e => { console.error('Points Fetch Error:', e); return 100; }),
                studentDashboardService.getRecentViolations(student.id).catch(e => { console.error('Violations Fetch Error:', e); return []; }),
                academicYearService.getActive().catch(e => { console.error('Academic Year Fetch Error:', e); return null; })
            ]);

            setGPAHistory(gpa);
            setHafalanData(hafalan);
            setTodaySchedule(schedule);
            setTopScore(top);
            setDisciplinePoints(points);
            setRecentViolations(recentV);
            setActiveYear(year);
        } catch (err: any) {
            console.error('Error fetching student dashboard data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (isLoading && !studentInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin opacity-40" />
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Menyamakan Portal Santri...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-400 font-sans selection:bg-indigo-500/30">
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="w-full px-4 sm:px-6 py-8 lg:p-10 space-y-10 max-w-[1600px] mx-auto overflow-x-hidden">
                    {/* Welcome Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 text-indigo-400 text-xs font-bold tracking-[0.2em] mb-2 uppercase">
                                <Activity className="w-4 h-4" />
                                Student Portal Integrated
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">Live Sync Alpha</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                Ahlan, <span className="text-indigo-500">{user.name.split(' ')[0]}!</span> 👋
                            </h1>
                            <p className="text-neutral-500 text-sm mt-2 font-medium">Semangat belajar! Data kamu telah tersinkronisasi dengan sistem pusat.</p>
                        </div>

                        <div className="relative group self-start md:self-auto">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex items-center gap-3 px-6 py-3 bg-neutral-900 border border-neutral-800 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(79,70,229,0.1)]">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                {activeYear?.name || 'Tahun Ajaran'}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
                        {/* LEFT COLUMN */}
                        <div className="col-span-12 lg:col-span-8 space-y-8">

                            {/* Stats Cards Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                {[
                                    { label: 'Indeks Prestasi', value: gpaHistory[gpaHistory.length - 1]?.gpa || '0.0', icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                                    { label: 'Hafalan Aktif', value: hafalanData ? (hafalanData.unitLabel ? `${hafalanData.unitLabel} ${hafalanData.currentJuz}` : hafalanData.currentName) : 'No Data', icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                    { label: 'Jadwal Hari Ini', value: todaySchedule.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                    { label: 'Poin Kedisiplinan', value: disciplinePoints.toString(), icon: Star, color: disciplinePoints > 80 ? 'text-rose-500' : 'text-amber-500', bg: 'bg-rose-500/10' },
                                ].map((s, i) => (
                                    <div key={i} className="bg-[#0a0a0a] p-4 sm:p-5 rounded-3xl border border-neutral-800/40 hover:border-indigo-500/20 transition-all group overflow-hidden">
                                        <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color} mb-4 group-hover:scale-110 transition-transform shrink-0`}>
                                            <s.icon className="w-5 h-5" />
                                        </div>
                                        <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1 truncate">{s.label}</p>
                                        <p className="text-xl font-black text-white truncate">{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* GPA Chart Area */}
                            <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                    <TrendingUp className="w-48 h-48" />
                                </div>
                                <div className="mb-10 flex items-center justify-between relative z-10">
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Tren Capaian Akademik</h3>
                                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-1">Indeks Prestasi Kumulatif per Semester</p>
                                    </div>
                                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="h-[300px] w-full relative z-10">
                                    {gpaHistory.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center gap-4 opacity-40">
                                            <TrendingUp className="w-12 h-12 text-neutral-700" />
                                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Belum ada riwayat nilai.</p>
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={gpaHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorGPA" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a" />
                                                <XAxis
                                                    dataKey="semester"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 10, fill: '#525252', fontWeight: 800 }}
                                                    dy={15}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 10, fill: '#525252' }}
                                                    domain={[0, 4]}
                                                />
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: '#0c0c0c', borderRadius: '16px', border: '1px solid #1f1f1f', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', padding: '16px' }}
                                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="gpa"
                                                    stroke="#6366f1"
                                                    strokeWidth={4}
                                                    fillOpacity={1}
                                                    fill="url(#colorGPA)"
                                                    dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#050505' }}
                                                    activeDot={{ r: 7, strokeWidth: 0, fill: '#fff' }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Today's Schedule */}
                            <div className="bg-[#0a0a0a] rounded-[2.5rem] border border-neutral-800/40 shadow-2xl overflow-hidden">
                                <div className="p-8 border-b border-neutral-800/50 flex items-center justify-between bg-neutral-900/40">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-indigo-500" />
                                        Agenda Belajar Hari Ini
                                    </h3>
                                    <button
                                        onClick={() => router.push('/dashboard/santri/jadwal')}
                                        className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1 group"
                                    >
                                        Seluruh Jadwal
                                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                                <div className="p-4 lg:p-8">
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-neutral-600 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-neutral-800/30">
                                                    <th className="pb-5 px-4 w-32">Waktu</th>
                                                    <th className="pb-5 px-4">Mata Pelajaran</th>
                                                    <th className="pb-5 px-4">Pembimbing</th>
                                                    <th className="pb-5 px-4 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-800/20">
                                                {todaySchedule.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="py-16 text-center text-neutral-700 font-bold uppercase text-[10px] tracking-widest italic leading-relaxed">
                                                            No learning sessions scheduled for today.<br />
                                                            Focus on your self-study and memorization.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    todaySchedule.map((item) => (
                                                        <tr key={item.id} className="group hover:bg-neutral-900/30 transition-colors">
                                                            <td className="py-6 px-4 font-bold text-neutral-300 text-sm">{item.time}</td>
                                                            <td className="py-6 px-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center justify-center font-black text-indigo-500 text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                                        {item.subject.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-white text-sm uppercase tracking-tight">{item.subject}</p>
                                                                        <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1 flex items-center gap-1">
                                                                            <MapPin className="w-3 h-3" />
                                                                            {item.room}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-6 px-4 text-neutral-500 text-sm font-medium">{item.teacher}</td>
                                                            <td className="py-6 px-4 text-center">
                                                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${item.status === 'Selesai' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' :
                                                                    item.status === 'Sedang Berlangsung' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)] animate-pulse' :
                                                                        'bg-neutral-900 text-neutral-600 border-neutral-800'
                                                                    }`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="col-span-12 lg:col-span-4 space-y-8">

                            {/* Hafalan Progress Card */}
                            <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-2xl flex flex-col group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-32 h-32" />
                                </div>
                                <div className="w-full mb-8 flex items-center justify-between relative z-10">
                                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Progres Hafalan</h3>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Live Sync</span>
                                    </div>
                                </div>

                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1">Capaian Saat Ini</p>
                                            <h4 className="text-3xl font-black text-white tracking-tighter">{hafalanData?.currentName || 'Belum Ada Data'}</h4>
                                            {hafalanData?.currentDetail && (
                                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">{hafalanData.currentDetail}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1">Target</p>
                                            <p className="text-xl font-black text-neutral-400">{hafalanData?.totalTarget || 30} {hafalanData?.unitLabel || 'Unit'}</p>
                                        </div>
                                    </div>

                                    {/* Premium Progress Bar */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Estimasi Selesai</span>
                                            <span className="text-sm font-black text-white">{hafalanData ? `${hafalanData.totalProgress || 0}%` : '--'}</span>
                                        </div>
                                        <div className="h-3 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800/50 p-[2px]">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                                style={{ width: `${hafalanData ? Math.max(5, hafalanData.totalProgress || 0) : 0}%`, opacity: hafalanData ? 1 : 0 }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-8">
                                        <div className="p-4 bg-[#0c0c0c] rounded-2xl border border-neutral-800/50">
                                            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1 text-center">Tuntas</p>
                                            <p className="text-xl font-black text-white text-center">{hafalanData ? `${hafalanData.completed} ${hafalanData.unitLabel || 'Juz'}` : '--'}</p>
                                        </div>
                                        <div className="p-4 bg-[#0c0c0c] rounded-2xl border border-neutral-800/50">
                                            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1 text-center">Sisa</p>
                                            <p className="text-xl font-black text-indigo-500 text-center">{hafalanData ? `${hafalanData.remaining} ${hafalanData.unitLabel || 'Juz'}` : '--'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Card - Best Subject */}
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-500/20 group relative overflow-hidden cursor-pointer active:scale-95 transition-all">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000 rotate-12">
                                    <Star className="w-32 h-32 fill-white" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                                            Top Performance
                                        </div>
                                        <Award className="w-5 h-5 text-indigo-200" />
                                    </div>
                                    <p className="text-[10px] font-bold text-indigo-100/60 uppercase tracking-widest mb-1">Mata Pelajaran Terbaik</p>
                                    <h4 className="text-2xl font-black tracking-tight mb-4 uppercase">{topScore?.subjects?.name || 'Belum Ada Penilaian'}</h4>
                                    <div className="flex items-end gap-3">
                                        <span className="text-5xl font-black tracking-tighter">{topScore?.score || '--'}</span>
                                        <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-2 opacity-60">Final Grade</span>
                                    </div>
                                </div>
                            </div>

                            {/* Class Info Box */}
                            <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-2xl relative group overflow-hidden">
                                <div className="absolute -right-4 -bottom-4 bg-indigo-500/5 w-24 h-24 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all"></div>
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 shrink-0">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1">Status Keanggotaan</p>
                                        <h4 className="text-lg font-black text-white tracking-tight uppercase">{studentInfo?.classes?.name || 'Belum Ada Kelas'}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Terdaftar Aktif</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #262626; }
            `}</style>
        </div>
    );
}
