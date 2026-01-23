'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    clearSession,
    User,
} from '@/lib/auth';
import {
    Calendar,
    Search,
    Download,
    Clock,
    UserX,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Activity,
    ChevronDown
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { homeroomService } from '@/lib/services/homeroom';
import { attendanceService } from '@/lib/services/attendance';
import * as XLSX from 'xlsx';

// Status styling map (Midnight Optimized)
const STATUS_STYLE: Record<string, string> = {
    hadir: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-glow-emerald',
    sakit: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-glow-amber',
    izin: 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-glow-blue',
    alpha: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-glow-rose',
    telat: 'bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-glow-purple',
};

const STATUS_LABEL: Record<string, string> = {
    hadir: 'Hadir',
    sakit: 'Sakit',
    izin: 'Izin',
    alpha: 'Alpha',
    telat: 'Telat',
};

interface AttendanceRecord {
    id: string;
    studentName: string;
    studentClass: string;
    session: string;
    status: string;
    date: string;
}

export default function RekapAbsensiWaliPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState('');

    // Data state
    const [classInfo, setClassInfo] = useState<any>(null);
    const [rekapData, setRekapData] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Stats
    const [stats, setStats] = useState({
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpha: 0,
        telat: 0
    });

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_kelas') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchInitialData(currentUser.id);
    }, [router]);

    useEffect(() => {
        if (classInfo) {
            fetchAttendanceData();
        }
    }, [selectedDate, classInfo]);

    const fetchInitialData = async (teacherId: string) => {
        try {
            setIsLoading(true);
            const cls = await homeroomService.getClassInfo(teacherId);
            if (!cls) {
                setClassInfo({ name: 'Belum Ada Kelas', id: null });
                setIsLoading(false);
                return;
            }
            setClassInfo(cls);
        } catch (error) {
            console.error('Error fetching class info:', error);
            setIsLoading(false);
        }
    };

    const fetchAttendanceData = async () => {
        if (!classInfo?.id) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const data = await attendanceService.getRekap({ date: selectedDate });
            const classData = data.filter((item: any) =>
                item.classId === classInfo.id
            );

            setRekapData(classData);

            setStats({
                hadir: classData.filter((d: any) => d.status === 'hadir').length,
                sakit: classData.filter((d: any) => d.status === 'sakit').length,
                izin: classData.filter((d: any) => d.status === 'izin').length,
                alpha: classData.filter((d: any) => d.status === 'alpha').length,
                telat: classData.filter((d: any) => d.status === 'telat').length,
            });

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (!user) return null;

    const filteredData = rekapData.filter(item => {
        const matchesSearch = item.studentName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === '' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleExport = () => {
        if (filteredData.length === 0) {
            alert('Tidak ada data yang bisa diekspor untuk filter saat ini.');
            return;
        }

        try {
            const exportData = filteredData.map((item, index) => ({
                'No': index + 1,
                'Nama Santri': item.studentName,
                'Sesi Belajar': item.session,
                'Status': STATUS_LABEL[item.status] || item.status,
                'Tanggal': item.date
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);

            // Set column widths
            const wscols = [
                { wch: 5 },  // No
                { wch: 30 }, // Nama Santri
                { wch: 15 }, // Sesi
                { wch: 12 }, // Status
                { wch: 15 }, // Tanggal
            ];
            ws['!cols'] = wscols;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi");

            const fileName = `Rekap_Absensi_${classInfo?.name || 'Kelas'}_${selectedDate}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Gagal melakukan ekspor data.');
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col lowercase-none">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64 flex-1">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 space-y-10">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-[0.2em] mb-3">
                                <Activity className="w-4 h-4" />
                                Monitoring Presensi
                            </div>
                            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight">
                                Rekap <span className="text-indigo-500 italic">Absensi</span>
                            </h1>
                            <p className="text-neutral-500 font-medium mt-2">
                                Riwayat kehadiran harian santri <span className="text-white font-bold">Kelas {classInfo?.name || '...'}</span>.
                            </p>
                        </div>
                        <div className="flex">
                            <button
                                onClick={handleExport}
                                className="flex items-center justify-center gap-3 px-8 py-4 bg-neutral-900 border border-neutral-800 shadow-xl hover:bg-neutral-800 text-white font-black rounded-2xl transition-all active:scale-95 group"
                            >
                                <Download className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                                <span className="uppercase tracking-[0.2em] text-[10px]">Export Laporan</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Row (Premium Midnight) */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-8">
                        {[
                            { label: 'Hadir', value: stats.hadir, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                            { label: 'Sakit', value: stats.sakit, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                            { label: 'Izin', value: stats.izin, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                            { label: 'Alpha', value: stats.alpha, icon: UserX, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                            { label: 'Telat', value: stats.telat, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-[#0c0c0c] p-8 rounded-[2.5rem] border border-neutral-800 shadow-2xl transition-all hover:bg-neutral-900 group relative overflow-hidden">
                                <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 border ${stat.border} shadow-inner group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="w-6 h-6 shadow-glow" />
                                </div>
                                <p className="text-4xl font-black text-white leading-none tracking-tight">{stat.value}</p>
                                <p className="text-[10px] font-black text-neutral-500 tracking-[0.2em] uppercase mt-4">{stat.label}</p>

                                <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity`}>
                                    <stat.icon className="w-20 h-20 text-white" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters (Midnight Integrated) */}
                    <div className="bg-[#0c0c0c] p-8 rounded-[3rem] border border-neutral-800 shadow-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="relative group">
                                <Search className="w-5 h-5 text-neutral-600 absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cari santri..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-16 pr-8 py-5 bg-neutral-900 border border-neutral-800 rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-black focus:border-indigo-500 font-bold text-white transition-all placeholder:text-neutral-700"
                                />
                            </div>
                            <div className="relative group">
                                <Calendar className="w-5 h-5 text-neutral-600 absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full pl-16 pr-8 py-5 bg-neutral-900 border border-neutral-800 rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-black focus:border-indigo-500 font-bold text-white transition-all color-scheme-dark"
                                />
                            </div>
                            <div className="relative group">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full h-full pl-8 pr-12 py-5 bg-neutral-900 border border-neutral-800 rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-black focus:border-indigo-500 font-black text-xs uppercase tracking-widest text-white transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="hadir">Hadir</option>
                                    <option value="telat">Telat</option>
                                    <option value="sakit">Sakit</option>
                                    <option value="izin">Izin</option>
                                    <option value="alpha">Alpha</option>
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600 group-focus-within:text-indigo-500 transition-colors">
                                    <ChevronDown className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Display - Responsive Midnight Container */}
                    <div className="bg-[#0c0c0c] rounded-[3rem] border border-neutral-800 shadow-2xl overflow-hidden group">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-neutral-900/40 border-b border-neutral-800">
                                    <tr>
                                        <th className="px-10 py-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Data Santri</th>
                                        <th className="px-10 py-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Sesi Belajar</th>
                                        <th className="px-10 py-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] text-center">Status Kehadiran</th>
                                        <th className="px-10 py-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] text-right">Tanggal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/50">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={4} className="px-10 py-32 text-center">
                                                <div className="flex flex-col items-center gap-6">
                                                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                                                    <p className="text-neutral-500 font-black uppercase tracking-[0.3em] text-[10px]">Sinkronisasi Awan...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-10 py-32 text-center text-neutral-600 font-black uppercase tracking-[0.2em] text-xs italic">
                                                Data kosong untuk kriteria ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map((item) => (
                                            <tr key={item.id} className="hover:bg-indigo-500/[0.03] transition-colors group/row">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-indigo-500 font-black text-[10px] border border-neutral-800 group-hover/row:border-indigo-500/30 transition-all">
                                                            {item.studentName.charAt(0)}
                                                        </div>
                                                        <p className="font-black text-white group-hover/row:text-indigo-400 transition-colors tracking-tight">{item.studentName}</p>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className="px-4 py-1.5 bg-neutral-900 text-neutral-400 border border-neutral-800 rounded-xl text-[9px] font-black tracking-[0.2em] uppercase">{item.session}</span>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <span className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-glow-sm ${STATUS_STYLE[item.status]}`}>
                                                        {STATUS_LABEL[item.status] || item.status}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-right text-[10px] font-black text-neutral-600 uppercase tracking-widest tabular-nums">
                                                    {item.date}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View (Premium Midnight Cards) */}
                        <div className="md:hidden p-6 space-y-6 bg-black/40">
                            {isLoading ? (
                                <div className="py-32 flex flex-col items-center justify-center gap-6">
                                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Memuat...</p>
                                </div>
                            ) : filteredData.length === 0 ? (
                                <div className="py-32 text-center text-neutral-600 font-black uppercase tracking-widest text-[10px]">
                                    Log Kosong.
                                </div>
                            ) : (
                                filteredData.map((item) => (
                                    <div key={item.id} className="bg-neutral-900/40 p-8 rounded-[2.5rem] border border-neutral-800 shadow-xl active:scale-[0.98] transition-all group overflow-hidden relative">
                                        <div className="flex items-center justify-between mb-8">
                                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em]">{item.date}</span>
                                            <span className={`px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${STATUS_STYLE[item.status]} border shadow-glow-sm`}>
                                                {STATUS_LABEL[item.status] || item.status}
                                            </span>
                                        </div>
                                        <h4 className="font-black text-white text-xl tracking-tight leading-none mb-6 group-hover:text-indigo-400 transition-colors">{item.studentName}</h4>
                                        <div className="flex items-center justify-between pt-6 border-t border-neutral-800/50">
                                            <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Sesi Belajar</p>
                                            <p className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 uppercase tracking-widest">{item.session}</p>
                                        </div>
                                        {/* Ambient background badge */}
                                        <div className="absolute -right-6 -bottom-6 opacity-[0.02]">
                                            <Activity className="w-24 h-24 text-white" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
