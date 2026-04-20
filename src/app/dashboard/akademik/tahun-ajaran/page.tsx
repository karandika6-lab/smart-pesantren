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
    Plus,
    Edit,
    Trash2,
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

                <main className="p-4 lg:p-8 max-w-[1700px] mx-auto overflow-x-hidden">
                    {/* Back Button */}
                    <Link
                        href="/dashboard/akademik"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        <span className="text-sm font-medium uppercase font-black tracking-widest text-[10px]">Dashboard Akademik</span>
                    </Link>

                    {/* Academic Year List - Correct DOM Structure */}
                    <div className="bg-[#0b0b0b] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">
                        {/* Header Container */}
                        <div className="p-8 lg:p-10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
                                    <span className="w-1.5 h-6 bg-emerald-500 rounded-full block"></span>
                                    Tahun Ajaran
                                </h1>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Kelola periode akademik aktif</p>
                            </div>
                            <button
                                onClick={openAddModal}
                                className="flex items-center gap-3 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Tambah Periode
                            </button>
                        </div>

                        {/* Content Area */}
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin opacity-20" />
                                <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Sinkronisasi Data...</p>
                            </div>
                        ) : years.length === 0 ? (
                            <div className="py-24 text-center">
                                <div className="w-20 h-20 bg-neutral-900 border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <CalendarDays className="w-10 h-10 text-neutral-700" />
                                </div>
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Belum Ada Periode Akademik</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {years.map((year, index) => (
                                    <div key={year.id} className="group p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.01] transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-center font-black text-sm text-gray-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-xl">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg text-white uppercase tracking-tight group-hover:text-emerald-500 transition-colors">{year.name}</h3>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">{year.semester}</span>
                                                    {year.is_active && (
                                                        <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/10 rounded text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                                                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                                                            Aktif Sekarang
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {!year.is_active && (
                                                <button 
                                                    onClick={() => handleSetActive(year.id)}
                                                    className="px-5 py-2.5 bg-neutral-900 hover:bg-emerald-600 text-gray-500 hover:text-white border border-white/5 transition-all rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95"
                                                >
                                                    Aktifkan
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => openEditModal(year)}
                                                className="p-3 bg-neutral-900 hover:bg-white/10 text-gray-500 hover:text-white border border-white/5 transition-all rounded-xl active:scale-95"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {!year.is_active && (
                                                <button 
                                                    onClick={() => handleDelete(year.id)}
                                                    className="p-3 bg-neutral-900 hover:bg-rose-600/10 text-gray-500 hover:text-rose-500 border border-white/5 transition-all rounded-xl active:scale-95"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Modal - Modern Design */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0b0b0b] border border-white/10 rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-white/5">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                                {editingYear ? 'Perbarui Data' : 'Tahun Ajaran Baru'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Nama Periode</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: 2025/2026"
                                    required
                                    className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Pilih Semester</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['ganjil', 'genap'] as const).map((sem) => (
                                        <button
                                            key={sem}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, semester: sem })}
                                            className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.semester === sem
                                                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/20'
                                                : 'bg-black/40 border-white/5 text-gray-600'
                                                }`}
                                        >
                                            {sem}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Mulai</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Selesai</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm font-bold"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 bg-neutral-900 text-gray-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:text-white transition-all active:scale-95"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                                >
                                    {isSubmitting ? 'Simpan...' : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
