'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    getCurrentUser,
    User
} from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    ArrowLeft,
    AlertTriangle,
    Plus,
    Search,
    Calendar,
    Loader2,
    Edit,
    Trash2,
    ClipboardList,
    Download,
    UserX,
    Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { violationsService, ViolationWithRelations } from '@/lib/services/violations';
import { kesantrianService } from '@/lib/services/kesantrian';
import ViolationModal from '@/components/admin/ViolationModal';

export default function PelanggaranPage() {
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [violations, setViolations] = useState<ViolationWithRelations[]>([]);
    const [stats, setStats] = useState({ totalViolations: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedViolation, setSelectedViolation] = useState<ViolationWithRelations | null>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [violationData, statusData] = await Promise.all([
                violationsService.getAll(),
                kesantrianService.getStats()
            ]);
            setViolations(violationData);
            setStats(statusData);
        } catch (error) {
            console.error('Error fetching violations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            fetchData();
        }
    }, []);

    const handleOpenAddModal = () => {
        setSelectedViolation(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (violation: ViolationWithRelations) => {
        setSelectedViolation(violation);
        setIsModalOpen(true);
    };

    const handleSubmitViolation = async (data: any) => {
        try {
            if (selectedViolation) {
                await violationsService.update(selectedViolation.id, data);
            } else {
                await violationsService.create({
                    ...data,
                    recorded_by: user?.id
                });
            }
            fetchData();
        } catch (error) {
            console.error('Error saving violation:', error);
            throw error;
        }
    };

    const handleDeleteViolation = async (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus catatan pelanggaran ini?')) {
            try {
                await violationsService.delete(id);
                fetchData();
            } catch {
                alert('Gagal menghapus catatan pelanggaran');
            }
        }
    };

    const handleExport = async () => {
        try {
            const exportRows = filteredViolations.map((v) => ({
                'Tanggal': new Date(v.violation_date).toLocaleDateString('id-ID'),
                'Nama': v.students?.name || 'Unknown',
                'Kategori': v.category?.toUpperCase() || '-',
                'Poin': v.points,
                'Status': v.status
            }));
            const ws = XLSX.utils.json_to_sheet(exportRows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Pelanggaran");
            XLSX.writeFile(wb, `Log_Pelanggaran_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            alert('Export failed');
        }
    };

    if (!user) return null;

    const filteredViolations = violations.filter(v =>
        v.students?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#050505] flex">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={() => {}}
            />

            <div className="flex-1 lg:ml-64 min-w-0">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 max-w-[1700px] mx-auto overflow-x-hidden">
                    {/* Header */}
                    <div className="mb-10">
                        <Link
                            href="/dashboard/kesantrian"
                            className="inline-flex items-center gap-2 text-xs font-black text-gray-500 hover:text-white mb-6 uppercase tracking-widest transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Dashboard Kesantrian
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-black text-white flex items-center gap-4 uppercase tracking-tighter">
                                    <span className="w-1.5 h-8 bg-rose-600 rounded-full"></span>
                                    Buku Hitam <span className="text-rose-600">Digital</span>
                                </h1>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                                    Pencatatan Kedisiplinan & Poin Santri
                                </p>
                            </div>
                            <button
                                onClick={handleOpenAddModal}
                                className="flex items-center justify-center gap-3 px-6 py-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] lg:text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-rose-600/20 active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Catat Pelanggaran
                            </button>
                        </div>
                    </div>

                    <ViolationModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={handleSubmitViolation}
                        violationData={selectedViolation ? {
                            id: selectedViolation.id,
                            student_id: selectedViolation.student_id,
                            type: selectedViolation.category,
                            description: selectedViolation.description,
                            points: selectedViolation.points,
                            punishment: selectedViolation.punishment,
                            date: selectedViolation.violation_date,
                            status: selectedViolation.status,
                        } : undefined}
                    />

                    {/* Stats & Tools */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
                        <div className="lg:col-span-3 flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <Search className="w-5 h-5 text-gray-700 absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-rose-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cari nama santri atau jenis..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-[#0c0c0c] border border-white/5 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-white font-bold text-sm transition-all shadow-inner"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleExport}
                                    className="p-4 bg-[#0c0c0c] border border-white/5 rounded-2xl text-gray-500 hover:text-white transition-all hover:border-white/10 active:scale-95"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                                <button className="p-4 bg-[#0c0c0c] border border-white/5 rounded-2xl text-gray-500 hover:text-white transition-all hover:border-white/10 active:scale-95">
                                    <Filter className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="bg-rose-600 rounded-[2rem] p-6 lg:p-8 flex items-center justify-between shadow-2xl shadow-rose-600/10">
                            <div>
                                <p className="text-[10px] font-black text-rose-100 uppercase tracking-widest leading-none mb-2">Total Kejadian</p>
                                <h4 className="text-3xl font-black text-white leading-none">{stats.totalViolations}</h4>
                            </div>
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <ClipboardList className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Violation List - Hybrid Layout */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <Loader2 className="w-10 h-10 text-rose-600 animate-spin opacity-20" />
                            <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Memuat Arsip...</p>
                        </div>
                    ) : (
                        <div className="bg-[#0b0b0b] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden backdrop-blur-sm">
                            {/* Desktop Table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/[0.02] border-b border-white/5">
                                            <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Tanggal</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Santri</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Kategori</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Poin</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredViolations.map((v) => (
                                            <tr key={v.id} className="group hover:bg-white/[0.01] transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                                                        <Calendar className="w-4 h-4 text-gray-600" />
                                                        {new Date(v.violation_date).toLocaleDateString('id-ID')}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center font-black text-gray-500 border border-white/5">
                                                            {v.students?.name?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-rose-400 transition-colors">{v.students?.name || '??'}</p>
                                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">Kelas {v.students?.classes?.name || '-'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${v.category === 'berat' ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                                                        v.category === 'sedang' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                                                            'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                                        }`}>
                                                        {v.category}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-600"></div>
                                                        <span className="text-sm font-black text-rose-500 tracking-tighter">-{v.points}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/40 border border-white/5 rounded-full">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${v.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500 opacity-50'}`}></div>
                                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{v.status === 'completed' ? 'Selesai' : 'Pending'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleOpenEditModal(v)}
                                                            className="p-2.5 bg-neutral-900 hover:bg-indigo-600 text-gray-600 hover:text-white rounded-xl border border-white/5 transition-all shadow-lg active:scale-90"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteViolation(v.id)}
                                                            className="p-2.5 bg-neutral-900 hover:bg-rose-600 text-gray-600 hover:text-white rounded-xl border border-white/5 transition-all shadow-lg active:scale-90"
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

                            {/* Mobile Card List */}
                            <div className="lg:hidden divide-y divide-white/5">
                                {filteredViolations.map((v) => (
                                    <div key={v.id} className="p-6 active:bg-white/[0.02] transition-colors">
                                        <div className="flex items-start justify-between mb-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center font-black text-rose-500 border border-rose-500/10 shadow-inner">
                                                    {v.students?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-black text-white text-base tracking-tight uppercase leading-none truncate">{v.students?.name || '??'}</h4>
                                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mt-2">Kelas {v.students?.classes?.name || '-'}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${v.category === 'berat' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'text-gray-500 border-white/5'}`}>
                                                {v.category}
                                            </span>
                                        </div>
                                        <div className="bg-black/40 rounded-2xl p-5 border border-white/5 mb-6">
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2 leading-none">Deskripsi Kejadian</p>
                                            <p className="text-sm font-bold text-gray-300 leading-relaxed italic">&quot;{v.punishment || v.description || '-'}&quot;</p>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Akumulasi</p>
                                                    <p className="text-sm font-black text-rose-500">-{v.points} Poin</p>
                                                </div>
                                                <div className="w-px h-8 bg-white/5"></div>
                                                <div className="flex flex-col">
                                                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Status</p>
                                                    <p className={`text-[10px] font-black uppercase tracking-tighter ${v.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{v.status === 'completed' ? 'SELESAI' : 'PENDING'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleOpenEditModal(v)} className="p-3 bg-neutral-900 rounded-xl border border-white/5 text-gray-500 active:bg-indigo-600 active:text-white transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteViolation(v.id)} className="p-3 bg-neutral-900 rounded-xl border border-white/5 text-gray-500 active:bg-rose-600 active:text-white transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredViolations.length === 0 && (
                                <div className="p-24 text-center">
                                    <UserX className="w-16 h-16 text-neutral-900 mx-auto mb-6" />
                                    <h3 className="font-black text-white uppercase tracking-tight text-xl">Arsip Masih Bersih</h3>
                                    <p className="text-gray-700 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Tidak ada catatan pelanggaran yang ditemukan</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
