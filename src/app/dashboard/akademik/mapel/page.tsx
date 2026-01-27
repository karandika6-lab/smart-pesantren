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
    FileSpreadsheet,
    Edit,
    Trash2
} from 'lucide-react';

import { subjectsService } from '@/lib/services/academic';
import { Subject } from '@/types/database.types';
import { Loader2 } from 'lucide-react';
import SubjectModal from '@/components/admin/SubjectModal';

export default function MataPelajaranPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Semua');
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    const fetchSubjects = async () => {
        try {
            setIsLoading(true);
            const data = await subjectsService.getAll(false); // Show all including inactive for admin
            setSubjects(data);
            setIsLoading(false);
        } catch (_error) {
            console.error('Error fetching subjects:', _error);
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
            fetchSubjects();
        });
        return () => cancelAnimationFrame(timer);
    }, [router]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleOpenAddModal = () => {
        setSelectedSubject(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (subject: Subject) => {
        setSelectedSubject(subject);
        setIsModalOpen(true);
    };

    const handleSubmitSubject = async (data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            if (selectedSubject) {
                await subjectsService.update(selectedSubject.id, data);
            } else {
                // Add pesantren_id from current user
                const dataWithPesantren = {
                    ...data,
                    pesantren_id: user?.pesantrenId || null
                };
                console.log('Submitting subject data:', dataWithPesantren);
                await subjectsService.create(dataWithPesantren);
            }
            fetchSubjects();
        } catch (error: unknown) {
            console.error('Error saving subject:', error);
            throw error;
        }
    };

    const handleDeleteSubject = async (id: string) => {
        if (confirm('Apakah Anda yakin ingin MENGHAPUS PERMANEN mata pelajaran ini?\n\nPeringatan: Data yang sudah dihapus tidak bisa dikembalikan!')) {
            try {
                await subjectsService.delete(id);
                fetchSubjects();
                alert('Mata pelajaran berhasil dihapus!');
            } catch (error: unknown) {
                console.error('Delete error:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                if (errorMessage.includes('violates foreign key')) {
                    alert('Gagal menghapus!\n\nMata pelajaran ini masih digunakan di jadwal atau nilai siswa.\n\nHapus data terkait terlebih dahulu, atau nonaktifkan saja melalui Edit.');
                } else {
                    alert('Gagal menghapus mata pelajaran:\n' + errorMessage);
                }
            }
        }
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase tracking-widest font-black text-blue-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <span>Loading Mata Pelajaran...</span>
                </div>
            </div>
        );
    }

    const filteredSubjects = subjects.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.code.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesCategory = false;
        if (selectedCategory === 'Semua') {
            matchesCategory = true;
        } else if (selectedCategory === 'Diniyah') {
            matchesCategory = s.category === 'Diniyah' || s.category === 'Agama';
        } else if (selectedCategory === 'Muatan Lokal') {
            matchesCategory = s.category === 'Muatan Lokal' || s.category === 'Umum';
        } else {
            matchesCategory = s.category === selectedCategory;
        }

        return matchesSearch && matchesCategory;
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
                                    Mata Pelajaran
                                </h1>
                                <p className="text-gray-400 mt-1">
                                    Daftar kurikulum mata pelajaran Diniyah dan Umum
                                </p>
                            </div>
                            <button
                                onClick={handleOpenAddModal}
                                className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Tambah Mapel
                            </button>
                        </div>
                    </div>

                    <SubjectModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={handleSubmitSubject}
                        subjectData={selectedSubject}
                    />

                    {/* Stats & Filters */}
                    <div className="flex flex-col lg:flex-row gap-6 mb-8">
                        <div className="flex-1 relative">
                            <Search className="w-6 h-6 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari nama atau kode mapel..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-neutral-900/40 border border-white/5 rounded-[1.5rem] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all backdrop-blur-sm"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-neutral-900/40 border border-white/5 rounded-[1.5rem] p-1.5 flex items-center backdrop-blur-sm">
                                {['Semua', 'Diniyah', 'Muatan Lokal'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedCategory === cat
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'text-gray-500 hover:text-white'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <button className="p-4 bg-neutral-900 border border-white/5 rounded-2xl text-gray-500 hover:text-white transition-all active:scale-90 shadow-lg">
                                <FileSpreadsheet className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* List Layout */}
                    <div className="bg-[#0c0c0c]/60 backdrop-blur-xl rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden group">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#0a0a0a]/50 border-b border-neutral-800">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest w-12">No</th>
                                        <th className="text-left px-6 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest w-32">Kode</th>
                                        <th className="text-left px-6 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest">Nama Mata Pelajaran</th>
                                        <th className="text-center px-6 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest">Kategori</th>
                                        <th className="text-center px-6 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest">Durasi</th>
                                        <th className="text-center px-6 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest">KKM</th>
                                        <th className="text-center px-6 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest">Status</th>
                                        <th className="text-center px-6 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest w-32">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/50">
                                    {filteredSubjects.map((s, index) => (
                                        <tr key={s.id} className="hover:bg-blue-600/5 transition-colors group/row">
                                            <td className="px-6 py-4 text-[10px] font-black text-neutral-700">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-[10px] font-black text-blue-500 tracking-widest font-mono">
                                                    {s.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-black text-white group-hover/row:text-blue-400 transition-colors uppercase tracking-tight">{s.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${(s.category === 'Diniyah' || s.category === 'Agama') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                                    {s.category === 'Umum' ? 'Muatan Lokal' : (s.category === 'Agama' ? 'Diniyah' : s.category)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[10px] font-bold text-neutral-400">{s.credit_hours || 2} JP</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[10px] font-bold text-neutral-400">75</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {(s as Subject & { is_active?: boolean }).is_active === false ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] font-black text-rose-500 uppercase tracking-widest">
                                                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                                                        Inactive
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2 opacity-60 group-hover/row:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleOpenEditModal(s)}
                                                        className="p-2 bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 hover:bg-blue-500/10 text-neutral-500 hover:text-blue-500 rounded-xl transition-all"
                                                        title="Edit Mapel"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSubject(s.id)}
                                                        className="p-2 bg-neutral-900 border border-neutral-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-neutral-500 hover:text-rose-500 rounded-xl transition-all"
                                                        title="Hapus Mapel"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {filteredSubjects.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 bg-neutral-900/40 border border-white/5 rounded-[3rem]">
                            <div className="w-20 h-20 bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                                <Search className="w-10 h-10 text-gray-600" />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2">Mapel tidak ditemukan</h3>
                            <p className="text-gray-500 max-w-xs text-center">
                                Coba kata kunci nama atau kode mata pelajaran yang berbeda.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
