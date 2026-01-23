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
    GraduationCap,
    Plus,
    Search,
    User as UserIcon,
    Mail,
    Phone,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Edit,
    Trash2
} from 'lucide-react';

import { teachersService, TeacherWithProfile } from '@/lib/services/teachers';
import { Loader2 } from 'lucide-react';
import TeacherModal from '@/components/admin/TeacherModal';

export default function DataGuruPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [teachers, setTeachers] = useState<TeacherWithProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_akademik' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchTeachers();
    }, [router]);

    const fetchTeachers = async () => {
        try {
            setIsLoading(true);
            const data = await teachersService.getAll();
            setTeachers(data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching teachers:', error);
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleOpenAddModal = () => {
        setSelectedTeacher(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (teacher: any) => {
        setSelectedTeacher(teacher);
        setIsModalOpen(true);
    };

    const handleSubmitTeacher = async (data: any) => {
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
                if (result && result.email && result.password) {
                    setTimeout(() => {
                        alert(`✅ Guru berhasil ditambahkan!\n\n📧 Email: ${result.email}\n🔑 Password: ${result.password}\n\nSimpan informasi ini untuk login guru.`);
                    }, 500);
                }
            }
            fetchTeachers();
        } catch (error) {
            console.error('Error saving teacher:', error);
            throw error;
        }
    };

    const handleDeleteTeacher = async (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus data guru ini?')) {
            try {
                await teachersService.delete(id);
                fetchTeachers();
            } catch (error) {
                alert('Gagal menghapus data guru. Pastikan tidak ada data terkait (jadwal, dsb) yang masih menggunakan guru ini.');
            }
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await teachersService.update(id, { is_active: !currentStatus });
            fetchTeachers();
        } catch (error) {
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
                                    <GraduationCap className="w-7 h-7 text-blue-600" />
                                    Data Guru & Pengajar
                                </h1>
                                <p className="text-gray-500">
                                    Kelola profil and tugas mengajar asatidz/asatidzah
                                </p>
                            </div>
                            <button
                                onClick={handleOpenAddModal}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/30"
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
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
                        <div className="relative max-w-md">
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari NIP atau nama guru..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Teachers Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">NIP / Profil</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Mapel Utama</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Gender</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Status</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredTeachers.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${t.gender === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                                                        }`}>
                                                        {t.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{t.name}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{t.nip}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-medium text-gray-700">{t.specialization || 'Umum'}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${t.gender === 'L' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                                                    }`}>
                                                    {t.gender === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => handleToggleStatus(t.id, t.is_active)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${t.is_active
                                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                        }`}
                                                >
                                                    {t.is_active ? (
                                                        <>
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Aktif
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="w-3 h-3" />
                                                            Non-Aktif
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenEditModal(t)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTeacher(t.id)}
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
