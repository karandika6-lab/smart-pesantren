'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
import {
    Users,
    Search,
    BookOpen,
    Eye,
    Activity,
    Loader2,
    LayoutGrid
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { ustadzService } from '@/lib/services/ustadz';

export default function SantriSayaPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Data State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStudents = async (userId: string) => {
        try {
            setIsLoading(true);
            const data = await ustadzService.getMyStudents(userId);
            setStudents(data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'ustadz') {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchStudents(currentUser.id);
        });
        return () => cancelAnimationFrame(timer);

    }, [router]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (!user) return null;

    const filteredData = students.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nis?.includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-400 font-sans selection:bg-indigo-500/30">

            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-[0.2em] mb-2 uppercase">
                                <Activity className="w-4 h-4" />
                                Manajemen Binaan
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                Santri <span className="text-indigo-500">Halaqah Saya</span>
                            </h1>
                            <p className="text-neutral-500 text-sm mt-2 font-medium">Daftar santri binaan dalam kelompok halaqoh asuhan Anda.</p>
                        </div>

                        <div className="relative group self-start md:self-auto">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex items-center gap-3 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                                <Users className="w-4 h-4" />
                                Total: {students.length} Santri
                            </div>
                        </div>
                    </div>

                    {/* Search Strip */}
                    <div className="bg-[#0c0c0c] p-4 lg:p-6 rounded-[2.5rem] border border-white/5 shadow-2xl">
                        <div className="relative group max-w-md">
                            <Search className="w-4 h-4 text-neutral-600 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari Nama / NIS..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-black border border-white/5 rounded-2xl focus:outline-none focus:border-indigo-500 text-white font-black text-xs uppercase tracking-widest transition-all placeholder:text-neutral-900 shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Data Display */}
                    <div className="bg-[#0c0c0c] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                        {/* Mobile View: Cards */}
                        <div className="lg:hidden p-4 space-y-4">
                            {isLoading ? (
                                <div className="py-20 flex flex-col items-center gap-4">
                                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin opacity-20" />
                                </div>
                            ) : filteredData.length === 0 ? (
                                <div className="py-20 text-center opacity-20">
                                    <LayoutGrid className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Kosong</p>
                                </div>
                            ) : (
                                filteredData.map((s) => (
                                    <div key={s.id} className="bg-black border border-white/5 rounded-[2rem] p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center font-black text-indigo-500 text-sm border border-indigo-500/10">
                                                    {s.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-xs text-white uppercase tracking-tight leading-none">{s.name}</h4>
                                                    <p className="text-[8px] font-bold text-neutral-700 uppercase tracking-widest mt-1.5">NIS: {s.nis || '-'}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => router.push(`/dashboard/ustadz/santri/${s.id}`)}
                                                className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-neutral-600 border border-white/5 active:scale-90"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-neutral-900/50 p-4 rounded-2xl border border-white/5">
                                                <p className="text-[8px] font-black text-neutral-700 uppercase tracking-widest mb-2">Hafalan</p>
                                                <div className="flex items-end justify-between">
                                                    <span className="text-sm font-black text-white">{s.totalHafalan} <span className="text-[9px] text-neutral-600">Juz</span></span>
                                                    <span className="text-[10px] font-black text-indigo-500 italic">Juz {s.lastJuz}</span>
                                                </div>
                                                <div className="h-1 w-full bg-black rounded-full mt-3 overflow-hidden">
                                                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${(s.totalHafalan / 30) * 100}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="bg-neutral-900/50 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                                                <p className="text-[8px] font-black text-neutral-700 uppercase tracking-widest mb-2">Status</p>
                                                <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase text-center ${s.status === 'Lancar' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                                    {s.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop View: Table */}
                        <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-black border-b border-white/5">
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em] w-20">No</th>
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em]">Nama Lengkap</th>
                                        <th className="px-4 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em] text-center w-32">Kelas</th>
                                        <th className="px-4 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em] text-center w-40">Terakhir</th>
                                        <th className="px-4 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em] text-center w-48">Progress</th>
                                        <th className="px-4 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em] text-center w-32">Status</th>
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em] text-center w-32">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 bg-black/20 text-white">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="py-32 text-center">
                                                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto opacity-20" />
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map((s, i) => (
                                            <tr key={s.id} className="hover:bg-indigo-600/[0.02] transition-all group">
                                                <td className="px-8 py-5 text-sm font-black text-neutral-800">{i + 1}</td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 rounded-2xl bg-indigo-600/5 border border-indigo-500/10 flex items-center justify-center font-black text-indigo-500 text-sm shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                            {s.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-white text-sm uppercase tracking-tight leading-none group-hover:text-indigo-400 transition-colors">{s.name}</p>
                                                            <p className="text-[10px] text-neutral-700 font-bold tracking-widest mt-2 uppercase">NIS: {s.nis || '-'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <span className="px-3 py-1.5 bg-neutral-900 text-neutral-500 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest">{s.class}</span>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <BookOpen className="w-4 h-4 text-indigo-500/40" />
                                                        <span className="font-black text-sm uppercase">Juz {s.lastJuz}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm font-black text-indigo-400 tracking-tighter">{s.totalHafalan} <span className="text-[10px] text-neutral-700 uppercase">Juz</span></span>
                                                        <div className="w-24 h-1.5 bg-black rounded-full mt-3 overflow-hidden border border-white/5">
                                                            <div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, (s.totalHafalan / 30) * 100)}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${s.status === 'Lancar' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                                        {s.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <button
                                                        onClick={() => router.push(`/dashboard/ustadz/santri/${s.id}`)}
                                                        className="p-3 bg-neutral-900 text-neutral-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all border border-white/5 active:scale-90"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #262626; }
            `}</style>
        </div>
    );
}
