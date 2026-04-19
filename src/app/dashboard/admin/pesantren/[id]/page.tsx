'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, User } from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { Building2, Users, UsersRound, BookOpen, GraduationCap, MapPin, Phone, ArrowLeft, MoreVertical, Ban, Activity, DollarSign, BookText, QrCode, User as UserIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

export default function PesantrenMonitoringDashboard({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    const [isLoading, setIsLoading] = useState(true);
    const [pesantrenData, setPesantrenData] = useState<any>(null);
    const [stats, setStats] = useState({
        totalSantri: 0,
        totalStaff: 0,
        hadirToday: 0,
        sakitToday: 0
    });
    
    const [attendanceLog, setAttendanceLog] = useState<any[]>([]);
    const [tahfidzLog, setTahfidzLog] = useState<any[]>([]);
    
    // Unwrapping the dynamic params safely for Next.js 16
    const resolveParams = async () => {
        const resolved = await params;
        return Array.isArray(resolved.id) ? resolved.id[0] : resolved.id;
    };

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const pesantrenId = await resolveParams();
            
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

            setStats({
                totalSantri: santriCount || 0,
                totalStaff: staffCount || 0,
                hadirToday: hadir,
                sakitToday: sakitAlpha
            });

            // Set Recent Logs (Max 5)
            setAttendanceLog(todayAtt?.slice(0, 5) || []);

            // 4. Fetch Tahfidz (Fail gracefully if table doesn't exist yet)
            const { data: tahfidzData, error: tahfidzError } = await supabase
                .from('tahfidz_records' as any)
                .select('surah_name, juz_number, grade, recorded_at, students(name)')
                .eq('pesantren_id', pesantrenId)
                .order('recorded_at', { ascending: false })
                .limit(5);

            if (!tahfidzError && tahfidzData) {
                setTahfidzLog(tahfidzData);
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

    // Dummy Chart Data until we build complex aggregations
    const attendanceTrendData = [
        { name: 'Senin', hadir: 120, absen: 5 },
        { name: 'Selasa', hadir: 118, absen: 7 },
        { name: 'Rabu', hadir: 122, absen: 3 },
        { name: 'Kamis', hadir: 115, absen: 10 },
        { name: 'Jumat', hadir: 125, absen: 0 },
        { name: 'Sabtu', hadir: 120, absen: 5 },
    ];

    const tahfidzDistributionData = [
        { name: 'Juz 1-5', value: 45, color: '#8b5cf6' },
        { name: 'Juz 6-15', value: 25, color: '#3b82f6' },
        { name: 'Juz 16-25', value: 15, color: '#10b981' },
        { name: 'Juz 26-30', value: 10, color: '#f59e0b' },
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

                <main className="p-4 lg:p-8 max-w-[1600px] mx-auto">
                    
                    {/* Navigation Breadcrumb */}
                    <button 
                        onClick={() => router.push('/dashboard/admin/pesantren')}
                        className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-6 text-sm font-bold tracking-widest uppercase"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Master Data
                    </button>

                    {/* Section 1: Header Identity */}
                    <div className="bg-neutral-900/50 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 lg:p-10 mb-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-24 h-24 bg-neutral-950 border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
                                <Building2 className="w-10 h-10 text-indigo-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">Active Unit</span>
                                    <span className="text-neutral-500 text-xs font-bold font-mono">ID: {pesantrenData.id.split('-')[0]}</span>
                                </div>
                                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-3">{pesantrenData.name}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400 font-medium">
                                    <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {pesantrenData.address || 'Alamat tidak diatur'}</div>
                                    <div className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {pesantrenData.phone || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 flex gap-3">
                            <button className="px-5 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold text-sm transition-colors border border-white/10 flex items-center gap-2">
                                <Ban className="w-4 h-4 text-rose-500" />
                                Suspend Mode
                            </button>
                        </div>
                    </div>

                    {/* Section 2: High Level Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><UsersRound className="w-20 h-20" /></div>
                            <h3 className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-4">Total Santri</h3>
                            <div className="text-4xl font-black text-white">{stats.totalSantri}</div>
                            <p className="text-emerald-400 text-xs font-bold mt-2">+0% Bulan ini</p>
                        </div>
                        <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><GraduationCap className="w-20 h-20" /></div>
                            <h3 className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-4">Total SDM / Staff</h3>
                            <div className="text-4xl font-black text-white">{stats.totalStaff}</div>
                            <p className="text-indigo-400 text-xs font-bold mt-2">Aktif Bekerja</p>
                        </div>
                        <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><QrCode className="w-20 h-20" /></div>
                            <h3 className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-4">Kehadiran (Hari Ini)</h3>
                            <div className="text-4xl font-black text-white">{stats.hadirToday}</div>
                            <p className="text-rose-400 text-xs font-bold mt-2">{stats.sakitToday} Tidak Hadir</p>
                        </div>
                        <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign className="w-20 h-20" /></div>
                            <h3 className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-4">Total Pemasukan</h3>
                            <div className="text-4xl font-black text-white">100%</div>
                            <p className="text-emerald-400 text-xs font-bold mt-2">Monitoring Tahap Beta</p>
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
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-neutral-400">
                                <thead className="text-[10px] font-black uppercase tracking-widest text-neutral-500 bg-neutral-950/50">
                                    <tr>
                                        <th className="px-6 py-4 rounded-l-2xl">Nama Santri</th>
                                        <th className="px-6 py-4">Surah</th>
                                        <th className="px-6 py-4">Juz</th>
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
                                                <td className="px-6 py-4 font-bold text-white">{t.students?.name}</td>
                                                <td className="px-6 py-4">{t.surah_name}</td>
                                                <td className="px-6 py-4"><span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-lg font-bold">Juz {t.juz_number}</span></td>
                                                <td className="px-6 py-4 font-bold text-emerald-400">{t.grade || '-'}</td>
                                                <td className="px-6 py-4">{new Date(t.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
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
