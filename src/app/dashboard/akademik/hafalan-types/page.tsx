'use client';

import { useEffect, useState } from 'react';
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
    AlertTriangle
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

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin_akademik') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchHafalanTypes();
    }, [router]);

    useEffect(() => {
        applyFilters();
    }, [hafalanTypes, searchQuery, categoryFilter, statusFilter]);

    const fetchHafalanTypes = async () => {
        try {
            setIsLoading(true);
            const [types, statistics] = await Promise.all([
                hafalanTypesService.getAllIncludingInactive(),
                hafalanTypesService.getStatistics()
            ]);
            setHafalanTypes(types);
            setStats(statistics);
        } catch (error) {
            console.error('Error fetching hafalan types:', error);
            alert('Gagal memuat data hafalan types');
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
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
    };

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
        } catch (error: any) {
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
        } catch (error: any) {
            alert(error.message || 'Gagal menghapus hafalan type');
        }
    };

    const handleReactivate = async (type: HafalanType) => {
        try {
            await hafalanTypesService.reactivate(type.id);
            await fetchHafalanTypes();
        } catch (error: any) {
            alert(error.message || 'Gagal mengaktifkan kembali hafalan type');
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
        } catch (error: any) {
            alert('ERROR: ' + (error.message || 'Gagal menghapus hafalan type'));
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (!user) return null;

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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                                📚 Master Hafalan Types
                            </h1>
                            <p className="text-gray-500">Kelola jenis-jenis hafalan yang tersedia di pesantren</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditData(null);
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Tambah Hafalan Type
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-gray-500">Total Types</p>
                                <BookOpen className="w-5 h-5 text-indigo-600" />
                            </div>
                            <p className="text-3xl font-black text-gray-800">{stats.total}</p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-gray-500">Aktif</p>
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            </div>
                            <p className="text-3xl font-black text-emerald-600">{stats.active}</p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-gray-500">Nonaktif</p>
                                <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <p className="text-3xl font-black text-red-600">{stats.inactive}</p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-gray-500">Kategori</p>
                                <div className="w-5 h-5 text-purple-600">📂</div>
                            </div>
                            <p className="text-3xl font-black text-purple-600">{Object.keys(stats.by_category).length}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari nama hafalan..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                                />
                            </div>

                            {/* Category Filter */}
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                            >
                                <option value="all">Semua Kategori</option>
                                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>{config.icon} {config.label}</option>
                                ))}
                            </select>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                            >
                                <option value="all">Semua Status</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Nonaktif</option>
                            </select>
                        </div>
                    </div>

                    {/* Hafalan Types List */}
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                                <p className="text-gray-500">Memuat data...</p>
                            </div>
                        ) : filteredTypes.length === 0 ? (
                            <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <p className="text-gray-400 italic">Tidak ada data hafalan type</p>
                            </div>
                        ) : (
                            filteredTypes.map((type) => {
                                const config = CATEGORY_CONFIG[type.category as keyof typeof CATEGORY_CONFIG];
                                return (
                                    <div
                                        key={type.id}
                                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-2xl">{config.icon}</span>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-800">{type.name}</h3>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${config.color}-100 text-${config.color}-700`}>
                                                                {config.label}
                                                            </span>
                                                            <span className="text-sm text-gray-500">
                                                                {type.total_units} {type.unit_name}
                                                            </span>
                                                            {type.is_active ? (
                                                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                                    Aktif
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                                    Nonaktif
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {type.description && (
                                                    <p className="text-sm text-gray-600 mt-2 ml-11">{type.description}</p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(type)}
                                                    className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                {type.is_active ? (
                                                    <button
                                                        onClick={() => handleDelete(type)}
                                                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                                        title="Nonaktifkan"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleReactivate(type)}
                                                            className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                                                            title="Aktifkan Kembali"
                                                        >
                                                            <RotateCcw className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleHardDelete(type)}
                                                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                                            title="Hapus Permanen (TIDAK BISA DIKEMBALIKAN)"
                                                        >
                                                            <AlertTriangle className="w-5 h-5" />
                                                        </button>
                                                    </>
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
