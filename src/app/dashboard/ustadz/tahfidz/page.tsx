'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, User } from '@/lib/auth';
import {
    BookOpen,
    Search,
    Save,
    CheckCircle2,
    ChevronRight,
    Loader2,
    X,
    TrendingUp,
    History,
    MessageSquare,
    Star,
    Award,
    Calendar,
    Activity,
    UserCircle
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { hafalanService, HafalanProgram, HafalanProgress } from '@/lib/services/hafalan';

const GRADE_CONFIG = [
    { value: 'A', label: 'Mumtaz', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', active: 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20' },
    { value: 'B', label: 'Jayyid Jidda', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', active: 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' },
    { value: 'C', label: 'Jayyid', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', active: 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-500/20' },
    { value: 'D', label: 'Maqbul', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', active: 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-500/20' },
    { value: 'E', label: 'Dhaif', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', active: 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-500/20' },
];

export default function InputTahfidzPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, _setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Data State
    const [activePrograms, setActivePrograms] = useState<HafalanProgram[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<HafalanProgram | null>(null);
    const [programProgress, setProgramProgress] = useState<HafalanProgress[]>([]);

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form State
    const [form, setForm] = useState({
        unit_number: 1,
        unit_name: '',
        progress_percentage: 100,
        grade: 'A' as 'A' | 'B' | 'C' | 'D' | 'E',
        notes: ''
    });

    const fetchPrograms = async () => {
        try {
            setIsLoading(true);
            const data = await hafalanService.getAllActivePrograms();
            setActivePrograms(data);
        } catch (error: unknown) {
            console.error('Error fetching programs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'ustadz') {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchPrograms();
        });
        return () => cancelAnimationFrame(timer);

    }, [router]);

    const handleSelectProgram = async (program: HafalanProgram) => {
        setSelectedProgram(program);
        setIsLoading(true);
        try {
            const progress = await hafalanService.getProgramProgress(program.id);
            setProgramProgress(progress);

            // Auto-fill next unit
            const lastUnit = progress.length > 0
                ? Math.max(...progress.map(p => p.unit_number))
                : 0;

            setForm({
                unit_number: lastUnit + 1,
                unit_name: `Halaqah Ke-${lastUnit + 1}`,
                progress_percentage: 100,
                grade: 'A',
                notes: ''
            });
        } catch (error) {
            console.error('Error fetching progress:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedProgram || !user) return;
        setIsSaving(true);
        try {
            await hafalanService.recordProgress({
                program_id: selectedProgram.id,
                student_id: selectedProgram.student_id,
                unit_number: form.unit_number,
                unit_name: form.unit_name,
                progress_percentage: form.progress_percentage,
                grade: form.grade,
                notes: form.notes,
                evaluated_by: user.id
            });

            setShowSuccess(true);
            // Refresh progress
            const updatedProgress = await hafalanService.getProgramProgress(selectedProgram.id);
            setProgramProgress(updatedProgress);

            setTimeout(() => {
                setShowSuccess(false);
                setForm(prev => ({
                    ...prev,
                    unit_number: prev.unit_number + 1,
                    unit_name: `Halaqah Ke-${prev.unit_number + 1}`,
                    notes: ''
                }));
            }, 2000);
        } catch (error) {
            console.error('Error saving progress:', error);
            alert('Gagal menyimpan data.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const filteredPrograms = activePrograms.filter(p =>
        p.student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.student?.nis?.includes(searchQuery) ||
        p.hafalan_type?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-300 font-sans selection:bg-indigo-500/30">

            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-[0.2em] mb-2 uppercase">
                                <Activity className="w-4 h-4" />
                                Halaqah Tahfidz
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                Input <span className="text-indigo-500">Setoran Hafalan</span>
                            </h1>
                            <p className="text-neutral-500 text-sm mt-2 font-medium">Catat progres hafalan santri binaan secara real-time.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left: Student List */}
                        <div className="lg:col-span-4 bg-[#0a0a0a] rounded-3xl border border-neutral-800/50 flex flex-col overflow-hidden h-[calc(100vh-280px)]">
                            <div className="p-5 border-b border-neutral-800/50 bg-[#0c0c0c]">
                                <div className="relative group">
                                    <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama santri..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold text-white transition-all placeholder:text-neutral-600"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                {isLoading && activePrograms.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-4">
                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin opacity-40" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Menyeleraskan...</p>
                                    </div>
                                ) : filteredPrograms.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full opacity-40 px-10 text-center">
                                        <UserCircle className="w-12 h-12 text-neutral-700 mb-4" />
                                        <p className="text-xs font-bold text-neutral-500">Tidak ada santri ditemukan.</p>
                                    </div>
                                ) : (
                                    filteredPrograms.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleSelectProgram(p)}
                                            className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all text-left relative overflow-hidden group ${selectedProgram?.id === p.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-neutral-800 active:scale-[0.98]'}`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 font-bold">
                                                {p.student?.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm truncate leading-tight uppercase tracking-tight">{p.student?.name}</h4>
                                                <p className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${selectedProgram?.id === p.id ? 'text-indigo-200' : 'text-neutral-500'}`}>
                                                    {p.hafalan_type?.name}
                                                </p>
                                            </div>
                                            <ChevronRight className={`w-4 h-4 transition-transform ${selectedProgram?.id === p.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right: Form Area */}
                        <div className="lg:col-span-8 space-y-6">
                            {selectedProgram ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {/* Selected Student Stats Card */}
                                    <div className="bg-[#0a0a0a] p-5 lg:p-6 rounded-3xl border border-neutral-800/50 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                                        <div className="absolute right-0 top-0 p-8 opacity-[0.03] pointer-events-none">
                                            <Award className="w-48 h-48 text-indigo-500" />
                                        </div>

                                        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                                            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-indigo-500/10 rounded-[1.8rem] flex items-center justify-center border border-indigo-500/20 shrink-0">
                                                <span className="text-2xl lg:text-3xl font-extrabold text-indigo-500">{selectedProgram.student?.name.charAt(0)}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight leading-tight uppercase">{selectedProgram.student?.name}</h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-bold uppercase">
                                                        {selectedProgram.hafalan_type?.name}
                                                    </span>
                                                    <span className="text-xs font-semibold text-neutral-500 italic">Kelas {selectedProgram.student?.classes?.name || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedProgram(null)}
                                            className="hidden md:flex w-10 h-10 items-center justify-center bg-neutral-900 text-neutral-600 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-neutral-800"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Main Form */}
                                    <div className="bg-[#0a0a0a] rounded-3xl border border-neutral-800/50 overflow-hidden shadow-2xl">
                                        <div className="p-6 lg:p-8 space-y-8 text-white">
                                            {showSuccess && (
                                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 text-emerald-500 animate-in zoom-in-95 duration-200">
                                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Berhasil Disimpan!</span>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                                                {/* Left: Program Details */}
                                                <div className="space-y-6">
                                                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                        <TrendingUp className="w-3.5 h-3.5" /> Progres Halaqah
                                                    </h4>
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Nomor Seri Capaian</label>
                                                            <input
                                                                type="number"
                                                                value={form.unit_number}
                                                                onChange={e => setForm({ ...form, unit_number: parseInt(e.target.value) })}
                                                                className="w-full px-6 py-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:border-indigo-500 text-xl font-bold text-white transition-all"
                                                            />
                                                            <p className="text-[9px] font-medium text-neutral-600 italic">
                                                                *Terakhir tercatat pada level {programProgress.length}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Keterangan Capaian</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Misal: Juz 30 / Al-Baqarah"
                                                                value={form.unit_name}
                                                                onChange={e => setForm({ ...form, unit_name: e.target.value })}
                                                                className="w-full px-6 py-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:border-indigo-500 font-bold text-white transition-all placeholder:text-neutral-700"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Grade & Percentage */}
                                                <div className="space-y-6">
                                                    <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                        <Star className="w-3.5 h-3.5" /> Penilaian (Itqan)
                                                    </h4>
                                                    <div className="grid grid-cols-5 gap-2">
                                                        {GRADE_CONFIG.map(g => (
                                                            <button
                                                                key={g.value}
                                                                onClick={() => setForm({ ...form, grade: g.value })}
                                                                className={`h-16 flex flex-col items-center justify-center rounded-xl border transition-all active:scale-95 ${form.grade === g.value ? g.active : g.color}`}
                                                            >
                                                                <span className="text-xl font-bold">{g.value}</span>
                                                                <span className="text-[7px] font-bold uppercase mt-1">{g.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="pt-4 space-y-4">
                                                        <div className="flex justify-between items-end mb-2 px-1">
                                                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Pencapaian (%)</label>
                                                            <span className="text-xl font-bold text-indigo-500">{form.progress_percentage}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0" max="100" step="10"
                                                            value={form.progress_percentage}
                                                            onChange={e => setForm({ ...form, progress_percentage: parseInt(e.target.value) })}
                                                            className="w-full h-2 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Bottom: Notes */}
                                                <div className="md:col-span-2 space-y-3">
                                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                                        <MessageSquare className="w-3.5 h-3.5" /> Catatan Evaluasi
                                                    </label>
                                                    <textarea
                                                        rows={2}
                                                        value={form.notes}
                                                        onChange={e => setForm({ ...form, notes: e.target.value })}
                                                        placeholder="Contoh: Perhatikan tajwid pada hukum nun mati, Mad Thabi'i sudah bagus..."
                                                        className="w-full px-6 py-3 bg-neutral-900 border border-neutral-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-sm text-white transition-all resize-none placeholder:text-neutral-700 font-sans"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving || !form.unit_name}
                                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/10 hover:bg-indigo-500 transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3 text-[10px] group"
                                            >
                                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                                                Sahkan Setoran Hari Ini
                                            </button>
                                        </div>
                                    </div>

                                    {/* History Area */}
                                    <div className="bg-[#0a0a0a] p-5 lg:p-6 rounded-3xl border border-neutral-800/50 text-white">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="text-xs font-bold text-white flex items-center gap-2">
                                                <History className="w-4 h-4 text-indigo-400" />
                                                Riwayat Setoran Terbaru
                                            </h4>
                                        </div>
                                        <div className="space-y-3">
                                            {programProgress.length === 0 ? (
                                                <div className="py-12 flex flex-col items-center justify-center border border-dashed border-neutral-800/50 rounded-3xl">
                                                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest italic">Belum ada riwayat</p>
                                                </div>
                                            ) : (
                                                [...programProgress].reverse().slice(0, 3).map((p) => (
                                                    <div key={p.id} className="flex items-center justify-between p-5 bg-neutral-900/30 border border-neutral-800/40 rounded-2xl group transition-all hover:border-neutral-700">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center font-bold text-neutral-500 text-xs text-indigo-400">
                                                                {p.unit_number}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-white uppercase tracking-tight">{p.unit_name}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Calendar className="w-3 h-3 text-neutral-600" />
                                                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                                                        {new Date(p.evaluated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${p.grade === 'A' ? 'bg-emerald-500/10 text-emerald-500' :
                                                            p.grade === 'B' ? 'bg-blue-500/10 text-blue-500' : 'bg-neutral-800 text-neutral-500'
                                                            }`}>
                                                            {p.grade}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full bg-[#0a0a0a] rounded-[2.5rem] border-2 border-dashed border-neutral-800/50 flex flex-col items-center justify-center p-12 lg:p-20 text-center">
                                    <div className="w-24 h-24 lg:w-32 lg:h-32 bg-indigo-500/5 rounded-full flex items-center justify-center mb-8 border border-white/5">
                                        <BookOpen className="w-10 h-10 lg:w-16 lg:h-16 text-indigo-500/20" />
                                    </div>
                                    <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 tracking-tight">Halaqah Mana Hari Ini?</h3>
                                    <p className="text-neutral-500 text-xs font-medium max-w-xs mx-auto leading-relaxed uppercase tracking-wider opacity-60">
                                        Pilih salah satu santri dari daftar di sebelah kiri untuk mulai mencatat progres setoran hafalan mereka.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #262626; }
            `}</style>
        </div>
    );
}
