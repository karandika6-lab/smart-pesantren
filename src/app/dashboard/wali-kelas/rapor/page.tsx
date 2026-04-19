'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    clearSession,
    User,
} from '@/lib/auth';
import {
    RaporConfig,
    StudentRaporData,
    getSemesterName,
    getStoredSettings,
} from '@/lib/raporConfig';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import RaporSheet from '@/components/rapor/RaporSheet';
import {
    Printer,
    Users,
    Search,
    Eye,
    Download,
    CheckCircle2,
    AlertCircle,
    Loader2,
    X,
    FileText
} from 'lucide-react';

import { homeroomService } from '@/lib/services/homeroom';
import { academicYearService } from '@/lib/services/academic';
import { raporService } from '@/lib/services/rapor';
import { raporSettingsService } from '@/lib/services/rapor-settings';

export default function WaliKelasRaporPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Settings
    const [settings, setSettings] = useState<RaporConfig | null>(null);
    const [classInfo, setClassInfo] = useState<Record<string, unknown> | null>(null);

    // Students data
    const [students, setStudents] = useState<StudentRaporData[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Modal & Print state
    const [selectedStudent, setSelectedStudent] = useState<StudentRaporData | null>(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isPrintingAll, setIsPrintingAll] = useState(false);

    // Ref for print
    const printRef = useRef<HTMLDivElement>(null);

    const fetchInitialData = async (userId: string) => {
        try {
            setIsLoading(true);
            const [cls, activeYear, dbSettings] = await Promise.all([
                homeroomService.getClassInfo(userId),
                academicYearService.getActive(),
                raporSettingsService.getSettings()
            ]);

            if (!cls) {
                alert('Anda belum ditugaskan sebagai Wali Kelas.');
                router.replace('/dashboard/wali-kelas');
                return;
            }
            setClassInfo(cls);

            const baseSettings = getStoredSettings();
            const currentSettings = {
                ...baseSettings,
                academic_year: activeYear?.name || dbSettings?.academic_year || baseSettings.academic_year,
                active_semester: (activeYear?.semester ? Number(activeYear.semester) : dbSettings?.active_semester || 1) as 1 | 2
            };

            setSettings(currentSettings);

            const raporData = await raporService.getRaporDataByClass(cls.id as string, activeYear?.id ?? '', currentSettings.active_semester);
            setStudents(raporData as StudentRaporData[]);

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching initial data:', error);
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

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery)
    );

    const calculateAverage = (grades: { score: number }[]) => {
        if (!grades || grades.length === 0) return 0;
        const validGrades = grades.filter(g => typeof g.score === 'number' && !isNaN(g.score));
        if (validGrades.length === 0) return 0;
        const total = validGrades.reduce((sum, g) => sum + g.score, 0);
        return Math.round(total / validGrades.length);
    };

    const handlePrint = (student: StudentRaporData) => {
        setSelectedStudent(student);
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 500);
    };

    const handlePrintAll = async () => {
        if (filteredStudents.length === 0) {
            alert("Tidak ada data santri untuk dicetak.");
            return;
        }

        setIsPrintingAll(true);
        setIsPrinting(true);

        setTimeout(() => {
            window.print();
            setIsPrintingAll(false);
            setIsPrinting(false);
        }, 1200);
    };

    const handlePreview = (student: StudentRaporData) => {
        setSelectedStudent(student);
        setShowPreviewModal(true);
    };

    if (!user || !settings) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="animate-pulse text-gray-400">Memuat...</div>
            </div>
        );
    }

    const activeSemesterName = getSemesterName(settings.active_semester);

    return (
        <div className="min-h-screen bg-transparent">
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background-color: white !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    
                    /* Force white background for printing */
                    html, body {
                        background-color: white !important;
                    }
                }
            `}</style>

            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64 no-print">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-[0.2em] mb-3">
                                <FileText className="w-4 h-4" />
                                Monitoring Akademik
                            </div>
                            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight">
                                Cetak <span className="text-indigo-500 italic">Rapor Santri</span>
                            </h1>
                            <p className="text-neutral-500 font-medium mt-2">
                                Menyiapkan dokumen laporan hasil belajar <span className="text-white font-bold">Kelas {classInfo?.name as string || '...'}</span>.
                            </p>
                        </div>
                        <button
                            onClick={handlePrintAll}
                            disabled={isPrinting}
                            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-xl shadow-indigo-900/20 disabled:opacity-50 active:scale-95"
                        >
                            {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Cetak Semua (.PDF)
                        </button>
                    </div>

                    <div className="bg-[#0c0c0c]/60 backdrop-blur-xl border border-neutral-800 rounded-3xl p-5 mb-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                    <FileText className="w-7 h-7 text-indigo-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Semester Aktif</p>
                                    <h3 className="text-2xl font-black text-white">
                                        Semester {settings.active_semester} <span className="text-indigo-500 italic">({activeSemesterName})</span>
                                    </h3>
                                    <p className="text-xs font-bold text-neutral-600 mt-1 uppercase tracking-widest">Tahun Ajaran {settings.academic_year}</p>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-neutral-900/50 rounded-2xl border border-neutral-800 backdrop-blur-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                    {settings.active_semester === 2 ? (
                                        <span className="text-emerald-500">
                                            <CheckCircle2 className="w-4 h-4 inline mr-2" />
                                            Keputusan Kenaikan Kelas Aktif
                                        </span>
                                    ) : (
                                        <span className="text-indigo-400">
                                            <AlertCircle className="w-4 h-4 inline mr-2" />
                                            Laporan Hasil Belajar Tengah Tahun
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0c0c0c]/60 backdrop-blur-xl p-4 rounded-2xl border border-neutral-800 shadow-2xl mb-8">
                        <div className="relative group">
                            <Search className="w-5 h-5 text-neutral-600 absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari santri berdasarkan nama..."
                                className="w-full pl-16 pr-8 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-black font-bold text-white transition-all placeholder:text-neutral-700"
                            />
                        </div>
                    </div>

                    <div className="bg-[#0c0c0c]/60 backdrop-blur-xl rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden group mb-10">
                        <div className="p-5 border-b border-neutral-800 bg-neutral-900/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-indigo-500" />
                                <h3 className="font-black text-white uppercase tracking-widest text-xs">Daftar Santri</h3>
                            </div>
                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total {filteredStudents.length} Santri</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#0a0a0a]/50 border-b border-neutral-800">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest w-12">No</th>
                                        <th className="text-left px-6 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest">Nama Santri</th>
                                        <th className="text-left px-6 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest">NIS</th>
                                        <th className="text-center px-6 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest">JK</th>
                                        <th className="text-center px-6 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest">Rata-rata</th>
                                        <th className="text-center px-6 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest">Kehadiran</th>
                                        {settings.active_semester === 2 && (
                                            <th className="text-center px-6 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest">Status</th>
                                        )}
                                        <th className="text-center px-6 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest w-40">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/50">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={settings.active_semester === 2 ? 8 : 7} className="p-10 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Memuat data santri...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan={settings.active_semester === 2 ? 8 : 7} className="p-10 text-center text-neutral-600 italic font-medium">
                                                Tidak ada santri ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student, index) => {
                                            const avg = calculateAverage(student.grades);
                                            const totalAbsent = (Number(student.attendance?.sakit) || 0) +
                                                (Number(student.attendance?.izin) || 0) +
                                                (Number(student.attendance?.alpha) || 0);

                                            return (
                                                <tr key={student.id} className="hover:bg-indigo-500/5 transition-colors group/row">
                                                    <td className="px-6 py-3.5 text-[10px] font-black text-neutral-700">{index + 1}</td>
                                                    <td className="px-6 py-3.5">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${student.gender === 'L' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                                                {student.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-white group-hover/row:text-indigo-400 transition-colors tracking-tight">{student.name}</p>
                                                                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mt-0.5">NISN: {student.nisn}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <span className="px-3 py-1 bg-neutral-900 text-neutral-400 border border-neutral-800 rounded-lg text-[10px] font-black tracking-widest">
                                                            {student.nis}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-center">
                                                        <span className={`w-9 h-9 inline-flex items-center justify-center rounded-xl text-[10px] font-black border ${student.gender === 'L' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                                            {student.gender}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-center">
                                                        <span className={`text-lg font-black tracking-tighter ${avg >= 80 ? 'text-emerald-500' : avg >= 70 ? 'text-indigo-400' : 'text-rose-500'}`}>
                                                            {avg}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-center text-[10px] font-black text-neutral-500 uppercase">
                                                        {totalAbsent} Hari
                                                    </td>
                                                    {settings.active_semester === 2 && (
                                                        <td className="px-6 py-3.5 text-center">
                                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${student.promotion?.isPromoted ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                                                {student.promotion?.isPromoted ? 'Lanjut' : 'Tinggal'}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-3.5">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button onClick={() => handlePreview(student)} className="w-9 h-9 flex items-center justify-center bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-white rounded-xl transition-all">
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handlePrint(student)} disabled={isPrinting} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50">
                                                                <Printer className="w-3.5 h-3.5" />
                                                                Cetak
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* Preview Modal */}
            {showPreviewModal && selectedStudent && (
                <div className="fixed inset-0 bg-black/40 z-[999] flex items-center justify-center p-4 no-print overflow-hidden">
                    <div className="bg-[#111] border border-neutral-800 rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                            <div>
                                <h3 className="font-black text-white uppercase tracking-widest text-sm">Preview Rapor Santri</h3>
                                <p className="text-[10px] font-bold text-neutral-500 mt-1 uppercase tracking-[0.2em]">{selectedStudent.name} • SEMESTER {settings.active_semester}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => { handlePrint(selectedStudent); setShowPreviewModal(false); }} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all">
                                    <Printer className="w-4 h-4" />
                                    Cetak Sekarang
                                </button>
                                <button onClick={() => setShowPreviewModal(false)} className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-500 rounded-2xl transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4 lg:p-12 bg-neutral-900">
                            <div className="transform scale-90 lg:scale-95 origin-top flex justify-center pb-20">
                                <div className="rapor-page bg-white shadow-2xl rounded-sm overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
                                    <RaporSheet
                                        settings={settings}
                                        student={selectedStudent}
                                        semester={settings.active_semester}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Areas */}
            <div className="print-only">
                {selectedStudent && !isPrintingAll && (
                    <div className="print-area">
                        <RaporSheet
                            ref={printRef}
                            settings={settings}
                            student={selectedStudent}
                            semester={settings.active_semester}
                        />
                    </div>
                )}

                {isPrintingAll && (
                    <div className="print-area">
                        {filteredStudents.map((student) => (
                            <RaporSheet
                                key={student.id}
                                settings={settings}
                                student={student}
                                semester={settings.active_semester}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
