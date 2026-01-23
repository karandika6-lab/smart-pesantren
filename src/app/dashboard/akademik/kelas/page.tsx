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
    Users,
    Plus,
    Search,
    User as UserIcon,
    Edit,
    Trash2,
    MoreVertical,
    CheckCircle2,
    GraduationCap,
    School
} from 'lucide-react';

import { classesService, ClassWithRelations } from '@/lib/services/classes';
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
    const [selectedClass, setSelectedClass] = useState<any>(null);

    // Promote State
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [promoteFrom, setPromoteFrom] = useState('');
    const [promoteTo, setPromoteTo] = useState('');
    const [isPromoting, setIsPromoting] = useState(false);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_akademik' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchData();
    }, [router]);

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
        } catch (error) {
            console.error('Error fetching classes:', error);
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleOpenAddModal = () => {
        setSelectedClass(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (cls: any) => {
        setSelectedClass(cls);
        setIsModalOpen(true);
    };

    const handleSubmitClass = async (data: any) => {
        try {
            if (selectedClass) {
                await classesService.update(selectedClass.id, data);
            } else {
                await classesService.create(data);
            }
            fetchData();
        } catch (error) {
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
            } catch (error) {
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
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Dashboard
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    <School className="w-7 h-7 text-blue-600" />
                                    Data Kelas & Rombel
                                </h1>
                                <p className="text-gray-500">
                                    Kelola rombongan belajar dan penugasan wali kelas
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsPromoteModalOpen(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
                                >
                                    <GraduationCap className="w-5 h-5" />
                                    Kenaikan Kelas
                                </button>
                                <button
                                    onClick={handleOpenAddModal}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                    Tambah Kelas
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Promote Modal */}
                    {isPromoteModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-6">
                                <div className="flex justify-between items-center border-b pb-4">
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <GraduationCap className="w-6 h-6 text-indigo-600" />
                                        Batch Kenaikan Kelas
                                    </h2>
                                    <button onClick={() => setIsPromoteModalOpen(false)}><Users className="w-5 h-5 text-gray-400" /></button>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Pindahkan seluruh siswa dari satu kelas ke kelas lain secara massal (misal: 7A ke 8A). Pastikan kapasitas mencukupi.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Dari Kelas (Sumber)</label>
                                        <select
                                            value={promoteFrom}
                                            onChange={(e) => setPromoteFrom(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                        >
                                            <option value="">-- Pilih Kelas Asal --</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} (Jml: {studentCounts[c.id] || 0})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex justify-center">
                                        <ArrowLeft className="w-6 h-6 rotate-[-90deg] text-gray-300" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ke Kelas (Tujuan)</label>
                                        <select
                                            value={promoteTo}
                                            onChange={(e) => setPromoteTo(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                        >
                                            <option value="">-- Pilih Kelas Tujuan --</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} (Kapasitas: {c.capacity})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={() => setIsPromoteModalOpen(false)}
                                        className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handlePromote}
                                        disabled={isPromoting}
                                        className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
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

                    {/* Filters */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari nama kelas atau wali kelas..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <select
                                value={filterLevel}
                                onChange={(e) => setFilterLevel(e.target.value)}
                                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-700"
                            >
                                <option value="Semua">Semua Jenjang</option>
                                <option value="Tsanawiyah">Tsanawiyah</option>
                                <option value="Aliyah">Aliyah</option>
                            </select>
                        </div>
                    </div>

                    {/* Classes Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Nama Kelas</th>
                                        <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Jenjang</th>
                                        <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Wali Kelas</th>
                                        <th className="text-center p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Kapasitas</th>
                                        <th className="text-center p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="text-center p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredClasses.map((cls) => {
                                        const isTsanawiyah = cls.grade_level >= 7 && cls.grade_level <= 9;
                                        const currentTotal = studentCounts[cls.id] || 0;
                                        const capacity = cls.capacity || 30;
                                        const fillPercent = Math.min((currentTotal / capacity) * 100, 100);

                                        return (
                                            <tr key={cls.id} className="hover:bg-blue-50/30 transition-colors group">
                                                {/* Nama Kelas */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform ${isTsanawiyah ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700' : 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-700'}`}>
                                                            {cls.grade_level || 'K'}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-gray-800 text-base">{cls.name}</span>
                                                            <p className="text-xs text-gray-400 font-medium mt-0.5">
                                                                TA {cls.academic_year?.name || '2025/2026'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Jenjang */}
                                                <td className="p-4">
                                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-block uppercase tracking-wide ${isTsanawiyah
                                                        ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
                                                        : 'bg-purple-50 text-purple-600 ring-1 ring-purple-100'
                                                        }`}>
                                                        {isTsanawiyah ? 'Tsanawiyah' : 'Aliyah'}
                                                    </span>
                                                </td>

                                                {/* Wali Kelas */}
                                                <td className="p-4">
                                                    {cls.homeroom_teacher?.name ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                                                                {cls.homeroom_teacher.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                                            </div>
                                                            <span className="font-medium text-gray-700">{cls.homeroom_teacher.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-sm">Belum ditugaskan</span>
                                                    )}
                                                </td>

                                                {/* Kapasitas */}
                                                <td className="p-4 text-center">
                                                    <div className="inline-flex flex-col items-center gap-1">
                                                        <span className={`font-bold text-lg ${currentTotal >= capacity ? 'text-rose-600' : currentTotal >= capacity * 0.8 ? 'text-amber-600' : 'text-gray-800'}`}>
                                                            {currentTotal}
                                                            <span className="text-gray-400 font-normal text-sm">/{capacity}</span>
                                                        </span>
                                                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${currentTotal >= capacity ? 'bg-rose-500' : currentTotal >= capacity * 0.8 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                                                style={{ width: `${fillPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="p-4 text-center">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold ring-1 ring-emerald-100">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Aktif
                                                    </span>
                                                </td>

                                                {/* Aksi */}
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleOpenEditModal(cls)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="Edit Kelas"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClass(cls.id)}
                                                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                            title="Hapus Kelas"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {filteredClasses.length === 0 && (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="font-bold text-gray-800">Data tidak ditemukan</h3>
                                <p className="text-gray-500">Coba kata kunci pencarian lain atau pilih jenjang yang berbeda.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
