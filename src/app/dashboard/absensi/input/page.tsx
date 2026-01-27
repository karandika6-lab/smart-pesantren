'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    clearSession,
    User
} from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { classesService, ClassWithRelations } from '@/lib/services/classes';
import { attendanceService, AttendanceItem } from '@/lib/services/attendance';
import { sessionsService, AttendanceSession } from '@/lib/services/sessions';
import {
    Loader2,
    Calendar,
    Save,
    CheckCircle2,
    Users,
    ChevronDown
} from 'lucide-react';

export default function InputAbsensiPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Selection State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [classes, setClasses] = useState<ClassWithRelations[]>([]);

    // Session State
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');

    // Attendance Data
    const [students, setStudents] = useState<AttendanceItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // UI Feedback
    const [showSuccess, setShowSuccess] = useState(false);

    const fetchClasses = useCallback(async () => {
        try {
            const data = await classesService.getAll();
            setClasses(data || []);
        } catch (err) {
            console.error('Failed to fetch classes', err);
        }
    }, []);

    const fetchSessions = useCallback(async () => {
        try {
            const data = await sessionsService.getAll();
            setSessions(data);
        } catch (err) {
            console.error('Failed to fetch sessions', err);
        }
    }, []);

    const fetchRoster = useCallback(async () => {
        if (!selectedClassId || !selectedDate) return;
        setIsLoading(true);
        try {
            // Find selected session details
            const selectedSession = sessions.find(s => s.id === selectedSessionId);
            const sessionName = selectedSession ? selectedSession.name : undefined;
            const sessionType = selectedSession ? selectedSession.category : 'class';

            const roster = await attendanceService.getClassAttendance(
                selectedClassId,
                selectedDate,
                sessionName,
                sessionType
            );

            const processedRoster = roster.map(s => {
                if (s.status) return s;
                if (selectedClassId === 'all') {
                    return { ...s, status: 'hadir' as const };
                } else {
                    return { ...s, status: null };
                }
            });

            setStudents(processedRoster);
        } catch (err) {
            console.error('Failed to fetch roster', err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedClassId, selectedDate, selectedSessionId, sessions]);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchClasses();
            fetchSessions();
        });
        return () => cancelAnimationFrame(timer);
    }, [router, fetchClasses, fetchSessions]);

    // Fetch roster when class, date, or session changes
    useEffect(() => {
        fetchRoster();
    }, [fetchRoster]);

    const handleStatusChange = (studentId: string, status: 'hadir' | 'izin' | 'sakit' | 'alpha' | 'telat') => {
        setStudents(prev => prev.map(s =>
            s.student_id === studentId ? { ...s, status } : s
        ));
    };

    const handleNotesChange = (studentId: string, notes: string) => {
        setStudents(prev => prev.map(s =>
            s.student_id === studentId ? { ...s, notes } : s
        ));
    };

    const handleSubmit = async () => {
        if (!user || students.length === 0) return;
        setIsSaving(true);
        try {
            // Find selected session details
            const selectedSession = sessions.find(s => s.id === selectedSessionId);
            const sessionName = selectedSession ? selectedSession.name : undefined;
            const sessionType = selectedSession ? selectedSession.category : 'class';

            await attendanceService.submitAttendance(
                selectedDate,
                students,
                user.id,
                sessionName,
                sessionType
            );
            setShowSuccess(true);
            // Refresh roster to reflect saved state immediately
            fetchRoster();
            setTimeout(() => setShowSuccess(false), 3000);
        } catch {
            alert('Gagal menyimpan absensi. Coba lagi.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    // Calculate Stats for Realtime UI
    const stats = {
        hadir: students.filter(s => s.status === 'hadir').length,
        sakit: students.filter(s => s.status === 'sakit').length,
        izin: students.filter(s => s.status === 'izin').length,
        alpha: students.filter(s => s.status === 'alpha').length,
        telat: students.filter(s => s.status === 'telat').length,
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20"> {/* pb-20 for floating button space */}
            <Sidebar
                user={user!}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64">
                <DashboardHeader user={user!} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8 max-w-4xl mx-auto">
                    {/* Header Controls */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <h1 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-cyan-600" />
                            Input Absensi Harian
                        </h1>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Tanggal</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 font-medium text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Pilih Kelas</label>
                                <div className="relative">
                                    <select
                                        value={selectedClassId}
                                        onChange={(e) => setSelectedClassId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 font-medium text-gray-700 appearance-none"
                                    >
                                        <option value="">-- Pilih Kelas --</option>
                                        <option value="all" className="font-bold text-cyan-700">-- Semua Santri --</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Sesi / Kegiatan</label>
                                <div className="relative">
                                    <select
                                        value={selectedSessionId}
                                        onChange={(e) => setSelectedSessionId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 font-medium text-gray-700 appearance-none"
                                    >
                                        <option value="">-- Pilih Sesi (Otomatis Deteksi Waktu) --</option>
                                        {sessions.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} ({s.start_time?.slice(0, 5) || '--:--'}) - {s.category}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Realtime Stats Bar */}
                        {students.length > 0 && (
                            <div className="flex items-center justify-between gap-2 mt-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="text-center flex-1 border-r border-gray-200">
                                    <p className="text-xs text-gray-400 font-bold uppercase">Hadir</p>
                                    <p className="text-lg font-bold text-emerald-600">{stats.hadir}</p>
                                </div>
                                <div className="text-center flex-1 border-r border-gray-200">
                                    <p className="text-xs text-gray-400 font-bold uppercase">Telat</p>
                                    <p className="text-lg font-bold text-amber-600">{stats.telat}</p>
                                </div>
                                <div className="text-center flex-1 border-r border-gray-200">
                                    <p className="text-xs text-gray-400 font-bold uppercase">Sakit</p>
                                    <p className="text-lg font-bold text-blue-600">{stats.sakit}</p>
                                </div>
                                <div className="text-center flex-1 border-r border-gray-200">
                                    <p className="text-xs text-gray-400 font-bold uppercase">Izin</p>
                                    <p className="text-lg font-bold text-orange-600">{stats.izin}</p>
                                </div>
                                <div className="text-center flex-1">
                                    <p className="text-xs text-gray-400 font-bold uppercase">Alpha</p>
                                    <p className="text-lg font-bold text-rose-600">{stats.alpha}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Student List */}
                    {isLoading ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
                        </div>
                    ) : !selectedClassId ? (
                        <div className="text-center py-12 text-gray-400">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Silakan pilih kelas terlebih dahulu</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            Kelas ini belum memiliki siswa.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {students.map((student) => (
                                <div key={student.student_id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md">
                                    {/* Student Info */}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm transition-colors ${student.status === 'hadir' ? 'bg-emerald-500' :
                                            student.status === 'sakit' ? 'bg-blue-500' :
                                                student.status === 'izin' ? 'bg-orange-500' :
                                                    student.status === 'telat' ? 'bg-amber-500' :
                                                        student.status === 'alpha' ? 'bg-rose-500' :
                                                            'bg-gray-300' // Default / Unset State
                                            }`}>
                                            {student.student_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{student.student_name}</h3>
                                            <p className="text-xs text-gray-500 font-medium">
                                                {student.class_name && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 mr-2">{student.class_name}</span>}
                                                NIS: {student.nis}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                                        {[
                                            { id: 'hadir', label: 'Hadir', color: 'emerald' },
                                            { id: 'telat', label: 'Telat', color: 'amber' },
                                            { id: 'sakit', label: 'Sakit', color: 'blue' },
                                            { id: 'izin', label: 'Izin', color: 'orange' },
                                            { id: 'alpha', label: 'Alpha', color: 'rose' },
                                        ].map((opt) => {
                                            const isActive = student.status === opt.id;
                                            const activeClasses = {
                                                emerald: 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500 ring-offset-1',
                                                amber: 'bg-amber-100 text-amber-700 ring-2 ring-amber-500 ring-offset-1',
                                                blue: 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 ring-offset-1',
                                                orange: 'bg-orange-100 text-orange-700 ring-2 ring-orange-500 ring-offset-1',
                                                rose: 'bg-rose-100 text-rose-700 ring-2 ring-rose-500 ring-offset-1',
                                            };

                                            return (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleStatusChange(student.student_id, opt.id as 'hadir' | 'izin' | 'sakit' | 'alpha' | 'telat')}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${isActive
                                                        ? activeClasses[opt.color as keyof typeof activeClasses]
                                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Notes Input */}
                                    <input
                                        type="text"
                                        placeholder="Catatan (Opsional)..."
                                        value={student.notes || ''}
                                        onChange={(e) => handleNotesChange(student.student_id, e.target.value)}
                                        className="md:w-48 bg-gray-50 border-none rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-cyan-500"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                {/* Floating Save Button */}
                <div className={`fixed bottom-6 right-6 lg:right-10 transition-transform duration-300 ${students.length > 0 ? 'translate-y-0' : 'translate-y-32'}`}>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-full shadow-xl hover:shadow-2xl transition-all active:scale-95 disabled:opacity-70 disabled:scale-100"
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {isSaving ? 'Menyimpan...' : 'Simpan Absensi'}
                    </button>
                </div>

                {/* Success Toast */}
                {showSuccess && (
                    <div className="fixed top-6 right-6 z-[100] bg-gray-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-slide-up">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="font-bold">Absensi Berhasil Disimpan!</span>
                    </div>
                )}
            </div>
        </div>
    );
}
