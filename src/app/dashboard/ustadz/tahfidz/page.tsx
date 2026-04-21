'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearSession, User } from '@/lib/auth';
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

const GRADE_CONFIG: { value: 'A' | 'B' | 'C' | 'D' | 'E', label: string, color: string, active: string }[] = [
    { value: 'A', label: 'Mumtaz', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', active: 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20' },
    { value: 'B', label: 'Jayyid Jidda', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', active: 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' },
    { value: 'C', label: 'Jayyid', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', active: 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-500/20' },
    { value: 'D', label: 'Maqbul', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', active: 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-500/20' },
    { value: 'E', label: 'Dhaif', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', active: 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-500/20' },
];

export default function InputTahfidzPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
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

                <main className="p-3 sm:p-4 lg:p-10 space-y-6 lg:space-y-10 max-w-[1500px] mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 lg:mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                            <div>
                                <h1 className="text-xl sm:text-4xl font-black text-white uppercase tracking-tight leading-none">Input <span className="text-indigo-500">Tahfidz</span></h1>
                                <p className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">Sahkan setoran bin-nadzor & bil-ghoib</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left: Student List - Sticky Header/Bar on Mobile */}
                        <div className="lg:col-span-4 bg-[#0c0c0c] rounded-[2rem] border border-white/5 flex flex-col overflow-hidden h-fit lg:h-[calc(100vh-280px)] lg:sticky lg:top-8 shadow-2xl">
                            <div className="p-4 lg:p-6 border-b border-white/5 bg-black/40">
                                <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                    Pilih Santri
                                </h3>
                                <div className="relative group">
                                    <Search className="w-3.5 h-3.5 text-neutral-600 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Cari Nama / NIS..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-black border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-white transition-all placeholder:text-neutral-800"
                                    />
                                </div>
                            </div>
                            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto p-4 lg:p-6 no-scrollbar custom-scrollbar">
                                {isLoading && activePrograms.length === 0 ? (
                                    <div className="flex items-center gap-2 p-4 animate-pulse">
                                        <div className="w-8 h-8 rounded-full bg-neutral-900"></div>
                                        <div className="h-2 w-20 bg-neutral-900 rounded"></div>
                                    </div>
                                ) : filteredPrograms.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-20">
                                        <UserCircle className="w-8 h-8 mb-2" />
                                        <p className="text-[8px] font-black uppercase">Kosong</p>
                                    </div>
                                ) : (
                                    filteredPrograms.map(p => {
                                        const isActive = selectedProgram?.id === p.id;
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => handleSelectProgram(p)}
                                                className={`flex-none lg:w-full flex items-center gap-3 p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all border shrink-0 ${isActive 
                                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                                                    : 'bg-black/40 border-white/5 text-neutral-500 hover:text-white hover:border-white/10 active:scale-95'}`}
                                            >
                                                <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center font-black text-xs lg:text-sm shrink-0 ${isActive ? 'bg-white/20' : 'bg-neutral-900'}`}>
                                                    {p.student?.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-[80px] lg:min-w-0 text-left">
                                                    <h4 className="font-black text-[10px] lg:text-sm uppercase tracking-tight truncate leading-none">{p.student?.name.split(' ')[0]}</h4>
                                                    <p className={`text-[8px] font-bold uppercase tracking-widest mt-1.5 truncate ${isActive ? 'text-indigo-200' : 'text-neutral-700'}`}>
                                                        {p.hafalan_type?.name}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Right: Form Area */}
                        <div className="lg:col-span-8 space-y-6">
                            {selectedProgram ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {/* Selected Student Stats Card */}
                                    <div className="bg-[#0c0c0c] p-6 lg:p-10 rounded-[2rem] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
                                        <div className="absolute right-0 top-0 p-8 opacity-[0.02] pointer-events-none">
                                            <Award className="w-48 h-48 text-indigo-500" />
                                        </div>

                                        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                                            <div className="w-16 h-16 lg:w-24 lg:h-24 bg-indigo-500/10 rounded-[1.8rem] flex items-center justify-center border border-white/5 shrink-0 shadow-inner">
                                                <span className="text-2xl lg:text-4xl font-black text-indigo-500">{selectedProgram.student?.name.charAt(0)}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-xl lg:text-3xl font-black text-white tracking-tight leading-none uppercase truncate">{selectedProgram.student?.name}</h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                        {selectedProgram.hafalan_type?.name}
                                                    </span>
                                                    <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest border-l border-white/10 pl-2">Kelas {selectedProgram.student?.classes?.name || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedProgram(null)}
                                            className="w-full sm:w-12 h-12 flex items-center justify-center bg-black/40 text-neutral-700 rounded-2xl hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-white/5 active:scale-90"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Main Form */}
                                    <div className="bg-[#0c0c0c] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                                        <div className="p-6 lg:p-12 space-y-10 text-white">
                                            {showSuccess && (
                                                <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 text-emerald-500 animate-in zoom-in-95 duration-200">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Data Setoran Berhasil Disahkan!</span>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
                                                {/* Left: Program Details */}
                                                <div className="space-y-8">
                                                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                                        <div className="w-4 h-[2px] bg-indigo-500"></div>
                                                        Progres Unit
                                                    </h4>
                                                    <div className="space-y-6">
                                                        <div className="space-y-3">
                                                            <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest px-1">Nomor Capaian</label>
                                                            <div className="relative group">
                                                                <input
                                                                    type="number"
                                                                    value={form.unit_number}
                                                                    onChange={e => setForm({ ...form, unit_number: parseInt(e.target.value) })}
                                                                    className="w-full px-6 py-4 bg-black border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-2xl font-black text-white transition-all shadow-inner"
                                                                />
                                                            </div>
                                                            <p className="text-[8px] font-black text-neutral-800 uppercase tracking-widest px-1">
                                                                Saran: Level {programProgress.length + 1}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest px-1">Nama Capaian / Maqro</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Juz 30 / Qur'an..."
                                                                value={form.unit_name}
                                                                onChange={e => setForm({ ...form, unit_name: e.target.value })}
                                                                className="w-full px-6 py-4 bg-black border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-black text-xs uppercase tracking-widest text-white transition-all placeholder:text-neutral-900 shadow-inner"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Grade & Percentage */}
                                                <div className="space-y-8">
                                                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                                        <div className="w-4 h-[2px] bg-amber-500"></div>
                                                        Penilaian (Itqan)
                                                    </h4>
                                                    <div className="grid grid-cols-5 gap-2 lg:gap-3">
                                                        {GRADE_CONFIG.map(g => (
                                                            <button
                                                                key={g.value}
                                                                onClick={() => setForm({ ...form, grade: g.value })}
                                                                className={`h-16 lg:h-20 flex flex-col items-center justify-center rounded-xl lg:rounded-2xl border transition-all active:scale-95 ${form.grade === g.value 
                                                                    ? 'bg-amber-600 border-amber-500 text-white shadow-xl shadow-amber-500/20' 
                                                                    : 'bg-black/40 border-white/5 text-neutral-700 hover:text-white'}`}
                                                            >
                                                                <span className="text-xl lg:text-2xl font-black">{g.value}</span>
                                                                <span className="text-[7px] lg:text-[8px] font-black uppercase mt-1 tracking-tighter opacity-70">{g.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="pt-4 space-y-4">
                                                        <div className="flex justify-between items-end mb-1 px-1">
                                                            <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest italic">Capaian %</label>
                                                            <span className="text-xl font-black text-amber-500 underline underline-offset-8 decoration-amber-500/20 font-mono tracking-tighter">{form.progress_percentage}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0" max="100" step="10"
                                                            value={form.progress_percentage}
                                                            onChange={e => setForm({ ...form, progress_percentage: parseInt(e.target.value) })}
                                                            className="w-full h-1.5 bg-neutral-900 rounded-full appearance-none cursor-pointer accent-amber-500 border border-white/5"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Bottom: Notes */}
                                                <div className="md:col-span-2 space-y-4">
                                                    <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest flex items-center gap-2 px-1">
                                                        <MessageSquare className="w-3.5 h-3.5 opacity-40" /> Catatan Evaluasi
                                                    </label>
                                                    <textarea
                                                        rows={2}
                                                        value={form.notes}
                                                        onChange={e => setForm({ ...form, notes: e.target.value })}
                                                        placeholder="Contoh: Perhatikan makharijul huruf pada surat Al-Baqarah..."
                                                        className="w-full px-6 py-4 bg-black border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-bold text-xs text-white transition-all resize-none placeholder:text-neutral-900 shadow-inner no-scrollbar font-sans"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving || !form.unit_name}
                                                className="w-full py-5 lg:py-6 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-4 text-xs lg:text-sm group mt-4"
                                            >
                                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                                                Sahkan Setoran Halaqah
                                            </button>
                                        </div>
                                    </div>

                                    {/* History Area */}
                                    <div className="bg-[#0c0c0c] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                                        <div className="p-6 lg:p-10 border-b border-white/5 bg-black/20">
                                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                                                <History className="w-4 h-4 text-indigo-500" />
                                                Riwayat Halaqah
                                            </h4>
                                        </div>
                                        <div className="p-4 lg:p-10 space-y-4">
                                            {programProgress.length === 0 ? (
                                                <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-[2rem]">
                                                    <p className="text-[10px] font-black text-neutral-800 uppercase tracking-widest">Belum ada riwayat setoran</p>
                                                </div>
                                            ) : (
                                                [...programProgress].reverse().slice(0, 5).map((p) => (
                                                    <div key={p.id} className="flex items-center justify-between p-5 lg:p-6 bg-black border border-white/5 rounded-2xl lg:rounded-3xl hover:border-indigo-500/30 transition-all group shadow-sm">
                                                        <div className="flex items-center gap-4 lg:gap-6">
                                                            <div className="w-10 h-10 lg:w-14 lg:h-14 bg-neutral-900 border border-white/5 rounded-xl lg:rounded-2xl flex items-center justify-center font-black text-xs lg:text-base text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                                                {p.unit_number}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-xs lg:text-base text-white uppercase tracking-tight leading-none mb-2">{p.unit_name}</p>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-900 rounded-md text-[8px] font-black uppercase tracking-widest text-neutral-600 border border-white/5">
                                                                        <Calendar className="w-2.5 h-2.5" />
                                                                        {new Date(p.evaluated_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                                    </div>
                                                                    {p.notes && <div className="text-[8px] font-bold text-neutral-800 uppercase tracking-widest truncate max-w-[100px] sm:max-w-xs">{p.notes}</div>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center font-black text-sm lg:text-lg border ${p.grade === 'A' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                            p.grade === 'B' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-neutral-900 text-neutral-700 border-white/5'
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
