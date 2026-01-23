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
    User as UserIcon,
    Search,
    BookOpen,
    Download,
    Filter
} from 'lucide-react';

import { schedulesService, ScheduleWithRelations } from '@/lib/services/academic';
import { classesService } from '@/lib/services/classes';
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
    const [classes, setClasses] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<ScheduleWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_akademik' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchClasses();
    }, [router]);

    useEffect(() => {
        if (selectedClass) {
            fetchSchedules(selectedClass);
        }
    }, [selectedClass]);

    const fetchClasses = async () => {
        try {
            const data = await classesService.getAll();
            setClasses(data);
            if (data.length > 0) {
                setSelectedClass(data[0].id);
            } else {
                setIsLoading(false);
            }
        } catch (error) {
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
        } catch (error) {
            console.error('Error fetching schedules:', error);
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleOpenAddModal = () => {
        setSelectedSchedule(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (schedule: any) => {
        setSelectedSchedule(schedule);
        setIsModalOpen(true);
    };

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
            } catch (error) {
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
        return schedules.filter(s => s.day_of_week === dayOfWeek);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8">
                    {/* Header */}
                    <div className="mb-6">
                        <Link
                            href="/dashboard/akademik"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Dashboard
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    <CalendarDays className="w-7 h-7 text-blue-600" />
                                    Jadwal Pelajaran
                                </h1>
                                <p className="text-gray-500">
                                    Kelola jadwal harian santri per kelas
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                </button>
                                <button
                                    onClick={handleOpenAddModal}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/30"
                                >
                                    <Plus className="w-4 h-4" />
                                    Tambah Jadwal
                                </button>
                            </div>
                        </div>
                    </div>

                    <ScheduleModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={handleSubmitSchedule}
                        scheduleData={selectedSchedule}
                        defaultClassId={selectedClass || undefined}
                    />

                    {/* Filter Class */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-8">
                        <div className="flex items-center gap-4">
                            <span className="font-medium text-gray-700">Pilih Kelas:</span>
                            <div className="flex flex-wrap gap-2">
                                {classes.map(cls => (
                                    <button
                                        key={cls.id}
                                        onClick={() => setSelectedClass(cls.id)}
                                        className={`px-4 py-2 rounded-xl border transition-all ${selectedClass === cls.id
                                            ? 'bg-blue-600 border-blue-600 text-white font-bold'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                                            }`}
                                    >
                                        Kelas {cls.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Schedule Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {DAYS.map(day => {
                            const daySchedules = getDaySchedules(day);
                            return (
                                <div key={day} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                                    <div className="bg-blue-50 p-4 border-b border-blue-100/50">
                                        <h3 className="font-bold text-blue-800 flex items-center gap-2 text-lg">
                                            <CalendarDays className="w-5 h-5 text-blue-600" />
                                            {day}
                                        </h3>
                                    </div>
                                    <div className="p-4 flex-1 space-y-4">
                                        {daySchedules.map((item) => (
                                            <div key={item.id} className="relative pl-4 border-l-2 border-blue-200 py-1 hover:bg-blue-50/50 transition-colors rounded-r-lg group">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                        <Clock className="w-3 h-3" />
                                                        {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleOpenEditModal(item)}
                                                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-white rounded shadow-sm"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSchedule(item.id)}
                                                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-white rounded shadow-sm"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <h4 className="font-bold text-gray-800 text-base">{item.subject?.name}</h4>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                    <UserIcon className="w-3.5 h-3.5" />
                                                    {item.teacher?.name || 'Belum diatur'}
                                                </div>
                                            </div>
                                        ))}
                                        {daySchedules.length === 0 && (
                                            <div className="py-8 text-center text-gray-400 italic text-sm">
                                                Libur / Tidak ada jadwal
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
