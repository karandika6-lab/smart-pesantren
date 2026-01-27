'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
import {
    CalendarCheck,
    Search,
    Filter,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Calendar,
    Loader2,
    Users,
    Activity
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { guardianService } from '@/lib/services/guardian';
import { attendanceService } from '@/lib/services/attendance';

export default function KehadiranSantriPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [children, setChildren] = useState<any[]>([]);
    const [activeChild, setActiveChild] = useState<any>(null);
    const [attendanceLog, setAttendanceLog] = useState<any[]>([]);
    const [stats, setStats] = useState({ hadir: 0, sakit: 0, izin: 0, alpha: 0, percentage: 0 });
    const [searchQuery, setSearchQuery] = useState('');

    const fetchChildAttendance = async (child: any) => {
        setIsLoading(true);
        setActiveChild(child);
        try {
            const data = await attendanceService.getStudentHistory(child.id);
            const formatted = data.map((item: any) => ({
                id: item.id,
                date: new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
                day: new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long' }),
                status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                checkIn: item.check_in_time ? item.check_in_time.slice(0, 5) : '-',
                session: item.session || item.type || 'Kegiatan Umum',
                notes: item.notes
            }));

            setAttendanceLog(formatted);

            const counts = data.reduce((acc: Record<string, number>, curr: any) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
            }, { hadir: 0, sakit: 0, izin: 0, alpha: 0 } as Record<string, number>);

            const total = data.length || 1;
            setStats({
                hadir: counts.hadir || 0,
                sakit: counts.sakit || 0,
                izin: counts.izin || 0,
                alpha: counts.alpha || 0,
                percentage: Math.round(((counts.hadir || 0) / total) * 100)
            });
        } catch (err) {
            console.error('Error fetching attendance:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInitialData = useCallback(async (parentId: string) => {
        try {
            const childrenList = await guardianService.getChildren(parentId);
            setChildren(childrenList);
            if (childrenList.length > 0) {
                await fetchChildAttendance(childrenList[0]);
            } else {
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Error fetching initial data:', err);
            setIsLoading(false);
        }
    }, []);

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

    if (isLoading && !activeChild) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin opacity-40" />
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Menyinkronkan Data Kehadiran...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const filteredLogs = attendanceLog.filter(log =>
        log.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.session.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                                Discipline Monitoring
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                                Kehadiran & <span className="text-orange-500">Kedisiplinan</span>
                            </h1>
                            <p className="text-neutral-500 text-xs mt-1 font-medium">Laporan kehadiran harian dan riwayat absensi santri.</p>
                        </div>

                        {children.length > 1 && (
                            <div className="flex bg-[#0a0a0a] p-1 rounded-xl border border-neutral-800 shadow-lg overflow-x-auto no-scrollbar">
                                {children.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => fetchChildAttendance(c)}
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
                    </div>

                    {!activeChild ? (
                        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-3xl p-16 text-center shadow-lg">
                            <Users className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-white">Data Belum Tersedia</h3>
                        </div>
                    ) : (
                        <>
                            {/* Stats Cards - Slimmer */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-neutral-800 shadow-md flex flex-col items-center group">
                                    <div className="w-10 h-10 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <h4 className="text-2xl font-black text-white tracking-tighter">{stats.percentage}%</h4>
                                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mt-1 text-center">Kehadiran</p>
                                </div>
                                <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-neutral-800 shadow-md flex flex-col items-center group">
                                    <div className="w-10 h-10 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                                        <AlertCircle className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <h4 className="text-2xl font-black text-white tracking-tighter">{stats.izin}</h4>
                                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mt-1">Total Izin</p>
                                </div>
                                <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-neutral-800 shadow-md flex flex-col items-center group">
                                    <div className="w-10 h-10 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                                        <Calendar className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <h4 className="text-2xl font-black text-white tracking-tighter">{stats.sakit}</h4>
                                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mt-1">Total Sakit</p>
                                </div>
                                <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-neutral-800 shadow-md flex flex-col items-center group">
                                    <div className="w-10 h-10 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center justify-center mb-4">
                                        <XCircle className="w-5 h-5 text-rose-500" />
                                    </div>
                                    <h4 className="text-2xl font-black text-white tracking-tighter">{stats.alpha}</h4>
                                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mt-1">Tanpa Ket.</p>
                                </div>
                            </div>

                            {/* Filtering - Slimmer */}
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="relative w-full md:w-80">
                                    <Search className="w-4 h-4 text-neutral-700 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Cari tanggal..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-neutral-800 rounded-xl focus:outline-none focus:border-orange-500/30 text-white text-sm transition-all"
                                    />
                                </div>
                                <button className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 border border-neutral-800 text-neutral-400 font-black rounded-xl hover:text-white transition-all text-[9px] uppercase tracking-widest">
                                    <Filter className="w-3.5 h-3.5" />
                                    Filter Status
                                </button>
                            </div>

                            {/* Table - Slimmer rows */}
                            <div className="bg-[#0a0a0a] rounded-3xl border border-neutral-800 shadow-xl overflow-hidden min-h-0 h-fit">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-[300px]">
                                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin opacity-40" />
                                    </div>
                                ) : filteredLogs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                                        <CalendarCheck className="w-10 h-10 opacity-20 mb-4" />
                                        <p className="font-bold uppercase text-[9px] tracking-widest opacity-30">Belum ada riwayat kehadiran.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left">
                                            <thead className="bg-[#0e0e0e] border-b border-neutral-800">
                                                <tr>
                                                    <th className="px-6 py-4 text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em] w-40">Tanggal</th>
                                                    <th className="px-6 py-4 text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Sesi</th>
                                                    <th className="px-6 py-4 text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center w-28">Status</th>
                                                    <th className="px-6 py-4 text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center w-24">Jam</th>
                                                    <th className="px-6 py-4 text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-800/20">
                                                {filteredLogs.map((item) => (
                                                    <tr key={item.id} className="hover:bg-neutral-900/30 transition-all group">
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-white text-xs uppercase tracking-tight">{item.date}</p>
                                                            <p className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest mt-1">{item.day}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <Clock className="w-3.5 h-3.5 text-neutral-700" />
                                                                <p className="font-bold text-white text-xs uppercase tracking-tight">{item.session}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${item.status === 'Hadir' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' :
                                                                item.status === 'Izin' ? 'bg-amber-500/5 text-amber-500 border-amber-500/10' :
                                                                    item.status === 'Sakit' ? 'bg-blue-500/5 text-blue-500 border-blue-500/10' :
                                                                        'bg-rose-500/5 text-rose-500 border-rose-500/10'
                                                                }`}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`text-[9px] font-black tracking-widest uppercase ${item.checkIn !== '-' ? 'text-white' : 'text-neutral-800'}`}>
                                                                {item.checkIn}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-[10px] text-neutral-500 font-medium italic truncate max-w-[150px]">
                                                                {item.notes || '-'}
                                                            </p>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
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
