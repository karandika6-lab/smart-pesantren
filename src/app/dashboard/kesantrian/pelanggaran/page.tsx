'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    getCurrentUser,
    User
} from '@/lib/auth';
import {
    ArrowLeft,
    AlertTriangle,
    Plus,
    Search,
    Filter,
    Calendar,
    UserX,
    ClipboardList,
    Download
} from 'lucide-react';

// ============================================
// Types & Data
// ============================================

import { violationsService, ViolationWithRelations } from '@/lib/services/violations';
import { kesantrianService } from '@/lib/services/kesantrian';
import { Loader2, Edit, Trash2 } from 'lucide-react';
import ViolationModal from '@/components/admin/ViolationModal';

export default function PelanggaranPage() {
    const [user, setUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [violations, setViolations] = useState<ViolationWithRelations[]>([]);
    const [stats, setStats] = useState({ totalViolations: 0 });
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedViolation, setSelectedViolation] = useState<any>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            fetchData();
        }
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [violationData, statusData] = await Promise.all([
                violationsService.getAll(),
                kesantrianService.getStats()
            ]);
            setViolations(violationData);
            setStats(statusData);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching violations:', error);
            setIsLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setSelectedViolation(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (violation: any) => {
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
        if (confirm('Apakah Anda yakin ingin menghapus catatan pelanggaran ini? Poin santri akan dikembalikan.')) {
            try {
                await violationsService.delete(id);
                fetchData();
            } catch (error) {
                alert('Gagal menghapus catatan pelanggaran');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-10 h-10 text-rose-600 animate-spin" />
            </div>
        );
    }

    const filteredViolations = violations.filter(v =>
        v.students?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/dashboard/kesantrian"
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mb-2 transition-colors font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Dashboard
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <AlertTriangle className="w-8 h-8 text-rose-600" />
                            Buku Hitam Digital
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Pencatatan pelanggaran disiplin dan akumulasi poin santri
                        </p>
                    </div>
                    <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95"
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
                violationData={selectedViolation}
            />

            {/* Stats & Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari nama santri atau jenis pelanggaran..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:bg-white focus:border-rose-500 transition-all text-sm font-medium"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors text-sm font-bold">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors text-sm font-bold">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>
                <div className="bg-rose-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-rose-900/20">
                    <div>
                        <p className="text-[10px] font-bold text-rose-100 uppercase tracking-widest leading-none mb-1">Total Pelanggaran</p>
                        <h4 className="text-2xl font-extrabold leading-none">{stats.totalViolations}</h4>
                    </div>
                    <ClipboardList className="w-10 h-10 text-rose-400 opacity-50" />
                </div>
            </div>

            {/* Violation Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="text-left p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tanggal</th>
                                <th className="text-left p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Santri</th>
                                <th className="text-left p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pelanggaran</th>
                                <th className="text-center p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Poin</th>
                                <th className="text-left p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hukuman (Takzir)</th>
                                <th className="text-center p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="text-center p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredViolations.map((v) => (
                                <tr key={v.id} className="hover:bg-rose-50/20 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium whitespace-nowrap">
                                            <Calendar className="w-4 h-4 text-gray-300" />
                                            {new Date(v.violation_date).toLocaleDateString('id-ID')}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-xs ring-2 ring-white shadow-sm">
                                                {v.students?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{v.students?.name || 'Unknown'}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                    Kelas {v.students?.classes?.name || '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full uppercase tracking-wider ${v.category === 'berat' ? 'bg-red-100 text-red-700' :
                                            v.category === 'sedang' ? 'bg-orange-100 text-orange-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {v.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-sm font-black text-red-700">-{v.points}</span>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm text-gray-600 font-medium italic">"{v.punishment || v.description || '-'}"</p>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest ${v.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                            v.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {v.status === 'completed' ? 'Selesai' :
                                                v.status === 'cancelled' ? 'Batal' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleOpenEditModal(v)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteViolation(v.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
                {filteredViolations.length === 0 && (
                    <div className="p-16 text-center">
                        <UserX className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="font-bold text-gray-800">Tidak ada catatan pelanggaran</h3>
                        <p className="text-gray-400 text-sm">Coba sesuaikan pencarian atau filter Anda.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
