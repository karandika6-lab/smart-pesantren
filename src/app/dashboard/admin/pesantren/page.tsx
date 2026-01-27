'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, User, clearSession } from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    Plus,
    Search,
    Users,
    MapPin,
    Phone,
    Edit,
    Trash2,
    Building2,
    Loader2,
    X,
    CheckCircle2
} from 'lucide-react';
import { pesantrenService, Pesantren, DetailedPesantren } from '@/lib/services/pesantren';

export default function PesantrenManagement() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [pesantrens, setPesantrens] = useState<DetailedPesantren[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingPesantren, setEditingPesantren] = useState<Pesantren | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: ''
    });

    const fetchPesantrens = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await pesantrenService.getDetailedAll();
            setPesantrens(data);
        } catch (_error) {
            console.error('Failed to fetch pesantren:', _error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'super_admin') {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchPesantrens();
        });
        return () => cancelAnimationFrame(timer);
    }, [router, fetchPesantrens]);

    const handleSave = async () => {
        if (!formData.name) {
            alert('Nama Pesantren wajib diisi');
            return;
        }

        setIsSaving(true);
        try {
            if (editingPesantren) {
                await pesantrenService.update(editingPesantren.id, formData);
            } else {
                await pesantrenService.create(formData);
            }
            setShowModal(false);
            setEditingPesantren(null);
            setFormData({ name: '', address: '', phone: '' });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            fetchPesantrens();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            alert('Gagal menyimpan: ' + message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Hapus unit pesantren "${name}"? Semua data terkait unit ini akan terisolasi.`)) {
            try {
                await pesantrenService.delete(id);
                fetchPesantrens();
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                alert('Gagal menghapus: ' + message);
            }
        }
    };

    const filteredPesantrens = pesantrens.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (isLoading && pesantrens.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-[60] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-medium">Data Pesantren berhasil diperbarui!</span>
                </div>
            )}

            {/* Management Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-neutral-800">
                        <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="text-xl font-bold dark:text-white">
                                {editingPesantren ? 'Edit Pesantren' : 'Tambah Pesantren Baru'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nama Pesantren</label>
                                <div className="relative">
                                    <Building2 className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none dark:text-white"
                                        placeholder="Misal: Pesantren Al-Hidayah"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Alamat</label>
                                <div className="relative">
                                    <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                                    <textarea
                                        rows={3}
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none dark:text-white"
                                        placeholder="Alamat lengkap unit"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nomor Telepon</label>
                                <div className="relative">
                                    <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none dark:text-white"
                                        placeholder="0812..."
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-neutral-800 flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                                {editingPesantren ? 'Simpan Perubahan' : 'Daftarkan Pesantren'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Sidebar
                user={user!}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64">
                <DashboardHeader user={user!} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8">
                    {/* Header Banner - Modern Gradient */}
                    <div className="bg-gradient-to-br from-purple-950 via-violet-900 to-indigo-950 rounded-[2.5rem] p-8 lg:p-12 border border-purple-500/20 shadow-2xl relative overflow-hidden mb-8 group">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full -mr-20 -mt-20 blur-3xl mix-blend-overlay" />
                        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full -ml-20 -mb-20 blur-3xl mix-blend-overlay" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 text-purple-300 text-xs font-bold tracking-[0.2em] mb-3 uppercase shadow-black/10">
                                    <Building2 className="w-4 h-4" />
                                    Master Data
                                </div>
                                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-xl">Pesantren Management</h1>
                                <p className="text-purple-100/80 font-medium mt-3 max-w-xl leading-relaxed drop-shadow-md">
                                    Kelola daftar unit pesantren, konfigurasi lokasi, dan isolasi data per unit.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingPesantren(null);
                                    setFormData({ name: '', address: '', phone: '' });
                                    setShowModal(true);
                                }}
                                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-full font-black shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
                                <Plus className="w-5 h-5 relative z-10" />
                                <span className="uppercase tracking-widest text-sm relative z-10">Unit Pesantren Baru</span>
                            </button>
                        </div>
                    </div>

                    {/* Search & Statistics */}
                    <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-5 mb-8">
                        <div className="relative max-w-md">
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari berdasarkan nama atau lokasi..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-purple-500/20 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Grid List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredPesantrens.map((p) => (
                            <div key={p.id} className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 bg-purple-50 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-100 dark:border-purple-500/20">
                                            <Building2 className="w-7 h-7 text-purple-600" />
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setEditingPesantren(p);
                                                    setFormData({
                                                        name: p.name,
                                                        address: p.address || '',
                                                        phone: p.phone || ''
                                                    });
                                                    setShowModal(true);
                                                }}
                                                className="p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-lg text-gray-400 hover:text-purple-600"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id, p.name)}
                                                className="p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-lg text-gray-400 hover:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <h4 className="text-lg font-bold dark:text-white group-hover:text-purple-600 transition-colors mb-2">{p.name}</h4>
                                    <div className="space-y-2 mb-6 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 flex-shrink-0" />
                                            <span className="line-clamp-1">{p.address || 'Alamat belum diderfinisikan'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            <span>{p.phone || '-'}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-neutral-800">
                                        <div className="bg-gray-50 dark:bg-black rounded-xl p-3">
                                            <p className="text-xs text-gray-400 mb-0.5">Total Santri</p>
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-emerald-500" />
                                                <span className="font-bold dark:text-white">{p.totalStudents}</span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-black rounded-xl p-3">
                                            <p className="text-xs text-gray-400 mb-0.5">Total Staff</p>
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-purple-500" />
                                                <span className="font-bold dark:text-white">{p.totalUsers}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
