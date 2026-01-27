'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
import {
    BookOpen,
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

    const fetchChildHafalan = useCallback(async (child: any) => {
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
    }, []);

    const fetchInitialData = useCallback(async (parentId: string) => {
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
    }, [fetchChildHafalan]);

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
    }, [router, fetchInitialData]);

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
            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto">
                    {/* Header Section - Slimmer */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black tracking-[0.3em] mb-1 uppercase">
                                <Activity className="w-4 h-4" />
                                Qur'an Progress Report
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                                Monitoring <span className="text-orange-500">Hafalan</span>
                            </h1>
                            <p className="text-neutral-500 text-xs mt-1 font-medium">Rekapitulasi setoran hafalan dan penilaian santri.</p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4">
                            {children.length > 1 && (
                                <div className="flex bg-[#0a0a0a] p-1 rounded-xl border border-neutral-800 shadow-lg overflow-x-auto no-scrollbar">
                                    {children.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => fetchChildHafalan(c)}
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
                            <div className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-neutral-800 flex items-center gap-2.5 shadow-lg">
                                <Trophy className="w-3.5 h-3.5 text-orange-500" />
                                Selesai: {summary?.completed || 0} {summary?.unitLabel || 'Unit'}
                            </div>
                        </div>
                    </div>

                    {!activeChild ? (
                        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-3xl p-16 text-center shadow-lg">
                            <Users className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-white">Belum Terhubung</h3>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards - Slimmer */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-neutral-800 shadow-md group relative overflow-hidden">
                                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-3">Target Saat Ini</p>
                                    <div className="flex items-end justify-between relative z-10">
                                        <h4 className="text-xl font-black text-white truncate pr-2 uppercase">{summary?.currentName || (summary?.unitLabel ? `${summary.unitLabel} ${summary.currentJuz}` : '-')}</h4>
                                        <span className="text-orange-500 font-black text-[8px] uppercase tracking-widest shrink-0">Active</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-neutral-900 rounded-full mt-4 overflow-hidden border border-neutral-800">
                                        <div className="h-full bg-orange-600 transition-all duration-1000" style={{ width: `${summary ? Math.max(5, summary.totalProgress || 0) : 0}%` }}></div>
                                    </div>
                                </div>

                                <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-neutral-800 shadow-md group relative overflow-hidden">
                                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-3">Setoran Terakhir</p>
                                    <h4 className="text-xl font-black text-white truncate uppercase">{latestSetoran?.program?.hafalan_type?.name || '-'}</h4>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                        <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                                            {latestSetoran ? `${formatDate(latestSetoran.evaluated_at || latestSetoran.created_at)}` : 'Belum Ada'}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-neutral-800 shadow-md group relative overflow-hidden">
                                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-3">Capaian Kualitas</p>
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${getGradeConfig(latestSetoran?.grade).color}`}>
                                            {latestSetoran?.grade || '-'}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-black uppercase text-[10px] tracking-tight">{getGradeConfig(latestSetoran?.grade).label}</h4>
                                            <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">Status</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* History Section - Slimmer Table */}
                            <div className="bg-[#0a0a0a] rounded-3xl border border-neutral-800 shadow-xl overflow-hidden min-h-0 h-fit">
                                <div className="p-6 border-b border-neutral-800/50 bg-neutral-900/10 flex items-center justify-between">
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <HistoryIcon className="w-4 h-4 text-orange-500" />
                                        Log Riwayat
                                    </h3>
                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-neutral-600">
                                        <Clock className="w-3.5 h-3.5" />
                                        Last Update: {latestSetoran ? formatDate(latestSetoran.evaluated_at || latestSetoran.created_at) : '-'}
                                    </div>
                                </div>

                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-[#0e0e0e] border-b border-neutral-800">
                                                <th className="px-6 py-4 text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em] w-32">Tanggal</th>
                                                <th className="px-6 py-4 text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Program</th>
                                                <th className="px-6 py-4 text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center w-28">Predikat</th>
                                                <th className="px-6 py-4 text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-800/20">
                                            {history.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="py-16 text-center text-[10px] font-bold text-neutral-500 uppercase tracking-widest italic opacity-40">Belum ada riwayat setoran.</td>
                                                </tr>
                                            ) : (
                                                history.map((item) => {
                                                    const cfg = getGradeConfig(item.grade);
                                                    return (
                                                        <tr key={item.id} className="hover:bg-neutral-900/30 transition-all group">
                                                            <td className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase">{formatDate(item.evaluated_at || item.created_at)}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                                                                    <div>
                                                                        <p className="font-bold text-white text-xs uppercase tracking-tight">{item.program?.hafalan_type?.name || 'Program'}</p>
                                                                        <p className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest mt-0.5">
                                                                            {item.program?.hafalan_type?.unit_name || 'Unit'} {item.unit_number} • {item.progress_percentage}%
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${cfg.color}`}>
                                                                    {cfg.label}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="text-[10px] text-neutral-500 italic truncate max-w-[200px] group-hover:max-w-none group-hover:whitespace-normal transition-all">
                                                                    {item.notes || '-'}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Motivation Section - Slimmer */}
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-900 text-white shadow-xl relative overflow-hidden group">
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="max-w-xl">
                                        <h4 className="text-lg font-black uppercase tracking-tight mb-1">Dukungan Untuk Ananda</h4>
                                        <p className="text-orange-100 font-medium opacity-80 text-sm">
                                            Berikan apresiasi terbaik Ayah/Bunda atas setiap progres hafalan yang dicapai ananda.
                                        </p>
                                    </div>
                                    <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/5 font-black uppercase tracking-widest text-[8px]">
                                        Hafalan Berkah
                                    </div>
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
