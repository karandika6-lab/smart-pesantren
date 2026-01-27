'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
import {
    CalendarDays,
    Clock,
    MapPin,
    CheckCircle2,
    Calendar,
    ChevronRight,
    Loader2,
    Activity,
    Info
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { ustadzService } from '@/lib/services/ustadz';
import { academicYearService } from '@/lib/services/academic';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function JadwalMengajarPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeDay, setActiveDay] = useState('Senin');

    // Data state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [weeklySchedule, setWeeklySchedule] = useState<Record<string, any[]>>({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [activeYear, setActiveYear] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async (teacherId: string) => {
        try {
            setIsLoading(true);
            const [scheduleData, yearData] = await Promise.all([
                ustadzService.getFullWeeklySchedule(teacherId),
                academicYearService.getActive()
            ]);

            setWeeklySchedule(scheduleData);
            setActiveYear(yearData);

            const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const today = dayNames[new Date().getDay()];
            if (DAYS.includes(today)) {
                setActiveDay(today);
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'ustadz') {
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

    if (!user) return null;

    const schedules = weeklySchedule[activeDay] || [];

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-400 font-sans selection:bg-indigo-500/30">

            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8 space-y-8 max-w-[1500px] mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-[0.2em] mb-2 uppercase">
                                <Activity className="w-4 h-4" />
                                Agenda Pengajaran
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                Jadwal <span className="text-indigo-500">Mengajar Mingguan</span>
                            </h1>
                            <p className="text-neutral-500 text-sm mt-2 font-medium">Manajemen waktu dan agenda pengajaran rutin Anda.</p>
                        </div>

                        <div className="relative group self-start md:self-auto">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 shadow-[0_0_20px_rgba(79,70,229,0.3)]"></div>
                            <div className="relative flex items-center gap-3 px-6 py-3 bg-neutral-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] border border-neutral-800">
                                <CalendarDays className="w-4 h-4 text-indigo-500" />
                                {activeYear?.name || 'Tahun Ajaran'}
                            </div>
                        </div>
                    </div>

                    {/* Day Selection Tabs */}
                    <div className="flex flex-wrap gap-2 p-1.5 bg-[#0a0a0a] rounded-2xl border border-neutral-800/40 shadow-xl overflow-x-auto custom-scrollbar">
                        {DAYS.map(day => (
                            <button
                                key={day}
                                onClick={() => setActiveDay(day)}
                                className={`flex-1 min-w-[120px] py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all relative overflow-hidden group ${activeDay === day
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'text-neutral-600 hover:bg-neutral-900 hover:text-neutral-300'
                                    }`}
                            >
                                {day}
                                {activeDay === day && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Schedule List */}
                    <div className="space-y-4 min-h-[400px]">
                        {isLoading ? (
                            <div className="py-24 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin opacity-40" />
                                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Menyusun Jadwal Anda...</p>
                            </div>
                        ) : schedules.length > 0 ? (
                            schedules.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-[#0a0a0a] p-5 lg:p-6 rounded-2xl border border-neutral-800/40 hover:border-indigo-500/30 transition-all group flex flex-col md:flex-row md:items-center gap-8 relative overflow-hidden"
                                >
                                    <div className="absolute right-0 top-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform">
                                        <Clock className="w-32 h-32" />
                                    </div>

                                    {/* Time Block */}
                                    <div className="flex items-center gap-5 md:w-56 shrink-0 relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-white tracking-tight">{item.time}</p>
                                            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">KBM Routine</p>
                                        </div>
                                    </div>

                                    {/* Info Block */}
                                    <div className="flex-1 relative z-10">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <span className="px-3 py-1 bg-neutral-900 border border-neutral-800 text-neutral-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                {item.class}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-neutral-600 ml-1">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-bold uppercase tracking-wide">{item.room}</span>
                                            </div>
                                        </div>
                                        <h3 className="text-xl lg:text-2xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                                            {item.subject}
                                        </h3>
                                    </div>

                                    {/* Action/Status */}
                                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-neutral-900 pt-6 md:pt-0 relative z-10">
                                        <span className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${item.status === 'Selesai'
                                            ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10'
                                            : 'bg-indigo-500/5 text-indigo-400 border-indigo-500/10 shadow-[0_0_15px_rgba(79,70,229,0.1)]'
                                            }`}>
                                            {item.status}
                                        </span>
                                        <button className="w-12 h-12 bg-neutral-900 text-neutral-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all border border-neutral-800 hover:border-indigo-500 group-hover:translate-x-1 shadow-lg shadow-black/50">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-[#0a0a0a] rounded-[3rem] border-2 border-dashed border-neutral-800/40 p-20 text-center opacity-60">
                                <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                                    <Calendar className="w-12 h-12 text-neutral-800" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-widest">Tidak Ada Jadwal</h3>
                                <p className="text-neutral-600 max-w-sm mx-auto text-sm font-medium">Persiapkan materi untuk hari berikutnya atau gunakan waktu luang untuk evaluasi santri.</p>
                            </div>
                        )}
                    </div>

                    {/* Pro Tip Section */}
                    <div className="p-6 lg:p-8 bg-gradient-to-br from-indigo-950/40 to-black rounded-2xl border border-indigo-500/20 relative overflow-hidden group shadow-2xl">
                        <div className="absolute right-0 top-0 p-12 opacity-[0.05] group-hover:scale-110 transition-transform duration-1000">
                            <Info className="w-48 h-48 text-indigo-500" />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-indigo-500" />
                                Verifikasi Kehadiran Guru
                            </h4>
                            <p className="text-neutral-400 text-sm max-w-2xl font-medium leading-relaxed uppercase tracking-wide opacity-80">
                                Pastikan Anda melakukan SCAN QR CODE di setiap awal KBM untuk rekapitulasi kehadiran otomatis di sistem pusat pesantren.
                            </p>
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
