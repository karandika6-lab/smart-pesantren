'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    User
} from '@/lib/auth';
import {
    Home,
    Plus,
    X,
    Shield,
    FileWarning,
    Calendar,
    Clock,
    CheckCircle2,
    TrendingUp,
    FileText,
    Users as UsersIcon
} from 'lucide-react';
import {
    ChartCard,
    ViolationTrendChart,
    ViolationRadarChart,
    PermissionStatsChart
} from '@/components/charts';

// ============================================
// Types
// ============================================

interface TrendData {
    name: string;
    violations: number;
}

interface RadarData {
    subject: string;
    value: number;
    fullMark: number;
}

interface PermStats {
    name: string;
    value: number;
}

interface Violator {
    student_id: string;
    student_name: string;
    class_name: string;
    total_points: number;
}

interface PermissionRequest {
    id: string;
    studentName: string;
    studentClass: string;
    parentName: string;
    parentPhone: string;
    reason: string;
    startDate: string;
    endDate: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

import { kesantrianService } from '@/lib/services/kesantrian';
import { studentsService, StudentWithRelations } from '@/lib/services/students';
import { Loader2 } from 'lucide-react';

export default function KesantrianDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Violation form
    const [showViolationModal, setShowViolationModal] = useState(false);
    const [violationForm, setViolationForm] = useState({
        studentId: '',
        category: 'ringan' as 'ringan' | 'sedang' | 'berat',
        points: 0,
        notes: '',
    });

    // Real Data State
    const [stats, setStats] = useState({
        totalViolations: 0,
        pendingPermissions: 0,
        dormOccupancy: '0/0',
        studentsOut: 0
    });
    const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
    const [violationTrend, setViolationTrend] = useState<TrendData[]>([]);
    const [violationRadar, setViolationRadar] = useState<RadarData[]>([]);
    const [permissionStats, setPermissionStats] = useState<PermStats[]>([]);
    const [students, setStudents] = useState<StudentWithRelations[]>([]);
    const [topViolators, setTopViolators] = useState<Violator[]>([]);


    // UI state
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [
                s,
                p,
                trend,
                radar,
                pStats,
                allStudents,
                violators
            ] = await Promise.all([
                kesantrianService.getStats(),
                kesantrianService.getPendingPermissions(),
                kesantrianService.getViolationTrend(),
                kesantrianService.getViolationRadar(),
                kesantrianService.getPermissionStats(),
                studentsService.getAll(),
                kesantrianService.getTopViolators()
            ]);

            setStats(s);
            setPermissions((p as unknown) as PermissionRequest[]);
            setViolationTrend(trend as unknown as TrendData[]);
            setViolationRadar(radar as unknown as RadarData[]);
            setPermissionStats(pStats as unknown as PermStats[]);
            setStudents(allStudents);
            setTopViolators((violators || []) as unknown as Violator[]);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching kesantrian data:', error);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const currentUser = getCurrentUser();
        // Role check handled by layout
        if (currentUser) {
            setUser(currentUser);
            fetchData();
        }
    }, [fetchData]);

    const handleSaveViolation = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await kesantrianService.recordViolation({
                studentId: violationForm.studentId,
                type: violationForm.category,
                description: violationForm.notes,
                points: violationForm.points,
                reportedBy: user.id
            });

            setSuccessMessage('Pelanggaran berhasil dicatat!');
            setShowSuccess(true);
            setShowViolationModal(false);
            setViolationForm({ studentId: '', category: 'ringan', points: 0, notes: '' });
            fetchData(); // Refresh data
        } catch (err) {
            console.error('Failed to save violation:', err);
        } finally {
            setIsSaving(false);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    const handlePermissionAction = async (id: string, action: 'approved' | 'rejected') => {
        if (!user) return;
        setProcessingId(id);
        try {
            await kesantrianService.updatePermissionStatus(id, action, user.id);
            setPermissions(prev => prev.map(p =>
                p.id === id ? { ...p, status: action } : p
            ));
            setSuccessMessage(action === 'approved' ? 'Izin disetujui!' : 'Izin ditolak!');
            setShowSuccess(true);
            fetchData(); // Refresh stats
        } catch (err) {
            console.error('Failed to handle permission:', err);
        } finally {
            setProcessingId(null);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    const pendingPermissions = permissions.filter(p => p.status === 'pending');

    return (
        <div>
            {/* Welcome Banner - Modern Gradient & High Contrast */}
            <div className="bg-gradient-to-br from-rose-950 via-red-900 to-orange-950 rounded-[2.5rem] p-8 lg:p-12 text-white mb-8 shadow-2xl overflow-hidden relative border border-rose-500/20 group">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full -mr-20 -mt-20 blur-3xl mix-blend-overlay" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-500/10 rounded-full -ml-20 -mb-20 blur-3xl mix-blend-overlay" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shadow-inner backdrop-blur-sm">
                                <Shield className="w-8 h-8 text-rose-300" />
                            </div>
                            <div>
                                <h2 className="text-3xl lg:text-4xl font-black tracking-tight leading-none drop-shadow-lg">
                                    Portal <span className="text-rose-300">Kesantrian</span>
                                </h2>
                                <p className="text-rose-200/90 text-sm font-bold uppercase tracking-widest mt-1.5 shadow-black/10">Discipline & Monitoring</p>
                            </div>
                        </div>
                        <p className="text-rose-50/90 text-lg font-medium max-w-xl leading-relaxed drop-shadow-md">
                            Monitoring kedisiplinan dan perizinan santri terpadu secara real-time.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowViolationModal(true)}
                        className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-full font-black shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
                        <Plus className="w-5 h-5 relative z-10" />
                        <span className="uppercase tracking-widest text-sm relative z-10">Catat Pelanggaran</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats - Mobile 2 Columns */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                {[
                    { label: 'Pelanggaran', value: stats.totalViolations.toString(), icon: FileWarning, color: 'rose' },
                    { label: 'Pending Izin', value: stats.pendingPermissions.toString(), icon: Clock, color: 'orange' },
                    { label: 'Kamar Terisi', value: stats.dormOccupancy, icon: Home, color: 'amber' },
                    { label: 'Santri Izin', value: stats.studentsOut.toString(), icon: UsersIcon, color: 'blue' },
                ].map((stat, i) => (
                    <div key={i} className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-${stat.color}-200`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            {/* <TrendingUp className="w-4 h-4 text-emerald-500" /> */}
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight">{stat.value}</h3>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 truncate">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Top Row: Violation Trend (Wide) */}
            <div className="mb-8">
                <ChartCard
                    title="Tren Kedisiplinan Bulan Ini"
                    subtitle="Statistik jumlah pelanggaran per minggu"
                    className="!p-6 h-80"
                >
                    <ViolationTrendChart data={violationTrend} height="100%" />
                </ChartCard>
            </div>

            {/* Middle Row: Radar + Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <ChartCard
                    title="Peta Masalah Santri"
                    subtitle="Distribusi jenis pelanggaran yang sering terjadi"
                    className="h-96"
                >
                    <ViolationRadarChart data={violationRadar} height="100%" />
                </ChartCard>

                <ChartCard
                    title="Alasan Izin Keluar"
                    subtitle="Kategori alasan izin santri keluar lingkungan pesantren"
                    className="h-96"
                >
                    <PermissionStatsChart data={permissionStats} height="100%" />
                </ChartCard>
            </div>

            {/* Bottom Row: Recent Permissions */}
            <div className="space-y-4 mt-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-orange-500" />
                        Permohonan Terbaru
                    </h3>
                    <button onClick={() => router.push('/dashboard/kesantrian/perizinan')} className="text-sm text-orange-600 font-semibold hover:underline">
                        Lihat Semua
                    </button>
                </div>

                {pendingPermissions.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-2">Semua Izin Telah Diproses</h4>
                        <p className="text-gray-500 text-sm">Tidak ada permohonan izin yang menunggu persetujuan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {pendingPermissions.map(request => (
                            <div key={request.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-gray-50 bg-gray-50/30">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center font-bold text-orange-700">
                                                {request.studentName.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 leading-none mb-1">{request.studentName}</h4>
                                                <p className="text-xs text-gray-500 font-medium">Kelas {request.studentClass}</p>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                            Pending
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 flex-1 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Alasan</p>
                                            <p className="text-sm font-medium text-gray-700">{request.reason}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Masa Izin</p>
                                            <p className="text-sm font-medium text-gray-700">{request.startDate} - {request.endDate}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50/50 flex gap-3">
                                    <button
                                        onClick={() => handlePermissionAction(request.id, 'rejected')}
                                        className="flex-1 py-2.5 border border-red-200 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 transition-colors"
                                    >
                                        Tolak
                                    </button>
                                    <button
                                        onClick={() => handlePermissionAction(request.id, 'approved')}
                                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-emerald-200"
                                    >
                                        Setujui
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Top Violators Section */}
            <div className="mt-8">
                <ChartCard
                    title="Top Pelanggaran Santri"
                    subtitle="Daftar santri dengan poin akumulasi tertinggi. Perlu perhatian khusus."
                    className="!p-0 overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Nama Santri</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Kelas</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Total Poin</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {topViolators.map((v: Violator, index: number) => (
                                    <tr key={v.student_id} className="hover:bg-rose-50/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {index + 1}
                                                </div>
                                                <span className="font-bold text-gray-800">{v.student_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{v.class_name || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-rose-600 font-black">{v.total_points} Poin</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {v.total_points >= 50 ? (
                                                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">SP 1</span>
                                            ) : v.total_points >= 20 ? (
                                                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">Perhatian</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Aman</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {topViolators.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                                            Belum ada data pelanggaran yang tercatat.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>
            </div>

            {/* Violation Modal */}
            {showViolationModal && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Catat Pelanggaran</h3>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">Buku Hitam Digital</p>
                            </div>
                            <button onClick={() => setShowViolationModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Pilih Santri</label>
                                <select
                                    value={violationForm.studentId}
                                    onChange={(e) => setViolationForm({ ...violationForm, studentId: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                                >
                                    <option value="">Cari nama santri...</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.name} - Kelas {student.class?.name || 'N/A'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Jenis Pelanggaran</label>
                                <select
                                    value={violationForm.category}
                                    onChange={(e) => {
                                        const cat = e.target.value as 'ringan' | 'sedang' | 'berat';
                                        const points = cat === 'ringan' ? 5 : cat === 'sedang' ? 15 : 50;
                                        setViolationForm({
                                            ...violationForm,
                                            category: cat,
                                            points: points
                                        });
                                    }}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                                >
                                    <option value="">Pilih kategori...</option>
                                    <option value="ringan">Ringan (-5 poin)</option>
                                    <option value="sedang">Sedang (-15 poin)</option>
                                    <option value="berat">Berat (-50 poin)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Poin (Otomatis)</label>
                                    <input
                                        type="number"
                                        readOnly
                                        value={violationForm.points}
                                        className="w-full px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 font-bold focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tanggal</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-medium focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Catatan Musyrif</label>
                                <textarea
                                    rows={3}
                                    value={violationForm.notes}
                                    onChange={(e) => setViolationForm({ ...violationForm, notes: e.target.value })}
                                    placeholder="Ketikan kronologi singkat..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none font-medium"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
                            <button
                                onClick={() => setShowViolationModal(false)}
                                className="flex-1 py-3 text-gray-500 font-bold hover:text-gray-700 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveViolation}
                                disabled={!violationForm.studentId || !violationForm.category || isSaving}
                                className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? 'Menyimpan...' : 'Simpan Pelanggaran'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-gray-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-slide-up">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold tracking-wide">{successMessage}</span>
                </div>
            )}
        </div>
    );
}
