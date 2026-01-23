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
    Edit,
    Trash2,
    Eye,
    Filter,
    UserCheck,
    Download
} from 'lucide-react';

import { studentsService } from '@/lib/services/students';
import { Loader2 } from 'lucide-react';
import SantriModal from '@/components/admin/SantriModal';

export default function ManajemenSantriPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSantri, setSelectedSantri] = useState<any>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_akademik' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchStudents();
    }, [router]);

    const fetchStudents = async () => {
        try {
            setIsLoading(true);
            const data = await studentsService.getAll();
            setStudents(data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching students:', error);
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleOpenAddModal = () => {
        setSelectedSantri(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (santri: any) => {
        setSelectedSantri(santri);
        setIsModalOpen(true);
    };

    const handleSubmitSantri = async (data: any) => {
        try {
            if (selectedSantri) {
                // When updating, only send fields that exist in students table
                // Exclude email (managed in profiles), and other non-table fields
                const updateData = {
                    name: data.name,
                    nis: data.nis,
                    gender: data.gender,
                    class_id: data.class_id,
                    birth_place: data.birth_place || null,
                    birth_date: data.birth_date || null,
                    address: data.address || null,
                    parent_name: data.parent_name,
                    parent_phone: data.parent_phone || null,
                    status: data.status || 'active'
                };
                await studentsService.update(selectedSantri.id, updateData);
            } else {
                // Create new - RPC will handle user creation
                const result = await studentsService.create(data);

                // Show generated credentials if available
                if (result && result.email && result.password) {
                    setTimeout(() => {
                        alert(`✅ Santri berhasil ditambahkan!\n\n📧 Email: ${result.email}\n🔑 Password: ${result.password}\n\nSimpan informasi ini untuk login santri/wali.`);
                    }, 500);
                }
            }
            fetchStudents();
        } catch (error) {
            console.error('Error saving santri:', error);
            throw error;
        }
    };

    const handleDeleteSantri = async (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus data santri ini?')) {
            try {
                await studentsService.delete(id);
                fetchStudents();
            } catch (error) {
                alert('Gagal menghapus data santri.');
            }
        }
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase tracking-widest font-black text-blue-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <span>Loading Data Santri...</span>
                </div>
            </div>
        );
    }

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery)
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
                                    <Users className="w-7 h-7 text-blue-600" />
                                    Manajemen Santri
                                </h1>
                                <p className="text-gray-500">
                                    Kelola database santri, perwalian, dan akun wali santri
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/dashboard/akademik/santri/import"
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    <Download className="w-5 h-5" />
                                    Import Massal
                                </Link>
                                <button
                                    onClick={handleOpenAddModal}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/30"
                                >
                                    <Plus className="w-5 h-5" />
                                    Tambah Santri
                                </button>
                            </div>
                        </div>
                    </div>

                    <SantriModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={handleSubmitSantri}
                        santriData={selectedSantri}
                    />

                    {/* Stats & Filters */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari NIS atau nama santri..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-sm font-medium text-gray-500">
                                    Total: <span className="text-blue-600 font-bold">{students.length} Santri</span>
                                </div>
                                <button className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                    <Filter className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Students Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Santri</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Kelas</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Wali Santri</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Status</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredStudents.map((s) => (
                                        <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${s.gender === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                                                        }`}>
                                                        {s.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{s.name}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{s.nis}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-medium text-gray-700">{s.class?.name || '-'}</span>
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{s.parent_name || '-'}</p>
                                                    <p className="text-xs text-gray-500">{s.parent_phone || '-'}</p>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEditModal(s)}
                                                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSantri(s.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                </main>
            </div>
        </div>
    );
}
