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
    User as UserIcon,
    Mail,
    Phone,
    CheckCircle2,
    XCircle,
    Edit,
    Trash2
} from 'lucide-react';

import { teachersService, TeacherWithProfile } from '@/lib/services/teachers';
import { Loader2 } from 'lucide-react';
import TeacherModal from '@/components/admin/TeacherModal';

interface Credentials {
    email?: string;
    password?: string;
}

export default function DataGuruPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [teachers, setTeachers] = useState<TeacherWithProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithProfile | null>(null);

    const fetchTeachers = async () => {
        try {
            setIsLoading(true);
            const data = await teachersService.getAll();
            setTeachers(data);
            setIsLoading(false);
        } catch (_error) {
            console.error('Error fetching teachers:', _error);
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
            fetchTeachers();
        });
        return () => cancelAnimationFrame(timer);
    }, [router]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleOpenAddModal = () => {
        setSelectedTeacher(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (teacher: TeacherWithProfile) => {
        setSelectedTeacher(teacher);
        setIsModalOpen(true);
    };

    const handleSubmitTeacher = async (data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            if (selectedTeacher) {
                // When updating, only send fields that exist in teachers table
                const updateData = {
                    name: data.name,
                    nip: data.nip || null,
                    gender: data.gender,
                    specialization: data.specialization || null,
                    phone: data.phone || null,
                    address: data.address || null,
                    is_active: data.is_active ?? true
                };
                await teachersService.update(selectedTeacher.id, updateData);
            } else {
                // Create new - RPC will handle user creation
                const result = await teachersService.create(data);

                // Show generated credentials if available
                const creds = result as unknown as Credentials;
                if (result && creds.email && creds.password) {
                    setTimeout(() => {
                        alert(`✅ Guru berhasil ditambahkan!\n\n📧 Email: ${creds.email}\n🔑 Password: ${creds.password}\n\nSimpan informasi ini untuk login guru.`);
                    }, 500);
                }
            }
            fetchTeachers();
        } catch (error: unknown) {
            console.error('Error saving teacher:', error);
            throw error;
        }
    };

    const handleDeleteTeacher = async (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus data guru ini?')) {
            try {
                await teachersService.delete(id);
                fetchTeachers();
            } catch {
                alert('Gagal menghapus data guru. Pastikan tidak ada data terkait (jadwal, dsb) yang masih menggunakan guru ini.');
            }
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await teachersService.update(id, { is_active: !currentStatus });
            fetchTeachers();
        } catch {
            alert('Gagal mengubah status guru');
        }
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase tracking-widest font-black text-blue-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <span>Loading Data Guru...</span>
                </div>
            </div>
        );
    }

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.nip && t.nip.includes(searchQuery))
    );

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
                                    Data Guru & Pengajar
                                </h1>
                                <p className="text-gray-400 mt-1">
                                    Kelola profil and tugas mengajar asatidz/asatidzah
                                </p>
                            </div>
                            <button
                                onClick={handleOpenAddModal}
                                className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Tambah Guru Baru
                            </button>
                        </div>
                    </div>

                    <TeacherModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={handleSubmitTeacher}
                        teacherData={selectedTeacher}
                    />

                    {/* Filter / Search */}
                    <div className="flex flex-col lg:flex-row gap-6 mb-8">
                        <div className="flex-1 relative">
                            <Search className="w-6 h-6 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari NIP atau nama guru..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-neutral-900/40 border border-white/5 rounded-[1.5rem] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all backdrop-blur-sm"
                            />
                        </div>
                        <div className="flex items-center gap-4 bg-neutral-900/40 border border-white/5 rounded-[1.5rem] px-6 py-4 backdrop-blur-sm">
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none">Total Pengajar</p>
                            <span className="text-xl font-black text-blue-500 leading-none">{teachers.length}</span>
                        </div>
                    </div>

                    {/* Teachers Table Area */}
                    <div className="bg-neutral-900/60 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-sm shadow-2xl">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5">
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Asatidz / Guru</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Spesialisasi</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Gender</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Kontak</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredTeachers.map((t) => (
                                        <tr key={t.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shadow-lg border transition-transform group-hover:scale-110 ${t.gender === 'L'
                                                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                        : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                                                        }`}>
                                                        {t.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors uppercase">{t.name}</p>
                                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-0.5">NIP: {t.nip || '---'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-white/5 flex items-center justify-center">
                                                        <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-300">{t.specialization || 'Guru Umum'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${t.gender === 'L'
                                                    ? 'bg-blue-500/5 border-blue-500/10 text-blue-500'
                                                    : 'bg-pink-500/5 border-pink-500/10 text-pink-500'
                                                    }`}>
                                                    {t.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex gap-1.5">
                                                    <button className="p-2 bg-neutral-800 hover:bg-neutral-700 text-gray-500 hover:text-white rounded-lg border border-white/5 transition-colors" title="Email">
                                                        <Mail className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button className="p-2 bg-neutral-800 hover:bg-neutral-700 text-gray-500 hover:text-white rounded-lg border border-white/5 transition-colors" title="Phone">
                                                        <Phone className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <button
                                                    onClick={() => handleToggleStatus(t.id, t.is_active)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 bg-black/40 border border-white/5 rounded-full transition-all active:scale-95`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${t.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`}></div>
                                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${t.is_active ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {t.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenEditModal(t)}
                                                        className="p-2.5 bg-neutral-800 hover:bg-blue-600 text-gray-500 hover:text-white rounded-xl border border-white/5 transition-all active:scale-95"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTeacher(t.id)}
                                                        className="p-2.5 bg-neutral-800 hover:bg-rose-600 text-gray-500 hover:text-white rounded-xl border border-white/5 transition-all active:scale-95"
                                                        title="Hapus"
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

                    {filteredTeachers.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 bg-neutral-900/40 border border-white/5 rounded-[3rem]">
                            <div className="w-20 h-20 bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                                <UserIcon className="w-10 h-10 text-gray-600" />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2">Guru tidak ditemukan</h3>
                            <p className="text-gray-500 max-w-xs text-center">
                                Coba kata kunci pencarian NIP atau nama yang berbeda.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
