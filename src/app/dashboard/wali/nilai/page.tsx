'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
import {
    FileText,
    TrendingUp,
    Download,
    Award,
    ChevronDown,
    BookOpen,
    Loader2,
    Users,
    Activity,
    Star,
    LayoutGrid,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { supabase } from '@/lib/supabase';
import { guardianService } from '@/lib/services/guardian';
import { gradesService } from '@/lib/services/grades';

export default function NilaiAkademikPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [children, setChildren] = useState<any[]>([]);
    const [activeChild, setActiveChild] = useState<any>(null);
    const [grades, setGrades] = useState<any[]>([]);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_santri') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchInitialData(currentUser.id);
    }, [router]);

    const fetchInitialData = async (parentId: string) => {
        try {
            const childrenList = await guardianService.getChildren(parentId);
            setChildren(childrenList);
            if (childrenList.length > 0) {
                await fetchChildGrades(childrenList[0]);
            } else {
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Error fetching initial data:', err);
            setIsLoading(false);
        }
    };

    const fetchChildGrades = async (child: any) => {
        setIsLoading(true);
        setActiveChild(child);
        try {
            const gradesData = await gradesService.getByStudent(child.id);
            setGrades(gradesData.map(g => {
                const score = gradesService.getFinalValue(g);
                return {
                    id: g.id,
                    subject: g.subject?.name || 'Unknown',
                    kkm: 75,
                    score: score,
                    predicate: gradesService.getGradeLetter(score),
                    status: score >= 75 ? 'Lulus' : 'Remedial'
                };
            }));
        } catch (err) {
            console.error('Error fetching grades:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (isLoading && !activeChild) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin opacity-40" />
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Memproses Transkrip Akademik...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const averageScore = grades.length > 0
        ? grades.reduce((acc, curr) => acc + curr.score, 0) / grades.length
        : 0;

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-400 font-sans selection:bg-orange-500/30">
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 space-y-10 max-w-[1500px] mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-orange-500 text-xs font-bold tracking-[0.2em] mb-2 uppercase">
                                <Activity className="w-4 h-4" />
                                Achievement Registry
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                Nilai & <span className="text-orange-500">Rapor Akademik</span>
                            </h1>
                            <p className="text-neutral-500 text-sm mt-2 font-medium">Laporan capaian nilai dan hasil evaluasi belajar putra/putri Anda.</p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4">
                            {children.length > 1 && (
                                <div className="flex bg-[#0a0a0a] p-1.5 rounded-2xl border border-neutral-800 shadow-xl overflow-x-auto no-scrollbar">
                                    {children.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => fetchChildGrades(c)}
                                            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${activeChild?.id === c.id
                                                ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]'
                                                : 'text-neutral-600 hover:text-neutral-300'
                                                }`}
                                        >
                                            {c.name.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <button className="px-6 py-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl text-[10px] font-black text-white hover:bg-neutral-800 transition-all flex items-center gap-3 uppercase tracking-widest shadow-xl">
                                <Download className="w-4 h-4 text-orange-500" />
                                Download Rapor PDF
                            </button>
                        </div>
                    </div>

                    {!activeChild ? (
                        <div className="bg-[#0a0a0a] border border-neutral-800/50 rounded-[3rem] p-24 text-center shadow-2xl">
                            <Users className="w-20 h-20 text-neutral-800 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-white">Profil Belum Dimuat</h3>
                            <p className="text-neutral-500 mt-2 font-medium">Mohon tunggu sementara kami mengambil data transkrip.</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-orange-600 to-amber-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-orange-950/20 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-orange-100/60 text-[10px] font-black uppercase tracking-widest mb-4">Rata-rata Nilai</p>
                                        <h4 className="text-6xl font-black tracking-tighter">{averageScore.toFixed(1)}</h4>
                                        <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 w-fit px-4 py-2 rounded-xl backdrop-blur-md border border-white/5">
                                            <TrendingUp className="w-3.5 h-3.5 text-orange-200" />
                                            Update Semester Aktif
                                        </div>
                                    </div>
                                    <Award className="absolute top-1/2 right-0 -translate-y-1/2 w-40 h-40 text-white/10 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
                                </div>

                                <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-xl flex flex-col justify-center relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform">
                                        <Star className="w-32 h-32 text-orange-500" />
                                    </div>
                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4">Predikat Capaian</p>
                                    <h4 className="text-4xl font-black text-white tracking-tighter uppercase leading-tight">
                                        {averageScore >= 85 ? 'Sangat Baik' : averageScore >= 75 ? 'Baik' : 'Perlu Bimbingan'}
                                    </h4>
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Kualifikasi Akademik Aman</span>
                                    </div>
                                </div>

                                <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-xl flex flex-col justify-center relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform">
                                        <LayoutGrid className="w-32 h-32 text-orange-500" />
                                    </div>
                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4">Status Tuntas</p>
                                    <h4 className="text-4xl font-black text-white tracking-tighter uppercase leading-tight">
                                        {grades.every(g => g.status === 'Lulus') ? 'Semua Tuntas' : 'Ada Remedial'}
                                    </h4>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-2 italic leading-relaxed">
                                        Berdasarkan input seluruh mata pelajaran semester ini.
                                    </p>
                                </div>
                            </div>

                            {/* Grades Table */}
                            <div className="bg-[#0a0a0a] rounded-[2.5rem] border border-neutral-800/40 shadow-2xl overflow-hidden relative group">
                                <div className="p-8 border-b border-neutral-800/50 bg-neutral-900/20 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-black text-white uppercase tracking-[0.2em] text-sm">Transkrip Sementara</h3>
                                        <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-1">Laporan real-time progres pembelajaran pesantren.</p>
                                    </div>
                                    <div className="px-5 py-2.5 bg-[#050505] border border-neutral-800 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                                        Semester Ganjil 2024
                                        <ChevronDown className="w-4 h-4 text-neutral-700" />
                                    </div>
                                </div>
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#0e0e0e] border-b border-neutral-800/50">
                                            <tr>
                                                <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Mata Pelajaran</th>
                                                <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center w-24">KKM</th>
                                                <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center w-32">Nilai Akhir</th>
                                                <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center w-24">Grd</th>
                                                <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center w-40">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-800/20">
                                            {grades.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-24 text-center">
                                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                                            <LayoutGrid className="w-12 h-12 text-neutral-700" />
                                                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest italic text-center">Data nilai ananda sedang dalam proses input.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                grades.map((res) => (
                                                    <tr key={res.id} className="hover:bg-neutral-900/30 transition-all group">
                                                        <td className="px-8 py-7">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-orange-500/5 border border-orange-500/10 rounded-xl flex items-center justify-center font-black text-orange-500 text-xs group-hover:bg-orange-600 group-hover:text-white transition-all shadow-[0_0_15px_rgba(234,88,12,0.05)]">
                                                                    {res.subject.charAt(0)}
                                                                </div>
                                                                <span className="font-bold text-white text-sm uppercase tracking-tight">{res.subject}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-7 text-center font-bold text-neutral-600 text-xs">{res.kkm}</td>
                                                        <td className="px-8 py-7 text-center">
                                                            <span className={`text-xl font-black tracking-tighter ${res.score >= 85 ? 'text-orange-500' : 'text-white'}`}>
                                                                {res.score}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-7 text-center">
                                                            <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center font-black text-sm border ${res.predicate === 'A' ? 'bg-orange-600 text-white border-orange-700 shadow-xl' :
                                                                'bg-neutral-900 text-neutral-400 border-neutral-800'
                                                                }`}>
                                                                {res.predicate}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-7 text-center">
                                                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${res.status === 'Lulus' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' :
                                                                'bg-rose-500/5 text-rose-500 border-rose-500/10'
                                                                }`}>
                                                                {res.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Bottom Info Banner */}
                    <div className="p-10 rounded-[2.5rem] bg-[#0c0c0c] border border-neutral-800/40 shadow-xl flex flex-col md:flex-row items-center gap-10 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-125 transition-transform duration-[2000ms]">
                            <BookOpen className="w-48 h-48" />
                        </div>
                        <div className="w-16 h-16 bg-indigo-500/5 border border-indigo-500/10 rounded-[1.5rem] flex items-center justify-center text-indigo-500 shrink-0 shadow-[0_0_20px_rgba(79,70,229,0.05)] group-hover:scale-110 transition-transform">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">Pemberitahuan Akademik</h4>
                            <p className="text-neutral-500 text-sm font-medium leading-relaxed max-w-4xl">
                                Jika Bapak/Ibu menemukan ketidaksesuaian data, mohon segera hubungi Homeroom Teacher (Wali Kelas) ananda untuk proses klarifikasi dan rekonsiliasi nilai sebelum periode pencetakan Rapor PDF.
                            </p>
                        </div>
                        <div className="md:ml-auto">
                            <button className="px-8 py-4 bg-white/5 border border-white/5 whitespace-nowrap rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all">
                                Hubungi Wali Kelas
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #262626; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
