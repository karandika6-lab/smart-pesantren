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
    Loader2,
    Activity,
    Star,
    LayoutGrid,
    Calendar,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { supabase } from '@/lib/supabase';
import { gradesService } from '@/lib/services/grades';
import { attendanceService } from '@/lib/services/attendance';
import { studentDashboardService } from '@/lib/services/student-dashboard';

export default function RiwayatNilaiPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [summary, setSummary] = useState({
        gpa: 0,
        trend: 0,
        totalHafalan: 0,
        attendance: 100
    });

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'santri') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchData(currentUser.id);
    }, [router]);

    const fetchData = async (userId: string) => {
        try {
            setIsLoading(true);
            const { data: student, error: sError } = await supabase
                .from('students')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (sError) throw sError;
            setStudentInfo(student);

            const gradesData = await gradesService.getByStudent(student.id);

            const grouped = gradesData.reduce((acc: any, grade: any) => {
                const key = `${grade.academic_year_id || '2024'}-${grade.semester}`;
                if (!acc[key]) {
                    acc[key] = {
                        semester: `Semester ${grade.semester === 1 ? 'Ganjil' : 'Genap'} ${grade.academic_year_id || ''}`,
                        grades: []
                    };
                }
                acc[key].grades.push({
                    no: acc[key].grades.length + 1,
                    name: grade.subject?.name || 'Unknown',
                    kkm: 75,
                    score: grade.final_grade || 0,
                    letter: gradesService.getGradeLetter(grade.final_grade || 0),
                    predicate: getPredicate(grade.final_grade || 0)
                });
                return acc;
            }, {});

            const reportsArray = Object.values(grouped).map((group: any) => {
                const avg = group.grades.length > 0
                    ? group.grades.reduce((sum: number, g: any) => sum + (g.score || 0), 0) / group.grades.length
                    : 0;
                return {
                    ...group,
                    gpa: (avg / 25).toFixed(2)
                };
            });

            setReports(reportsArray);

            const [gpaH, hafalan, attPercentage] = await Promise.all([
                studentDashboardService.getGPAHistory(student.id),
                studentDashboardService.getHafalanData(student.id),
                attendanceService.getStudentAttendanceSummary(student.id)
            ]);

            const currentGPA = reportsArray.length > 0 ? Number(reportsArray[0].gpa) : 0;
            const prevGPA = gpaH.length > 1 ? gpaH[gpaH.length - 2].gpa : currentGPA;

            setSummary({
                gpa: currentGPA,
                trend: currentGPA - prevGPA,
                totalHafalan: hafalan?.completed || 0,
                attendance: attPercentage
            });
        } catch (err) {
            console.error('Error fetching grades history:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getPredicate = (score: number) => {
        if (score >= 90) return 'Sangat Baik';
        if (score >= 80) return 'Baik';
        if (score >= 70) return 'Cukup';
        return 'Kurang';
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (isLoading && reports.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin opacity-40" />
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Menyusun Lapor Akademik...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-400 font-sans selection:bg-indigo-500/30">
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 space-y-10 max-w-[1500px] mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-[0.2em] mb-2 uppercase">
                                <Activity className="w-4 h-4" />
                                Academic Transcript
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                Riwayat <span className="text-indigo-500">Nilai & Rapor</span>
                            </h1>
                            <p className="text-neutral-500 text-sm mt-2 font-medium">Buku laporan pencapaian akademik digital yang terdokumentasi rapi.</p>
                        </div>
                        <div className="flex gap-4">
                            <button className="px-6 py-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl text-[10px] font-black text-white hover:bg-neutral-800 transition-all flex items-center gap-3 uppercase tracking-widest shadow-xl">
                                <Download className="w-4 h-4 text-indigo-500" />
                                Export Rapor PDF
                            </button>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-500/10 relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-indigo-100/60 text-[10px] font-black uppercase tracking-widest mb-4">IPK Terakhir</p>
                                <h4 className="text-6xl font-black tracking-tighter">{summary.gpa || '0.00'}</h4>
                                <div className={`mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 w-fit px-4 py-2 rounded-xl backdrop-blur-md border border-white/5`}>
                                    <TrendingUp className={`w-3.5 h-3.5 ${summary.trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
                                    {summary.trend >= 0 ? 'Meningkat' : 'Menurun'} {Math.abs(summary.trend).toFixed(2)}
                                </div>
                            </div>
                            <Award className="absolute top-1/2 right-0 -translate-y-1/2 w-40 h-40 text-white/10 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
                        </div>

                        <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-xl flex flex-col justify-center relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform">
                                <Star className="w-32 h-32" />
                            </div>
                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4">Progres Tahfidz</p>
                            <h4 className="text-4xl font-black text-white tracking-tighter">{summary.totalHafalan} <span className="text-lg text-neutral-600 font-bold uppercase ml-1">/ 30 Juz</span></h4>
                            <div className="w-full h-1.5 bg-neutral-900 rounded-full mt-6 overflow-hidden border border-neutral-800">
                                <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: `${(summary.totalHafalan / 30) * 100}%` }}></div>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-neutral-800/40 shadow-xl flex flex-col justify-center relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform">
                                <Activity className="w-32 h-32" />
                            </div>
                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4">Absensi Kehadiran</p>
                            <h4 className="text-4xl font-black text-white tracking-tighter">{summary.attendance}%</h4>
                            <div className="mt-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Kualifikasi Sangat Baik</span>
                            </div>
                        </div>
                    </div>

                    {/* Reports List */}
                    <div className="space-y-10">
                        {reports.length === 0 ? (
                            <div className="bg-[#0a0a0a] p-24 rounded-[3rem] border border-neutral-800/50 text-center shadow-2xl">
                                <div className="w-20 h-20 bg-neutral-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-neutral-800">
                                    <FileText className="w-10 h-10 text-neutral-800" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Belum Ada Transkip</h3>
                                <p className="text-neutral-500 max-w-sm mx-auto font-medium">Laporan akademik anda akan muncul di sini setelah divalidasi oleh asatidzah.</p>
                            </div>
                        ) : (
                            reports.map((report, idx) => (
                                <div key={idx} className="bg-[#0a0a0a] rounded-[2.5rem] border border-neutral-800/40 shadow-2xl overflow-hidden">
                                    <div className="p-8 border-b border-neutral-800/50 bg-neutral-900/20 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-black text-white uppercase tracking-[0.2em] text-sm">{report.semester}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Cumulative GPA: {report.gpa}</p>
                                            </div>
                                        </div>
                                        <button className="p-2.5 bg-[#050505] text-neutral-600 hover:text-white rounded-xl border border-neutral-800 transition-all">
                                            <ChevronDown className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left font-sans">
                                            <thead>
                                                <tr className="bg-[#0e0e0e] border-b border-neutral-800/50">
                                                    <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] w-16 text-center">No</th>
                                                    <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Mata Pelajaran</th>
                                                    <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">KKM</th>
                                                    <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">Angka</th>
                                                    <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">Grd</th>
                                                    <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Predikat</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-800/20">
                                                {report.grades.map((sub: any) => (
                                                    <tr key={sub.no} className="hover:bg-neutral-900/30 transition-all group">
                                                        <td className="px-8 py-6 text-center font-bold text-neutral-700 text-xs">{sub.no}</td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] font-black text-neutral-500 group-hover:text-indigo-500 group-hover:border-indigo-500/30 transition-all">
                                                                    {sub.no}
                                                                </div>
                                                                <span className="font-bold text-white text-sm uppercase tracking-tight">{sub.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-center font-bold text-neutral-600 text-xs">{sub.kkm}</td>
                                                        <td className="px-8 py-6 text-center font-black text-white text-lg tracking-tighter">{sub.score}</td>
                                                        <td className="px-8 py-6 text-center">
                                                            <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center font-black text-sm border ${sub.letter === 'A' ? 'bg-indigo-500 text-white border-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)]' :
                                                                sub.letter === 'B' ? 'bg-neutral-900 text-indigo-400 border-neutral-800' :
                                                                    'bg-neutral-900 text-neutral-600 border-neutral-800'
                                                                }`}>
                                                                {sub.letter}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className="px-4 py-1.5 bg-neutral-900 text-neutral-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-neutral-800 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all">
                                                                {sub.predicate}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))
                        )}
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
