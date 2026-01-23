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

export default function InputNilaiMapelPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Filter Options
    const [availableClasses, setAvailableClasses] = useState<any[]>([]);
    const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
    const [activeYear, setActiveYear] = useState<any>(null);

    // Filters
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Students & Grades state
    const [students, setStudents] = useState<any[]>([]);
    const [grades, setGrades] = useState<Record<string, { uh1: number, uh2: number, uts: number, uas: number, id?: string }>>({});

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'ustadz') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchInitialData(currentUser.id);
    }, [router]);

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
                const firstClass = classes[0] as any;
                if (firstClass?.id) setSelectedClass(firstClass.id);
            }
            if (subjects && subjects.length > 0) {
                const firstSubject = subjects[0] as any;
                if (firstSubject?.id) setSelectedSubject(firstSubject.id);
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching initial data:', error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedClass && selectedSubject && activeYear) {
            fetchStudentsAndGrades();
        }
    }, [selectedClass, selectedSubject, activeYear]);

    const fetchStudentsAndGrades = async () => {
        try {
            setIsLoading(true);
            const studentData = await studentsService.getByClass(selectedClass);
            setStudents(studentData);

            const semester = 1;
            const existingGrades = await gradesService.getByClass(selectedClass, selectedSubject);

            const gradeMap: typeof grades = {};
            studentData.forEach(s => {
                const found = existingGrades.find(g => g.student_id === s.id && g.semester === semester);
                gradeMap[s.id] = found ? {
                    id: found.id,
                    uh1: found.uh1 || 0,
                    uh2: found.uh2 || 0,
                    uts: found.uts || 0,
                    uas: found.uas || 0,
                } : { uh1: 0, uh2: 0, uts: 0, uas: 0 };
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

    const handleScoreChange = (id: string, field: 'uh1' | 'uh2' | 'uts' | 'uas', value: string) => {
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
                return {
                    id: g.id,
                    student_id: s.id,
                    subject_id: selectedSubject,
                    teacher_id: user.id,
                    academic_year_id: activeYear.id,
                    semester,
                    uh1: g.uh1,
                    uh2: g.uh2,
                    uts: g.uts,
                    uas: g.uas,
                    final_grade: gradesService.calculateFinalGrade(g),
                    grade_letter: gradesService.getGradeLetter(gradesService.calculateFinalGrade(g) || 0)
                };
            });

            await gradesService.bulkUpsert(records as any);

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
                            <div className="relative flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-500 transition-colors">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Simpan Semua
                            </div>
                        </button>
                    </div>

                    {showSuccess && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 font-bold text-xs uppercase tracking-wider animate-in fade-in slide-in-from-top-4">
                            <CheckCircle2 className="w-4 h-4" />
                            Data nilai telah berhasil diperbarui & tersinkronisasi!
                        </div>
                    )}

                    {/* Filter Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-3 space-y-2">
                            <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-widest ml-1">Pilih Kelas</label>
                            <div className="relative group">
                                <Filter className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-indigo-500" />
                                <select
                                    value={selectedClass}
                                    onChange={e => setSelectedClass(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3.5 bg-[#0a0a0a] border border-neutral-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-bold text-sm appearance-none cursor-pointer transition-all"
                                >
                                    {availableClasses.map(c => <option key={c.id} value={c.id} className="bg-neutral-900">Kelas {c.name}</option>)}
                                </select>
                                <ChevronDown className="w-4 h-4 text-neutral-600 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-2">
                            <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-widest ml-1">Mata Pelajaran</label>
                            <div className="relative group">
                                <ClipboardCheck className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-indigo-500" />
                                <select
                                    value={selectedSubject}
                                    onChange={e => setSelectedSubject(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3.5 bg-[#0a0a0a] border border-neutral-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-bold text-sm appearance-none cursor-pointer transition-all"
                                >
                                    {availableSubjects.map(s => <option key={s.id} value={s.id} className="bg-neutral-900">{s.name}</option>)}
                                </select>
                                <ChevronDown className="w-4 h-4 text-neutral-600 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        <div className="lg:col-span-5 space-y-2">
                            <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-widest ml-1">Cari Nama Santri</label>
                            <div className="relative group">
                                <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500" />
                                <input
                                    type="text"
                                    placeholder="Cari berdasarkan nama atau NIS..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3.5 bg-[#0a0a0a] border border-neutral-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-bold text-sm transition-all placeholder:text-neutral-700 placeholder:font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Main Table Card */}
                    <div className="bg-[#0a0a0a] rounded-[2rem] border border-neutral-800/40 overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#0e0e0e] border-b border-neutral-800/50">
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Santri</th>
                                        <th className="px-4 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">UH 1</th>
                                        <th className="px-4 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">UH 2</th>
                                        <th className="px-4 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">UTS</th>
                                        <th className="px-4 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">UAS</th>
                                        <th className="px-8 py-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">Rata-rata</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/30">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin opacity-40" />
                                                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Menyiapkan Data Santri...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-40">
                                                    <Users className="w-12 h-12 text-neutral-700" />
                                                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest italic">Tidak ada data santri ditemukan.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((s) => {
                                            const g = grades[s.id] || { uh1: 0, uh2: 0, uts: 0, uas: 0 };
                                            const avg = Math.round((g.uh1 + g.uh2 + g.uts + g.uas) / 4);
                                            return (
                                                <tr key={s.id} className="hover:bg-neutral-900/40 transition-all group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center font-bold text-indigo-500 text-sm">
                                                                {s.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-white text-sm uppercase tracking-tight">{s.name}</p>
                                                                <p className="text-[10px] text-neutral-600 font-bold tracking-widest mt-0.5">NIS: {s.nis}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {['uh1', 'uh2', 'uts', 'uas'].map((field) => (
                                                        <td key={field} className="px-4 py-5 text-center">
                                                            <input
                                                                type="number"
                                                                value={g[field as keyof typeof g] || ''}
                                                                onChange={e => handleScoreChange(s.id, field as any, e.target.value)}
                                                                className="w-14 h-11 text-center bg-[#0a0a0a] border border-neutral-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-extrabold text-sm transition-all appearance-none group-hover:bg-neutral-900 shadow-inner"
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="px-8 py-5 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className={`text-lg font-black tracking-tighter ${avg >= 75 ? 'text-indigo-400' : 'text-neutral-700'}`}>{avg}</span>
                                                            <div className="flex gap-0.5 mt-1 overflow-hidden">
                                                                {[1, 2, 3].map(i => (
                                                                    <Star key={i} className={`w-2.5 h-2.5 ${avg >= 85 ? 'text-amber-500 fill-amber-500' : 'text-neutral-800'}`} />
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
