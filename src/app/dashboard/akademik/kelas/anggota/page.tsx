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

                <main className="p-3 sm:p-4 lg:p-10 max-w-[1600px] mx-auto">
                    {/* Back Button */}
                        <Link
                            href="/dashboard/akademik/kelas"
                            className="inline-flex items-center gap-2 text-[10px] sm:text-xs text-neutral-500 hover:text-white mb-4 sm:mb-6 transition-all group"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                            Kembali ke Manajemen Kelas
                        </Link>

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <div>
                                <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight">Anggota <span className="text-blue-500">Kelas</span></h1>
                                <p className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest mt-0.5">Kelola penempatan santri per rombel</p>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Class List - Horizontal on Mobile, Sidebar on Desktop */}
                            <div className="lg:col-span-1 space-y-4">
                                <div className="bg-[#0c0c0c] rounded-[1.5rem] lg:rounded-[2rem] border border-white/5 p-4 lg:p-6 sticky top-4">
                                    <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                        Pilih Kelas
                                    </h3>
                                    <div className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                                        {classes.map(cls => {
                                            const count = students.filter(s => s.class_id === cls.id).length;
                                            const isActive = selectedClass === cls.id;
                                            return (
                                                <button
                                                    key={cls.id}
                                                    onClick={() => setSelectedClass(cls.id)}
                                                    className={`flex-none lg:w-full flex items-center justify-between p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all border shrink-0 ${isActive
                                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                                        : 'bg-black/40 border-white/5 text-neutral-500 hover:text-white'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <GraduationCap className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                                                        <span className="text-xs font-black uppercase tracking-tight">{cls.name}</span>
                                                    </div>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ml-2 ${isActive ? 'bg-white/20 text-white' : 'bg-neutral-900 text-neutral-600'}`}>
                                                        {count}
                                                    </span>
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => setSelectedClass(null)}
                                            className={`flex-none lg:w-full flex items-center justify-between p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all border shrink-0 ${selectedClass === null
                                                ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                                                : 'bg-black/40 border-white/5 text-neutral-500 hover:text-white'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <UserMinus className={`w-4 h-4 ${selectedClass === null ? 'text-white' : 'text-amber-500'}`} />
                                                <span className="text-xs font-black uppercase tracking-tight">Tanpa Kelas</span>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ml-2 ${selectedClass === null ? 'bg-white/20 text-white' : 'bg-neutral-900 text-neutral-600'}`}>
                                                {studentsWithoutClass.length}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Students List - Hybrid View */}
                            <div className="lg:col-span-3 bg-[#0c0c0c] rounded-[1.5rem] lg:rounded-[2rem] border border-white/5 overflow-hidden flex flex-col h-fit shadow-2xl">
                                {/* Header */}
                                <div className="p-5 lg:p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-black/20">
                                    <div className="min-w-0">
                                        <h3 className="text-base lg:text-xl font-black text-white uppercase tracking-tight truncate">
                                            {selectedClass === null
                                                ? 'Santri Unassigned'
                                                : `${selectedClassData?.name || 'Anggota Kelas'}`}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-1 h-1 bg-neutral-700 rounded-full"></div>
                                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">
                                                Total: {selectedClass === null ? studentsWithoutClass.length : filteredStudents.length} Santri
                                            </p>
                                        </div>
                                    </div>

                                    {/* Search */}
                                    <div className="relative group min-w-[200px]">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Cari NIS / Nama..."
                                            className="w-full pl-11 pr-4 py-3 bg-black border border-white/5 rounded-xl text-xs text-white placeholder-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold"
                                        />
                                    </div>
                                </div>

                                {/* Hybrid List */}
                                <div className="flex-1">
                                    {(selectedClass === null ? studentsWithoutClass : filteredStudents).length === 0 ? (
                                        <div className="p-20 text-center">
                                            <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                                                <Users className="w-8 h-8 text-neutral-800" />
                                            </div>
                                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Tidak ada santri ditemukan</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Desktop Table View */}
                                            <div className="hidden lg:block overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="bg-[#0a0a0a] border-b border-white/5">
                                                            <th className="p-6 text-[10px] font-black text-neutral-600 uppercase tracking-widest">NIS</th>
                                                            <th className="p-6 text-[10px] font-black text-neutral-600 uppercase tracking-widest">Nama Santri</th>
                                                            <th className="p-6 text-[10px] font-black text-neutral-600 uppercase tracking-widest">L/P</th>
                                                            {selectedClass === null && (
                                                                <th className="p-6 text-[10px] font-black text-neutral-600 uppercase tracking-widest text-right">Aksi</th>
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/[0.02]">
                                                        {(selectedClass === null ? studentsWithoutClass : filteredStudents).map((student) => (
                                                            <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                                                                <td className="p-6">
                                                                    <span className="px-3 py-1 bg-neutral-900 border border-white/5 rounded-lg text-xs font-mono text-blue-500 font-bold">
                                                                        {student.nis}
                                                                    </span>
                                                                </td>
                                                                <td className="p-6">
                                                                    <div className="text-sm font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{student.name}</div>
                                                                </td>
                                                                <td className="p-6">
                                                                    <div className={`inline-flex px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${student.gender === 'L' ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                                        {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                                                                    </div>
                                                                </td>
                                                                {selectedClass === null && (
                                                                    <td className="p-6 text-right">
                                                                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                                                            <UserPlus className="w-3.5 h-3.5" />
                                                                            Assign
                                                                        </button>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobile Card List View */}
                                            <div className="lg:hidden divide-y divide-white/[0.05]">
                                                {(selectedClass === null ? studentsWithoutClass : filteredStudents).map((student, idx) => (
                                                    <div key={student.id} className="p-5 active:bg-white/[0.02] transition-colors relative">
                                                        <div className="flex items-center justify-between gap-4 mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-neutral-800">#{idx + 1}</span>
                                                                <span className="px-2 py-0.5 bg-neutral-900 border border-white/5 rounded-lg text-[9px] font-mono text-blue-500 font-bold uppercase shrink-0">
                                                                    {student.nis}
                                                                </span>
                                                            </div>
                                                            <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest shrink-0 ${student.gender === 'L' ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                                {student.gender === 'L' ? 'L' : 'P'}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-black text-white uppercase tracking-tight mb-4">{student.name}</div>
                                                        {selectedClass === null && (
                                                            <button className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">
                                                                <UserPlus className="w-3.5 h-3.5" />
                                                                Masukkan ke Kelas
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
