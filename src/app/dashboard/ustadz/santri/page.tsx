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
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'ustadz') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchStudents(currentUser.id);
    }, [router]);

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
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
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
                            <div className="relative flex items-center gap-3 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                                <Users className="w-4 h-4" />
                                Total: {students.length} Santri
                            </div>
                        </div>
                    </div>

                    {/* Search Strip */}
                    <div className="bg-[#0a0a0a] p-4 lg:p-5 rounded-[2rem] border border-neutral-800/40 shadow-xl">
                        <div className="relative group max-w-md">
                            <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari berdasarkan nama atau NIS..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-[#0c0c0c] border border-neutral-800 rounded-2xl focus:outline-none focus:border-indigo-500 text-white font-bold text-sm transition-all placeholder:text-neutral-700 placeholder:font-medium"
                            />
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-[#0a0a0a] rounded-[2.5rem] border border-neutral-800/40 overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#0e0e0e] border-b border-neutral-800/50">
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] w-20">No</th>
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Nama Lengkap</th>
                                        <th className="px-4 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">Kelas</th>
                                        <th className="px-4 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">Juz Terakhir</th>
                                        <th className="px-4 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">Total Hafalan</th>
                                        <th className="px-4 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">Status</th>
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/30">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin opacity-40" />
                                                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Menyamakan Data Binaan...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-40">
                                                    <LayoutGrid className="w-12 h-12 text-neutral-700" />
                                                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest italic">Belum ada santri binaan yang terdaftar.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map((s, i) => (
                                            <tr key={s.id} className="hover:bg-neutral-900/40 transition-all group">
                                                <td className="px-8 py-5 text-sm font-bold text-neutral-700">{i + 1}</td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center font-bold text-indigo-500 text-sm">
                                                            {s.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white text-sm uppercase tracking-tight">{s.name}</p>
                                                            <p className="text-[10px] text-neutral-600 font-bold tracking-widest mt-0.5">NIS: {s.nis || '-'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <span className="px-2.5 py-1 bg-neutral-900 text-neutral-500 border border-neutral-800 rounded-lg text-[9px] font-bold uppercase">{s.class}</span>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <div className="flex items-center justify-center gap-2 group-hover:scale-110 transition-transform">
                                                        <BookOpen className="w-3.5 h-3.5 text-indigo-500/60" />
                                                        <span className="font-bold text-white text-sm">Juz {s.lastJuz}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm font-black text-indigo-400 tracking-tighter">{s.totalHafalan} Juz</span>
                                                        <div className="w-16 h-1 bg-neutral-900 rounded-full mt-2 overflow-hidden border border-neutral-800">
                                                            <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, (s.totalHafalan / 30) * 100)}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${s.status === 'Lancar' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                            s.status === 'Baru' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                                                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                        }`}>
                                                        {s.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <button
                                                        onClick={() => router.push(`/dashboard/ustadz/santri/${s.id}`)}
                                                        className="p-2.5 bg-neutral-900 text-neutral-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-neutral-800 hover:border-indigo-500 group-hover:translate-x-1"
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
