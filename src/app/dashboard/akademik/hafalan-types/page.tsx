'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    clearSession,
    User
} from '@/lib/auth';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    CheckCircle2,
    XCircle,
    BookOpen,
    Loader2,
    RotateCcw,
    AlertTriangle,
    Calendar
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { hafalanTypesService, HafalanType } from '@/lib/services/hafalan-types';
import HafalanTypeModal from '@/components/hafalan/HafalanTypeModal';

const CATEGORY_CONFIG = {
    quran: { label: 'Al-Qur\'an', color: 'blue', icon: '📖' },
    doa: { label: 'Doa', color: 'green', icon: '🤲' },
    mufrodat: { label: 'Mufrodat', color: 'purple', icon: '📝' },
    hadits: { label: 'Hadits', color: 'amber', icon: '📜' },
    nadhom: { label: 'Nadhom', color: 'pink', icon: '✍️' },
    other: { label: 'Lainnya', color: 'gray', icon: '📚' }
};

export default function HafalanTypesPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Data state
    const [hafalanTypes, setHafalanTypes] = useState<HafalanType[]>([]);
    const [filteredTypes, setFilteredTypes] = useState<HafalanType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState<HafalanType | null>(null);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        by_category: {} as Record<string, number>
    });

    const fetchHafalanTypes = async () => {
        try {
            setIsLoading(true);
            const [types, statistics] = await Promise.all([
                hafalanTypesService.getAllIncludingInactive(),
                hafalanTypesService.getStatistics()
            ]);
            setHafalanTypes(types);
            setStats(statistics);
        } catch (error: any) {
            console.error('Error fetching hafalan types:', error?.message || error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin_akademik') {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchHafalanTypes();
        });
        return () => cancelAnimationFrame(timer);
    }, [router]);

    const applyFilters = useCallback(() => {
        let filtered = [...hafalanTypes];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(type =>
                type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                type.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(type => type.category === categoryFilter);
        }

        // Status filter
        if (statusFilter === 'active') {
            filtered = filtered.filter(type => type.is_active);
        } else if (statusFilter === 'inactive') {
            filtered = filtered.filter(type => !type.is_active);
        }

        setFilteredTypes(filtered);
    }, [hafalanTypes, searchQuery, categoryFilter, statusFilter]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const handleSave = async (data: Omit<HafalanType, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            if (editData) {
                await hafalanTypesService.update(editData.id, data);
            } else {
                await hafalanTypesService.create(data);
            }
            await fetchHafalanTypes();
            setShowModal(false);
            setEditData(null);
        } catch (error: unknown) {
            throw error;
        }
    };

    const handleEdit = (type: HafalanType) => {
        setEditData(type);
        setShowModal(true);
    };

    const handleDelete = async (type: HafalanType) => {
        if (!confirm(`Yakin ingin menonaktifkan "${type.name}"?`)) return;

        try {
            await hafalanTypesService.delete(type.id);
            await fetchHafalanTypes();
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Gagal menghapus hafalan type';
            alert(errorMsg);
        }
    };

    const handleReactivate = async (type: HafalanType) => {
        try {
            await hafalanTypesService.reactivate(type.id);
            await fetchHafalanTypes();
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Gagal mengaktifkan kembali hafalan type';
            alert(errorMsg);
        }
    };

    const handleHardDelete = async (type: HafalanType) => {
        // Double confirmation for hard delete
        const firstConfirm = confirm(
            `PERINGATAN!\n\nAnda akan MENGHAPUS PERMANEN "${type.name}" dari database.\n\nData yang sudah dihapus TIDAK BISA dikembalikan!\n\nLanjutkan?`
        );

        if (!firstConfirm) return;

        const secondConfirm = confirm(
            `KONFIRMASI TERAKHIR!\n\nYakin ingin menghapus "${type.name}" PERMANEN?\n\nTindakan ini TIDAK BISA dibatalkan!`
        );

        if (!secondConfirm) return;

        try {
            await hafalanTypesService.hardDelete(type.id);
            await fetchHafalanTypes();
            alert('Hafalan type berhasil dihapus permanen dari database');
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Gagal menghapus hafalan type';
            alert('ERROR: ' + errorMsg);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050505] flex relative overflow-hidden">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none"></div>

            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="flex-1 lg:ml-64 relative z-10">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 max-w-[1600px] mx-auto">
                    {/* Header Banner Section - More Compact */}
                    <div className="relative mb-8 lg:mb-10 rounded-[2.5rem] p-6 lg:p-8 overflow-hidden bg-gradient-to-br from-neutral-900 to-black border border-white/5 shadow-2xl group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-emerald-500/10 transition-colors duration-1000" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-2xl lg:text-4xl font-black text-white tracking-tighter uppercase leading-none flex items-center gap-4">
                                    <span className="w-1.5 h-8 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]"></span>
                                    Master <span className="text-emerald-500">Hafalan Types</span>
                                </h1>
                                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[9px] mt-3 ml-5">
                                    Smart Pesantren v2.0 • Data Management
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditData(null);
                                    setShowModal(true);
                                }}
                                className="flex items-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 group/btn"
                            >
                                <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" />
                                Tambah Hafalan Type
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid - More Compact Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                        {[
                            { label: 'Total Types', value: stats.total, icon: BookOpen, color: 'blue' },
                            { label: 'Aktif', value: stats.active, icon: CheckCircle2, color: 'emerald' },
                            { label: 'Nonaktif', value: stats.inactive, icon: XCircle, color: 'rose' },
                            { label: 'Kategori', value: Object.keys(stats.by_category || {}).length, icon: Calendar, color: 'amber' }
                        ].map((stat, i) => (
                            <div key={i} className="group relative">
                                <div className={`absolute -inset-0.5 bg-gradient-to-b from-${stat.color}-500/20 to-transparent rounded-[1.8rem] opacity-0 group-hover:opacity-100 transition duration-500`}></div>
                                <div className="relative bg-[#0c0c0c] border border-white/5 p-5 lg:p-6 rounded-[1.8rem] transition-all duration-500 group-hover:bg-neutral-900 group-hover:scale-[1.02] h-full shadow-xl">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500 border border-${stat.color}-500/20`}>
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                    <h3 className="text-2xl font-black text-white tracking-tighter">{stat.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters Strip - More Compact */}
                    <div className="bg-neutral-900/40 border border-white/5 p-4 lg:p-5 rounded-[2rem] mb-8 backdrop-blur-xl shadow-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="relative group">
                                <Search className="w-4 h-4 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cari nama hafalan..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-6 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-white placeholder-gray-700 font-bold transition-all text-sm"
                                />
                            </div>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-5 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-white font-bold appearance-none cursor-pointer text-sm"
                            >
                                <option value="all">Semua Kategori</option>
                                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key} className="bg-neutral-900">{config.icon} {config.label}</option>
                                ))}
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-5 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-white font-bold appearance-none cursor-pointer text-sm"
                            >
                                <option value="all">Semua Status</option>
                                <option value="active" className="bg-neutral-900">AKTIF</option>
                                <option value="inactive" className="bg-neutral-900">NONAKTIF</option>
                            </select>
                        </div>
                    </div>

                    {/* Hafalan Types Grid List - More Compact Items */}
                    <div className="grid grid-cols-1 gap-4">
                        {isLoading ? (
                            <div className="bg-neutral-900/20 p-16 rounded-[2.5rem] border border-white/5 text-center backdrop-blur-sm">
                                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4 opacity-40" />
                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Sinkronisasi Data Master...</p>
                            </div>
                        ) : filteredTypes.length === 0 ? (
                            <div className="bg-neutral-900/20 p-16 rounded-[2.5rem] border border-white/5 text-center backdrop-blur-sm">
                                <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5 opacity-50">
                                    <BookOpen className="w-8 h-8 text-gray-500" />
                                </div>
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] italic">Tidak ada data hafalan type yang ditemukan</p>
                            </div>
                        ) : (
                            filteredTypes.map((type) => {
                                const config = CATEGORY_CONFIG[type.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.other;
                                return (
                                    <div
                                        key={type.id}
                                        className="group relative bg-neutral-900/40 p-5 lg:p-6 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all duration-500 hover:shadow-2xl overflow-hidden backdrop-blur-md"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-white/10 transition-colors" />

                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                            <div className="flex items-start gap-5">
                                                <div className="text-2xl w-14 h-14 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-3">
                                                    {config.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                                                        <h3 className="text-base lg:text-lg font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors uppercase">
                                                            {type.name}
                                                        </h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-${config.color}-500/10 text-${config.color}-400 border border-${config.color}-500/20`}>
                                                            {config.label}
                                                        </span>
                                                        {type.is_active ? (
                                                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/5 border border-emerald-500/20 rounded-full">
                                                                <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">Aktif</span>
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-500/5 border border-rose-500/20 rounded-full">
                                                                <div className="w-1 h-1 rounded-full bg-rose-500"></div>
                                                                <span className="text-[8px] font-black text-rose-400 uppercase tracking-tighter">Nonaktif</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-2">
                                                        {type.total_units} {type.unit_name} Terdaftar
                                                    </p>
                                                    {type.description && (
                                                        <p className="text-gray-400 text-xs leading-relaxed max-w-2xl font-medium border-l border-white/5 pl-3 py-0.5">
                                                            {type.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2.5 justify-end">
                                                <button
                                                    onClick={() => handleEdit(type)}
                                                    className="p-3 bg-neutral-800 hover:bg-emerald-600 text-gray-500 hover:text-white rounded-xl transition-all border border-white/5 active:scale-95 shadow-lg group/edit"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4 group-hover/edit:scale-110" />
                                                </button>
                                                {type.is_active ? (
                                                    <button
                                                        onClick={() => handleDelete(type)}
                                                        className="p-3 bg-neutral-800 hover:bg-rose-600 text-gray-500 hover:text-white rounded-xl transition-all border border-white/5 active:scale-95 shadow-lg group/del"
                                                        title="Nonaktifkan"
                                                    >
                                                        <Trash2 className="w-4 h-4 group-hover/del:scale-110" />
                                                    </button>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleReactivate(type)}
                                                            className="p-3 bg-neutral-800 hover:bg-emerald-600 text-gray-500 hover:text-white rounded-xl transition-all border border-white/5 active:scale-95 shadow-lg"
                                                            title="Aktifkan Kembali"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleHardDelete(type)}
                                                            className="p-3 bg-neutral-800 hover:bg-rose-600 text-gray-500 hover:text-white rounded-xl transition-all border border-white/5 active:scale-95 shadow-lg"
                                                            title="Hapus Permanen"
                                                        >
                                                            <AlertTriangle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </main>
            </div>

            {/* Modal */}
            <HafalanTypeModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditData(null);
                }}
                onSave={handleSave}
                editData={editData}
            />
        </div>
    );
}
