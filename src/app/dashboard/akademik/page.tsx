'use client';

import { useEffect, useState } from 'react';
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
    ChartCard,
    ClassDensityChart,
    GenderRatioChart,
    TeacherLoadChart
} from '@/components/charts';

import { studentsService } from '@/lib/services/students';
import { teachersService } from '@/lib/services/teachers';
import { classesService } from '@/lib/services/classes';
import { Loader2 } from 'lucide-react';

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
    const [classDensity, setClassDensity] = useState<any[]>([]);
    const [genderRatio, setGenderRatio] = useState<any[]>([]);
    const [teacherLoad, setTeacherLoad] = useState<any[]>([]);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_akademik' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchData();
    }, [router]);

    const fetchData = async () => {
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
                totalHours: load.reduce((acc, curr) => acc + curr.hours, 0)
            });

            setClassDensity(density);
            setGenderRatio(ratio);
            setTeacherLoad(load);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching akademik data:', error);
            setIsLoading(false);
        }
    };

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
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-[2rem] p-8 lg:p-10 text-white mb-8 shadow-xl shadow-blue-900/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                                    <GraduationCap className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-extrabold tracking-tight">Portal Akademik</h2>
                                    <p className="text-blue-100 font-medium">Smart Pesantren Monitoring System</p>
                                </div>
                            </div>
                            <p className="text-blue-50/80 max-w-xl leading-relaxed">
                                Selamat datang kembali, {user.name}. Pantau rasio kelas, beban mengajar, dan statistik santri secara real-time dari satu dashboard.
                            </p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { label: 'Total Santri', value: stats.totalStudents, icon: Users, color: 'blue', trend: 'Global' },
                            { label: 'Total Guru', value: stats.totalTeachers, icon: GraduationCap, color: 'emerald', trend: 'Aktif' },
                            { label: 'Total Kelas', value: stats.totalClasses, icon: BookMarked, color: 'indigo', trend: 'Aktif' },
                            { label: 'Jam/Minggu', value: stats.totalHours, icon: Clock, color: 'rose', trend: 'Total' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                                        <TrendingUp className="w-3 h-3" />
                                        {stat.trend}
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                            </div>
                        ))}
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-12 gap-6 mb-8">
                        {/* Class Density - Span 8 */}
                        <div className="col-span-12 lg:col-span-8">
                            <ChartCard
                                title="Kepadatan Kelas"
                                subtitle="Perbandingan jumlah santri terhadap kapasitas rombel"
                                className="h-full !p-6"
                            >
                                <div className="mt-4">
                                    <ClassDensityChart data={classDensity} height={300} />
                                </div>
                            </ChartCard>
                        </div>

                        {/* Gender Ratio - Span 4 */}
                        <div className="col-span-12 lg:col-span-4">
                            <ChartCard
                                title="Rasio Gender"
                                subtitle="Persentase santri putra & putri"
                                className="h-full !p-6"
                            >
                                <div className="mt-4">
                                    <GenderRatioChart data={genderRatio} height={300} />
                                </div>
                            </ChartCard>
                        </div>

                        {/* Teacher Load - Span 12 */}
                        <div className="col-span-12">
                            <ChartCard
                                title="Beban Mengajar Guru"
                                subtitle="Distribusi jam pelajaran aktif per minggu untuk 5 guru dengan beban tertinggi"
                                className="!p-6"
                            >
                                <div className="mt-6">
                                    <TeacherLoadChart data={teacherLoad} height={380} />
                                </div>
                            </ChartCard>
                        </div>
                    </div>

                    {/* Quick Access Section */}
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Akses Cepat</h3>
                                <p className="text-gray-500 text-sm">Navigasi langsung ke modul akademik utama</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { title: 'Atur Kurikulum', desc: 'Kelola mata pelajaran dan silabus', icon: BookMarked, link: '/dashboard/akademik/mapel' },
                                { title: 'Manajemen Kelas', desc: 'Input data kelas dan wali kelas', icon: Users, link: '/dashboard/akademik/kelas' },
                                { title: 'Jadwal Mingguan', desc: 'Update jadwal pelajaran rutin', icon: CalendarDays, link: '/dashboard/akademik/jadwal' },
                            ].map((item, i) => (
                                <Link
                                    key={i}
                                    href={item.link}
                                    className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-blue-50 hover:border-blue-100 transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    <h4 className="font-bold text-gray-800 mb-1">{item.title}</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
