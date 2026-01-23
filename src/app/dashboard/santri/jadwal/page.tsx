'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
import {
    CalendarDays,
    Clock,
    User as TeacherIcon,
    MapPin,
    ChevronRight,
    Loader2,
    BookOpen,
    Activity,
    Calendar,
    LayoutGrid,
    Star
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { supabase } from '@/lib/supabase';
import { studentDashboardService } from '@/lib/services/student-dashboard';

const DAYS = [
    { label: 'Senin', value: 1 },
    { label: 'Selasa', value: 2 },
    { label: 'Rabu', value: 3 },
    { label: 'Kamis', value: 4 },
    { label: 'Jumat', value: 5 },
    { label: 'Sabtu', value: 6 },
    { label: 'Minggu', value: 0 },
];

export default function JadwalPelajaranPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeDay, setActiveDay] = useState(1); // Monday
    const [schedule, setSchedule] = useState<any[]>([]);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'santri') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);

        const today = new Date().getDay();
        setActiveDay(today);

        fetchData(currentUser.id);
    }, [router]);

    const fetchData = async (userId: string) => {
        try {
            setIsLoading(true);
            const { data: student, error: sError } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (sError) throw sError;

            const scheduleData = await studentDashboardService.getWeeklySchedule(student.id);
            setSchedule(scheduleData);
        } catch (err) {
            console.error('Error fetching weekly schedule:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (isLoading && schedule.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin opacity-40" />
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Memuat Jadwal Santri...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const filteredSchedule = schedule.filter(item => item.day_of_week === activeDay);

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-400 font-sans selection:bg-indigo-500/30">
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 space-y-10 max-w-[1500px] mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-[0.2em] mb-2 uppercase">
                                <Activity className="w-4 h-4" />
                                Weekly Routine
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                Jadwal <span className="text-indigo-500">Pelajaran Mingguan</span>
                            </h1>
                            <p className="text-neutral-500 text-sm mt-2 font-medium">Manajemen waktu belajar anda sepekan untuk hasil yang maksimal.</p>
                        </div>
                    </div>

                    {/* Day Selection Tabs */}
                    <div className="no-scrollbar flex overflow-x-auto p-1.5 gap-1.5 bg-[#0a0a0a] rounded-[2rem] border border-neutral-800/40 shadow-xl">
                        {DAYS.map(day => (
                            <button
                                key={day.value}
                                onClick={() => setActiveDay(day.value)}
                                className={`flex-1 min-w-[100px] py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${activeDay === day.value
                                    ? 'bg-indigo-600 text-white shadow-[0_10px_20px_rgba(79,70,229,0.3)]'
                                    : 'text-neutral-600 hover:text-neutral-400 hover:bg-neutral-900/50'
                                    }`}
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>

                    {/* Schedule Content Table */}
                    <div className="bg-[#0a0a0a] rounded-[2.5rem] border border-neutral-800/40 shadow-2xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.01] pointer-events-none group-hover:scale-110 transition-transform duration-[2000ms]">
                            <CalendarDays className="w-64 h-64" />
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#0e0e0e] border-b border-neutral-800/50">
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] w-48">Jam / Waktu</th>
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Mata Pelajaran</th>
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Ustadz / Guru</th>
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">Ruangan</th>
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/20">
                                    {filteredSchedule.length > 0 ? (
                                        filteredSchedule.map((item) => (
                                            <tr key={item.id} className="hover:bg-neutral-900/30 transition-all group">
                                                <td className="px-8 py-7">
                                                    <div className="flex items-center gap-3">
                                                        <Clock className="w-4 h-4 text-indigo-500/50" />
                                                        <span className="font-black text-white text-sm">{item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-7">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center justify-center font-black text-indigo-500 text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-[0_0_15px_rgba(79,70,229,0.05)]">
                                                            {item.subjects?.name?.charAt(0) || 'K'}
                                                        </div>
                                                        <span className="font-bold text-white text-sm uppercase tracking-tight">{item.subjects?.name || 'Kegiatan Pesantren'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-7">
                                                    <div className="flex items-center gap-3">
                                                        <TeacherIcon className="w-4 h-4 text-neutral-700" />
                                                        <span className="font-bold text-neutral-500 text-sm whitespace-nowrap">{item.teachers?.name || 'Ustadz / Ustadzah'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-7 text-center">
                                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-600 rounded-xl text-[9px] font-black uppercase tracking-widest group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        {item.room || 'Aula Utama'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-7 text-right">
                                                    <button className="p-2.5 bg-neutral-900 text-neutral-700 rounded-xl hover:bg-neutral-800 hover:text-white transition-all border border-neutral-800">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-40">
                                                    <LayoutGrid className="w-12 h-12 text-neutral-700" />
                                                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest italic">Tidak ada agenda pengajaran di hari ini.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tip Information */}
                    <div className="p-8 rounded-[2.5rem] bg-[#0c0c0c] border border-neutral-800/40 shadow-xl flex items-center gap-6 group">
                        <div className="w-14 h-14 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.05)] group-hover:scale-110 transition-transform">
                            <Star className="w-6 h-6 fill-current" />
                        </div>
                        <div>
                            <h4 className="text-white font-black uppercase tracking-widest text-xs">Pesan Pagi:</h4>
                            <p className="text-neutral-500 text-sm font-medium mt-1">Disiplin adalah jembatan antara cita-cita dan pencapaian. Selamat beraktivitas!</p>
                        </div>
                    </div>
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
