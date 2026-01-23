'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getCurrentUser,
    clearSession,
    User,
    ROLE_NAMES
} from '@/lib/auth';
import { convertGrade, GradeConversion } from '@/lib/gradeConverter';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    ArrowLeft,
    Save,
    Loader2,
    CheckCircle2,
    Download,
    Printer,
    Eye,
    EyeOff,
    Activity,
    BookOpen,
    Trophy,
    GraduationCap,
    X
} from 'lucide-react';

import { homeroomService } from '@/lib/services/homeroom';
import { studentsService } from '@/lib/services/students';
import { subjectsService, academicYearService } from '@/lib/services/academic';
import { gradesService } from '@/lib/services/grades';

// ============================================
// Types
// ============================================

interface StudentGrades {
    id: string;
    name: string;
    nis: string;
    subjects: Record<string, {
        score: number | null;
        conversion: GradeConversion | null;
        gradeId?: string; // To keep track of existing records
    }>;
}

export default function WaliKelasNilaiPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Metadata
    const [classInfo, setClassInfo] = useState<any>(null);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [academicYear, setAcademicYear] = useState<any>(null);
    const [semester, setSemester] = useState<1 | 2>(1); // Default to Ganjil

    // Students state with all subject grades
    const [students, setStudents] = useState<StudentGrades[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Selected student for detail view
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

    // View mode
    const [showArabic, setShowArabic] = useState(true);

    // UI state
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_kelas') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchInitialData(currentUser.id);
    }, [router]);

    const fetchInitialData = async (teacherId: string) => {
        try {
            setIsLoading(true);
            const [cls, allSubjects, activeYear] = await Promise.all([
                homeroomService.getClassInfo(teacherId),
                subjectsService.getAll(),
                academicYearService.getActive()
            ]);

            if (!cls) {
                alert('Anda belum ditugaskan sebagai Wali Kelas.');
                router.replace('/dashboard/wali-kelas');
                return;
            }

            setClassInfo(cls);
            setSubjects(allSubjects);
            setAcademicYear(activeYear);

            // Fetch students and their current grades
            const classStudents = await studentsService.getByClass(cls.id);
            const existingGrades = await gradesService.getByClass(cls.id);

            const initialStudents: StudentGrades[] = classStudents.map(student => {
                const studentSubjects: Record<string, any> = {};

                allSubjects.forEach(sub => {
                    const gradeRecord = existingGrades.find(g => g.student_id === student.id && g.subject_id === sub.id);
                    const score = gradeRecord ? Number(gradeRecord.final_grade || gradeRecord.uts || gradeRecord.uas || 0) : null;

                    studentSubjects[sub.id] = {
                        score: score,
                        conversion: score !== null ? convertGrade(score) : null,
                        gradeId: gradeRecord?.id
                    };
                });

                return {
                    id: student.id,
                    name: student.name,
                    nis: student.nis,
                    subjects: studentSubjects
                };
            });

            setStudents(initialStudents);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching initial data:', error);
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    // Handle score change with real-time conversion
    const handleScoreChange = (studentId: string, subjectId: string, value: string) => {
        const numValue = value === '' ? null : parseInt(value);

        setStudents(prev => prev.map(student => {
            if (student.id !== studentId) return student;

            const newSubjects = { ...student.subjects };

            if (numValue === null || isNaN(numValue)) {
                newSubjects[subjectId] = { score: null, conversion: null };
            } else {
                const clampedValue = Math.max(0, Math.min(100, numValue));
                newSubjects[subjectId] = {
                    score: clampedValue,
                    conversion: convertGrade(clampedValue)
                };
            }

            return { ...student, subjects: newSubjects };
        }));
    };

    // Calculate average
    const calculateAverage = (student: StudentGrades): number | null => {
        const scores = Object.values(student.subjects)
            .map(s => s.score)
            .filter((s): s is number => s !== null);

        if (scores.length === 0) return null;
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    };

    // Handle save
    const handleSave = async () => {
        if (!classInfo || !user || !academicYear) return;

        try {
            setIsSaving(true);
            const gradesToUpsert: any[] = [];

            students.forEach(student => {
                subjects.forEach(subject => {
                    const gradeData = student.subjects[subject.id];
                    if (gradeData.score !== null) {
                        gradesToUpsert.push({
                            student_id: student.id,
                            subject_id: subject.id,
                            academic_year_id: academicYear.id,
                            semester: semester,
                            uh1: gradeData.score, // Basic mapping for now
                            uh2: gradeData.score,
                            uts: gradeData.score,
                            uas: gradeData.score,
                            final_grade: gradeData.score,
                            grade_letter: gradeData.conversion?.grade || 'C',
                            notes: '',
                        });
                    }
                });
            });

            if (gradesToUpsert.length > 0) {
                await gradesService.bulkUpsert(gradesToUpsert);
            }

            setIsSaving(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving grades:', error);
            setIsSaving(false);
            alert('Gagal menyimpan nilai.');
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        );
    }

    const selectedStudentData = students.find(s => s.id === selectedStudent);

    return (
        <div className="min-h-screen bg-black flex flex-col lowercase-none">
            {/* Success Toast (Midnight style) */}
            {showSuccess && (
                <div className="fixed top-24 right-8 z-[60] bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl text-emerald-400 px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="font-black uppercase tracking-widest text-[10px]">Sinkron Berhasil</p>
                        <p className="text-sm font-bold text-white/90">Semua nilai telah tersimpan aman.</p>
                    </div>
                </div>
            )}

            {/* Detail Modal (Premium Midnight) */}
            {selectedStudentData && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0c0c0c] border border-neutral-800 rounded-[3rem] w-full max-w-2xl shadow-3xl max-h-[90vh] overflow-hidden flex flex-col relative">
                        <div className="p-10 border-b border-neutral-800 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                                    <Trophy className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tight">{selectedStudentData.name}</h3>
                                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] mt-1">NIS: {selectedStudentData.nis} • Kelas {classInfo?.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center text-neutral-500 hover:text-white transition-colors border border-neutral-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-10 overflow-y-auto flex-1 space-y-6">
                            {subjects.map(subject => {
                                const gradeData = selectedStudentData.subjects[subject.id];
                                return (
                                    <div key={subject.id} className="bg-neutral-900/50 border border-neutral-800 rounded-[2rem] p-8 hover:bg-neutral-900 transition-colors group">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <BookOpen className="w-4 h-4 text-indigo-500" />
                                                    <p className="font-black text-white text-lg tracking-tight uppercase tracking-widest text-xs">{subject.name}</p>
                                                </div>
                                                <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">{subject.code}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-black text-white tabular-nums group-hover:text-indigo-400 transition-colors">
                                                    {gradeData?.score ?? '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {gradeData?.conversion && (
                                            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-neutral-800/50">
                                                <div className="text-center">
                                                    <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mb-3">Grade</p>
                                                    <span className={`inline-block px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${gradeData.conversion.grade === 'A' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                            gradeData.conversion.grade === 'B' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                                gradeData.conversion.grade === 'C' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                                    'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                        }`}>
                                                        {gradeData.conversion.grade}
                                                    </span>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mb-2">Arab</p>
                                                    <p className="text-white font-black text-xl font-arabic" dir="rtl">
                                                        {gradeData.conversion.arab_angka}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mb-1">Status</p>
                                                    <p className="text-[10px] text-white font-black uppercase tracking-widest leading-none">{gradeData.conversion.predikat}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-10 border-t border-neutral-800 bg-neutral-950/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] mb-1">Rata-rata Akumulasi</p>
                                    <div className="flex items-center gap-4">
                                        <p className="text-4xl font-black text-indigo-500 tabular-nums shadow-glow-indigo">
                                            {calculateAverage(selectedStudentData) ?? '-'}
                                        </p>
                                        <div className="w-1.5 h-1.5 bg-neutral-800 rounded-full" />
                                        <p className="text-sm font-black text-white/60 tracking-widest uppercase">Pencapaian Final</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    className="px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
                                >
                                    Selesai Review
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64 flex-1">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 space-y-10">
                    {/* Page Header (Midnight Optimized) */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <button
                                onClick={() => router.push('/dashboard/wali-kelas')}
                                className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-6 text-[10px] font-black uppercase tracking-[0.2em] group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Kembali Ke Beranda
                            </button>
                            <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-[0.2em] mb-4">
                                <Activity className="w-4 h-4" />
                                Master Akademik
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-none mb-3">
                                Input Nilai <span className="text-indigo-500 italic">Perwalian</span>
                            </h1>
                            <p className="text-neutral-500 font-medium max-w-2xl leading-relaxed">
                                Kelola pencapaian semester <span className="text-white font-bold">{semester === 1 ? 'Ganjil' : 'Genap'}</span> untuk <span className="text-white font-bold">Kelas {classInfo?.name}</span> (T.A. {academicYear?.name}).
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                onClick={() => setShowArabic(!showArabic)}
                                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border transition-all ${showArabic
                                    ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-glow-indigo'
                                    : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                                    }`}
                            >
                                {showArabic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {showArabic ? 'Hide Arabic' : 'Show Arabic'}
                            </button>
                            <button className="flex items-center gap-3 px-6 py-4 bg-neutral-900 border border-neutral-800 text-neutral-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:text-white transition-all shadow-xl active:scale-95">
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Desktop Matrix (Premium Midnight Table) */}
                    <div className="bg-[#0c0c0c] rounded-[3.5rem] border border-neutral-800 shadow-3xl overflow-hidden relative">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                            <table className="w-full text-left">
                                <thead className="bg-neutral-900/40 border-b border-neutral-800">
                                    <tr>
                                        <th className="px-10 py-10 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] sticky left-0 bg-[#0c0c0c] z-20 min-w-[240px]">
                                            Profil Santri
                                        </th>
                                        {subjects.map(subject => (
                                            <th key={subject.id} className="px-8 py-10 transition-colors hover:bg-neutral-900/50 min-w-[140px]">
                                                <div className="text-[9px] text-indigo-500 font-black mb-1.5 uppercase tracking-widest">{subject.code}</div>
                                                <div className="text-white font-black uppercase tracking-widest text-[10px] leading-tight">{subject.name}</div>
                                            </th>
                                        ))}
                                        <th className="px-10 py-10 text-[10px] font-black text-white uppercase tracking-[0.2em] text-center bg-indigo-500/10 min-w-[100px] border-l border-neutral-800">
                                            AVG
                                        </th>
                                        <th className="px-10 py-10 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] text-center min-w-[80px]">
                                            OPS
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/50">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={subjects.length + 3} className="px-10 py-48 text-center">
                                                <div className="flex flex-col items-center gap-6">
                                                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                                                    <p className="text-neutral-500 font-black uppercase tracking-[0.3em] text-[10px]">Sinkronisasi Data Akademik...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((student, index) => {
                                            const average = calculateAverage(student);
                                            const avgConversion = average !== null ? convertGrade(average) : null;

                                            return (
                                                <tr key={student.id} className="hover:bg-indigo-500/[0.02] transition-colors group/row">
                                                    <td className="px-10 py-8 sticky left-0 bg-[#0c0c0c] z-10 border-r border-neutral-800/50 group-hover/row:bg-neutral-900 transition-colors">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center border border-neutral-800 shadow-inner group-hover/row:border-indigo-500/30 transition-all">
                                                                <span className="text-[10px] font-black text-neutral-500 group-hover/row:text-indigo-500">{index + 1}</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-white text-sm tracking-tight mb-1 group-hover/row:text-indigo-400 transition-colors">{student.name}</p>
                                                                <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">{student.nis}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {subjects.map(subject => {
                                                        const gradeData = student.subjects[subject.id];
                                                        return (
                                                            <td key={subject.id} className="p-4 transition-colors group/cell hover:bg-neutral-900">
                                                                <div className="flex flex-col items-center gap-3">
                                                                    <div className="relative">
                                                                        <input
                                                                            type="number"
                                                                            min={0}
                                                                            max={100}
                                                                            value={gradeData?.score ?? ''}
                                                                            onChange={(e) => handleScoreChange(student.id, subject.id, e.target.value)}
                                                                            className="w-20 px-3 py-4 text-center bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-black text-white transition-all tabular-nums"
                                                                        />
                                                                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-neutral-900 rounded-full border-2 border-neutral-800 group-focus-within/cell:border-indigo-500 transition-colors" />
                                                                    </div>
                                                                    {showArabic && gradeData?.conversion && (
                                                                        <div className="text-lg font-black text-neutral-600 font-arabic leading-none h-6 group-hover/cell:text-indigo-400/50 transition-colors" dir="rtl">
                                                                            {gradeData.conversion.arab_angka}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-10 py-8 text-center bg-indigo-500/[0.03] border-l border-neutral-800">
                                                        {avgConversion ? (
                                                            <div className="flex flex-col items-center gap-2">
                                                                <span className="text-xl font-black text-white tabular-nums shadow-glow-indigo">{average}</span>
                                                                <span className={`px-3 py-1 rounded-xl text-[9px] font-black border ${avgConversion.grade === 'A' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                                    avgConversion.grade === 'B' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                                        avgConversion.grade === 'C' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                                            'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                                    }`}>
                                                                    {avgConversion.grade}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-neutral-700 font-black">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-10 py-8 text-center">
                                                        <button
                                                            onClick={() => setSelectedStudent(student.id)}
                                                            className="w-10 h-10 bg-neutral-900 hover:bg-indigo-500/20 hover:text-indigo-500 border border-neutral-800 rounded-xl flex items-center justify-center text-neutral-600 transition-all active:scale-90"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Save Bar (Premium Footer) */}
                        <div className="p-10 border-t border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6 bg-neutral-950/30">
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1.5">Total Database</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-black text-xs">
                                            {students.length}
                                        </div>
                                        <span className="text-white font-black text-xs uppercase tracking-widest">Santri Aktif</span>
                                    </div>
                                </div>
                                <div className="w-px h-10 bg-neutral-800" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1.5">Mata Pelajaran</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-black text-xs">
                                            {subjects.length}
                                        </div>
                                        <span className="text-white font-black text-xs uppercase tracking-widest">Mapel Terkoneksi</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full md:w-auto px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-2xl shadow-indigo-500/20 active:scale-95 group"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Sync Terminal...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 group-hover:scale-125 transition-transform" />
                                        Simpan Perubahan
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Bottom Guidance (Midnight Integrated) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] p-10 flex gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                                <GraduationCap className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="font-black text-white text-lg tracking-tight mb-2">Hak Akses Wali Kelas</h4>
                                <p className="text-sm text-neutral-500 font-medium leading-relaxed">
                                    Sebagai wali kelas, Anda memegang hak penuh untuk mengelola nilai di kelas perwalian Anda. Pastikan semua angka telah diverifikasi sebelum melakukan <span className="text-indigo-400 font-black tracking-widest uppercase text-[10px]">Simpan Perubahan</span>.
                                </p>
                            </div>
                        </div>
                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-[2.5rem] p-10">
                            <h4 className="font-black text-white text-lg tracking-tight mb-6">Grading Matrix</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { grade: 'A', range: '90-100', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
                                    { grade: 'B', range: '80-89', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
                                    { grade: 'C', range: '70-79', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
                                    { grade: 'D/E', range: '<70', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
                                ].map((item, idx) => (
                                    <div key={idx} className={`p-4 rounded-2xl border ${item.color} flex flex-col items-center gap-1`}>
                                        <span className="font-black text-xl">{item.grade}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60 text-white">{item.range}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
