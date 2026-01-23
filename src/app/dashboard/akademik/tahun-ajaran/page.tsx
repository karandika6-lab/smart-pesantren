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
    Calendar,
    Plus,
    Edit,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    ArrowLeft,
    CalendarDays,
    GraduationCap
} from 'lucide-react';
import { academicYearsService, AcademicYear } from '@/lib/services/academic-years';

export default function TahunAjaranPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [years, setYears] = useState<AcademicYear[]>([]);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        semester: 'ganjil' as 'ganjil' | 'genap',
        start_date: '',
        end_date: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || !['super_admin', 'admin_akademik'].includes(currentUser.role)) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchData();
    }, [router]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await academicYearsService.getAll();
            setYears(data);
        } catch (error) {
            console.error('Error fetching academic years:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const openAddModal = () => {
        setEditingYear(null);
        setFormData({ name: '', semester: 'ganjil', start_date: '', end_date: '' });
        setShowModal(true);
    };

    const openEditModal = (year: AcademicYear) => {
        setEditingYear(year);
        setFormData({
            name: year.name,
            semester: year.semester,
            start_date: year.start_date || '',
            end_date: year.end_date || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingYear) {
                await academicYearsService.update(editingYear.id, formData);
            } else {
                await academicYearsService.create(formData);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error saving:', error);
            alert('Gagal menyimpan data');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetActive = async (id: string) => {
        try {
            await academicYearsService.setActive(id);
            fetchData();
        } catch (error) {
            console.error('Error setting active:', error);
            alert('Gagal mengaktifkan tahun ajaran');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin hapus tahun ajaran ini?')) return;
        try {
            await academicYearsService.delete(id);
            fetchData();
            alert('Tahun ajaran berhasil dihapus!');
        } catch (error: any) {
            console.error('Error deleting:', error);
            const errorMsg = error?.message || error?.code || 'Unknown error';
            alert(`Gagal menghapus: ${errorMsg}\n\nJika masih gagal, jalankan SQL fix-academic-years-rls.sql di Supabase`);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-black flex">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="flex-1 lg:ml-64">
                <DashboardHeader
                    user={user}
                    onMenuClick={() => setSidebarOpen(true)}
                />

                <main className="p-4 lg:p-6">
                    {/* Back Button */}
                    <Link
                        href="/dashboard/akademik"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Dashboard
                    </Link>

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Tahun Ajaran</h1>
                            <p className="text-gray-400">Kelola tahun ajaran dan semester aktif</p>
                        </div>
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Tambah Tahun Ajaran
                        </button>
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                    ) : years.length === 0 ? (
                        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-12 text-center">
                            <CalendarDays className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">Belum Ada Tahun Ajaran</h3>
                            <p className="text-gray-400 mb-6">Tambahkan tahun ajaran pertama untuk memulai</p>
                            <button
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Tambah Tahun Ajaran
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {years.map((year) => (
                                <div
                                    key={year.id}
                                    className={`rounded-2xl border p-6 transition-all ${year.is_active
                                        ? 'bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/20'
                                        : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${year.is_active ? 'bg-emerald-500/30' : 'bg-gray-700/50'
                                                }`}>
                                                <Calendar className={`w-6 h-6 ${year.is_active ? 'text-emerald-400' : 'text-gray-500'
                                                    }`} />
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-lg ${year.is_active ? 'text-emerald-300' : 'text-white'}`}>{year.name}</h3>
                                                <p className={`text-sm capitalize ${year.is_active ? 'text-emerald-400/70' : 'text-gray-400'}`}>
                                                    Semester {year.semester}
                                                </p>
                                            </div>
                                        </div>
                                        {year.is_active && (
                                            <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg shadow-emerald-500/30">
                                                Aktif
                                            </span>
                                        )}
                                    </div>

                                    {year.start_date && year.end_date && (
                                        <p className={`text-sm mb-4 ${year.is_active ? 'text-emerald-400/60' : 'text-gray-500'}`}>
                                            {new Date(year.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            {' - '}
                                            {new Date(year.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    )}

                                    <div className={`flex items-center gap-2 pt-4 border-t ${year.is_active ? 'border-emerald-500/30' : 'border-gray-700/50'}`}>
                                        {!year.is_active && (
                                            <button
                                                onClick={() => handleSetActive(year.id)}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Aktifkan
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openEditModal(year)}
                                            className="p-2 hover:bg-gray-700/50 text-gray-400 hover:text-white rounded-lg transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(year.id)}
                                            className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700">
                        <div className="p-6 border-b border-gray-700">
                            <h3 className="text-lg font-bold text-white">
                                {editingYear ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Nama Tahun Ajaran
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="2025/2026"
                                    required
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Semester
                                </label>
                                <select
                                    value={formData.semester}
                                    onChange={(e) => setFormData({ ...formData, semester: e.target.value as 'ganjil' | 'genap' })}
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                >
                                    <option value="ganjil">Ganjil</option>
                                    <option value="genap">Genap</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                        Tanggal Mulai
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                        Tanggal Selesai
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 border border-gray-600 text-gray-300 font-medium rounded-xl hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        'Simpan'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
