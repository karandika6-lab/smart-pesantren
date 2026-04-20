'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, User } from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { supabase } from '@/lib/supabase';
import { 
    Bell, 
    Calendar, 
    Clock, 
    CheckCircle2, 
    ChevronLeft, 
    Search,
    Filter,
    Loader2
} from 'lucide-react';

interface NotificationLog {
    id: string;
    title: string;
    body: string;
    type: string | null;
    is_read: boolean | null;
    created_at: string | null;
}

export default function NotificationHistoryPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = useCallback(async (userId: string) => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (e) {
            console.error('Failed to fetch notifications:', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_santri') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchNotifications(currentUser.id);
    }, [router, fetchNotifications]);

    const formatFullDate = (dateStr: string | null) => {
        if (!dateStr) return 'Baru Saja';
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const formatTimeOnly = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-400 font-sans">
            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={() => {}} />

            <div className="lg:pl-64 flex-1">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => router.back()}
                                className="p-3 bg-[#0a0a0a] border border-neutral-800 rounded-2xl text-neutral-500 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-tight uppercase">Riwayat <span className="text-orange-500">Notifikasi</span></h1>
                                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">Status Kehadiran & Akademik Ananda</p>
                            </div>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="space-y-6">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-8 h-8 text-orange-500 animate-spin opacity-40" />
                                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Memuat Riwayat...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="bg-[#0a0a0a] border border-neutral-800 rounded-[2rem] p-20 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
                                <div className="p-6 bg-neutral-900 rounded-3xl border border-white/5 opacity-40">
                                    <Bell className="w-12 h-12 text-neutral-600" />
                                </div>
                                <p className="text-[11px] font-black uppercase tracking-widest text-neutral-600">Belum ada riwayat notifikasi untuk periode ini.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {notifications.map((notif) => (
                                    <div 
                                        key={notif.id}
                                        className={`group relative p-6 rounded-[2rem] bg-[#0a0a0a] border transition-all duration-300 shadow-lg ${
                                            notif.is_read 
                                                ? 'border-neutral-800 hover:border-neutral-700' 
                                                : 'border-orange-500/30 bg-orange-500/[0.02]'
                                        }`}
                                    >
                                        <div className="flex items-start gap-5">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
                                                notif.type === 'absensi' 
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                                    : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                            }`}>
                                                {notif.type === 'absensi' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-4 mb-2">
                                                    <h3 className={`text-sm font-black uppercase tracking-tight truncate ${notif.is_read ? 'text-neutral-300' : 'text-white'}`}>
                                                        {notif.title}
                                                    </h3>
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <span className="text-[10px] font-bold text-white leading-none mb-1 uppercase opacity-40">
                                                            {formatTimeOnly(notif.created_at)}
                                                        </span>
                                                        <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">
                                                            {formatFullDate(notif.created_at).split(',')[0]}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                                                    {notif.body}
                                                </p>
                                                <div className="flex items-center gap-4 mt-6">
                                                    <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                                                        {notif.type || 'General'}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-neutral-700 uppercase tracking-widest">
                                                        {formatFullDate(notif.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
