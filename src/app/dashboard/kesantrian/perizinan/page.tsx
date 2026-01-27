'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
    getCurrentUser,
    User
} from '@/lib/auth';
import {
    ArrowLeft,
    Shield,
    Search,
    Check,
    X,
    Clock,
    History,
    Calendar,
    Phone,
    UserCheck,
    MapPin
} from 'lucide-react';

// ============================================
// Types & Data
// ============================================

import { permissionsService, PermissionWithRelations } from '@/lib/services/permissions';
import { Loader2 } from 'lucide-react';

import PermissionModal from '@/components/admin/PermissionModal';
import { Plus } from 'lucide-react';

export default function PerizinanPage() {
    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [permits, setPermits] = useState<PermissionWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);

    const fetchPermits = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = activeTab === 'pending'
                ? await permissionsService.getPending()
                : await permissionsService.getHistory();
            setPermits(data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching permits:', error);
            setIsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            const timer = requestAnimationFrame(() => {
                setUser(currentUser);
                fetchPermits();
            });
            return () => cancelAnimationFrame(timer);
        }
    }, [activeTab, fetchPermits]);

    const handleAction = async (id: string, status: 'approved' | 'rejected') => {
        if (!user) return;
        try {
            await permissionsService.updateStatus(id, status, user.id);
            fetchPermits();
        } catch {
            alert('Gagal memperbarui status perizinan');
        }
    };

    const handleManualSubmit = async (data: {
        student_id: string;
        permission_type: 'pulang' | 'keluar' | 'sakit' | 'kegiatan';
        reason: string;
        start_date: string;
        end_date: string;
    }) => {
        try {
            await permissionsService.create(data);
            setIsManualModalOpen(false);
            // If we are in 'history' tab, refresh. If in 'pending', switch to 'history' or just refresh?
            // Since manual permits are auto-approved, they go to history.
            if (activeTab === 'history') {
                fetchPermits();
            } else {
                setActiveTab('history'); // Switch to history to see the new permit
            }
        } catch (error) {
            throw error; // Let modal handle error alert
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    const filteredPermits = permits.filter(p => {
        const matchesSearch = p.students?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.reason.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

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
                            <UserCheck className="w-8 h-8 text-indigo-600" />
                            Manajemen Perizinan
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Kelola permohonan keluar santri dan monitoring status kepulangan
                        </p>
                    </div>
                    <button
                        onClick={() => setIsManualModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Buat Izin Manual
                    </button>
                </div>
            </div>

            <PermissionModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                onSubmit={handleManualSubmit}
            />

            {/* Tab Navigation & Search */}
            <div className="flex flex-col xl:flex-row gap-4 mb-8">
                <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'pending'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <Clock className="w-4 h-4" />
                        Menunggu Persetujuan
                        {permits.filter(p => p.status === 'pending').length > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'pending' ? 'bg-white/20' : 'bg-red-50 text-red-600'}`}>
                                {permits.filter(p => p.status === 'pending').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'history'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <History className="w-4 h-4" />
                        Riwayat Izin
                    </button>
                </div>

                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Cari nama santri atau alasan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm font-medium text-gray-700"
                    />
                </div>
            </div>

            {/* Permits List */}
            <div className="space-y-4">
                {filteredPermits.map((p) => (
                    <div key={p.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                        <div className="p-6">
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Santri Info */}
                                <div className="lg:w-1/4">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center font-bold text-indigo-700 shadow-sm">
                                            {p.students?.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-gray-800 leading-tight">{p.students?.name || 'Unknown'}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Kelas {p.students?.classes?.name || '-'}</p>
                                        </div>
                                    </div>
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                        p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                            p.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                                        }`}>
                                        {p.status === 'pending' ? 'Menunggu' :
                                            p.status === 'approved' ? 'Disetujui' :
                                                p.status === 'completed' ? 'Kembali' : 'Ditolak'}
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><Calendar className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Durasi Izin</p>
                                                <p className="text-sm font-bold text-gray-700">{new Date(p.start_date).toLocaleDateString('id-ID')} - {new Date(p.end_date).toLocaleDateString('id-ID')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><MapPin className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Tipe Izin</p>
                                                <p className="text-sm font-bold text-gray-700 uppercase">{p.permission_type || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-2">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-gray-50 rounded-lg text-gray-400 font-bold text-xs">?</div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Alasan Pengajuan</p>
                                                <p className="text-sm font-medium text-gray-600 leading-relaxed italic">&quot;{p.reason}&quot;</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center gap-4">
                                            <div className="flex -space-x-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center"><Phone className="w-3.5 h-3.5 text-gray-400" /></div>
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center"><span className="text-[10px] font-bold text-indigo-600">W</span></div>
                                            </div>
                                            <p className="text-xs font-bold text-gray-500">Kontak Wali: {p.students?.parent_phone || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="lg:w-1/6 flex md:flex-row lg:flex-col gap-2 justify-center">
                                    {p.status === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => handleAction(p.id, 'approved')}
                                                className="flex-1 lg:flex-none py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                                            >
                                                <Check className="w-4 h-4" /> SETUJU
                                            </button>
                                            <button
                                                onClick={() => handleAction(p.id, 'rejected')}
                                                className="flex-1 lg:flex-none py-2.5 border border-rose-200 text-rose-600 font-bold rounded-xl text-xs hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                <X className="w-4 h-4" /> TOLAK
                                            </button>
                                        </>
                                    ) : (
                                        <button className="w-full py-2.5 bg-gray-50 text-gray-400 font-bold rounded-xl text-[10px] uppercase tracking-widest group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                            Lihat Detail
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredPermits.length === 0 && (
                    <div className="p-16 text-center bg-white rounded-[2rem] border border-dashed border-gray-200">
                        <Shield className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="font-bold text-gray-800">Antrian Bersih!</h3>
                        <p className="text-gray-400 text-sm">Tidak ada permohonan izin dalam kategori ini.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
