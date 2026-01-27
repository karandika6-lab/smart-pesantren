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
    Plus,
    Search,
    Edit,
    Trash2,
    CheckCircle2,
    GraduationCap,
    X
} from 'lucide-react';

import { classesService, ClassWithRelations } from '@/lib/services/classes';
import { ClassInsert, ClassUpdate } from '@/types/database.types';
import { Loader2 } from 'lucide-react';
import ClassModal from '@/components/admin/ClassModal';

export default function ManajemenKelasPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLevel, setFilterLevel] = useState('Semua');
    const [classes, setClasses] = useState<ClassWithRelations[]>([]);
    const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState<ClassWithRelations | null>(null);

    // Promote State
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [promoteFrom, setPromoteFrom] = useState('');
    const [promoteTo, setPromoteTo] = useState('');
    const [isPromoting, setIsPromoting] = useState(false);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [classesData, counts] = await Promise.all([
                classesService.getAll(),
                classesService.getStudentCounts()
            ]);
            setClasses(classesData);
            setStudentCounts(counts);
            setIsLoading(false);
        } catch (error: unknown) {
            console.error('Error fetching classes:', error);
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
            fetchData();
        });
        return () => cancelAnimationFrame(timer);
    }, [router]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleOpenAddModal = () => {
        setSelectedClass(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (cls: ClassWithRelations) => {
        setSelectedClass(cls);
        setIsModalOpen(true);
    };

    const handleSubmitClass = async (data: ClassInsert | ClassUpdate) => {
        try {
            if (selectedClass) {
                await classesService.update(selectedClass.id, data);
            } else {
                await classesService.create(data as ClassInsert);
            }
            fetchData();
        } catch (error: unknown) {
            console.error('Error saving class:', error);
            throw error;
        }
    };

    const handlePromote = async () => {
        if (!promoteFrom || !promoteTo) {
            alert('Mohon pilih kelas asal dan tujuan!');
            return;
        }
        if (promoteFrom === promoteTo) {
            alert('Kelas asal dan tujuan tidak boleh sama!');
            return;
        }

        if (!confirm('Anda yakin ingin memindahkan SELURUH siswa dari kelas asal ke kelas tujuan? Tindakan ini tidak dapat dibatalkan dengan mudah.')) return;

        setIsPromoting(true);
        try {
            const res = await classesService.promoteStudents(promoteFrom, promoteTo);
            alert(`Berhasil memindahkan ${res.moved_count} siswa!`);
            setIsPromoteModalOpen(false);
            setPromoteFrom('');
            setPromoteTo('');
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Gagal melakukan kenaikan kelas.');
        } finally {
            setIsPromoting(false);
        }
    };

    const handleDeleteClass = async (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus kelas ini? Semua data terkait (jadwal, dsb) mungkin akan hilang.')) {
            try {
                await classesService.delete(id);
                fetchData();
            } catch {
                alert('Gagal menghapus kelas. Pastikan tidak ada data santri yang terhubung.');
            }
        }
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase tracking-widest font-black text-blue-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <span>Loading Data Kelas...</span>
                </div>
            </div>
        );
    }

    const filteredClasses = classes.filter(cls => {
        const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (cls.homeroom_teacher?.name.toLowerCase().includes(searchQuery.toLowerCase()));

        const isTsanawiyah = cls.grade_level >= 7 && cls.grade_level <= 9;
        const isAliyah = cls.grade_level >= 10 && cls.grade_level <= 12;

        const matchesLevel = filterLevel === 'Semua' ||
            (filterLevel === 'Tsanawiyah' && isTsanawiyah) ||
            (filterLevel === 'Aliyah' && isAliyah);

        return matchesSearch && matchesLevel;
    });

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

                <main className="p-4 lg:p-8">
                    {/* Header */}
                    <div className="mb-10">
                        <Link
                            href="/dashboard/akademik"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Kembali ke Dashboard
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                                    <span className="w-2 h-8 bg-blue-600 rounded-full block"></span>
                                    Data Kelas & Rombel
                                </h1>
                                <p className="text-gray-400 mt-1">
                                    Kelola rombongan belajar dan penugasan wali kelas
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => setIsPromoteModalOpen(true)}
                                    className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
                                >
                                    <GraduationCap className="w-5 h-5" />
                                    Kenaikan Kelas
                                </button>
                                <button
                                    onClick={handleOpenAddModal}
                                    className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                    Tambah Kelas
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Promote Modal */}
                    {isPromoteModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                            <div className="bg-neutral-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300 p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                                        <GraduationCap className="w-6 h-6 text-indigo-500" />
                                        Batch Kenaikan Kelas
                                    </h2>
                                    <button
                                        onClick={() => setIsPromoteModalOpen(false)}
                                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                                <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl mb-8">
                                    <p className="text-sm text-indigo-300 font-medium leading-relaxed">
                                        Pindahkan seluruh siswa secara massal. Pastikan kapasitas kelas tujuan mencukupi sebelum memproses.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Dari Kelas (Sumber)</label>
                                        <select
                                            value={promoteFrom}
                                            onChange={(e) => setPromoteFrom(e.target.value)}
                                            className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        >
                                            <option value="" className="bg-neutral-900">-- Pilih Kelas Asal --</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id} className="bg-neutral-900">{c.name} (Santri: {studentCounts[c.id] || 0})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex justify-center relative -my-4 z-10">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg border-4 border-neutral-900">
                                            <ArrowLeft className="w-5 h-5 rotate-[-90deg] text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Ke Kelas (Tujuan)</label>
                                        <select
                                            value={promoteTo}
                                            onChange={(e) => setPromoteTo(e.target.value)}
                                            className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        >
                                            <option value="" className="bg-neutral-900">-- Pilih Kelas Tujuan --</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id} className="bg-neutral-900">{c.name} (Kapasitas: {c.capacity})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-8 flex gap-4">
                                    <button
                                        onClick={() => setIsPromoteModalOpen(false)}
                                        className="flex-1 py-4 bg-neutral-800 hover:bg-neutral-700 text-gray-400 font-bold rounded-2xl transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handlePromote}
                                        disabled={isPromoting}
                                        className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isPromoting ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                        Proses Kenaikan
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal */}
                    <ClassModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={handleSubmitClass}
                        classData={selectedClass}
                    />

                    {/* Filters & Stats */}
                    <div className="flex flex-col lg:flex-row gap-6 mb-8">
                        <div className="flex-1 relative">
                            <Search className="w-6 h-6 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari nama kelas atau wali kelas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-neutral-900/40 border border-white/5 rounded-[1.5rem] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all backdrop-blur-sm"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-neutral-900/40 border border-white/5 rounded-[1.5rem] p-1 flex items-center backdrop-blur-sm">
                                {['Semua', 'Tsanawiyah', 'Aliyah'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setFilterLevel(level)}
                                        className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${filterLevel === level
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'text-gray-500 hover:text-white'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Classes Grid - Better for 3D UI than just a table */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClasses.map((cls) => {
                            const isTsanawiyah = cls.grade_level >= 7 && cls.grade_level <= 9;
                            const currentTotal = studentCounts[cls.id] || 0;
                            const capacity = cls.capacity || 30;
                            const fillPercent = Math.min((currentTotal / capacity) * 100, 100);

                            return (
                                <div
                                    key={cls.id}
                                    className="group relative bg-neutral-900/60 border border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_50px_rgba(37,99,235,0.1)] hover:-translate-y-1"
                                >
                                    {/* 3D Glass Effect Overlay */}
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                    <div className="p-7">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border transition-transform group-hover:scale-110 duration-500 ${isTsanawiyah
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                                    }`}>
                                                    {cls.grade_level}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-white tracking-tight">{cls.name}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isTsanawiyah ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
                                                            }`}>
                                                            {isTsanawiyah ? 'Tsanawiyah' : 'Aliyah'}
                                                        </span>
                                                        <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                            TA {cls.academic_year?.name || '2025/2026'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => handleOpenEditModal(cls)}
                                                    className="p-2.5 bg-neutral-800 hover:bg-blue-600 text-gray-400 hover:text-white rounded-xl border border-white/5 transition-all active:scale-95"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClass(cls.id)}
                                                    className="p-2.5 bg-neutral-800 hover:bg-rose-600 text-gray-400 hover:text-white rounded-xl border border-white/5 transition-all active:scale-95"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-5">
                                            {/* Homeroom Teacher */}
                                            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-[10px] shadow-lg border border-white/10 shrink-0">
                                                    {cls.homeroom_teacher?.name ? cls.homeroom_teacher.name.split(' ').map(n => n[0]).slice(0, 2).join('') : '??'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Wali Kelas</p>
                                                    <p className="text-sm font-bold text-gray-300 truncate">
                                                        {cls.homeroom_teacher?.name || 'Belum ditugaskan'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Capacity Progress */}
                                            <div className="space-y-2 px-1">
                                                <div className="flex justify-between items-end">
                                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Kapasitas Kelas</p>
                                                    <p className="text-sm font-black text-white">
                                                        {currentTotal}
                                                        <span className="text-gray-600 font-bold ml-1">/ {capacity}</span>
                                                    </p>
                                                </div>
                                                <div className="h-2 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/5">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${currentTotal >= capacity ? 'bg-rose-500' : currentTotal >= capacity * 0.8 ? 'bg-amber-500' : 'bg-blue-500'
                                                            }`}
                                                        style={{ width: `${fillPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-emerald-400">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Status Aktif</span>
                                            </div>
                                            <Link
                                                href={`/dashboard/akademik/kelas/anggota?id=${cls.id}`}
                                                className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors"
                                            >
                                                Lihat Santri →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredClasses.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 bg-neutral-900/40 border border-white/5 rounded-[2.5rem]">
                            <div className="w-20 h-20 bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                                <Search className="w-10 h-10 text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Data tidak ditemukan</h3>
                            <p className="text-gray-500 max-w-xs text-center">
                                Coba kata kunci pencarian lain atau pilih filter jenjang yang berbeda.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
