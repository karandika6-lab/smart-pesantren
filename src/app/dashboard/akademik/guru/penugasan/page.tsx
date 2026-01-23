'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getCurrentUser,
    clearSession,
    User
} from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    ArrowLeft,
    Users,
    BookOpen,
    Plus,
    Search,
    Loader2,
    Trash2,
    GraduationCap,
    ChevronDown
} from 'lucide-react';
import { classesService, ClassWithRelations } from '@/lib/services/classes';
import { teachersService } from '@/lib/services/teachers';
import { subjectsService } from '@/lib/services/subjects';
import { teachingAssignmentsService, TeachingAssignment } from '@/lib/services/teaching-assignments';

interface Teacher {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    name: string;
    code: string;
}

export default function PenugasanMengajarPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [classes, setClasses] = useState<ClassWithRelations[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        teacher_id: '',
        subject_id: '',
        class_id: '',
        hours_per_week: 2
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterTeacher, setFilterTeacher] = useState<string>('all');

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || !['super_admin', 'admin_akademik'].includes(currentUser.role)) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchData();
    }, [router]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [classesData, teachersData, subjectsData, assignmentsData] = await Promise.all([
                classesService.getAll(),
                teachersService.getAll(),
                subjectsService.getAll(),
                teachingAssignmentsService.getAll()
            ]);
            setClasses(classesData);
            setTeachers(teachersData as unknown as Teacher[]);
            setSubjects(subjectsData as unknown as Subject[]);
            setAssignments(assignmentsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await teachingAssignmentsService.create(formData);
            setShowForm(false);
            setFormData({ teacher_id: '', subject_id: '', class_id: '', hours_per_week: 2 });
            fetchData();
        } catch (error: any) {
            console.error('Error creating assignment:', error);
            if (error.message?.includes('duplicate')) {
                alert('Penugasan ini sudah ada');
            } else {
                alert('Gagal menambahkan penugasan');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin hapus penugasan ini?')) return;
        try {
            await teachingAssignmentsService.delete(id);
            fetchData();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Gagal menghapus');
        }
    };

    const filteredAssignments = filterTeacher === 'all'
        ? assignments
        : assignments.filter(a => a.teacher_id === filterTeacher);

    // Calculate teacher workload
    const getTeacherWorkload = (teacherId: string) => {
        return assignments
            .filter(a => a.teacher_id === teacherId)
            .reduce((sum, a) => sum + (a.hours_per_week || 0), 0);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-black flex">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="flex-1 lg:ml-64">
                <DashboardHeader
                    user={user}
                    onMenuClick={() => setSidebarOpen(true)}
                />

                <main className="p-4 lg:p-6">
                    {/* Back Button */}
                    <Link
                        href="/dashboard/akademik/guru"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Data Guru
                    </Link>

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Penugasan Mengajar</h1>
                            <p className="text-gray-400">Atur guru pengajar untuk setiap mata pelajaran dan kelas</p>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Tambah Penugasan
                        </button>
                    </div>

                    {/* Filter */}
                    <div className="mb-6 flex items-center gap-4">
                        <div className="relative">
                            <select
                                value={filterTeacher}
                                onChange={(e) => setFilterTeacher(e.target.value)}
                                className="pl-4 pr-10 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                                <option value="all">Semua Guru</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                    ) : filteredAssignments.length === 0 ? (
                        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-12 text-center">
                            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">Belum Ada Penugasan</h3>
                            <p className="text-gray-400 mb-6">Tambahkan penugasan mengajar untuk guru</p>
                        </div>
                    ) : (
                        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-700/50">
                                        <th className="text-left p-4 text-gray-400 font-medium">Guru</th>
                                        <th className="text-left p-4 text-gray-400 font-medium">Mata Pelajaran</th>
                                        <th className="text-left p-4 text-gray-400 font-medium">Kelas</th>
                                        <th className="text-left p-4 text-gray-400 font-medium">Jam/Minggu</th>
                                        <th className="text-left p-4 text-gray-400 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAssignments.map((assignment) => (
                                        <tr key={assignment.id} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                                                        <GraduationCap className="w-4 h-4 text-violet-400" />
                                                    </div>
                                                    <span className="text-white">{assignment.teacher?.name || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-300">
                                                {assignment.subject?.name || '-'}
                                            </td>
                                            <td className="p-4 text-gray-300">
                                                {assignment.class?.name || '-'}
                                            </td>
                                            <td className="p-4 text-gray-300">
                                                {assignment.hours_per_week} jam
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleDelete(assignment.id)}
                                                    className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Workload Summary */}
                    {!isLoading && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {teachers.slice(0, 8).map(teacher => {
                                const workload = getTeacherWorkload(teacher.id);
                                return (
                                    <div key={teacher.id} className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
                                        <p className="text-sm text-gray-400 mb-1">{teacher.name}</p>
                                        <p className="text-2xl font-bold text-white">{workload} <span className="text-sm font-normal text-gray-500">jam/minggu</span></p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* Add Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700">
                        <div className="p-6 border-b border-gray-700">
                            <h3 className="text-lg font-bold text-white">Tambah Penugasan Mengajar</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Guru</label>
                                <select
                                    value={formData.teacher_id}
                                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                >
                                    <option value="">Pilih Guru...</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Mata Pelajaran</label>
                                <select
                                    value={formData.subject_id}
                                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                >
                                    <option value="">Pilih Mata Pelajaran...</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Kelas</label>
                                <select
                                    value={formData.class_id}
                                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                >
                                    <option value="">Pilih Kelas...</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Jam per Minggu</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={formData.hours_per_week}
                                    onChange={(e) => setFormData({ ...formData, hours_per_week: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 border border-gray-600 text-gray-300 font-medium rounded-xl hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        'Simpan'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
