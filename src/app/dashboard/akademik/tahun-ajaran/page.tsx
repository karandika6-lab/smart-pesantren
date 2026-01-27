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
    Loader2,
    ArrowLeft,
    CalendarDays
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

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || !['super_admin', 'admin_akademik'].includes(currentUser.role)) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchData();
    }, [router]);

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
        } catch (error: unknown) {
            console.error('Error deleting:', error);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            alert(`Gagal menghapus: ${errorMsg}\n\nJika masih gagal, jalankan SQL fix-academic-years-rls.sql di Supabase`);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050505] flex">
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

                <main className="p-4 lg:p-8">
                    {/* Back Button */}
                    <Link
                        href="/dashboard/akademik"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        <span className="text-sm font-medium">Kembali ke Dashboard</span>
                    </Link>

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                                <span className="w-2 h-8 bg-emerald-500 rounded-full block"></span>
                                Tahun Ajaran
                            </h1>
                            <p className="text-gray-400 mt-1">Kelola periode akademik dan status semester aktif</p>
                        </div>
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            Tambah Tahun Ajaran
                        </button>
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                            <p className="text-gray-500 font-medium animate-pulse">Memuat data akadmik...</p>
                        </div>
                    ) : years.length === 0 ? (
                        <div className="relative overflow-hidden bg-neutral-900/40 rounded-3xl border border-white/5 p-16 text-center backdrop-blur-sm">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
                            <div className="w-20 h-20 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                                <CalendarDays className="w-10 h-10 text-gray-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Belum Ada Tahun Ajaran</h3>
                            <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                                Belum ada data tahun ajaran yang tercatat. Silakan buat tahun ajaran baru untuk memulai operasional akademik.
                            </p>
                            <button
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Buat Tahun Ajaran Pertama
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {years.map((year) => (
                                <div
                                    key={year.id}
                                    className={`group relative rounded-[2rem] border transition-all duration-300 ${year.is_active
                                        ? 'bg-gradient-to-br from-emerald-500/10 via-neutral-900 to-neutral-900 border-emerald-500/40 shadow-[0_20px_50px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/20'
                                        : 'bg-neutral-900/60 border-white/5 hover:border-emerald-500/30'
                                        }`}
                                >
                                    {/* 3D Reflection Effect */}
                                    <div className="absolute top-0 left-0 w-full h-full rounded-[2rem] bg-gradient-to-tr from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="p-7">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-110 ${year.is_active
                                                    ? 'bg-emerald-500/20 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                                    : 'bg-neutral-800 border-white/5 shadow-inner'
                                                    }`}>
                                                    <Calendar className={`w-7 h-7 ${year.is_active ? 'text-emerald-400' : 'text-gray-500'}`} />
                                                </div>
                                                <div>
                                                    <h3 className={`font-black text-xl tracking-tight leading-tight ${year.is_active ? 'text-white' : 'text-gray-300'}`}>
                                                        {year.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${year.is_active
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : 'bg-neutral-800 text-gray-500'}`}
                                                        >
                                                            Semester {year.semester}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {year.is_active && (
                                                <div className="flex h-8 items-center px-3 bg-emerald-500 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-tighter">Aktif</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className={`p-4 rounded-2xl mb-6 flex flex-col gap-2 ${year.is_active ? 'bg-black/40' : 'bg-neutral-950/40'}`}>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-500 font-medium">Rentang Waktu</span>
                                            </div>
                                            {year.start_date && year.end_date ? (
                                                <p className={`text-sm font-bold tracking-tight ${year.is_active ? 'text-emerald-400' : 'text-gray-400'}`}>
                                                    {new Date(year.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    <span className="mx-2 opacity-50">•</span>
                                                    {new Date(year.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-600 italic">Belum diatur</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!year.is_active ? (
                                                <button
                                                    onClick={() => handleSetActive(year.id)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl text-sm font-bold transition-all border border-emerald-500/20 hover:border-emerald-500"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Aktifkan
                                                </button>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/5 text-emerald-500/40 rounded-xl text-sm font-bold border border-emerald-500/10">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Sedang Aktif
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 ml-2">
                                                <button
                                                    onClick={() => openEditModal(year)}
                                                    className="p-3 bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 active:scale-90"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(year.id)}
                                                    className="p-3 bg-neutral-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-all border border-white/5 active:scale-90"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
                    <div className="bg-neutral-900 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-white/10 overflow-hidden transition-all scale-100 animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16"></div>
                            <h3 className="text-xl font-black text-white relative z-10 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                                {editingYear ? 'Perbarui Tahun Ajaran' : 'Tahun Ajaran Baru'}
                            </h3>
                            <p className="text-gray-500 text-sm mt-2">Atur periode akademik untuk operasional sekolah</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
                                    Nama Tahun Ajaran
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: 2025/2026"
                                    required
                                    className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
                                    Pilih Semester
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['ganjil', 'genap'].map((sem) => (
                                        <button
                                            key={sem}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, semester: sem as 'ganjil' | 'genap' })}
                                            className={`py-3.5 rounded-2xl text-sm font-bold capitalize transition-all border ${formData.semester === sem
                                                ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                                                : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20'
                                                }`}
                                        >
                                            {sem}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
                                        Mulai
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
                                        Selesai
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 py-4 bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-white font-bold rounded-2xl transition-all disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-95"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Proses...
                                        </>
                                    ) : (
                                        'Simpan Data'
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
