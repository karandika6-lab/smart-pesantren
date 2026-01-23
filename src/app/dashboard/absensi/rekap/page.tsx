'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    clearSession,
    User,
} from '@/lib/auth';
import {
    Calendar,
    Search,
    ChevronDown,
    Filter,
    Download,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Clock,
    UserCheck,
    Users
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';

// ============================================
// Types
// ============================================

import { attendanceService } from '@/lib/services/attendance';
import { Loader2 } from 'lucide-react';

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
    hadir: { label: 'Hadir', class: 'bg-emerald-100 text-emerald-700' },
    sakit: { label: 'Sakit', class: 'bg-amber-100 text-amber-700' },
    izin: { label: 'Izin', class: 'bg-blue-100 text-blue-700' },
    alpha: { label: 'Alpha', class: 'bg-red-100 text-red-700' },
    telat: { label: 'Telat', class: 'bg-purple-100 text-purple-700' }, // Added Telat
};

// ... (inside component)

// Safe class access

export default function AbsensiRekapPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [rekapData, setRekapData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_absensi' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchRekap();
    }, [router]);

    useEffect(() => {
        fetchRekap();
    }, [selectedDate, searchTerm]);

    const fetchRekap = async () => {
        try {
            setIsLoading(true);
            const data = await attendanceService.getRekap({
                date: selectedDate,
                search: searchTerm
            });
            setRekapData(data);
        } catch (error) {
            console.error('Error fetching rekap:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (!user) return null;

    const stats = {
        hadir: rekapData.filter(d => d.status === 'hadir').length,
        sakit: rekapData.filter(d => d.status === 'sakit').length,
        izin: rekapData.filter(d => d.status === 'izin').length,
        alpha: rekapData.filter(d => d.status === 'alpha').length,
    };

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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Rekapitulasi Absensi</h1>
                            <p className="text-gray-500">Riwayat presensi santri per hari dan per kelas.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm">
                                <Download className="w-5 h-5 text-gray-400" />
                                Export Excel
                            </button>
                        </div>
                    </div>

                    {/* Quick Overview */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Hadir', value: stats.hadir, color: 'emerald', icon: UserCheck },
                            { label: 'Sakit', value: stats.sakit, color: 'amber', icon: Clock },
                            { label: 'Izin', value: stats.izin, color: 'blue', icon: Calendar },
                            { label: 'Alpha', value: stats.alpha, color: 'red', icon: XCircle },
                        ].map((stat, i) => (
                            <div key={stat.label} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`p-2 bg-${stat.color}-50 text-${stat.color}-600 rounded-lg`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-emerald-500">Filtered</span>
                                </div>
                                <p className="text-xl font-black text-gray-800">{stat.value}</p>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="flex-1 relative">
                                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari nama santri atau kelas..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 font-medium"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 font-medium"
                                    />
                                    <Calendar className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                <button className="p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-500">
                                    <Filter className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* DataTable */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100 text-left">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Santri</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Kelas</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Sesi</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Waktu Aben</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 relative min-h-[200px]">
                                    {isLoading && (
                                        <tr>
                                            <td colSpan={6} className="p-0">
                                                <div className="w-full flex justify-center py-10 bg-white/50 backdrop-blur-[1px] absolute inset-0 z-10">
                                                    <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {rekapData.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center font-bold text-xs">
                                                        {item.studentName.charAt(0)}
                                                    </div>
                                                    <p className="font-bold text-gray-800">{item.studentName}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">{item.studentClass}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-600">{item.session}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${(STATUS_BADGE[item.status] || { class: 'bg-gray-100 text-gray-700' }).class}`}>
                                                    {(STATUS_BADGE[item.status] || { label: item.status, class: 'bg-gray-100 text-gray-700' }).label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{item.date}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button className="p-1 hover:bg-gray-100 rounded-lg">
                                                    <MoreVertical className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {rekapData.length === 0 && !isLoading && (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center">
                                                <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                                <p className="text-gray-400 font-medium">Tidak ada data absensi untuk pencarian ini.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
