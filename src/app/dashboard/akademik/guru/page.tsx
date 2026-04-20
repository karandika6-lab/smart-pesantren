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

                <main className="p-4 lg:p-8 max-w-[1700px] mx-auto overflow-x-hidden">
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
                        teacherData={selectedTeacher ? {
                            id: selectedTeacher.id,
                            name: selectedTeacher.name,
                            nip: selectedTeacher.nip ?? undefined,
                            gender: (selectedTeacher.gender as 'L' | 'P') ?? undefined,
                            specialization: selectedTeacher.specialization ?? undefined,
                            phone: selectedTeacher.phone ?? undefined,
                            address: selectedTeacher.address ?? undefined,
                            email: selectedTeacher.email ?? undefined,
                            is_active: selectedTeacher.is_active ?? undefined,
                        } : undefined}
                    />

                    {/* Filter / Search Area */}
                    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-8 lg:mb-12">
                        <div className="flex-1 relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari NIP atau nama guru..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 lg:py-5 bg-[#0c0c0c] border border-white/5 rounded-2xl lg:rounded-[1.8rem] text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all font-bold text-sm lg:text-base shadow-2xl"
                            />
                        </div>
                        <div className="flex items-center justify-between lg:justify-center gap-6 bg-[#0c0c0c] border border-white/5 rounded-2xl lg:rounded-[1.8rem] px-8 py-4 lg:py-5 shadow-2xl">
                            <div className="flex flex-col lg:items-center">
                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] leading-none mb-1.5">Database</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl lg:text-2xl font-black text-white leading-none">{teachers.length}</span>
                                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hidden lg:block">Guru Aktif</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/5 hidden lg:block mx-2"></div>
                            <button className="lg:hidden p-3 bg-blue-600/10 text-blue-500 rounded-xl border border-blue-500/20">
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content Area - Hybrid Layout */}
                    <div className="bg-[#0b0b0b] border border-white/5 rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden shadow-2xl mb-12">
                        {/* Desktop Table (lg:block) */}
                        <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#0e0e0e]">
                                    <tr className="border-b border-white/5">
                                        <th className="px-10 py-7 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Asatidz/Guru</th>
                                        <th className="px-10 py-7 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Spesialisasi</th>
                                        <th className="px-10 py-7 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Status</th>
                                        <th className="px-10 py-7 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] text-right">Manajemen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredTeachers.map((t) => (
                                        <tr key={t.id} className="group hover:bg-white/[0.01] transition-all">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg border transition-all group-hover:scale-110 shadow-xl ${t.gender === 'L' ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' : 'bg-pink-600/10 border-pink-500/20 text-pink-400'}`}>
                                                        {t.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{t.name}</p>
                                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-1">NIP: {t.nip || '----'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                                                        <UserIcon className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">{t.specialization || 'Guru Umum'}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <button onClick={() => handleToggleStatus(t.id, t.is_active ?? false)} className="flex items-center gap-2 group/btn">
                                                    <div className={`w-2 h-2 rounded-full ${t.is_active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${t.is_active ? 'text-emerald-500' : 'text-rose-500'}`}>{t.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                                </button>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-20 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => handleOpenEditModal(t)} className="p-3 bg-neutral-900 hover:bg-blue-600 text-gray-500 hover:text-white rounded-xl border border-white/5 transition-all"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteTeacher(t.id)} className="p-3 bg-neutral-900 hover:bg-rose-600 text-gray-500 hover:text-white rounded-xl border border-white/5 transition-all"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List (lg:hidden) */}
                        <div className="lg:hidden divide-y divide-white/5">
                            {filteredTeachers.map((t) => (
                                <div key={t.id} className="p-6 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center font-black text-lg border ${t.gender === 'L' ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' : 'bg-pink-600/10 border-pink-500/20 text-pink-400'}`}>
                                                {t.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-white uppercase tracking-tight leading-none">{t.name}</h4>
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mt-2">NIP: {t.nip || '----'}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleToggleStatus(t.id, t.is_active ?? false)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${t.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                                            {t.is_active ? 'Aktif' : 'Non'}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center gap-3">
                                            <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                                            <span className="text-[10px] font-black text-gray-500 uppercase truncate">{t.specialization || 'Umum'}</span>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 px-1">
                                            <button onClick={() => handleOpenEditModal(t)} className="p-3 bg-neutral-900 border border-white/5 text-gray-400 rounded-xl active:scale-90"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteTeacher(t.id)} className="p-3 bg-rose-500/10 border border-rose-500/10 text-rose-500 rounded-xl active:scale-90"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
