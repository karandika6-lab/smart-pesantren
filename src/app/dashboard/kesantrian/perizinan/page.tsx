'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
    getCurrentUser,
    User
} from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    ArrowLeft,
    Search,
    Check,
    X,
    Clock,
    History,
    Calendar,
    Phone,
    UserCheck,
    MapPin,
    Plus,
    Loader2,
    ShieldCheck
} from 'lucide-react';

import { permissionsService, PermissionWithRelations } from '@/lib/services/permissions';
import PermissionModal from '@/components/admin/PermissionModal';

export default function PerizinanPage() {
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
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
        } catch (error) {
            console.error('Error fetching permits:', error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            fetchPermits();
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
            if (activeTab === 'history') {
                fetchPermits();
            } else {
                setActiveTab('history');
            }
        } catch (error) {
            throw error;
        }
    };

    if (!user) return null;

    const filteredPermits = permits.filter(p => {
        const matchesSearch = p.students?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.reason.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

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
                                    <span className="w-1.5 h-8 bg-indigo-600 rounded-full"></span>
                                    Manajemen Perizinan
                                </h1>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2 shadow-black/10">
                                    Monitoring Alur Keluar-Masuk Santri
                                </p>
                            </div>
                            <button
                                onClick={() => setIsManualModalOpen(true)}
                                className="flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] lg:text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Input Izin Manual
                            </button>
                        </div>
                    </div>

                    <PermissionModal
                        isOpen={isManualModalOpen}
                        onClose={() => setIsManualModalOpen(false)}
                        onSubmit={handleManualSubmit}
                    />

                    {/* Navigation & Search */}
                    <div className="flex flex-col xl:flex-row gap-6 mb-10">
                        <div className="flex bg-[#0c0c0c] p-1.5 rounded-[1.5rem] border border-white/5 shadow-2xl backdrop-blur-md">
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'pending'
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Clock className="w-4 h-4" />
                                Monitoring
                                {permits.filter(p => p.status === 'pending').length > 0 && (
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] ${activeTab === 'pending' ? 'bg-white/20' : 'bg-rose-500/10 text-rose-500'}`}>
                                        {permits.filter(p => p.status === 'pending').length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'history'
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <History className="w-4 h-4" />
                                Log Riwayat
                            </button>
                        </div>

                        <div className="flex-1 relative group">
                            <Search className="w-5 h-5 text-gray-700 absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari NIS atau alasan Izin..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-[#0c0c0c] border border-white/5 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white font-bold text-sm transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Permits List */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin opacity-20" />
                            <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Sinkronisasi Izin...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 lg:gap-6">
                            {filteredPermits.map((p) => (
                                <div key={p.id} className="bg-[#0b0b0b] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden group hover:border-white/10 transition-all">
                                    <div className="p-6 lg:p-8">
                                        <div className="flex flex-col lg:flex-row gap-8">
                                            {/* Santri Info */}
                                            <div className="lg:w-1/4">
                                                <div className="flex items-center gap-5 mb-5 lg:mb-6">
                                                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center font-black text-lg text-indigo-500 border border-indigo-500/20 shadow-inner">
                                                        {p.students?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-white text-lg tracking-tight uppercase leading-none truncate group-hover:text-indigo-400 transition-colors">
                                                            {p.students?.name || 'Unregistered'}
                                                        </h4>
                                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mt-2">Kelas {p.students?.classes?.name || '---'}</p>
                                                    </div>
                                                </div>
                                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-lg ${p.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                                    p.status === 'approved' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' :
                                                        p.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'pending' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                                        p.status === 'approved' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' :
                                                            p.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'
                                                        }`}></div>
                                                    {p.status === 'pending' ? 'Waiting Admin' :
                                                        p.status === 'approved' ? 'Authorized' :
                                                            p.status === 'completed' ? 'Returned' : 'Rejected'}
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                                                <div className="space-y-5">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2.5 bg-white/5 rounded-xl text-gray-500 border border-white/5"><Calendar className="w-4 h-4" /></div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-2">Periode Izin</p>
                                                            <p className="text-xs font-bold text-gray-300">{new Date(p.start_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long'})} - {new Date(p.end_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long'})}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2.5 bg-white/5 rounded-xl text-gray-500 border border-white/5"><MapPin className="w-4 h-4" /></div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-2">Tujuan / Tipe</p>
                                                            <p className="text-xs font-black text-indigo-500 uppercase tracking-tighter">{p.permission_type || '---'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="lg:col-span-2">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2.5 bg-white/5 rounded-xl text-gray-500 border border-white/5"><ShieldCheck className="w-4 h-4" /></div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-2">Alasan Pengajuan</p>
                                                            <p className="text-sm font-bold text-gray-200 leading-relaxed italic line-clamp-2">&quot;{p.reason}&quot;</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-5 pt-5 border-t border-white/5 flex items-center gap-4">
                                                        <div className="flex -space-x-3">
                                                            <div className="w-8 h-8 rounded-full bg-neutral-900 border-2 border-black flex items-center justify-center"><Phone className="w-3.5 h-3.5 text-gray-600" /></div>
                                                            <div className="w-8 h-8 rounded-full bg-indigo-600/20 border-2 border-black flex items-center justify-center"><span className="text-[10px] font-black text-indigo-500">W</span></div>
                                                        </div>
                                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest truncate">Wali Santri: {p.students?.parent_phone || 'Unlinked'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="lg:w-1/6 flex flex-row lg:flex-col gap-3 justify-center">
                                                {p.status === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(p.id, 'approved')}
                                                            className="flex-1 lg:flex-none py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95"
                                                        >
                                                            <Check className="w-4 h-4" /> Setujui
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(p.id, 'rejected')}
                                                            className="flex-1 lg:flex-none py-3.5 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"
                                                        >
                                                            <X className="w-4 h-4" /> Tolak
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button className="w-full py-4 bg-white/5 text-gray-600 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl group-hover:bg-indigo-600/10 group-hover:text-indigo-500 transition-all border border-transparent group-hover:border-indigo-500/10">
                                                        Arsip Izin
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredPermits.length === 0 && (
                                <div className="p-24 text-center bg-[#0b0b0b] rounded-[3rem] border border-dashed border-white/5 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-neutral-900 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                                        <ShieldCheck className="w-10 h-10 text-neutral-800" />
                                    </div>
                                    <h3 className="font-black text-white uppercase tracking-tight text-xl">Database Bersih</h3>
                                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Tidak ada permohonan dalam antrian</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
