'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
import {
    BookOpen,
    Search,
    ChevronRight,
    MessageSquare,
    Trophy,
    Target,
    Loader2,
    Users,
    Clock,
    CheckCircle2,
    Activity,
    Star,
    LayoutGrid,
    History as HistoryIcon
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { guardianService } from '@/lib/services/guardian';
import { hafalanService } from '@/lib/services/hafalan';
import { studentDashboardService } from '@/lib/services/student-dashboard';

export default function ProgressTahfidzPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [children, setChildren] = useState<any[]>([]);
    const [activeChild, setActiveChild] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_santri') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchInitialData(currentUser.id);
    }, [router]);

    const fetchInitialData = async (parentId: string) => {
        try {
            const childrenList = await guardianService.getChildren(parentId);
            setChildren(childrenList);
            if (childrenList.length > 0) {
                await fetchChildHafalan(childrenList[0]);
            } else {
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Error fetching initial data:', err);
            setIsLoading(false);
        }
    };

    const fetchChildHafalan = async (child: any) => {
        setIsLoading(true);
        setActiveChild(child);
        try {
            const [historyData, dashboardData] = await Promise.all([
                hafalanService.getByStudent(child.id),
                studentDashboardService.getHafalanData(child.id)
            ]);

            setHistory(historyData);
            setSummary(dashboardData);
        } catch (err) {
            console.error('Error fetching child hafalan:', err);
        } finally {
            setIsLoading(false);
        }
    };

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
        const configs: Record<string, any> = {
            'A': { label: 'Mumtaz', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            'B': { label: 'Jayyid Jiddan', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
            'C': { label: 'Jayyid', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            'D': { label: 'Maqbul', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
            'E': { label: 'Dhaif', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
        };
        return configs[grade] || { label: grade, color: 'text-neutral-400 bg-neutral-900 border-neutral-800' };
    };

    if (isLoading && !activeChild) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin opacity-40" />
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Memuat Laporan Tahfidz...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const latestSetoran = history[0];

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-400 font-sans selection:bg-orange-500/30">
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="px-6 py-8 lg:p-10 space-y-10 max-w-[1500px] mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-orange-500 text-xs font-bold tracking-[0.2em] mb-2 uppercase">
                                <Activity className="w-4 h-4" />
                                Qur'an Progress Report
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                Monitoring <span className="text-orange-500">Hafalan Santri</span>
                            </h1>
                            <p className="text-neutral-500 text-sm mt-2 font-medium">Rekapitulasi setoran hafalan dan penilaian dari Pembimbing Tahfidz.</p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4">
                            {children.length > 1 && (
                                <div className="flex bg-[#0a0a0a] p-1.5 rounded-2xl border border-neutral-800 shadow-xl overflow-x-auto max-w-[300px] md:max-w-none no-scrollbar">
                                    {children.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => fetchChildHafalan(c)}
                                            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${activeChild?.id === c.id
                                                ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]'
                                                : 'text-neutral-600 hover:text-neutral-300'
                                                }`}
                                        >
                                            {c.name.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="px-6 py-3 bg-neutral-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-neutral-800 flex items-center gap-3 shadow-xl">
                                <Trophy className="w-4 h-4 text-orange-500" />
                                Total Selesai: {summary?.completed || 0} {summary?.unitLabel || 'Unit'}
                            </div>
                        </div>
                    </div>

                    {!activeChild ? (
                        <div className="bg-[#0a0a0a] border border-neutral-800/50 rounded-[3rem] p-24 text-center shadow-2xl">
                            <Users className="w-20 h-20 text-neutral-800 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-white">Belum Terhubung</h3>
                            <p className="text-neutral-500 mt-2 font-medium">Hubungi Admin untuk menautkan data putra/putri Anda.</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-xl group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                                        <Star className="w-24 h-24 text-orange-500" />
                                    </div>
                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4">Target {summary?.unitLabel || 'Unit'} Saat Ini</p>
                                    <div className="flex items-end justify-between relative z-10">
                                        <h4 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase truncate pr-4">{summary?.currentName || (summary?.unitLabel ? `${summary.unitLabel} ${summary.currentJuz}` : '-')}</h4>
                                        <span className="text-orange-500 font-black text-[10px] uppercase tracking-widest shrink-0">Active</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-neutral-900 rounded-full mt-6 overflow-hidden border border-neutral-800">
                                        <div className="h-full bg-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.5)] transition-all duration-1000" style={{ width: `${summary ? Math.max(5, summary.totalProgress || 0) : 0}%` }}></div>
                                    </div>
                                </div>

                                <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-xl group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                                        <Clock className="w-24 h-24 text-orange-500" />
                                    </div>
                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4">Setoran Terakhir</p>
                                    <h4 className="text-2xl lg:text-3xl font-black text-white tracking-tighter truncate uppercase">{latestSetoran?.program?.hafalan_type?.name || '-'}</h4>
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none">
                                            {latestSetoran ? `${latestSetoran.program?.hafalan_type?.unit_name || 'Unit'} ${latestSetoran.unit_number} • ${formatDate(latestSetoran.evaluated_at || latestSetoran.created_at)}` : 'Belum Ada Laporan'}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-xl group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                                        <CheckCircle2 className="w-24 h-24 text-orange-500" />
                                    </div>
                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4">Capaian Kualitas</p>
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black ${getGradeConfig(latestSetoran?.grade).color}`}>
                                            {latestSetoran?.grade || '-'}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-black uppercase tracking-tight">{getGradeConfig(latestSetoran?.grade).label}</h4>
                                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Status Kelancaran</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* History Section */}
                            <div className="bg-[#0a0a0a] rounded-[2.5rem] border border-neutral-800/40 shadow-2xl overflow-hidden min-h-[400px]">
                                <div className="p-8 border-b border-neutral-800/50 bg-neutral-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                                            <HistoryIcon className="w-5 h-5 text-orange-500" />
                                            Log Riwayat Hafalan
                                        </h3>
                                        <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-0.5 ml-8">Update berkala dari ustadz/ustadzah tahfidz.</p>
                                    </div>
                                    <div className="flex items-center gap-3 px-5 py-2.5 bg-[#050505] border border-neutral-800 rounded-2xl">
                                        <Clock className="w-4 h-4 text-neutral-700" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                                            Terakhir: {latestSetoran ? formatDate(latestSetoran.evaluated_at || latestSetoran.created_at) : '-'}
                                        </span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-[#0e0e0e] border-b border-neutral-800/50">
                                                <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] w-32">Tanggal</th>
                                                <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Program & Level</th>
                                                <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">Predikat</th>
                                                <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Catatan Pembimbing</th>
                                                <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] w-16"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-800/30">
                                            {history.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-24 text-center">
                                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                                            <LayoutGrid className="w-12 h-12 text-neutral-700" />
                                                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest italic">Belum ada riwayat setoran untuk santri ini.</p>
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
                                                                    <div className="w-10 h-10 bg-orange-500/5 border border-orange-500/10 rounded-xl flex items-center justify-center">
                                                                        <BookOpen className="w-5 h-5 text-orange-500" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-black text-white text-sm uppercase tracking-tight">{item.program?.hafalan_type?.name || 'Program'}</p>
                                                                        <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">
                                                                            {item.program?.hafalan_type?.unit_name || 'Unit'} {item.unit_number} • {item.progress_percentage}% Selesai
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
                                                                <div className="flex items-center gap-3">
                                                                    <MessageSquare className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                                                                    <p className="text-xs text-neutral-500 italic max-w-xs truncate">"{item.notes || 'Ananda menunjukkan antusiasme yang baik.'}"</p>
                                                                </div>
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

                            {/* Motivation Section */}
                            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-600 to-orange-900 text-white shadow-2xl shadow-orange-950/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-120 transition-transform duration-1000 rotate-12">
                                    <Target className="w-40 h-40" />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="max-w-2xl">
                                        <h4 className="text-2xl font-black uppercase tracking-tight mb-2">Apresiasi Untuk Ananda</h4>
                                        <p className="text-orange-100 font-medium opacity-80 text-lg">
                                            Kesuksesan ananda dalam menghafal Al-Qur'an tak lepas dari do'a dan dukungan Ayah/Bunda. Berikan apresiasi terbaik atas setiap progres yang dicapai.
                                        </p>
                                    </div>
                                    <div className="px-8 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 font-black uppercase tracking-widest text-[10px] flex items-center gap-3">
                                        Setoran Lancar & Berkah
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #262626; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
