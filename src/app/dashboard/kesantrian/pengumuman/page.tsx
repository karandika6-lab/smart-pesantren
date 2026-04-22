'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, User } from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    ArrowLeft,
    Bell,
    Plus,
    Search,
    Calendar,
    Loader2,
    Trash2,
    Megaphone,
    Users,
    Clock,
    AlertCircle,
    X
} from 'lucide-react';
import { announcementsService, Announcement } from '@/lib/services/announcements';

export default function PengumumanPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [targetRoles, setTargetRoles] = useState<string[]>(['wali_santri']);
    const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await announcementsService.getAll();
            setAnnouncements(data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchData();
    }, [router]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) return;

        try {
            setIsSaving(true);
            await announcementsService.create({
                title,
                content,
                targetRoles,
                priority
            });
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error creating announcement:', error);
            alert('Gagal membuat pengumuman');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Hapus pengumuman ini?')) {
            try {
                await announcementsService.delete(id);
                fetchData();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setTargetRoles(['wali_santri']);
        setPriority('normal');
    };

    if (!user) return null;

    const filteredAnnouncements = announcements.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#050505] flex">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={() => {}}
            />

            <div className="flex-1 lg:ml-64 min-w-0">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 max-w-[1700px] mx-auto">
                    {/* Header */}
                    <div className="mb-10">
                        <Link
                            href="/dashboard/kesantrian"
                            className="inline-flex items-center gap-2 text-xs font-black text-gray-500 hover:text-white mb-6 uppercase tracking-widest transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Dashboard Kesantrian
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-black text-white flex items-center gap-4 uppercase tracking-tighter">
                                    <span className="w-1.5 h-8 bg-amber-500 rounded-full"></span>
                                    Pusat <span className="text-amber-500">Pengumuman</span>
                                </h1>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                                    Broadcast Informasi & Notifikasi Push ke Seluruh User
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center justify-center gap-3 px-6 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] lg:text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Pesan Baru
                            </button>
                        </div>
                    </div>

                    {/* Search & Tool */}
                    <div className="mb-10">
                        <div className="relative group max-w-xl">
                            <Search className="w-5 h-5 text-gray-700 absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-amber-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari arsip pengumuman..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-[#0c0c0c] border border-white/5 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-white font-bold text-sm transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Content List */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <Loader2 className="w-10 h-10 text-amber-500 animate-spin opacity-20" />
                            <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Sinkronisasi Data...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredAnnouncements.map((a) => (
                                <div key={a.id} className="group relative bg-[#0b0b0b] border border-white/5 rounded-[2rem] p-8 flex flex-col hover:border-amber-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/5">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-3 font-black text-[9px] uppercase tracking-widest text-gray-600">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${
                                            a.priority === 'urgent' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                            a.priority === 'high' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                            'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                        }`}>
                                            {a.priority}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 group-hover:text-amber-500 transition-colors leading-tight">
                                        {a.title}
                                    </h3>
                                    
                                    <p className="text-gray-500 text-xs font-bold leading-relaxed line-clamp-3 mb-8 opacity-80">
                                        {a.content}
                                    </p>

                                    <div className="mt-auto pt-6 border-t border-white/[0.03] flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {a.target_roles?.map((role, i) => (
                                                <div key={i} className="w-7 h-7 bg-neutral-900 border border-black rounded-full flex items-center justify-center text-[8px] font-black text-gray-400 uppercase" title={role}>
                                                    {role.charAt(0)}
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(a.id)}
                                            className="p-3 bg-neutral-900 hover:bg-rose-500/20 text-gray-700 hover:text-rose-500 rounded-xl transition-all border border-white/5 shadow-lg active:scale-95"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {filteredAnnouncements.length === 0 && (
                                <div className="col-span-full py-32 flex flex-col items-center justify-center text-center opacity-40">
                                    <Megaphone className="w-16 h-16 text-gray-800 mb-6" />
                                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">Belum Ada Pengumuman</h2>
                                    <p className="text-[10px] font-bold text-gray-800 uppercase tracking-[0.2em] mt-2">Buat broadcast pertama Anda untuk menyapa Wali Santri</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Create Modal */}
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => !isSaving && setIsModalOpen(false)}></div>
                            
                            <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="p-10">
                                    <div className="flex items-center justify-between mb-10">
                                        <div>
                                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                                <Megaphone className="w-6 h-6 text-amber-500" />
                                                Broadcast <span className="text-amber-500">Baru</span>
                                            </h2>
                                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-2">Pesan ini akan dikirim ke notifikasi HP user</p>
                                        </div>
                                        <button 
                                            onClick={() => setIsModalOpen(false)}
                                            className="p-3 bg-neutral-900 hover:bg-neutral-800 text-gray-500 rounded-2xl transition-all"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleCreate} className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Judul Pengumuman</label>
                                            <input 
                                                required
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Contoh: Jadwal Libur Ramadhan 1445 H"
                                                className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Isi Pengumuman</label>
                                            <textarea 
                                                required
                                                rows={5}
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                placeholder="Tuliskan detail pengumuman lengkap di sini..."
                                                className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner resize-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Prioritas</label>
                                                <select 
                                                    value={priority}
                                                    onChange={(e: any) => setPriority(e.target.value)}
                                                    className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 appearance-none transition-all"
                                                >
                                                    <option value="normal">Normal</option>
                                                    <option value="high">Penting</option>
                                                    <option value="urgent">Mendesak (Flash Red)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target Role</label>
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {['wali_santri', 'santri', 'ustadz'].map(role => (
                                                        <button 
                                                            key={role}
                                                            type="button"
                                                            onClick={() => {
                                                                if (targetRoles.includes(role)) {
                                                                    setTargetRoles(targetRoles.filter(r => r !== role));
                                                                } else {
                                                                    setTargetRoles([...targetRoles, role]);
                                                                }
                                                            }}
                                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                                                targetRoles.includes(role) 
                                                                ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/20' 
                                                                : 'bg-black border-white/5 text-gray-600 hover:border-white/10'
                                                            }`}
                                                        >
                                                            {role.replace('_', ' ')}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6">
                                            <button 
                                                disabled={isSaving}
                                                className="w-full py-5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black text-xs uppercase tracking-[0.3em] rounded-2xl transition-all shadow-2xl shadow-amber-500/20 flex items-center justify-center gap-4 group"
                                            >
                                                {isSaving ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <>
                                                        Kirim Sekarang
                                                        <Megaphone className="w-5 h-5 group-hover:scale-125 transition-transform" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
