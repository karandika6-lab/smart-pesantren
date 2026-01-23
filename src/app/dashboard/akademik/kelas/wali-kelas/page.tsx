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
    UserCheck,
    Search,
    Loader2,
    Save,
    X,
    ChevronDown,
    GraduationCap
} from 'lucide-react';
import { classesService, ClassWithRelations } from '@/lib/services/classes';
import { teachersService } from '@/lib/services/teachers';

interface Teacher {
    id: string;
    name: string;
    user_id?: string | null;
}

export default function WaliKelasPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [classes, setClasses] = useState<ClassWithRelations[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState<string | null>(null);

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
            const [classesData, teachersData] = await Promise.all([
                classesService.getAll(),
                teachersService.getAll()
            ]);
            setClasses(classesData);
            setTeachers(teachersData);
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

    const handleAssignWali = async (classId: string, teacherId: string | null) => {
        setIsSaving(classId);
        try {
            await classesService.update(classId, { homeroom_teacher_id: teacherId });
            // Update local state
            setClasses(prev => prev.map(c =>
                c.id === classId ? { ...c, homeroom_teacher_id: teacherId } : c
            ));
        } catch (error) {
            console.error('Error assigning homeroom teacher:', error);
            alert('Gagal menyimpan wali kelas');
        } finally {
            setIsSaving(null);
        }
    };

    const filteredClasses = classes.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getTeacherName = (teacherId: string | null | undefined) => {
        if (!teacherId) return null;
        const teacher = teachers.find(t => t.id === teacherId);
        return teacher?.name || null;
    };

    // Check if teacher is already assigned to another class
    const isTeacherAssigned = (teacherId: string, excludeClassId: string) => {
        return classes.some(c => c.homeroom_teacher_id === teacherId && c.id !== excludeClassId);
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
                        href="/dashboard/akademik/kelas"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Manajemen Kelas
                    </Link>

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Penugasan Wali Kelas</h1>
                            <p className="text-gray-400">Tentukan guru yang menjadi wali untuk setiap kelas</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative mb-6 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari kelas..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                    ) : filteredClasses.length === 0 ? (
                        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-12 text-center">
                            <GraduationCap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">Belum Ada Kelas</h3>
                            <p className="text-gray-400">Tambahkan kelas terlebih dahulu di menu Manajemen Kelas</p>
                        </div>
                    ) : (
                        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-700/50">
                                        <th className="text-left p-4 text-gray-400 font-medium">Kelas</th>
                                        <th className="text-left p-4 text-gray-400 font-medium">Tingkat</th>
                                        <th className="text-left p-4 text-gray-400 font-medium">Wali Kelas</th>
                                        <th className="text-left p-4 text-gray-400 font-medium w-80">Pilih Guru</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClasses.map((cls) => (
                                        <tr key={cls.id} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                                        <Users className="w-5 h-5 text-emerald-400" />
                                                    </div>
                                                    <span className="font-medium text-white">{cls.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-400">
                                                Kelas {cls.grade_level}
                                            </td>
                                            <td className="p-4">
                                                {getTeacherName(cls.homeroom_teacher_id) ? (
                                                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                                                        {getTeacherName(cls.homeroom_teacher_id)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500 italic">Belum ditentukan</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="relative flex-1">
                                                        <select
                                                            value={cls.homeroom_teacher_id || ''}
                                                            onChange={(e) => handleAssignWali(cls.id, e.target.value || null)}
                                                            disabled={isSaving === cls.id}
                                                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                                                        >
                                                            <option value="">-- Pilih Guru --</option>
                                                            {teachers.map((teacher) => (
                                                                <option
                                                                    key={teacher.id}
                                                                    value={teacher.id}
                                                                    disabled={isTeacherAssigned(teacher.id, cls.id)}
                                                                >
                                                                    {teacher.name} {isTeacherAssigned(teacher.id, cls.id) ? '(Sudah jadi Wali Kelas)' : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                    </div>
                                                    {isSaving === cls.id && (
                                                        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Info */}
                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <div className="flex items-start gap-3">
                            <UserCheck className="w-5 h-5 text-blue-400 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-300">Catatan Penting</h4>
                                <p className="text-sm text-blue-300/80 mt-1">
                                    Satu guru hanya dapat menjadi wali kelas untuk satu kelas saja.
                                    Guru yang sudah ditugaskan akan ditandai dan tidak dapat dipilih untuk kelas lain.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
