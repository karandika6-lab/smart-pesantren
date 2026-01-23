'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, User } from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { sessionsService, AttendanceSession } from '@/lib/services/sessions';
import {
    Loader2,
    Plus,
    Edit2,
    Trash2,
    Clock,
    Tag,
    Save,
    X,
    CheckCircle2
} from 'lucide-react';

export default function SessionManagementPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentSession, setCurrentSession] = useState<Partial<AttendanceSession>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_absensi' && currentUser.role !== 'super_admin' && currentUser.role !== 'kesantrian')) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchSessions();
    }, [router]);

    const fetchSessions = async () => {
        setIsLoading(true);
        try {
            const data = await sessionsService.getAll();
            setSessions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (session: AttendanceSession) => {
        setCurrentSession(session);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleAdd = () => {
        setCurrentSession({
            name: '',
            category: 'academic',
            start_time: '07:00',
            is_active: true
        });
        setIsEditing(false);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah anda yakin ingin menghapus sesi ini?')) return;
        try {
            await sessionsService.delete(id);
            fetchSessions();
        } catch (error) {
            alert('Gagal menghapus sesi');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { getPesantrenId } = await import('@/lib/services/helpers');
            const pesantrenId = await getPesantrenId();

            const payload = { ...currentSession, pesantren_id: pesantrenId };

            if (isEditing && currentSession.id) {
                await sessionsService.update(currentSession.id, payload);
            } else {
                await sessionsService.create(payload);
            }
            setShowModal(false);
            fetchSessions();
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan sesi');
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) return null;

    const CATEGORY_COLORS = {
        academic: 'bg-blue-100 text-blue-700',
        prayer: 'bg-emerald-100 text-emerald-700',
        activity: 'bg-purple-100 text-purple-700',
        other: 'bg-gray-100 text-gray-700'
    };

    const CATEGORY_LABELS = {
        academic: 'Akademik / Sekolah',
        prayer: 'Ibadah / Jamaah',
        activity: 'Kegiatan Asrama',
        other: 'Lainnya'
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={() => router.replace('/login')}
            />

            <div className="lg:pl-64">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8 max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Manajemen Sesi Absensi</h1>
                            <p className="text-gray-500">Atur jadwal kegiatan sekolah, madin, dan jamaah.</p>
                        </div>
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-600/20"
                        >
                            <Plus className="w-5 h-5" />
                            Tambah Sesi Baru
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isLoading ? (
                            <div className="col-span-full flex justify-center py-12">
                                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">Belum ada sesi yang dibuat.</p>
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div key={session.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${CATEGORY_COLORS[session.category] || 'bg-gray-100'}`}>
                                            {session.category}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(session)}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-cyan-600"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(session.id)}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-800 mb-2">{session.name}</h3>

                                    <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                                        <Clock className="w-4 h-4" />
                                        <span>Mulai: {session.start_time?.slice(0, 5) || '--:--'}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </main>

                {/* Modal Form */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {isEditing ? 'Edit Sesi' : 'Tambah Sesi Baru'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nama Sesi</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Madin Ula, Subuh Berjamaah"
                                        value={currentSession.name || ''}
                                        onChange={e => setCurrentSession({ ...currentSession, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Kategori</label>
                                    <select
                                        value={currentSession.category || 'academic'}
                                        onChange={e => setCurrentSession({ ...currentSession, category: e.target.value as any })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                    >
                                        <option value="academic">Akademik (Sekolah/Madin)</option>
                                        <option value="prayer">Ibadah (Sholat/Jamaah)</option>
                                        <option value="activity">Kegiatan (Roan/Ekskul)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Jam Mulai</label>
                                    <input
                                        type="time"
                                        value={currentSession.start_time || ''}
                                        onChange={e => setCurrentSession({ ...currentSession, start_time: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-all flex items-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Simpan Sesi
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
