'use client';

import { useEffect, useState } from 'react';
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
    Activity,
    ChevronRight,
    LayoutGrid,
    ArrowRight
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
                await fetchChildAttendance(childrenList[0]);
            } else {
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Error fetching initial data:', err);
            setIsLoading(false);
        }
    };

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

            const counts = data.reduce((acc: any, curr: any) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
            }, { hadir: 0, sakit: 0, izin: 0, alpha: 0 });

            const total = data.length || 1;
            setStats({
                ...counts,
                percentage: Math.round((counts.hadir / total) * 100)
            });
        } catch (err) {
            console.error('Error fetching attendance:', err);
        } finally {
            setIsLoading(false);
        }
    };

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
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 space-y-10 max-w-[1500px] mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-orange-500 text-xs font-bold tracking-[0.2em] mb-2 uppercase">
                                <Activity className="w-4 h-4" />
                                Discipline Monitoring
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                Kehadiran & <span className="text-orange-500">Kedisiplinan Santri</span>
                            </h1>
                            <p className="text-neutral-500 text-sm mt-2 font-medium">Laporan kehadiran harian dan riwayat absensi aktivitas pesantren.</p>
                        </div>

                        {children.length > 1 && (
                            <div className="flex bg-[#0a0a0a] p-1.5 rounded-2xl border border-neutral-800 shadow-xl overflow-x-auto no-scrollbar">
                                {children.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => fetchChildAttendance(c)}
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
                    </div>

                    {!activeChild ? (
                        <div className="bg-[#0a0a0a] border border-neutral-800/50 rounded-[3rem] p-24 text-center shadow-2xl">
                            <Users className="w-20 h-20 text-neutral-800 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-white">Data Belum Tersedia</h3>
                            <p className="text-neutral-500 mt-2 font-medium">Sistem sedang menyiapkan data kehadiran untuk akun Anda.</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Summary Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-xl flex flex-col items-center group">
                                    <div className="w-14 h-14 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <h4 className="text-4xl font-black text-white tracking-tighter">{stats.percentage}%</h4>
                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mt-2 text-center">Rasio Kehadiran</p>
                                </div>
                                <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-xl flex flex-col items-center group">
                                    <div className="w-14 h-14 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <AlertCircle className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <h4 className="text-4xl font-black text-white tracking-tighter">{stats.izin}</h4>
                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mt-2">Total Izin</p>
                                </div>
                                <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-xl flex flex-col items-center group">
                                    <div className="w-14 h-14 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <Calendar className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <h4 className="text-4xl font-black text-white tracking-tighter">{stats.sakit}</h4>
                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mt-2">Total Sakit</p>
                                </div>
                                <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-xl flex flex-col items-center group">
                                    <div className="w-14 h-14 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <XCircle className="w-6 h-6 text-rose-500" />
                                    </div>
                                    <h4 className="text-4xl font-black text-white tracking-tighter">{stats.alpha}</h4>
                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mt-2">Tanpa Ket.</p>
                                </div>
                            </div>

                            {/* Filtering & Search */}
                            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                                <div className="relative w-full md:w-96">
                                    <Search className="w-5 h-5 text-neutral-700 absolute left-5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Cari tanggal atau aktivitas..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-14 pr-6 py-4 bg-[#0a0a0a] border border-neutral-800/50 rounded-2xl focus:outline-none focus:border-orange-500/30 text-white font-medium shadow-xl transition-all"
                                    />
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <button className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-neutral-900 border border-neutral-800 text-neutral-400 font-black rounded-2xl hover:text-white transition-all text-[10px] uppercase tracking-widest">
                                        <Filter className="w-4 h-4" />
                                        Filter Status
                                    </button>
                                </div>
                            </div>

                            {/* Attendance Log Table */}
                            <div className="bg-[#0a0a0a] rounded-[2.5rem] border border-neutral-800/40 shadow-2xl overflow-hidden min-h-[400px]">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-[400px]">
                                        <Loader2 className="w-10 h-10 text-orange-500 animate-spin opacity-40" />
                                    </div>
                                ) : filteredLogs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                                        <div className="w-20 h-20 bg-neutral-900 rounded-[2rem] flex items-center justify-center mb-6 border border-neutral-800 opacity-20">
                                            <CalendarCheck className="w-10 h-10" />
                                        </div>
                                        <p className="font-bold italic uppercase text-[10px] tracking-widest opacity-30">Belum ada riwayat kehadiran tercatat.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left">
                                            <thead className="bg-[#0e0e0e] border-b border-neutral-800/50">
                                                <tr>
                                                    <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] w-48">Tanggal / Hari</th>
                                                    <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Aktivitas / Sesi</th>
                                                    <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">Status</th>
                                                    <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">Jam</th>
                                                    <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Keterangan</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-800/20">
                                                {filteredLogs.map((item) => (
                                                    <tr key={item.id} className="hover:bg-neutral-900/30 transition-all group">
                                                        <td className="px-8 py-7">
                                                            <p className="font-black text-white text-sm uppercase tracking-tight">{item.date}</p>
                                                            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1.5">{item.day}</p>
                                                        </td>
                                                        <td className="px-8 py-7">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-orange-500/5 border border-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-600 transition-all group-hover:shadow-[0_0_15px_rgba(234,88,12,0.3)]">
                                                                    <Clock className="w-4 h-4 text-orange-500 group-hover:text-white" />
                                                                </div>
                                                                <p className="font-bold text-white text-sm uppercase tracking-tight">{item.session}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-7 text-center">
                                                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${item.status === 'Hadir' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.05)]' :
                                                                item.status === 'Izin' ? 'bg-amber-500/5 text-amber-500 border-amber-500/10' :
                                                                    item.status === 'Sakit' ? 'bg-blue-500/5 text-blue-500 border-blue-500/10' :
                                                                        'bg-rose-500/5 text-rose-500 border-rose-500/10'
                                                                }`}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-7 text-center">
                                                            <span className={`text-[10px] font-black tracking-widest uppercase ${item.checkIn !== '-' ? 'text-white' : 'text-neutral-800'}`}>
                                                                {item.checkIn}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-7">
                                                            <p className="text-xs text-neutral-500 font-medium italic max-w-xs truncate">
                                                                "{item.notes || 'Tidak ada catatan khusus.'}"
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
