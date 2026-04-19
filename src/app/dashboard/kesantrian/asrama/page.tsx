'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Home,
    Plus,
    Users,
    Search,
    ChevronRight,
    Bed,
    Building2,
    CheckCircle2,
    ArrowLeft,
    Loader2,
    Edit,
    Trash2
} from 'lucide-react';

import { dormitoriesService, DormitoryWithRelations } from '@/lib/services/dormitories';
import DormModal from '@/components/admin/DormModal';

interface ExtendedDorm extends DormitoryWithRelations {
    building?: string;
}

export default function DataAsramaPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [dorms, setDorms] = useState<DormitoryWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDorm, setSelectedDorm] = useState<DormitoryWithRelations | null>(null);

    const fetchDorms = async () => {
        try {
            setIsLoading(true);
            const data = await dormitoriesService.getAll();
            setDorms(data);
            setIsLoading(false);
        } catch (_error) {
            console.error('Error fetching dorms:', _error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = requestAnimationFrame(() => {
            fetchDorms();
        });
        return () => cancelAnimationFrame(timer);
    }, []);

    const handleOpenAddModal = () => {
        setSelectedDorm(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (dorm: DormitoryWithRelations) => {
        setSelectedDorm(dorm);
        setIsModalOpen(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmitDorm = async (data: any) => {
        try {
            if (selectedDorm) {
                await dormitoriesService.update(selectedDorm.id, data);
            } else {
                await dormitoriesService.create(data);
            }
            fetchDorms();
        } catch (error) {
            console.error('Error saving dorm:', error);
            throw error;
        }
    };

    const handleDeleteDorm = async (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus data asrama ini? Pastikan tidak ada santri yang terdaftar di kamar ini.')) {
            try {
                await dormitoriesService.delete(id);
                fetchDorms();
            } catch {
                alert('Gagal menghapus data asrama. Mungkin masih ada santri yang terhubung.');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
            </div>
        );
    }

    const filteredDorms = dorms.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.supervisor?.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const totalCapacity = dorms.reduce((acc, d) => acc + (d.capacity || 0), 0);
    const totalOccupied = dorms.reduce((acc, d) => acc + (d.current_occupancy || 0), 0);
    const totalBuildings = Array.from(new Set(dorms.map(d => d.name.split(' ')[0]))).length || 0;

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
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
                            <Home className="w-8 h-8 text-orange-600" />
                            Data Asrama & Kamar
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Manajemen hunian santri dan penanggung jawab gedung
                        </p>
                    </div>
                    <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Tambah Gedung/Kamar
                    </button>
                </div>
            </div>

            <DormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitDorm}
                dormData={selectedDorm ?? undefined}
            />

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                        <Building2 className="w-7 h-7" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-extrabold text-gray-800">{totalBuildings}</h4>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gedung</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <Bed className="w-7 h-7" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-extrabold text-gray-800">{dorms.length}</h4>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Kamar</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <Users className="w-7 h-7" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-extrabold text-gray-800">{totalOccupied}/{totalCapacity}</h4>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Okupansi Santri</p>
                    </div>
                </div>
            </div>

            {/* Search / Filter */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-8">
                <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Cari gedung, nomor kamar, atau nama musyrif..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white focus:border-orange-500 transition-all font-medium text-gray-700"
                    />
                </div>
            </div>

            {/* Dorm Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredDorms.map((dorm) => {
                    const isFull = (dorm.current_occupancy || 0) >= (dorm.capacity || 1);
                    return (
                        <div key={dorm.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-orange-900/5 transition-all duration-300">
                            <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest ${isFull ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                                        }`}>
                                        {isFull ? 'Full' : 'Available'}
                                    </span>
                                    <button className="text-gray-300 hover:text-orange-500 transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                                <h3 className="text-lg font-extrabold text-gray-800 leading-tight">{(dorm as ExtendedDorm).building || 'Gedung'}</h3>
                                <p className="text-orange-600 font-bold">Kamar {dorm.name}</p>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kapasitas</p>
                                        <p className="text-sm font-bold text-gray-700">{dorm.current_occupancy}/{dorm.capacity} Santri</p>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-rose-500' : 'bg-emerald-500'
                                                }`}
                                            style={{ width: `${Math.min(((dorm.current_occupancy || 0) / (dorm.capacity || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-bold text-orange-600 border border-orange-50">
                                        {dorm.supervisor?.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Musyrif</p>
                                        <p className="text-sm font-bold text-gray-700 leading-tight">{dorm.supervisor?.name || 'Belum ditugaskan'}</p>
                                    </div>
                                    {isFull && (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-auto" />
                                    )}
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between text-xs font-bold text-gray-400">
                                <span>Last Checked: Today</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenEditModal(dorm)}
                                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-white rounded-lg transition-all shadow-sm"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteDorm(dorm.id)}
                                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all shadow-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
