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
    ChevronDown,
    AlertTriangle,
    ArrowLeft,
    ShieldAlert,
    Download
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { homeroomService } from '@/lib/services/homeroom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PelanggaranWaliPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [violations, setViolations] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [classInfo, setClassInfo] = useState<any>(null);

    const fetchInitialData = async (userId: string) => {
        try {
            setIsLoading(true);
            const info = await homeroomService.getClassInfo(userId);
            if (!info) {
                setClassInfo({ name: 'Belum Ada Kelas' });
                setIsLoading(false);
                return;
            }
            setClassInfo(info);

            // Fetch violations for students in this class
            const { data, error } = await supabase
                .from('violations')
                .select(`
                    *,
                    students!inner(name, class_id)
                `)
                .eq('students.class_id', info.id)
                .order('violation_date', { ascending: false });

            if (error) throw error;
            setViolations(data || []);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching violations:', error);
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
            fetchInitialData(currentUser.id);
        });
        return () => cancelAnimationFrame(timer);

    }, [router]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (!user) return null;

    const filteredData = violations.filter(v => {
        const matchesSearch = v.students?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === '' || v.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

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
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-6 text-xs font-black uppercase tracking-widest group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Kembali
                            </button>
                            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-[0.2em] mb-3">
                                <ShieldAlert className="w-4 h-4" />
                                Monitoring Kedisiplinan
                            </div>
                            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight">
                                Buku <span className="text-rose-500 italic">Kedisplinan</span>
                            </h1>
                            <p className="text-neutral-500 font-medium mt-2">
                                Daftar pelanggaran santri <span className="text-white font-bold">Kelas {classInfo?.name || '...'}</span>.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="px-6 py-3 bg-rose-600 shadow-xl shadow-rose-900/20 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-rose-500/20">
                                <AlertTriangle className="w-4 h-4" />
                                {violations.length} Total Kasus
                            </div>
                        </div>
                    </div>

                    {/* Stats Summary (Mini) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Ringan', count: violations.filter(v => v.category === 'ringan').length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            { label: 'Sedang', count: violations.filter(v => v.category === 'sedang').length, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                            { label: 'Berat', count: violations.filter(v => v.category === 'berat').length, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                        ].map((s, idx) => (
                            <div key={idx} className="bg-[#0c0c0c] p-4 rounded-2xl border border-neutral-800 flex items-center justify-between">
                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{s.label}</p>
                                <div className={`px-4 py-1 ${s.bg} ${s.color} rounded-lg font-black text-lg border border-white/5`}>
                                    {s.count}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-neutral-800 shadow-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="relative group">
                                <Search className="w-5 h-5 text-neutral-600 absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-rose-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cari nama atau deskripsi..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-16 pr-8 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:bg-black focus:border-rose-500 font-bold text-white transition-all placeholder:text-neutral-700"
                                />
                            </div>
                            <div className="relative group">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full h-full pl-8 pr-12 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:bg-black focus:border-rose-500 font-black text-[10px] uppercase tracking-widest text-white transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Semua Tingkat</option>
                                    <option value="ringan">Tingkat Ringan</option>
                                    <option value="sedang">Tingkat Sedang</option>
                                    <option value="berat">Tingkat Berat</option>
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600 group-focus-within:text-rose-500 transition-colors">
                                    <ChevronDown className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <button className="w-full py-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-400 font-black uppercase tracking-widest text-[10px] hover:text-white hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-inner">
                                    <Download className="w-4 h-4" />
                                    Export Excel
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Data List */}
                    <div className="bg-[#0c0c0c] rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden group">
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-neutral-900/40 border-b border-neutral-800">
                                    <tr>
                                        <th className="px-6 py-3.5 text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em]">Santri</th>
                                        <th className="px-6 py-3.5 text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em]">Tingkat</th>
                                        <th className="px-6 py-3.5 text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em]">Keterangan / Hukuman</th>
                                        <th className="px-6 py-3.5 text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] text-center">Poin</th>
                                        <th className="px-6 py-3.5 text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] text-right">Tanggal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/50">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-10 py-32 text-center">
                                                <div className="flex flex-col items-center gap-6">
                                                    <Loader2 className="w-16 h-16 text-rose-500 animate-spin" />
                                                    <p className="text-neutral-500 font-black uppercase tracking-[0.3em] text-[10px]">Memuat Rekap Kedisiplinan...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-10 py-32 text-center text-neutral-600 font-black uppercase tracking-[0.2em] text-xs italic">
                                                Tidak ada data pelanggaran.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map((v) => (
                                            <tr key={v.id} className="hover:bg-rose-500/[0.03] transition-colors group/row">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-rose-500 font-black text-[10px] border border-neutral-800 group-hover/row:border-rose-500/30 transition-all">
                                                            {v.students?.name?.charAt(0)}
                                                        </div>
                                                        <p className="font-black text-white group-hover/row:text-rose-400 transition-colors tracking-tight">{v.students?.name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-[0.2em] uppercase border ${v.category === 'berat' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                        v.category === 'sedang' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                        }`}>
                                                        {v.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <p className="text-sm font-bold text-neutral-400 group-hover/row:text-neutral-200 transition-colors max-w-md italic leading-relaxed">
                                                        &quot;{v.description || '-'}&quot;
                                                        {v.punishment && <span className="block not-italic text-xs text-rose-400/60 mt-2 font-black uppercase tracking-widest">Takzir: {v.punishment}</span>}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className="text-lg font-black text-rose-600 shadow-glow-rose">-{v.points}</span>
                                                </td>
                                                <td className="px-6 py-3 text-right text-[10px] font-black text-neutral-600 uppercase tracking-widest tabular-nums font-mono">
                                                    {new Date(v.violation_date).toLocaleDateString('id-ID')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="lg:hidden p-6 space-y-6 bg-black/40">
                            {filteredData.map((v) => (
                                <div key={v.id} className="bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800 shadow-xl active:scale-[0.98] transition-all group overflow-hidden relative">
                                    <div className="flex items-center justify-between mb-8">
                                        <span className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em]">{new Date(v.violation_date).toLocaleDateString('id-ID')}</span>
                                        <span className={`px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${v.category === 'berat' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                            v.category === 'sedang' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                            }`}>
                                            {v.category}
                                        </span>
                                    </div>
                                    <h4 className="font-black text-white text-xl tracking-tight leading-none mb-6">{v.students?.name}</h4>
                                    <div className="space-y-4 pt-6 border-t border-neutral-800/50">
                                        <p className="text-sm font-medium text-neutral-500 italic leading-relaxed">&quot;{v.description || '-'}&quot;</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-black text-rose-500/60 uppercase tracking-widest">Poin Disiplin</p>
                                            <p className="text-2xl font-black text-rose-600">-{v.points}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
