'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
import {
    Award,
    BookOpen,
    ChevronRight,
    Clock,
    Loader2,
    Activity,
    Star,
    History as HistoryIcon,
    LayoutGrid
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { supabase } from '@/lib/supabase';
import { hafalanService } from '@/lib/services/hafalan';
import { studentDashboardService } from '@/lib/services/student-dashboard';

export default function ProgressHafalanPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [studentInfo, setStudentInfo] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [history, setHistory] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [summary, setSummary] = useState<any>(null);

    const fetchData = async (userId: string) => {
        try {
            setIsLoading(true);
            const { data: student, error: sError } = await supabase
                .from('students')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (sError) throw sError;
            setStudentInfo(student);

            const [historyData, dashboardData] = await Promise.all([
                hafalanService.getByStudent(student.id),
                studentDashboardService.getHafalanData(student.id)
            ]);

            setHistory(historyData);
            setSummary(dashboardData);
        } catch (err) {
            console.error('Error fetching hafalan history:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'santri') {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchData(currentUser.id);
        });
        return () => cancelAnimationFrame(timer);

    }, [router]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getGradeConfig = (grade: string | null) => {
        if (!grade) return { label: '-', color: 'text-neutral-500 bg-neutral-900 border-neutral-800' };
        const configs: Record<string, { label: string; color: string }> = {
            'A': { label: 'Mumtaz', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            'B': { label: 'Jayyid Jidda', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
            'C': { label: 'Jayyid', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            'D': { label: 'Maqbul', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
            'E': { label: 'Dhaif', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
        };
        return configs[grade] || { label: grade, color: 'text-neutral-400 bg-neutral-900 border-neutral-800' };
    };

    if (isLoading && !studentInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin opacity-40" />
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Menyinkronkan Riwayat Hafalan...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const latestSetoran = history[0];

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-400 font-sans selection:bg-indigo-500/30">

            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="px-6 py-8 lg:p-10 space-y-10 max-w-[1500px] mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-[0.2em] mb-2 uppercase">
                                <Activity className="w-4 h-4" />
                                Achievement Tracking
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                Progress <span className="text-indigo-500">Hafalan & Tahfidz</span>
                            </h1>
                            <p className="text-neutral-500 text-sm mt-2 font-medium">Lacak capaian hapalan harian dan target bulanan Anda.</p>
                        </div>

                        <div className="relative group self-start md:self-auto">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 shadow-[0_0_20px_rgba(79,70,229,0.3)]"></div>
                            <div className="relative flex items-center gap-3 px-6 py-3 bg-neutral-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] border border-neutral-800">
                                <BookOpen className="w-4 h-4 text-indigo-500" />
                                Total: {summary?.completed || 0} {summary?.unitLabel || 'Unit'} Selesai
                            </div>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-xl group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                                <Star className="w-24 h-24" />
                            </div>
                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4">Target {summary?.unitLabel || 'Unit'} Aktif</p>
                            <div className="flex items-end justify-between relative z-10">
                                <h4 className="text-2xl lg:text-3xl font-black text-white tracking-tighter truncate pr-2">{summary?.programName || (summary?.unitLabel + ' ' + summary?.currentJuz) || '?'}</h4>
                                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0">In Progress</span>
                            </div>
                            <div className="w-full h-1.5 bg-neutral-900 rounded-full mt-6 overflow-hidden border border-neutral-800">
                                <div
                                    className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000"
                                    style={{ width: `${summary ? Math.max(5, summary.totalProgress || 0) : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-xl group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                                <Clock className="w-24 h-24" />
                            </div>
                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4">Setoran Terakhir</p>
                            <h4 className="text-2xl lg:text-3xl font-black text-white tracking-tighter truncate uppercase">{latestSetoran?.program?.hafalan_type?.name || '-'}</h4>
                            <div className="mt-3 flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none">
                                    {latestSetoran ? `${summary?.unitLabel || 'Unit'} ${latestSetoran.unit_number} • Tuntas` : 'Belum Ada Setoran'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-xl group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                                <Award className="w-24 h-24" />
                            </div>
                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4">Predikat Terakhir</p>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black ${getGradeConfig(latestSetoran?.grade).color}`}>
                                    {latestSetoran?.grade || '-'}
                                </div>
                                <div>
                                    <h4 className="text-white font-black uppercase tracking-tight">{getGradeConfig(latestSetoran?.grade).label}</h4>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Evaluasi Ustadz</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="bg-[#0a0a0a] rounded-[2.5rem] border border-neutral-800/40 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-neutral-800/50 bg-neutral-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                                    <HistoryIcon className="w-5 h-5 text-indigo-500" />
                                    Log Book Setoran
                                </h3>
                                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-0.5 ml-8">Riwayat harian evaluasi hafalan.</p>
                            </div>
                            <div className="flex items-center gap-3 px-5 py-2.5 bg-[#050505] border border-neutral-800 rounded-2xl">
                                <Clock className="w-4 h-4 text-neutral-700" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Update: {formatDate(latestSetoran?.evaluated_at || latestSetoran?.created_at)}</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#0e0e0e] border-b border-neutral-800/50">
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] w-32">Tanggal</th>
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Program & Target</th>
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">Predikat</th>
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Catatan</th>
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/30">
                                    {history.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-40">
                                                    <LayoutGrid className="w-12 h-12 text-neutral-700" />
                                                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest italic">Belum ada riwayat setoran tercatat.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        history.map((item) => {
                                            const cfg = getGradeConfig(item.grade);
                                            return (
                                                <tr key={item.id} className="hover:bg-neutral-900/30 transition-all group">
                                                    <td className="px-8 py-6 text-sm font-bold text-neutral-300">{formatDate(item.evaluated_at || item.created_at)}</td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center justify-center">
                                                                <BookOpen className="w-5 h-5 text-indigo-500" />
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-white text-sm uppercase tracking-tight">{item.program?.hafalan_type?.name || 'Program'}</p>
                                                                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">
                                                                    {item.program?.hafalan_type?.unit_name || 'Unit'} {item.unit_number} • {item.progress_percentage}% Tuntas
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${cfg.color}`}>
                                                            {cfg.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="text-xs text-neutral-500 italic max-w-xs truncate">{item.notes || 'Tidak ada catatan khusus.'}</p>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button className="p-2.5 bg-neutral-900 text-neutral-700 rounded-xl hover:bg-neutral-800 hover:text-white transition-all border border-neutral-800">
                                                            <ChevronRight className="w-4 h-4 text-neutral-500" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #262626; }
            `}</style>
        </div>
    );
}
