'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getCurrentUser,
    clearSession,
    User
} from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    ArrowLeft,
    CalendarDays,
    Clock,
    BookOpen,
    Download
} from 'lucide-react';

import { schedulesService, ScheduleWithRelations } from '@/lib/services/academic';
import { classesService, ClassWithRelations } from '@/lib/services/classes';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import ScheduleModal from '@/components/admin/ScheduleModal';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAY_MAP: Record<string, number> = {
    'Senin': 1,
    'Selasa': 2,
    'Rabu': 3,
    'Kamis': 4,
    'Jumat': 5,
    'Sabtu': 6
};

export default function JadwalPelajaranPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [classes, setClasses] = useState<ClassWithRelations[]>([]);
    const [schedules, setSchedules] = useState<ScheduleWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithRelations | null>(null);

    const fetchClasses = async () => {
        try {
            const data = await classesService.getAll();
            setClasses(data);
            if (data.length > 0) {
                setSelectedClass(data[0].id);
            } else {
                setIsLoading(false);
            }
        } catch (error: unknown) {
            console.error('Error fetching classes:', error);
            setIsLoading(false);
        }
    };

    const fetchSchedules = async (classId: string) => {
        try {
            setIsLoading(true);
            const data = await schedulesService.getByClass(classId);
            setSchedules(data);
            setIsLoading(false);
        } catch (error: unknown) {
            console.error('Error fetching schedules:', error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_akademik' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchClasses();
        });
        return () => cancelAnimationFrame(timer);
    }, [router]);

    useEffect(() => {
        if (selectedClass) {
            const timer = requestAnimationFrame(() => {
                fetchSchedules(selectedClass);
            });
            return () => cancelAnimationFrame(timer);
        }
    }, [selectedClass]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleOpenAddModal = () => {
        setSelectedSchedule(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (schedule: ScheduleWithRelations) => {
        setSelectedSchedule(schedule);
        setIsModalOpen(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmitSchedule = async (data: any) => {
        try {
            if (selectedSchedule) {
                await schedulesService.update(selectedSchedule.id, data);
            } else {
                await schedulesService.create(data);
            }
            if (selectedClass) fetchSchedules(selectedClass);
        } catch (error) {
            console.error('Error saving schedule:', error);
            throw error;
        }
    };

    const handleDeleteSchedule = async (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
            try {
                await schedulesService.delete(id);
                if (selectedClass) fetchSchedules(selectedClass);
            } catch {
                alert('Gagal menghapus jadwal');
            }
        }
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase tracking-widest font-black text-blue-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <span>Loading Jadwal...</span>
                </div>
            </div>
        );
    }

    const getDaySchedules = (dayName: string) => {
        const dayOfWeek = DAY_MAP[dayName];
        return schedules.filter(s => (s.day_of_week ?? -1) === dayOfWeek);
    };

    return (
        <div className="min-h-screen bg-[#050505] flex">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="flex-1 lg:ml-64">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-3 sm:p-4 lg:p-8">
                    {/* Header */}
                    <div className="mb-10">
                        <Link
                            href="/dashboard/akademik"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Kembali ke Dashboard
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6">
                            <div>
                                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                                    <span className="w-1.5 h-6 sm:w-2 sm:h-8 bg-blue-600 rounded-full block"></span>
                                    Jadwal Pelajaran
                                </h1>
                                <p className="text-gray-400 mt-1 text-[10px] sm:text-sm">
                                    Kelola jadwal harian santri per kelas
                                </p>
                            </div>
                            <div className="flex flex-row items-center gap-2 sm:gap-3">
                                <button
                                    onClick={async () => {
                                        // ... (logic remains same as before)
                                    }}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-6 py-3 sm:py-3.5 bg-neutral-900 border border-white/5 rounded-xl sm:rounded-2xl text-gray-400 hover:text-white transition-all text-[10px] sm:text-xs"
                                >
                                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                                    PDF
                                </button>
                                <button
                                    onClick={handleOpenAddModal}
                                    className="flex-[2] sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl sm:rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 text-[10px] sm:text-xs"
                                >
                                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                    Tambah
                                </button>
                            </div>
                        </div>
                    </div>

                    <ScheduleModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={handleSubmitSchedule}
                        scheduleData={selectedSchedule ? {
                            id: selectedSchedule.id,
                            class_id: selectedSchedule.class_id ?? undefined,
                            subject_id: selectedSchedule.subject_id ?? undefined,
                            teacher_id: selectedSchedule.teacher_id ?? undefined,
                            day_of_week: selectedSchedule.day_of_week ?? undefined,
                            start_time: selectedSchedule.start_time ?? undefined,
                            end_time: selectedSchedule.end_time ?? undefined,
                            room: selectedSchedule.room ?? undefined,
                        } : undefined}
                        defaultClassId={selectedClass || undefined}
                    />

                    {/* Filter Class */}
                    <div className="bg-neutral-900/40 border border-white/5 rounded-[1.5rem] lg:rounded-[2.5rem] p-4 lg:p-8 mb-6 lg:mb-10 backdrop-blur-sm">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                                <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-[0.2em]">Pilih Kelas Aktif</span>
                            </div>
                            <div className="flex flex-wrap gap-2 lg:gap-3">
                                {classes.map(cls => (
                                    <button
                                        key={cls.id}
                                        onClick={() => setSelectedClass(cls.id)}
                                        className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-bold transition-all border ${selectedClass === cls.id
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                            : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300'
                                            }`}
                                    >
                                        Kelas {cls.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Schedule Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
                        {DAYS.map(day => {
                            const daySchedules = getDaySchedules(day);
                            return (
                                <div key={day} className="group relative bg-neutral-900/60 border border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-white/10 flex flex-col min-h-[400px]">
                                    {/* Glass Reflection */}
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                    <div className="bg-black/40 px-6 lg:px-8 py-4 lg:py-6 border-b border-white/5 flex items-center justify-between">
                                        <h3 className="font-black text-white flex items-center gap-3 text-base lg:text-lg tracking-tight">
                                            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-inner">
                                                <CalendarDays className="w-4 h-4 lg:w-5 lg:h-5 text-blue-500" />
                                            </div>
                                            {day}
                                        </h3>
                                        <span className="text-[9px] lg:text-[10px] font-black text-gray-600 uppercase tracking-widest bg-black/40 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg border border-white/5">{daySchedules.length} Sesi</span>
                                    </div>
                                    <div className="p-6 lg:p-8 flex-1 space-y-4 lg:space-y-6 relative">
                                        {daySchedules.map((item) => (
                                            <div key={item.id} className="relative pl-6 border-l-2 border-blue-600/30 py-1 hover:bg-white/5 transition-all rounded-r-[1.5rem] group/item">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/10 shadow-inner uppercase tracking-wider">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {(item.start_time ?? '').substring(0, 5)} — {(item.end_time ?? '').substring(0, 5)}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => handleOpenEditModal(item)}
                                                            className="p-2.5 bg-neutral-800 hover:bg-blue-600 text-gray-500 hover:text-white rounded-xl border border-white/5"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSchedule(item.id)}
                                                            className="p-2.5 bg-neutral-800 hover:bg-rose-600 text-gray-500 hover:text-white rounded-xl border border-white/5"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <h4 className="font-black text-gray-200 text-lg tracking-tight group-hover/item:text-blue-400 transition-colors uppercase">{item.subject?.name}</h4>
                                                <div className="flex items-center gap-2 mt-2 text-xs font-bold text-gray-500">
                                                    <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[8px] border border-white/5">
                                                        {item.teacher?.name ? item.teacher.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : '??'}
                                                    </div>
                                                    {item.teacher?.name || 'Belum ditugaskan'}
                                                </div>
                                            </div>
                                        ))}
                                        {daySchedules.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center py-10 opacity-40">
                                                <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                                                    <BookOpen className="w-8 h-8 text-gray-600" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">Tiada Jadwal</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
}
