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
    Search,
    Loader2,
    UserPlus,
    UserMinus,
    GraduationCap,
    ChevronRight
} from 'lucide-react';
import { classesService, ClassWithRelations } from '@/lib/services/classes';
import { studentsService } from '@/lib/services/students';

interface Student {
    id: string;
    name: string;
    nis: string;
    class_id: string | null;
    gender: 'L' | 'P';
}

export default function AnggotaKelasPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [classes, setClasses] = useState<ClassWithRelations[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

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
            const [classesData, studentsData] = await Promise.all([
                classesService.getAll(),
                studentsService.getAll()
            ]);
            setClasses(classesData);
            setStudents(studentsData as unknown as Student[]);
            if (classesData.length > 0) {
                setSelectedClass(classesData[0].id);
            }
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


    const studentsInClass = students.filter(s => s.class_id === selectedClass);
    const studentsWithoutClass = students.filter(s => !s.class_id);

    const filteredStudents = studentsInClass.filter(
        s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.nis.includes(searchQuery)
    );

    const selectedClassData = classes.find(c => c.id === selectedClass);

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
                            <h1 className="text-2xl font-bold text-white">Anggota Kelas</h1>
                            <p className="text-gray-400">Kelola daftar santri per kelas</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Class List Sidebar */}
                            <div className="lg:col-span-1 bg-gray-800/50 rounded-2xl border border-gray-700/50 p-4 h-fit">
                                <h3 className="font-semibold text-white mb-4">Pilih Kelas</h3>
                                <div className="space-y-2">
                                    {classes.map(cls => {
                                        const count = students.filter(s => s.class_id === cls.id).length;
                                        return (
                                            <button
                                                key={cls.id}
                                                onClick={() => setSelectedClass(cls.id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedClass === cls.id
                                                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                                                    : 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 border border-transparent'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <GraduationCap className="w-4 h-4" />
                                                    <span>{cls.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs bg-gray-600/50 px-2 py-0.5 rounded-full">
                                                        {count}
                                                    </span>
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </button>
                                        );
                                    })}

                                    {/* Unassigned Students */}
                                    <button
                                        onClick={() => setSelectedClass(null)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedClass === null
                                            ? 'bg-orange-500/20 border border-orange-500/50 text-orange-400'
                                            : 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 border border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <UserMinus className="w-4 h-4" />
                                            <span>Belum Terdaftar</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs bg-orange-600/30 px-2 py-0.5 rounded-full">
                                                {studentsWithoutClass.length}
                                            </span>
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Students List */}
                            <div className="lg:col-span-3 bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
                                {/* Header */}
                                <div className="p-4 border-b border-gray-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold text-white">
                                            {selectedClass === null
                                                ? 'Santri Belum Terdaftar di Kelas'
                                                : `Anggota ${selectedClassData?.name || 'Kelas'}`}
                                        </h3>
                                        <p className="text-sm text-gray-400">
                                            {selectedClass === null
                                                ? `${studentsWithoutClass.length} santri`
                                                : `${studentsInClass.length} santri`}
                                        </p>
                                    </div>

                                    {/* Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Cari nama/NIS..."
                                            className="pl-9 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                </div>

                                {/* Table */}
                                {(selectedClass === null ? studentsWithoutClass : filteredStudents).length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400">Tidak ada santri di kelas ini</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-700/50">
                                                <th className="text-left p-4 text-gray-400 font-medium">NIS</th>
                                                <th className="text-left p-4 text-gray-400 font-medium">Nama</th>
                                                <th className="text-left p-4 text-gray-400 font-medium">JK</th>
                                                {selectedClass === null && (
                                                    <th className="text-left p-4 text-gray-400 font-medium">Aksi</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedClass === null ? studentsWithoutClass : filteredStudents).map((student) => (
                                                <tr key={student.id} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                                                    <td className="p-4 text-gray-300 font-mono text-sm">{student.nis}</td>
                                                    <td className="p-4 text-white">{student.name}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${student.gender === 'L'
                                                            ? 'bg-blue-500/20 text-blue-400'
                                                            : 'bg-pink-500/20 text-pink-400'
                                                            }`}>
                                                            {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                                                        </span>
                                                    </td>
                                                    {selectedClass === null && (
                                                        <td className="p-4">
                                                            <button className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                                                                <UserPlus className="w-4 h-4" />
                                                                Masukkan ke Kelas
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
