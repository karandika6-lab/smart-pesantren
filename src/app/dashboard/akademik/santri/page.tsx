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
    Edit,
    Trash2,
    Filter,
    Download,
    UserCheck,
    Users,
    Printer
} from 'lucide-react';

import { studentsService, StudentWithRelations } from '@/lib/services/students';
import { Loader2 } from 'lucide-react';
import SantriModal from '@/components/admin/SantriModal';
import PrintSantriCardModal from '@/components/admin/PrintSantriCardModal';

export default function ManajemenSantriPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<StudentWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSantri, setSelectedSantri] = useState<StudentWithRelations | null>(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [studentToPrint, setStudentToPrint] = useState<{id: string; name: string; nis: string; photo_url?: string | null; class_name?: string} | null>(null);

    const fetchStudents = async () => {
        try {
            setIsLoading(true);
            const data = await studentsService.getAll();
            setStudents(data);
            setIsLoading(false);
        } catch (error: unknown) {
            console.error('Error fetching students:', error);
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
            fetchStudents();
        });
        return () => cancelAnimationFrame(timer);
    }, [router]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleOpenAddModal = () => {
        setSelectedSantri(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (santri: StudentWithRelations) => {
        setSelectedSantri(santri);
        setIsModalOpen(true);
    };

    const handleOpenPrintModal = (santri: StudentWithRelations) => {
        setStudentToPrint({
            id: santri.id,
            name: santri.name,
            nis: santri.nis || '-',
            photo_url: santri.photo_url,
            class_name: santri.class?.name
        });
        setIsPrintModalOpen(true);
    };

    const handleSubmitSantri = async (data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
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
                const resultWithCreds = result as any; // eslint-disable-line @typescript-eslint/no-explicit-any

                // Show generated credentials if available
                if (resultWithCreds && resultWithCreds.email && resultWithCreds.password) {
                    setTimeout(() => {
                        alert(`✅ Santri berhasil ditambahkan!\n\n📧 Email: ${resultWithCreds.email}\n🔑 Password: ${resultWithCreds.password}\n\nSimpan informasi ini untuk login santri/wali.`);
                    }, 500);
                }
            }
            fetchStudents();
        } catch (error: unknown) {
            console.error('Error saving santri:', error);
            throw error;
        }
    };

    const handleDeleteSantri = async (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus data santri ini?')) {
            try {
                await studentsService.delete(id);
                fetchStudents();
            } catch {
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
        (s.nis ?? '').includes(searchQuery)
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

                <main className="p-4 lg:p-10 max-w-[1600px] mx-auto">
                    {/* Header */}
                    <div className="mb-6 lg:mb-10">
                        <Link
                            href="/dashboard/akademik"
                            className="inline-flex items-center gap-2 text-xs lg:text-sm text-gray-500 hover:text-white mb-4 lg:mb-6 transition-colors group"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4 transition-transform group-hover:-translate-x-1" />
                            Kembali ke Dashboard
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-3 lg:gap-4">
                                <span className="w-1.5 h-8 lg:w-2 lg:h-10 bg-blue-600 rounded-full block focus-ring"></span>
                                <div>
                                    <h1 className="text-xl lg:text-3xl font-black text-white tracking-tight uppercase leading-none">
                                        Manajemen <span className="text-blue-500">Santri</span>
                                    </h1>
                                    <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[9px] lg:text-[10px] mt-1 lg:mt-2 shadow-black/10">
                                        Database Santri & Akun Perwalian
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 lg:gap-3">
                                <Link
                                    href="/dashboard/akademik/santri/import"
                                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2.5 lg:px-6 lg:py-4 bg-white/5 border border-white/10 text-gray-400 hover:text-white font-black text-[9px] lg:text-xs uppercase tracking-widest rounded-xl lg:rounded-2xl transition-all backdrop-blur-md active:scale-95"
                                >
                                    <Download className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                    Import
                                </Link>
                                <button
                                    onClick={handleOpenAddModal}
                                    className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-4 py-2.5 lg:px-7 lg:py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                >
                                    <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                    Santri Baru
                                </button>
                            </div>
                        </div>
                    </div>

                    <SantriModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={handleSubmitSantri}
                        santriData={selectedSantri ? {
                            id: selectedSantri.id,
                            user_id: selectedSantri.user_id ?? undefined,
                            name: selectedSantri.name,
                            nis: selectedSantri.nis ?? undefined,
                            gender: (selectedSantri.gender as 'L' | 'P') ?? undefined,
                            class_id: selectedSantri.class_id ?? undefined,
                            birth_place: selectedSantri.birth_place ?? undefined,
                            birth_date: selectedSantri.birth_date ?? undefined,
                            address: selectedSantri.address ?? undefined,
                            parent_name: selectedSantri.parent_name ?? undefined,
                            parent_phone: selectedSantri.parent_phone ?? undefined,
                            status: selectedSantri.status ?? undefined,
                        } : undefined}
                    />

                    <PrintSantriCardModal
                        isOpen={isPrintModalOpen}
                        onClose={() => setIsPrintModalOpen(false)}
                        student={studentToPrint}
                        pesantrenName="Smart Pesantren"
                    />

                    {/* Stats & Filters */}
                    <div className="flex flex-col lg:flex-row gap-6 mb-8">
                        <div className="flex-1 relative">
                            <Search className="w-6 h-6 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari NIS atau nama santri..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-neutral-900/40 border border-white/5 rounded-[1.5rem] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all backdrop-blur-sm shadow-inner"
                            />
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end">
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Total Terdaftar</p>
                                <p className="text-xl font-black text-blue-500">{students.length} <span className="text-gray-600 font-bold ml-1 text-sm tracking-tight">Santri</span></p>
                            </div>
                            <button className="p-4 bg-neutral-900 border border-white/5 rounded-2xl text-gray-500 hover:text-white hover:border-blue-500/50 transition-all shadow-lg group active:scale-90">
                                <Filter className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                            </button>
                        </div>
                    </div>

                    {/* Students Table */}
                    <div className="bg-neutral-900/60 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-sm shadow-2xl">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5">
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Santri</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Gender</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Kelas</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Wali Santri</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredStudents.map((s) => (
                                        <tr key={s.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shadow-lg border transition-transform group-hover:scale-110 ${s.gender === 'L'
                                                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                        : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                                                        }`}>
                                                        {s.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors uppercase">{s.name}</p>
                                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-0.5">{s.nis}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${s.gender === 'L'
                                                    ? 'bg-blue-500/5 border-blue-500/10 text-blue-500'
                                                    : 'bg-pink-500/5 border-pink-500/10 text-pink-500'
                                                    }`}>
                                                    {s.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                                                        <UserCheck className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-400">{s.class?.name || '---'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-bold text-gray-500">{s.parent_name || '---'}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-black/40 border border-white/5 rounded-full`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-600'}`}></div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{s.status === 'active' ? 'Aktif' : 'Nonaktif'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleOpenPrintModal(s)}
                                                        className="p-2.5 bg-neutral-800 hover:bg-blue-600 text-gray-500 hover:text-white rounded-xl border border-white/5 transition-all active:scale-95"
                                                        title="Cetak Kartu"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-500 hover:text-white rounded-xl border border-white/5 transition-all active:scale-95 text-[10px] font-black uppercase px-4">
                                                        Detail
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEditModal(s)}
                                                        className="p-2.5 bg-neutral-800 hover:bg-emerald-600 text-gray-500 hover:text-white rounded-xl border border-white/5 transition-all active:scale-95"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSantri(s.id)}
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

                    {filteredStudents.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 bg-neutral-900/40 border border-white/5 rounded-[3rem] backdrop-blur-sm">
                            <div className="w-24 h-24 bg-neutral-800 rounded-3xl flex items-center justify-center mb-6 border border-white/5 shadow-inner animate-bounce">
                                <Search className="w-12 h-12 text-gray-600" />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2">Santri tidak ditemukan</h3>
                            <p className="text-gray-500 max-w-xs text-center font-medium">
                                Coba kata kunci NIS atau nama santri yang berbeda.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
