'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    clearSession,
    User,
} from '@/lib/auth';
import {
    Search,
    Eye,
    ChevronLeft,
    ChevronRight,
    Users,
    Filter,
    ArrowUpDown,
    Activity,
    Shield
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';

import { homeroomService } from '@/lib/services/homeroom';
import { Loader2 } from 'lucide-react';

export default function DataSantriWaliPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [students, setStudents] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [myClass, setMyClass] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async (userId: string) => {
        try {
            setIsLoading(true);
            const classData = await homeroomService.getClassInfo(userId);
            setMyClass(classData);

            if (classData) {
                const studentData = await homeroomService.getStudents(classData.id);
                setStudents(studentData);
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching students:', error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_kelas') {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchData(currentUser.id);
        });
        return () => cancelAnimationFrame(timer);

    }, [router]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-transparent">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-indigo-100 font-black uppercase tracking-[0.3em] text-[10px]">Menyinkronkan Data Santri...</p>
            </div>
        );
    }

    const filteredData = students.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nis.includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-transparent flex flex-col lowercase-none">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64 flex-1">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8 space-y-8">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-[0.2em] mb-3">
                                <Activity className="w-4 h-4" />
                                Database Kesiswaan
                            </div>
                            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight">
                                Santri <span className="text-indigo-500 italic">Perwalian</span>
                            </h1>
                            <p className="text-neutral-500 font-medium mt-2 max-w-xl text-sm lg:text-base">
                                Mengelola data lengkap murid di <span className="text-white font-bold">Kelas {myClass?.name || '...'}</span>.
                            </p>
                        </div>
                        <div className="flex">
                            <div className="px-6 py-3 bg-indigo-600 shadow-xl shadow-indigo-900/20 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-indigo-500/20">
                                <Users className="w-4 h-4" />
                                {students.length} Total Santri
                            </div>
                        </div>
                    </div>

                    {/* Search & Filters (Modern Midnight) */}
                    <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-neutral-800 shadow-2xl flex flex-col lg:flex-row items-center gap-6 group">
                        <div className="relative flex-1 w-full">
                            <Search className="w-5 h-5 text-neutral-600 absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari nama santri atau NIS..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-16 pr-8 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-black focus:border-indigo-500 font-bold text-white transition-all placeholder:text-neutral-600 placeholder:font-medium"
                            />
                        </div>
                        <button className="w-full lg:w-auto px-8 py-4 bg-neutral-900 text-neutral-400 border border-neutral-800 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-neutral-800 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95 shadow-inner">
                            <Filter className="w-4 h-4" />
                            Filter Data
                        </button>
                    </div>

                    {/* Data Display - Responsive Midnight Container */}
                    <div className="bg-[#0c0c0c] rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden relative group">
                        {/* Desktop View (Table) */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-neutral-900/40 border-b border-neutral-800">
                                    <tr>
                                        <th className="px-6 py-3.5 text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] w-24">No</th>
                                        <th className="px-6 py-3.5 text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em]">
                                            <div className="flex items-center gap-2">NIS <ArrowUpDown className="w-3 h-3 text-indigo-500" /></div>
                                        </th>
                                        <th className="px-6 py-3.5 text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em]">Nama Lengkap</th>
                                        <th className="px-6 py-3.5 text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] text-center">Gender</th>
                                        <th className="px-6 py-3.5 text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em]">TTL</th>
                                        <th className="px-6 py-3.5 text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] text-center">Status</th>
                                        <th className="px-6 py-3.5 text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/50">
                                    {filteredData.map((s, index) => (
                                        <tr key={s.id} className="hover:bg-indigo-500/[0.03] transition-colors group/row">
                                            <td className="px-6 py-3 text-xs font-black text-neutral-700 group-hover/row:text-indigo-500/50">{String(index + 1).padStart(2, '0')}</td>
                                            <td className="px-6 py-3">
                                                <span className="px-4 py-1.5 bg-neutral-900 text-neutral-300 border border-neutral-800 rounded-xl text-[10px] font-black tracking-widest group-hover/row:border-indigo-500/20 group-hover/row:text-white transition-all">{s.nis}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <p className="font-black text-white group-hover/row:text-indigo-400 transition-colors tracking-tight">{s.name}</p>
                                            </td>
                                            <td className="px-6 py-3 text-center text-xs">
                                                <span className={`w-10 h-10 inline-flex items-center justify-center rounded-2xl font-black shadow-inner border ${s.gender === 'L' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                                    {s.gender || '?'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-[10px] text-neutral-500 font-black uppercase tracking-widest leading-loose">
                                                <div className="max-w-[150px] truncate">{s.birth_place || '-'}</div>
                                                <div className="text-neutral-600 mt-1">{s.birth_date || '-'}</div>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border shadow-glow-sm ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-neutral-500/10 text-neutral-500 border-neutral-800'}`}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <button className="w-12 h-12 inline-flex items-center justify-center bg-neutral-900 text-neutral-600 rounded-2xl border border-neutral-800 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all hover:shadow-2xl hover:shadow-indigo-900/40 active:scale-90">
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View (Premium Dark Cards) */}
                        <div className="lg:hidden p-6 space-y-6 bg-black/40">
                            {filteredData.map((s) => (
                                <div key={s.id} className="bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800 shadow-xl active:scale-[0.98] transition-all relative overflow-hidden group">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-900/20">
                                                <span className="text-white font-black text-2xl">{s.name.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-white text-xl tracking-tight leading-none mb-2">{s.name}</h4>
                                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest leading-none">NIS: <span className="text-indigo-500">{s.nis}</span></p>
                                            </div>
                                        </div>
                                        <span className={`px-4 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-full border ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-glow-emerald' : 'bg-neutral-500/10 text-neutral-500 border-neutral-800'}`}>
                                            {s.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 py-6 border-y border-neutral-800/50">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Gender</p>
                                            <p className="text-sm font-bold text-neutral-300">{s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Kelahiran</p>
                                            <p className="text-sm font-bold text-neutral-300 truncate">{s.birth_place || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-8">
                                        <button className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-900/30 flex items-center justify-center gap-3 transition-all active:scale-95">
                                            <Eye className="w-4 h-4" />
                                            Detail Profil Santri
                                        </button>
                                    </div>
                                    {/* Ambient background icon */}
                                    <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                        <Shield className="w-24 h-24 text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Footer (Midnight Style) */}
                        <div className="p-5 bg-neutral-900/50 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-8">
                            <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em]">
                                Menampilkan <span className="text-white font-black">{filteredData.length}</span> Santri Terdaftar
                            </p>
                            <div className="flex items-center gap-4">
                                <button className="w-12 h-12 flex items-center justify-center border border-neutral-800 rounded-2xl text-neutral-700 cursor-not-allowed transition-all">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button className="w-12 h-12 flex items-center justify-center bg-neutral-900 border border-neutral-800 shadow-xl rounded-2xl text-white hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all active:scale-90">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
