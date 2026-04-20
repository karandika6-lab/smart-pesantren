'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
import {
    ClipboardCheck,
    Save,
    CheckCircle2,
    Loader2,
    Star,
    Search,
    ChevronDown,
    Filter,
    Activity,
    Users
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { ustadzService } from '@/lib/services/ustadz';
import { gradesService } from '@/lib/services/grades';
import { studentsService } from '@/lib/services/students';
import { academicYearService } from '@/lib/services/academic';

interface Class {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    name: string;
}

interface AcademicYear {
    id: string;
    name: string;
}

interface Student {
    id: string;
    name: string;
    nis?: string | null;
}

interface GradeRecord {
    tugas_score: number;
    uts_score: number;
    uas_score: number;
    id?: string;
}

export default function InputNilaiMapelPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Filter Options
    const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
    const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);

    // Filters
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Students & Grades state
    const [students, setStudents] = useState<Student[]>([]);
    const [grades, setGrades] = useState<Record<string, GradeRecord>>({});

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const fetchInitialData = async (teacherId: string) => {
        try {
            setIsLoading(true);
            const [classes, subjects, year] = await Promise.all([
                ustadzService.getAssignedClasses(teacherId),
                ustadzService.getAssignedSubjects(teacherId),
                academicYearService.getActive()
            ]);

            setAvailableClasses(classes || []);
            setAvailableSubjects(subjects || []);
            setActiveYear(year);

            if (classes && classes.length > 0) {
                const firstClass = classes[0] as Class;
                if (firstClass?.id) setSelectedClass(firstClass.id);
            }
            if (subjects && subjects.length > 0) {
                const firstSubject = subjects[0] as Subject;
                if (firstSubject?.id) setSelectedSubject(firstSubject.id);
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching initial data:', error);
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
            fetchInitialData(currentUser.id);
        });
        return () => cancelAnimationFrame(timer);

    }, [router]);

    useEffect(() => {
        if (selectedClass && selectedSubject && activeYear) {
            fetchStudentsAndGrades();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedSubject, activeYear]);

    const fetchStudentsAndGrades = async () => {
        try {
            setIsLoading(true);
            const studentData = await studentsService.getByClass(selectedClass);
            // Map StudentWithRelations to our local Student type
            setStudents(studentData.map(s => ({ id: s.id, name: s.name, nis: s.nis })));

            const semester = 1;
            const existingGrades = await gradesService.getByClass(selectedClass, selectedSubject);

            const gradeMap: typeof grades = {};
            studentData.forEach(s => {
                const found = existingGrades.find(g => g.student_id === s.id && g.semester === semester);
                gradeMap[s.id] = found ? {
                    id: found.id,
                    tugas_score: found.tugas_score || 0,
                    uts_score: found.uts_score || 0,
                    uas_score: found.uas_score || 0,
                } : { tugas_score: 0, uts_score: 0, uas_score: 0 };
            });
            setGrades(gradeMap);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching students/grades:', error);
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleScoreChange = (id: string, field: 'tugas_score' | 'uts_score' | 'uas_score', value: string) => {
        const val = parseInt(value) || 0;
        setGrades(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: Math.min(100, val) }
        }));
    };

    const handleSave = async () => {
        if (!user || !activeYear) return;
        setIsSaving(true);
        try {
            const semester = 1;
            const records = students.map(s => {
                const g = grades[s.id];
                // Calculate final score: tugas 20%, UTS 30%, UAS 50%
                const finalScore = Math.round((g.tugas_score * 0.2) + (g.uts_score * 0.3) + (g.uas_score * 0.5));
                return {
                    id: g.id,
                    student_id: s.id,
                    subject_id: selectedSubject,
                    teacher_id: user.id,
                    academic_year_id: activeYear.id,
                    semester: semester as 1 | 2,
                    tugas_score: g.tugas_score,
                    uts_score: g.uts_score,
                    uas_score: g.uas_score,
                    final_score: finalScore,
                    grade_letter: gradesService.getGradeLetter(finalScore)
                };
            });

            await gradesService.bulkUpsert(records);

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving grades:', error);
            alert('Gagal menyimpan nilai.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) return null;

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nis?.includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-400 font-sans selection:bg-indigo-500/30">

            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-[0.2em] mb-2 uppercase">
                                <Activity className="w-4 h-4" />
                                Penilaian Akademik
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                Input <span className="text-indigo-500">Nilai Mapel</span>
                            </h1>
                            <p className="text-neutral-500 text-sm mt-2 font-medium">Lakukan pengisian nilai berkala santri untuk semua kompetensi.</p>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="relative group transition-all active:scale-95"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 shadow-[0_0_20px_rgba(79,70,229,0.3)]"></div>
                            <div className="relative flex items-center gap-3 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-colors">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Simpan Semua
                            </div>
                        </button>
                    </div>

                    {showSuccess && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-widest animate-in fade-in slide-in-from-top-4">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            Sinkronisasi Nilai Berhasil!
                        </div>
                    )}

                    {/* Filter Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-4">
                        <div className="col-span-1 lg:col-span-3 space-y-2">
                            <label className="block text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-1">Kelas</label>
                            <div className="relative group">
                                <select
                                    value={selectedClass}
                                    onChange={e => setSelectedClass(e.target.value)}
                                    className="w-full pl-4 pr-10 py-3 bg-[#0c0c0c] border border-white/5 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-black text-[10px] uppercase appearance-none cursor-pointer transition-all shadow-inner"
                                >
                                    {availableClasses.map(c => <option key={c.id} value={c.id} className="bg-neutral-900">Kelas {c.name}</option>)}
                                </select>
                                <ChevronDown className="w-4 h-4 text-neutral-600 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        <div className="col-span-1 lg:col-span-4 space-y-2">
                            <label className="block text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-1">Mata Pelajaran</label>
                            <div className="relative group">
                                <select
                                    value={selectedSubject}
                                    onChange={e => setSelectedSubject(e.target.value)}
                                    className="w-full pl-4 pr-10 py-3 bg-[#0c0c0c] border border-white/5 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-black text-[10px] uppercase appearance-none cursor-pointer transition-all shadow-inner"
                                >
                                    {availableSubjects.map(s => <option key={s.id} value={s.id} className="bg-neutral-900">{s.name}</option>)}
                                </select>
                                <ChevronDown className="w-4 h-4 text-neutral-600 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        <div className="col-span-2 lg:col-span-5 space-y-2">
                            <label className="block text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-1">Pencarian Santri</label>
                            <div className="relative group">
                                <Search className="w-3.5 h-3.5 text-neutral-600 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500" />
                                <input
                                    type="text"
                                    placeholder="Nama / NIS..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-[#0c0c0c] border border-white/5 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-black text-[10px] transition-all placeholder:text-neutral-800 shadow-inner"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Main Table Card */}
                    <div className="bg-[#0c0c0c] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                        {/* Mobile view Cards (lg:hidden) */}
                        <div className="lg:hidden p-4 space-y-4">
                            {isLoading ? (
                                <div className="py-12 flex flex-col items-center">
                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin opacity-20" />
                                </div>
                            ) : filteredStudents.length === 0 ? (
                                <div className="py-12 text-center opacity-20">
                                    <Users className="w-10 h-10 mx-auto mb-2" />
                                    <p className="text-[10px] font-black uppercase">Kosong</p>
                                </div>
                            ) : (
                                filteredStudents.map((s) => {
                                    const g = grades[s.id] || { tugas_score: 0, uts_score: 0, uas_score: 0 };
                                    const finalScore = Math.round((g.tugas_score * 0.2) + (g.uts_score * 0.3) + (g.uas_score * 0.5));
                                    return (
                                        <div key={s.id} className="bg-black border border-white/5 rounded-2xl p-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center font-black text-indigo-500 text-xs">
                                                        {s.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-xs text-white uppercase tracking-tight leading-none">{s.name}</h4>
                                                        <p className="text-[8px] font-bold text-neutral-700 uppercase tracking-widest mt-1">NIS: {s.nis || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-xl font-black ${finalScore >= 75 ? 'text-indigo-400' : 'text-neutral-800'}`}>{finalScore}</span>
                                                    <p className="text-[7px] font-black text-neutral-800 uppercase tracking-tighter">Final</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                {(['tugas_score', 'uts_score', 'uas_score'] as const).map((field) => (
                                                    <div key={field} className="space-y-1.5">
                                                        <label className="text-[7px] font-black text-neutral-700 uppercase tracking-tighter px-1">{field.split('_')[0]}</label>
                                                        <input
                                                            type="number"
                                                            value={g[field] || ''}
                                                            onChange={e => handleScoreChange(s.id, field, e.target.value)}
                                                            className="w-full h-10 bg-[#0c0c0c] border border-white/5 rounded-lg text-center font-black text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Desktop view Table (hidden lg:block) */}
                        <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-black border-b border-white/5">
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em]">Santri</th>
                                        <th className="px-4 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em] text-center w-32">Tugas (20%)</th>
                                        <th className="px-4 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em] text-center w-32">UTS (30%)</th>
                                        <th className="px-4 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em] text-center w-32">UAS (50%)</th>
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em] text-center w-40">Nilai Akhir</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 bg-black/20">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="py-32 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin opacity-20" />
                                                    <p className="text-[9px] font-black text-neutral-700 uppercase tracking-[0.3em]">Menyelaraskan Data...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-32 text-center opacity-20">
                                                <Users className="w-16 h-16 mx-auto mb-4 text-neutral-800" />
                                                <p className="text-xs font-black text-neutral-700 uppercase tracking-widest">Tidak ada santri ditemukan.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((s) => {
                                            const g = grades[s.id] || { tugas_score: 0, uts_score: 0, uas_score: 0 };
                                            const finalScore = Math.round((g.tugas_score * 0.2) + (g.uts_score * 0.3) + (g.uas_score * 0.5));
                                            return (
                                                <tr key={s.id} className="hover:bg-indigo-600/[0.02] transition-all group">
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
                                                    {(['tugas_score', 'uts_score', 'uas_score'] as const).map((field) => (
                                                        <td key={field} className="px-4 py-5 text-center">
                                                            <input
                                                                type="number"
                                                                value={g[field] || ''}
                                                                onChange={e => handleScoreChange(s.id, field, e.target.value)}
                                                                className="w-16 h-12 text-center bg-black border border-white/5 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-black text-sm transition-all appearance-none shadow-inner"
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="px-8 py-5 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className={`text-2xl font-black tracking-tighter ${finalScore >= 75 ? 'text-indigo-400' : 'text-neutral-800'}`}>{finalScore}</span>
                                                            <div className="flex gap-0.5 mt-2">
                                                                {[1, 2, 3].map(i => (
                                                                    <Star key={i} className={`w-3 h-3 ${finalScore >= 85 ? 'text-amber-500 fill-amber-500' : 'text-neutral-900 group-hover:text-neutral-800'}`} />
                                                                ))}
                                                            </div>
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

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #262626; }
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
            `}</style>
        </div>
    );
}
