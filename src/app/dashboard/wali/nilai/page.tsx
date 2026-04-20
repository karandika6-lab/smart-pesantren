'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
import {
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
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
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

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_santri') {
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
            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto">
                    {/* Header Section - Slimmer */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                            <div>
                                <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight leading-none">Laporan <span className="text-indigo-500">Nilai</span></h1>
                                <p className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">Rekapitulasi capaian akademik santri</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {children.length > 1 && (
                                <div className="flex bg-[#0c0c0c] p-1.5 rounded-2xl border border-white/5 shadow-2xl overflow-x-auto no-scrollbar w-full sm:w-auto">
                                    {children.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => fetchChildGrades(c)}
                                            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${activeChild?.id === c.id
                                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30'
                                                : 'text-neutral-600 hover:text-neutral-400'
                                                }`}
                                        >
                                            {c.name.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <button
                                onClick={async () => {
                                    if (!activeChild || grades.length === 0) {
                                        alert("Data nilai belum tersedia.");
                                        return;
                                    }
                                    try {
                                        const { default: jsPDF } = await import('jspdf');
                                        const { default: autoTable } = await import('jspdf-autotable');
                                        const doc = new jsPDF();
                                        doc.setFontSize(22);
                                        doc.setTextColor(79, 70, 229);
                                        doc.text("SMART PESANTREN", 105, 20, { align: "center" });
                                        doc.setFontSize(14);
                                        doc.setTextColor(100);
                                        doc.text("Transkrip Nilai Akademik", 105, 28, { align: "center" });
                                        doc.setFontSize(10);
                                        doc.setTextColor(0);
                                        doc.text(`Nama Santri : ${activeChild.name}`, 14, 45);
                                        doc.text(`Rata-rata   : ${averageScore.toFixed(1)}`, 14, 50);
                                        autoTable(doc, {
                                            startY: 60,
                                            head: [['Mata Pelajaran', 'KKM', 'Nilai', 'Predikat', 'Status']],
                                            body: grades.map(g => [g.subject, g.kkm, g.score, g.predicate, g.status]),
                                            headStyles: { fillColor: [79, 70, 229] },
                                            styles: { fontSize: 10 },
                                        });
                                        doc.save(`Transkrip_${activeChild.name.replace(/\s+/g, '_')}.pdf`);
                                    } catch (err) {
                                        console.error('Export failed', err);
                                        alert('Gagal mendownload rapor');
                                    }
                                }}
                                className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all flex items-center gap-3 shadow-2xl shadow-indigo-600/20 active:scale-95 border border-indigo-400/20 w-fit"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Cetak Transkrip
                            </button>
                        </div>
                    </div>

                    {!activeChild ? (
                        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-3xl p-16 text-center shadow-lg">
                            <Users className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-white">Profil Belum Dimuat</h3>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards - Slimmer */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-orange-600 to-amber-700 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-orange-100/60 text-[9px] font-black uppercase tracking-widest mb-3">Rata-rata Nilai</p>
                                        <h4 className="text-4xl font-black tracking-tighter">{averageScore.toFixed(1)}</h4>
                                        <div className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-white/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-md">
                                            <TrendingUp className="w-3 h-3 text-orange-200" />
                                            Update Semester
                                        </div>
                                    </div>
                                    <Award className="absolute top-1/2 right-0 -translate-y-1/2 w-32 h-32 text-white/10 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
                                </div>

                                <div className="bg-[#0a0a0a] p-6 rounded-3xl border border-neutral-800 shadow-lg flex flex-col justify-center relative overflow-hidden">
                                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-3">Predikat Capaian</p>
                                    <h4 className="text-2xl font-black text-white tracking-tight uppercase">
                                        {averageScore >= 85 ? 'Sangat Baik' : averageScore >= 75 ? 'Baik' : 'Bimbingan'}
                                    </h4>
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Kualifikasi Aman</span>
                                    </div>
                                </div>

                                <div className="bg-[#0a0a0a] p-6 rounded-3xl border border-neutral-800 shadow-lg flex flex-col justify-center relative overflow-hidden">
                                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-3">Status Tuntas</p>
                                    <h4 className="text-2xl font-black text-white tracking-tight uppercase">
                                        {grades.every(g => g.status === 'Lulus') ? 'Semua Tuntas' : 'Ada Remedial'}
                                    </h4>
                                    <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1.5 leading-relaxed">
                                        Berdasarkan seluruh mata pelajaran.
                                    </p>
                                </div>
                            </div>

                            {/* Grades List */}
                            <div className="bg-[#0c0c0c] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden min-h-0 h-fit mb-10">
                                <div className="p-6 lg:p-8 border-b border-white/5 bg-black/40 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                        <BookOpen className="w-4 h-4 text-indigo-500" />
                                        Data Capaian Akademik
                                    </h3>
                                </div>

                                {/* Mobile Cards (lg:hidden) */}
                                <div className="lg:hidden p-4 space-y-4">
                                    {grades.length === 0 ? (
                                        <div className="py-20 text-center opacity-20">
                                            <BookOpen className="w-10 h-10 mx-auto mb-2" />
                                            <p className="text-[8px] font-black uppercase">Belum Ada Nilai</p>
                                        </div>
                                    ) : (
                                        grades.map((res) => (
                                            <div key={res.id} className="bg-black border border-white/5 rounded-[2rem] p-6 space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center font-black text-indigo-500 text-sm border border-white/5 group-active:scale-95 transition-transform">
                                                            {res.subject.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-xs text-white uppercase tracking-tight leading-none">{res.subject}</h4>
                                                            <p className="text-[8px] font-bold text-neutral-800 uppercase tracking-widest mt-1.5">KKM: {res.kkm}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-2xl font-black ${res.score >= 75 ? 'text-indigo-400' : 'text-neutral-800'}`}>{res.score}</span>
                                                        <p className="text-[7px] font-black text-neutral-800 uppercase tracking-tighter">Final</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between bg-neutral-900/50 p-4 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Predikat</span>
                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] border ${res.predicate === 'A' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-neutral-800 text-neutral-600 border-white/5'}`}>
                                                            {res.predicate}
                                                        </div>
                                                    </div>
                                                    <span className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${res.status === 'Lulus' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' : 'bg-rose-500/10 text-rose-500 border-rose-500/10'}`}>
                                                        {res.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Desktop View: Table (hidden lg:block) */}
                                <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#0e0e0e] border-b border-neutral-800">
                                            <tr>
                                                <th className="px-8 py-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Mata Pelajaran</th>
                                                <th className="px-8 py-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] text-center w-32">KKM</th>
                                                <th className="px-8 py-6 text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] text-center w-40">Nilai Akhir</th>
                                                <th className="px-8 py-6 text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] text-center w-32">Grd</th>
                                                <th className="px-8 py-6 text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] text-center w-40">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 bg-black/20 text-white">
                                            {grades.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-24 text-center">
                                                        <p className="text-[10px] font-black text-neutral-800 uppercase tracking-widest italic">Data nilai sedang dalam proses input.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                grades.map((res) => (
                                                    <tr key={res.id} className="hover:bg-indigo-600/[0.02] transition-all group">
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-5">
                                                                <div className="w-12 h-12 bg-indigo-600/5 border border-white/5 rounded-2xl flex items-center justify-center font-black text-indigo-500 text-sm shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                                    {res.subject.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-white text-sm uppercase tracking-tight leading-none group-hover:text-indigo-400 transition-colors">{res.subject}</p>
                                                                    <p className="text-[9px] font-black text-neutral-800 uppercase tracking-widest mt-2 italic">Kurikulum Nasional</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-center font-black text-neutral-700">{res.kkm}</td>
                                                        <td className="px-8 py-5 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <span className={`text-2xl font-black tracking-tighter ${res.score >= 85 ? 'text-indigo-500' : 'text-neutral-800'}`}>
                                                                    {res.score}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center font-black text-sm border shadow-inner ${res.predicate === 'A' ? 'bg-indigo-600 text-white border-white/10 shadow-lg shadow-indigo-600/20' : 'bg-neutral-900 text-neutral-500 border-white/5'}`}>
                                                                {res.predicate}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${res.status === 'Lulus' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 'bg-rose-500/5 text-rose-500 border-rose-500/10'}`}>
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

                    {/* Bottom Info Banner - Slimmer */}
                    <div className="p-6 rounded-3xl bg-[#0c0c0c] border border-neutral-800 shadow-lg flex flex-col md:flex-row items-center gap-6 group relative overflow-hidden">
                        <div className="w-12 h-12 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 shrink-0">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-1">Pemberitahuan Akademik</h4>
                            <p className="text-neutral-500 text-xs font-medium leading-relaxed">
                                Jika Bapak/Ibu menemukan ketidaksesuaian data, mohon segera hubungi Wali Kelas ananda untuk proses klarifikasi.
                            </p>
                        </div>
                        <div className="md:ml-auto">
                            <button className="px-6 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all">
                                Hubungi Wali Kelas
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 4px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
