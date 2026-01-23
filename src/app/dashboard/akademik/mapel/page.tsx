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
    BookMarked,
    Plus,
    Search,
    Filter,
    MoreVertical,
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
    const [selectedSubject, setSelectedSubject] = useState<any>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_akademik' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchSubjects();
    }, [router]);

    const fetchSubjects = async () => {
        try {
            setIsLoading(true);
            const data = await subjectsService.getAll(false); // Show all including inactive for admin
            setSubjects(data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching subjects:', error);
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleOpenAddModal = () => {
        setSelectedSubject(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (subject: any) => {
        setSelectedSubject(subject);
        setIsModalOpen(true);
    };

    const handleSubmitSubject = async (data: any) => {
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
        } catch (error) {
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
            } catch (error: any) {
                console.error('Delete error:', error);
                if (error.message?.includes('violates foreign key')) {
                    alert('Gagal menghapus!\n\nMata pelajaran ini masih digunakan di jadwal atau nilai siswa.\n\nHapus data terkait terlebih dahulu, atau nonaktifkan saja melalui Edit.');
                } else {
                    alert('Gagal menghapus mata pelajaran:\n' + (error.message || 'Unknown error'));
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
        const matchesCategory = selectedCategory === 'Semua' || s.category === selectedCategory;
        return matchesSearch && matchesCategory;
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
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Dashboard
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    <BookMarked className="w-7 h-7 text-blue-600" />
                                    Mata Pelajaran
                                </h1>
                                <p className="text-gray-500">
                                    Daftar mata pelajaran Diniyah dan Umum
                                </p>
                            </div>
                            <button
                                onClick={handleOpenAddModal}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/30"
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

                    {/* Filters */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari nama atau kode mapel..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                >
                                    <option value="Semua">Semua Kategori</option>
                                    <option value="Diniyah">Diniyah</option>
                                    <option value="Umum">Umum</option>
                                </select>
                                <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                                    <FileSpreadsheet className="w-4 h-4" />
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Subjects Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Kode</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Nama Mata Pelajaran</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Kategori</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Jam/Minggu</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">KKM</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredSubjects.map((s) => (
                                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 uppercase">
                                                    {s.code}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-medium text-gray-800">{s.name}</span>
                                                {!(s as any).is_active && (
                                                    <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">Non-Aktif</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.category === 'Diniyah'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {s.category || 'Umum'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-gray-600 text-sm">
                                                {s.credit_hours} JP
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="font-bold text-gray-800">75</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenEditModal(s)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSubject(s.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                </main>
            </div>
        </div>
    );
}
