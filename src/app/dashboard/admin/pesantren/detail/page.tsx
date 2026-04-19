'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, User } from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { Building2, Users, UsersRound, BookOpen, GraduationCap, MapPin, Phone, ArrowLeft, MoreVertical, Ban, Activity, DollarSign, BookText, QrCode, User as UserIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    const [isLoading, setIsLoading] = useState(true);
    const [pesantrenData, setPesantrenData] = useState<any>(null);
    const [stats, setStats] = useState({
        totalSantri: 0,
        totalStaff: 0,
        hadirToday: 0,
        sakitToday: 0,
        totalIncome: 0
    });
    
    const [attendanceLog, setAttendanceLog] = useState<any[]>([]);
    const [tahfidzLog, setTahfidzLog] = useState<any[]>([]);
    const [tahfidzDistributionData, setTahfidzDistributionData] = useState<any[]>([]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const pesantrenId = searchParams.get('id');
            if (!pesantrenId) {
                setIsLoading(false);
                return;
            }
            
            // 1. Fetch Pesantren Data
            const { data: pData } = await supabase
                .from('pesantren')
                .select('*')
                .eq('id', pesantrenId)
                .single();
            setPesantrenData(pData);

            // 2. Fetch Highlights (Santri & Staff Counts)
            const { count: santriCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('pesantren_id', pesantrenId);
            const { count: staffCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('pesantren_id', pesantrenId);

            // 3. Fetch Today's Attendance
            const todayStr = new Date().toISOString().split('T')[0];
            const { data: todayAtt } = await supabase
                .from('attendance')
                .select('status, students(name, classes(name))')
                .eq('pesantren_id', pesantrenId)
                .eq('date', todayStr)
                .order('created_at', { ascending: false });
                
            const hadir = todayAtt?.filter(a => a.status === 'Hadir').length || 0;
            const sakitAlpha = todayAtt?.filter(a => ['Sakit', 'Alpha', 'Izin'].includes(a.status)).length || 0;

            // 4. Fetch Actual Finance (Payments)
            const { data: paymentsInfo } = await supabase
                .from('payments')
                .select('amount')
                .eq('pesantren_id', pesantrenId);
            const totalInc = paymentsInfo?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

            setStats({
                totalSantri: santriCount || 0,
                totalStaff: staffCount || 0,
                hadirToday: hadir,
                sakitToday: sakitAlpha,
                totalIncome: totalInc
            });

            // Set Recent Logs (Max 5)
            setAttendanceLog(todayAtt?.slice(0, 5) || []);

            // 5. Fetch Real Hafalan Distribution (from hafalan_programs)
            const { data: hPrograms } = await supabase
                .from('hafalan_programs')
                .select('hafalan_types!inner(name), students!inner(pesantren_id)')
                .eq('students.pesantren_id', pesantrenId);
                
            if (hPrograms && hPrograms.length > 0) {
                const counts: Record<string, number> = {};
                hPrograms.forEach(p => {
                    // @ts-ignore - Handle Supabase deeply nested relationship types
                    const tName = p.hafalan_types?.name || 'Lainnya';
                    counts[tName] = (counts[tName] || 0) + 1;
                });
                
                const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
                const distrData = Object.entries(counts).map(([name, value], idx) => ({
                    name, 
                    value, 
                    color: colors[idx % colors.length]
                }));
                // Sort by value desc
                distrData.sort((a, b) => b.value - a.value);
                setTahfidzDistributionData(distrData);
            } else {
                setTahfidzDistributionData([]); // Empty if no data
            }

            // 6. Fetch Recent Hafalan Progress
            const { data: hProgress } = await supabase
                .from('hafalan_progress')
                .select(`
                    unit_number, progress_percentage, grade, evaluated_at, 
                    hafalan_programs!inner(
                        student_id, 
                        hafalan_types(name), 
                        students!inner(name, pesantren_id)
                    )
                `)
                .eq('hafalan_programs.students.pesantren_id', pesantrenId)
                .order('evaluated_at', { ascending: false })
                .limit(5);

            if (hProgress) {
                setTahfidzLog(hProgress);
            }

        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'super_admin') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    // Dummy Chart Data for Trend until we build complex aggregations
    const attendanceTrendData = [
        { name: 'Senin', hadir: 120, absen: 5 },
        { name: 'Selasa', hadir: 118, absen: 7 },
        { name: 'Rabu', hadir: 122, absen: 3 },
        { name: 'Kamis', hadir: 115, absen: 10 },
        { name: 'Jumat', hadir: 125, absen: 0 },
        { name: 'Sabtu', hadir: 120, absen: 5 },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!pesantrenData) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-8">
                <Building2 className="w-20 h-20 text-neutral-800 mb-6" />
                <h1 className="text-2xl font-black uppercase tracking-widest text-neutral-400 mb-2">Unit Tidak Ditemukan</h1>
                <p className="text-neutral-500 mb-8 text-center max-w-md">Data pesantren telah dihapus atau Anda tidak memiliki akses ke unit ini.</p>
                <button onClick={() => router.push('/dashboard/admin/pesantren')} className="px-6 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-transform">
                    Kembali ke Daftar
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-indigo-500/30">
            <Sidebar
                user={user!}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={() => {}}
            />

            <div className="lg:pl-64">
                <DashboardHeader user={user!} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 max-w-[1600px] mx-auto">
                    
                    {/* Navigation Breadcrumb */}
                    <button 
                        onClick={() => router.push('/dashboard/admin/pesantren')}
                        className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-4 lg:mb-6 text-[10px] lg:text-sm font-black tracking-widest uppercase"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        Kembali ke Master Data
                    </button>

                    {/* Section 1: Header Identity */}
                    <div className="bg-neutral-900/50 backdrop-blur-2xl border border-white/5 rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-10 mb-6 lg:mb-10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        
                        <div className="flex items-center gap-4 lg:gap-8 relative z-10">
                            <div className="w-12 h-12 lg:w-24 lg:h-24 bg-neutral-950 border border-white/10 rounded-xl lg:rounded-3xl flex items-center justify-center shadow-2xl shrink-0">
                                <Building2 className="w-6 h-6 lg:w-12 lg:h-12 text-indigo-400" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 lg:gap-3 mb-1.5 lg:mb-3">
                                    <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-emerald-500/10 text-emerald-400 text-[8px] lg:text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">Active Unit</span>
                                    <span className="text-neutral-500 text-[9px] lg:text-xs font-bold font-mono hidden sm:inline">ID: {pesantrenData.id.split('-')[0]}</span>
                                </div>
                                <h1 className="text-lg lg:text-4xl font-black text-white tracking-tight mb-2 lg:mb-4 uppercase leading-tight drop-shadow-xl">{pesantrenData.name}</h1>
                                <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-[10px] lg:text-sm text-neutral-400 font-bold uppercase tracking-widest">
                                    <div className="flex items-center gap-2 truncate"><MapPin className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0 text-indigo-500" /> <span className="truncate">{pesantrenData.address || 'Alamat tidak diatur'}</span></div>
                                    <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0 text-indigo-500" /> {pesantrenData.phone || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 flex gap-3">
                            <button className="flex-1 lg:flex-none px-4 py-2.5 lg:px-6 lg:py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest transition-all border border-white/10 flex items-center justify-center gap-2 active:scale-95">
                                <Ban className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-rose-500" />
                                Suspend Unit
                            </button>
                        </div>
                    </div>

                    {/* Section 2: High Level Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><UsersRound className="w-20 h-20" /></div>
                            <h3 className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-4">Total Santri</h3>
                            <div className="text-3xl xl:text-4xl font-black text-white truncate">{stats.totalSantri}</div>
                            <p className="text-emerald-400 text-xs font-bold mt-2">+0% Bulan ini</p>
                        </div>
                        <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><GraduationCap className="w-20 h-20" /></div>
                            <h3 className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-4">Total SDM / Staff</h3>
                            <div className="text-3xl xl:text-4xl font-black text-white truncate">{stats.totalStaff}</div>
                            <p className="text-indigo-400 text-xs font-bold mt-2">Aktif Bekerja</p>
                        </div>
                        <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><QrCode className="w-20 h-20" /></div>
                            <h3 className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-4">Kehadiran (Hari Ini)</h3>
                            <div className="text-3xl xl:text-4xl font-black text-white truncate">{stats.hadirToday}</div>
                            <p className="text-rose-400 text-xs font-bold mt-2">{stats.sakitToday} Tidak Hadir</p>
                        </div>
                        <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign className="w-20 h-20" /></div>
                            <h3 className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-4">Total Pemasukan</h3>
                            <div className="text-2xl xl:text-4xl font-black text-white truncate" title={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats.totalIncome)}>
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats.totalIncome)}
                            </div>
                            <p className="text-emerald-400 text-xs font-bold mt-2">Masuk ke kas unit</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Section 3: Absensi Real-time & Grafik */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-neutral-900/50 border border-white/5 rounded-[2rem] p-6 lg:p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-indigo-400" />
                                        Trend Kedisiplinan
                                    </h2>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={attendanceTrendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorAbsen" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                            <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '1rem' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Area type="monotone" dataKey="hadir" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHadir)" />
                                            <Area type="monotone" dataKey="absen" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorAbsen)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar: Feed & Finansial */}
                        <div className="space-y-8">
                            {/* Live Feed Absensi */}
                            <div className="bg-neutral-900/50 border border-white/5 rounded-[2rem] p-6 lg:p-8">
                                <h2 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <QrCode className="w-4 h-4 text-emerald-400" />
                                    Live Scan Terakhir
                                </h2>
                                <div className="space-y-4">
                                    {attendanceLog.length === 0 ? (
                                        <p className="text-neutral-500 text-sm italic">Belum ada scan masuk hari ini.</p>
                                    ) : (
                                        attendanceLog.map((log, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-neutral-950/50 rounded-2xl border border-white/5 relative overflow-hidden group">
                                                <div className={`w-2 h-full absolute left-0 top-0 ${log.status === 'Hadir' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                <div className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center shrink-0 ml-1">
                                                    <UserIcon className="w-5 h-5 text-neutral-400" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-bold text-white truncate">{log.students?.name}</p>
                                                    <p className="text-[10px] text-neutral-400 uppercase tracking-widest">{log.students?.classes?.name}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Circular Tahfidz Progress */}
                            <div className="bg-neutral-900/50 border border-white/5 rounded-[2rem] p-6 lg:p-8">
                                <h2 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-purple-400" />
                                    Distribusi Tahfidz
                                </h2>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={tahfidzDistributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {tahfidzDistributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '1rem' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    {tahfidzDistributionData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                                            {d.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    
                    {/* Tahfidz Highlight Table */}
                    <div className="mt-8 bg-neutral-900/50 border border-white/5 rounded-[2rem] p-6 lg:p-8">
                        <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <BookText className="w-5 h-5 text-purple-400" />
                            Highlight Setoran Tahfidz Terbaru
                        </h2>
                        <div className="overflow-x-auto pb-4">
                            <table className="w-full text-left text-sm text-neutral-400 whitespace-nowrap">
                                <thead className="text-[10px] font-black uppercase tracking-widest text-neutral-500 bg-neutral-950/50">
                                    <tr>
                                        <th className="px-6 py-4 rounded-l-2xl">Nama Santri</th>
                                        <th className="px-6 py-4">Tipe / Kategori</th>
                                        <th className="px-6 py-4">Progres (Unit)</th>
                                        <th className="px-6 py-4">Nilai</th>
                                        <th className="px-6 py-4 rounded-r-2xl">Waktu Setor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tahfidzLog.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center italic text-neutral-600">Belum ada rekaman tahfidz di unit ini.</td>
                                        </tr>
                                    ) : (
                                        tahfidzLog.map((t, i) => (
                                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-bold text-white">
                                                    {/* @ts-ignore - deeply nested Supabase response */}
                                                    {t.hafalan_programs?.students?.name || 'Santri'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {/* @ts-ignore */}
                                                    {t.hafalan_programs?.hafalan_types?.name || 'Lainnya'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-lg font-bold">
                                                        Unit {t.unit_number} ({t.progress_percentage}%)
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-emerald-400">{t.grade || '-'}</td>
                                                <td className="px-6 py-4">{new Date(t.evaluated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}

export default function PesantrenMonitoringDashboard() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
