'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    clearSession,
    User,
} from '@/lib/auth';
import {
    Plus,
    Search,
    BookOpen,
    Loader2,
    CheckCircle2,
    Clock,
    Trash2,
    Users
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { homeroomService } from '@/lib/services/homeroom';
import { hafalanService } from '@/lib/services/hafalan';
import AssignProgramModal from '@/components/hafalan/AssignProgramModal';

interface StudentWithPrograms {
    id: string;
    name: string;
    nis: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    programs: any[];
}

export default function WaliKelasHafalanPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Data state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [classInfo, setClassInfo] = useState<any>(null);
    const [students, setStudents] = useState<StudentWithPrograms[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentWithPrograms | null>(null);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    const fetchInitialData = async (teacherId: string) => {
        try {
            setIsLoading(true);

            // Get class info
            const cls = await homeroomService.getClassInfo(teacherId);
            if (!cls) {
                alert('Anda belum ditugaskan sebagai Wali Kelas.');
                router.replace('/dashboard/wali-kelas');
                return;
            }
            setClassInfo(cls);

            // Get students with their hafalan programs
            await fetchStudentsWithPrograms(cls.id);

        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Gagal memuat data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStudentsWithPrograms = async (classId: string) => {
        try {
            console.log('Fetching students for class:', classId);
            // Get all students in class
            const studentsData = await homeroomService.getStudents(classId);
            console.log('Students found:', studentsData.length);

            // Get hafalan programs for these students (all statuses)
            const studentIds = studentsData.map(s => s.id);
            const programs = await hafalanService.getProgramsByStudentIds(studentIds);
            console.log('Programs found:', programs.length);

            // Combine data and normalize properties
            const studentsWithPrograms = studentsData.map(student => {
                const studentPrograms = programs
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .filter((p: any) => p.student_id === student.id)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map((p: any) => ({
                        ...p,
                        // Normalize nested properties to match UI expectations
                        hafalan_type: p.hafalan_types || p.hafalan_type
                    }));

                return {
                    id: student.id,
                    name: student.name,
                    nis: student.nis,
                    programs: studentPrograms
                };
            });

            console.log('Processed students with programs:', studentsWithPrograms.length);
            setStudents(studentsWithPrograms);
        } catch (error) {
            console.error('Error fetching students with programs detailed:', error);
            alert('Gagal memuat data santri: ' + JSON.stringify(error));
        }
    };

    const handleAssignProgram = async (studentId: string, hafalanTypeId: string, notes?: string) => {
        if (!user) return;

        try {
            await hafalanService.assignProgram({
                student_id: studentId,
                hafalan_type_id: hafalanTypeId,
                assigned_by: user.id,
                notes
            });

            // Refresh data
            if (classInfo) {
                await fetchStudentsWithPrograms(classInfo.id);
            }

            alert('Program hafalan berhasil ditugaskan!');
        } catch (error: unknown) {
            throw error;
        }
    };

    const handleDeleteProgram = async (programId: string) => {
        if (!confirm('Yakin ingin menghapus program hafalan ini?')) return;

        try {
            await hafalanService.deleteProgram(programId);

            // Refresh data
            if (classInfo) {
                await fetchStudentsWithPrograms(classInfo.id);
            }

            alert('Program hafalan berhasil dihapus');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Gagal menghapus program';
            alert(message);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.nis && student.nis.includes(searchTerm))
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-transparent">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="px-6 py-4 lg:p-8">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-[0.2em] mb-3">
                                <BookOpen className="w-4 h-4" />
                                Monitoring Tahfidz
                            </div>
                            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight">
                                Manajemen <span className="text-indigo-500 italic">Hafalan</span>
                            </h1>
                            <p className="text-neutral-500 font-medium mt-2">
                                Progres tahfidz santri <span className="text-white font-bold">Kelas {classInfo?.name || '...'}</span>.
                            </p>
                        </div>
                    </div>

                    {!isLoading && (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gapx-6 py-4 lg:gap-8 mb-10">
                            {[
                                { label: 'Total Santri', value: students.length, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                                { label: 'Program Aktif', value: students.reduce((sum, s) => sum + s.programs.filter(p => p.status === 'active').length, 0), icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                                { label: 'Belum Ada', value: students.filter(s => s.programs.length === 0).length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-[#0c0c0c]/60 backdrop-blur-xl p-5 rounded-3xl border border-neutral-800 shadow-2xl group relative overflow-hidden">
                                    <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 border ${stat.border}`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <p className="text-3xl font-black text-white leading-none tracking-tight">{stat.value}</p>
                                    <p className="text-[10px] font-black text-neutral-500 tracking-[0.2em] uppercase mt-3">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Search */}
                    <div className="bg-[#0c0c0c]/60 backdrop-blur-xl p-5 rounded-2xl border border-neutral-800 shadow-2xl mb-10">
                        <div className="relative group">
                            <Search className="w-5 h-5 text-neutral-600 absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari nama santri..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-16 pr-8 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-black focus:border-indigo-500 font-bold text-white transition-all placeholder:text-neutral-700"
                            />
                        </div>
                    </div>

                    {/* Students List */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
                        {isLoading ? (
                            <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                                <p className="text-gray-500">Memuat data santri...</p>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <p className="text-gray-400 italic">Tidak ada santri ditemukan</p>
                            </div>
                        ) : (
                            filteredStudents.map((student) => (
                                <div
                                    key={student.id}
                                    className="bg-[#0c0c0c]/60 backdrop-blur-xl p-6 rounded-3xl border border-neutral-800 shadow-xl hover:bg-neutral-900 transition-all flex flex-col"
                                >
                                    {/* Student Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-black text-white tracking-tight">{student.name}</h3>
                                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mt-1">NIS: {student.nis}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setShowAssignModal(true);
                                            }}
                                            className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-500 hover:text-white border border-indigo-500/20 font-black uppercase tracking-widest text-[9px] rounded-xl transition-all active:scale-95"
                                        >
                                            + Tambah
                                        </button>
                                    </div>

                                    {/* Programs */}
                                    {student.programs.length === 0 ? (
                                        <div className="flex-1 flex items-center justify-center p-6 bg-neutral-900/30 rounded-2xl border border-neutral-800/50 mt-4 border-dashed">
                                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">
                                                Belum ada program hafalan
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {student.programs.map((program) => (
                                                <div
                                                    key={program.id}
                                                    className="px-6 py-4 bg-neutral-900 rounded-2xl border border-neutral-800 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <BookOpen className="w-5 h-5 text-indigo-600" />
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-800">
                                                                        {program.hafalan_type?.name || 'Unknown'}
                                                                    </h4>
                                                                    <p className="text-sm text-gray-500">
                                                                        {program.hafalan_type?.total_units} {program.hafalan_type?.unit_name}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {program.notes && (
                                                                <p className="text-sm text-gray-600 mt-2 ml-8">
                                                                    📝 {program.notes}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-3 mt-2 ml-8">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${program.status === 'active'
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : program.status === 'completed'
                                                                        ? 'bg-blue-100 text-blue-700'
                                                                        : 'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                    {program.status === 'active' ? 'Aktif' :
                                                                        program.status === 'completed' ? 'Selesai' : 'Dijeda'}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    Ditugaskan: {new Date(program.assigned_date).toLocaleDateString('id-ID')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteProgram(program.id)}
                                                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                                            title="Hapus Program"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>

            {/* Assign Program Modal */}
            {selectedStudent && (
                <AssignProgramModal
                    isOpen={showAssignModal}
                    onClose={() => {
                        setShowAssignModal(false);
                        setSelectedStudent(null);
                    }}
                    onAssign={(hafalanTypeId, notes) => handleAssignProgram(selectedStudent.id, hafalanTypeId, notes)}
                    studentName={selectedStudent.name}
                />
            )}
        </div>
    );
}
