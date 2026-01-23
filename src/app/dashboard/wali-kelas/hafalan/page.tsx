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
    Award,
    Trash2
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { homeroomService } from '@/lib/services/homeroom';
import { hafalanService } from '@/lib/services/hafalan';
import AssignProgramModal from '@/components/hafalan/AssignProgramModal';

interface StudentWithPrograms {
    id: string;
    name: string;
    nis: string;
    programs: any[];
}

export default function WaliKelasHafalanPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Data state
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
        setUser(currentUser);
        fetchInitialData(currentUser.id);
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
                    .filter((p: any) => p.student_id === student.id)
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
        } catch (error: any) {
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
        } catch (error: any) {
            alert(error.message || 'Gagal menghapus program');
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nis.includes(searchTerm)
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                            📖 Manajemen Hafalan
                        </h1>
                        <p className="text-gray-500">
                            {classInfo ? `Kelas ${classInfo.name}` : 'Memuat...'}
                        </p>
                    </div>

                    {/* Stats Cards */}
                    {!isLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-gray-500">Total Santri</p>
                                    <BookOpen className="w-5 h-5 text-indigo-600" />
                                </div>
                                <p className="text-3xl font-black text-gray-800">{students.length}</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-gray-500">Program Aktif</p>
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                </div>
                                <p className="text-3xl font-black text-emerald-600">
                                    {students.reduce((sum, s) => sum + s.programs.filter(p => p.status === 'active').length, 0)}
                                </p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-gray-500">Belum Ada Program</p>
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <p className="text-3xl font-black text-amber-600">
                                    {students.filter(s => s.programs.length === 0).length}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Search */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6">
                        <div className="relative">
                            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari nama atau NIS santri..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Students List */}
                    <div className="space-y-4">
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
                                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    {/* Student Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">{student.name}</h3>
                                            <p className="text-sm text-gray-500">NIS: {student.nis}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setShowAssignModal(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors text-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Tugaskan Program
                                        </button>
                                    </div>

                                    {/* Programs */}
                                    {student.programs.length === 0 ? (
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                                            <p className="text-sm text-amber-700">
                                                Belum ada program hafalan yang ditugaskan
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {student.programs.map((program) => (
                                                <div
                                                    key={program.id}
                                                    className="p-4 bg-gray-50 border border-gray-200 rounded-xl"
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
