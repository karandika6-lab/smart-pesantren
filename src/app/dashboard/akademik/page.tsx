'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getCurrentUser,
    clearSession,
    User
} from '@/lib/auth';
import {
    GraduationCap,
    Users,
    CalendarDays,
    BookMarked,
    Clock,
    ArrowUpRight,
    TrendingUp
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    ClassDensityChart,
    GenderRatioChart,
    TeacherLoadChart
} from '@/components/charts';

import { studentsService } from '@/lib/services/students';
import { teachersService } from '@/lib/services/teachers';
import { classesService } from '@/lib/services/classes';
import { Loader2 } from 'lucide-react';

interface ClassDensityItem {
    name: string;
    count: number;
    capacity: number;
}

interface GenderRatioItem {
    name: string;
    value: number;
    color: string;
}

interface TeacherLoadItem {
    name: string;
    hours: number;
}

export default function AkademikDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Real Data State
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        totalHours: 0
    });
    const [classDensity, setClassDensity] = useState<ClassDensityItem[]>([]);
    const [genderRatio, setGenderRatio] = useState<GenderRatioItem[]>([]);
    const [teacherLoad, setTeacherLoad] = useState<TeacherLoadItem[]>([]);

    const fetchData = useCallback(async () => {
        try {
            const [
                studentStats,
                teachers,
                classes,
                density,
                ratio,
                load
            ] = await Promise.all([
                studentsService.getStats(),
                teachersService.getAll(),
                classesService.getAll(),
                classesService.getDensity(),
                studentsService.getGenderRatio(),
                teachersService.getLoad()
            ]);

            setStats({
                totalStudents: studentStats.total,
                totalTeachers: teachers.length,
                totalClasses: classes.length,
                totalHours: load.reduce((acc, curr) => acc + (curr.hours || 0), 0)
            });

            setClassDensity(density);
            setGenderRatio(ratio);
            setTeacherLoad(load);
            setIsLoading(false);
            setIsLoading(false);
        } catch (_error) {
            console.error('Error fetching akademik data:', _error);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_akademik' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchData();
        });
        return () => cancelAnimationFrame(timer);
    }, [router, fetchData]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <div className="text-gray-400 font-medium">Menghubungkan ke database...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="flex-1 lg:ml-64">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 max-w-[1600px] mx-auto">
                    {/* Welcome Banner - Modern Gradient */}
                    <div className="relative mb-8 lg:mb-12 rounded-[2.5rem] p-8 lg:p-12 overflow-hidden bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-950 shadow-2xl border border-blue-500/20 group">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl mix-blend-overlay" />
                        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full -ml-20 -mb-20 blur-3xl mix-blend-overlay" />

                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                            <div className="max-w-3xl">
                                <div className="flex items-center gap-5 mb-5">
                                    <div className="p-3.5 bg-white/10 rounded-2xl border border-white/20 shadow-inner backdrop-blur-sm">
                                        <GraduationCap className="w-8 h-8 text-blue-200" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl lg:text-4xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-xl">
                                            Pusat Kendali <span className="text-blue-300">Akademik</span>
                                        </h2>
                                        <p className="text-blue-200/50 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 shadow-black/10">
                                            Smart Pesantren v2.0
                                        </p>
                                    </div>
                                </div>
                                <p className="text-blue-100/90 text-base lg:text-lg leading-relaxed font-medium drop-shadow-md">
                                    Selamat datang kembali, <span className="text-white font-extrabold">{user.name}</span>.
                                    Sistem sedang memantau <span className="text-blue-300 font-bold text-xl">{stats.totalStudents} santri</span> dan
                                    <span className="text-blue-300 font-bold text-xl"> {stats.totalTeachers} pengajar</span>.
                                </p>
                            </div>

                            <div className="flex shrink-0">
                                <div className="bg-black/40 border border-blue-400/10 rounded-2xl p-3.5 shadow-lg backdrop-blur-md">
                                    <div className="text-[9px] font-black text-blue-300 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                        Server Status
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-white font-black text-[10px] uppercase tracking-widest leading-none">Online</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards - Grid Layout - Optimized Mobile */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 lg:mb-12">
                        {[
                            { label: 'Total Santri', value: stats.totalStudents, icon: Users, color: 'blue', detail: 'Jiwa' },
                            { label: 'Total Guru', value: stats.totalTeachers, icon: GraduationCap, color: 'emerald', detail: 'Asatidz' },
                            { label: 'Total Kelas', value: stats.totalClasses, icon: BookMarked, color: 'indigo', detail: 'Rombel' },
                            { label: 'Jam/Minggu', value: stats.totalHours, icon: Clock, color: 'rose', detail: 'Pelajaran' },
                        ].map((stat, i) => (
                            <div key={i} className="group relative">
                                <div className={`absolute -inset-0.5 bg-gradient-to-b from-${stat.color}-500/20 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition duration-500`}></div>
                                <div className="relative bg-[#0c0c0c] border border-white/5 p-6 lg:p-8 rounded-3xl transition-all duration-500 group-hover:bg-[#111] group-hover:border-white/10 group-hover:scale-[1.02]">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className={`p-4 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-3xl font-black text-white tracking-tighter">{stat.value}</h3>
                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">{stat.detail}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Grid - New Aesthetics */}
                    <div className="grid grid-cols-12 gap-8 mb-12">
                        {/* Class Density */}
                        <div className="col-span-12 lg:col-span-8 group">
                            <div className="bg-neutral-900/40 border border-white/5 rounded-[3rem] p-8 lg:p-10 backdrop-blur-xl h-full transition-all duration-500 hover:border-white/10 hover:bg-neutral-900/60">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Kepadatan Kelas</h3>
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Rasio Santri per Rombongan Belajar</p>
                                    </div>
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
                                        <TrendingUp className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <ClassDensityChart data={classDensity} height={350} />
                                </div>
                            </div>
                        </div>

                        {/* Gender Ratio */}
                        <div className="col-span-12 lg:col-span-4">
                            <div className="bg-neutral-900/40 border border-white/5 rounded-[3rem] p-8 lg:p-10 backdrop-blur-xl h-full transition-all duration-500 hover:border-white/10 hover:bg-neutral-900/60">
                                <div className="mb-10">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Demografi</h3>
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Distribusi Gender</p>
                                </div>
                                <div className="mt-4 flex items-center justify-center">
                                    <GenderRatioChart data={genderRatio} height={350} />
                                </div>
                            </div>
                        </div>

                        {/* Teacher Load */}
                        <div className="col-span-12">
                            <div className="bg-neutral-900/40 border border-white/5 rounded-[3rem] p-8 lg:p-10 backdrop-blur-xl transition-all duration-500 hover:border-white/10 hover:bg-neutral-900/60">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Beban Kerja Pengajar</h3>
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Total Jam Mengajar Aktif per Minggu</p>
                                    </div>
                                    <div className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                        Top 5 Asatidz
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <TeacherLoadChart data={teacherLoad} height={400} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access Grid - 3D Cards */}
                    <div className="bg-neutral-900/40 border border-white/5 rounded-[3.5rem] p-10 lg:p-14 backdrop-blur-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                        <div className="relative z-10 mb-12">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Akses Navigasi Instan</h3>
                            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Pintas cepat ke modul manajemen utama</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: 'Kurikulum & Mapel', desc: 'Konfigurasi materi and silabus standar pesantren', icon: BookMarked, link: '/dashboard/akademik/mapel', color: 'blue' },
                                { title: 'Rombongan Belajar', desc: 'Pengelolaan data kelas, wali kelas and penempatan', icon: Users, link: '/dashboard/akademik/kelas', color: 'indigo' },
                                { title: 'Penjadwalan Aktif', desc: 'Sinkronisasi jadwal pelajaran and agenda akademik', icon: CalendarDays, link: '/dashboard/akademik/jadwal', color: 'amber' },
                            ].map((item, i) => (
                                <Link
                                    key={i}
                                    href={item.link}
                                    className="group relative overflow-hidden p-8 rounded-[2.5rem] bg-black/40 border border-white/5 transition-all duration-500 hover:bg-white/[0.02] hover:border-white/10 hover:shadow-2xl hover:translate-y-[-8px]"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700">
                                        <item.icon className="w-24 h-24" />
                                    </div>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="p-4 bg-neutral-800 rounded-2xl group-hover:bg-white group-hover:text-black transition-all duration-500 shadow-xl group-hover:scale-110">
                                            <item.icon className="w-7 h-7" />
                                        </div>
                                        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                                            <ArrowUpRight className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-black text-white mb-3 tracking-tight group-hover:text-blue-400 transition-colors uppercase">{item.title}</h4>
                                    <p className="text-gray-500 text-sm leading-relaxed font-medium group-hover:text-gray-400 transition-colors">{item.desc}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
