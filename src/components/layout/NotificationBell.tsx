'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/auth';

interface NotificationLog {
    id: string;
    title: string;
    body: string;
    type: string | null;
    is_read: boolean | null;
    created_at: string | null;
}

export default function NotificationBell({ user }: { user: User }) {
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationLog[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Initial Fetch & Realtime Subscription + FCM Registration
    useEffect(() => {
        if (!user || !user.id) return;

        console.log('>>> NOTIF SERVICE START <<<');

        const fetchNotifications = async () => {
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (!error && data) {
                    setNotifications(data);
                    setUnreadCount(data.filter(n => !n.is_read).length);
                }
            } catch (err) {
                console.error("Error fetching notifications", err);
            }
        };

        const setupFCM = async () => {
            try {
                const { Capacitor } = await import('@capacitor/core');
                if (Capacitor.getPlatform() === 'web') return;

                const { PushNotifications } = await import('@capacitor/push-notifications');
                
                let perm = await PushNotifications.checkPermissions();
                if (perm.receive !== 'granted') {
                    perm = await PushNotifications.requestPermissions();
                }

                if (perm.receive === 'granted') {
                    await PushNotifications.addListener('registration', async (token) => {
                        console.log('!!! PUSH TOKEN SUCCESS !!!', token.value);
                        try {
                            console.log('!!! REGISTERING TOKEN FOR USER ID:', user.id);
                            const apiUrl = Capacitor.getPlatform() === 'web' 
                                ? '/api/notifications/register' 
                                : 'https://smart-pesantren.vercel.app/api/notifications/register';

                            const response = await fetch(apiUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    userId: user.id,
                                    token: token.value,
                                    deviceInfo: Capacitor.getPlatform()
                                })
                            });

                            if (response.ok) {
                                console.log('Token saved to database successfully');
                            } else {
                                const errorData = await response.json();
                                console.error('Database Registration Failed:', JSON.stringify(errorData, null, 2));
                            }
                        } catch (saveErr) {
                            console.error('Failed to save token:', saveErr);
                        }
                    });
                    await PushNotifications.register();
                }
            } catch (fcmErr) {
                console.error('FCM Setup Error:', fcmErr);
            }
        };

        fetchNotifications();
        setupFCM();

        const subscription = supabase
            .channel(`notifications-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const newLog = payload.new as NotificationLog;
                    setNotifications((prev) => [newLog, ...prev]);
                    setUnreadCount((prev) => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user?.id]);

    const markAsRead = async (id: string) => {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);
            
            setNotifications(prev => prev.map(n => n.id === id ? {...n, is_read: true} : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error(e);
        }
    };

    const markAllAsRead = async () => {
        if (unreadCount === 0) return;
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .in('id', unreadIds);
            setNotifications(prev => prev.map(n => ({...n, is_read: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error(e);
        }
    };

    const formatTime = (timeStr: string) => {
        const date = new Date(timeStr);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 sm:p-3.5 bg-[#0a0a0a] hover:bg-neutral-900 rounded-xl sm:rounded-2xl transition-all border border-neutral-800/80 group active:scale-95"
            >
                <div className="relative">
                    <Bell className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${unreadCount > 0 ? 'text-orange-500 animate-bounce' : 'text-neutral-400 group-hover:text-white'}`} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#0a0a0a] shadow-lg animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </button>

            {/* Dropdown Card */}
            {isOpen && (
                <div className="fixed md:absolute top-[80px] md:top-full mt-4 left-4 right-4 md:left-auto md:right-[-10px] md:w-[400px] max-h-[75vh] bg-neutral-950 border border-neutral-800 shadow-[0_30px_70px_rgba(0,0,0,1)] rounded-[2.5rem] overflow-hidden flex flex-col z-[10000] animate-in slide-in-from-top-4 fade-in duration-250">
                    {/* Header */}
                    <div className="p-5 border-b border-neutral-900 flex items-center justify-between bg-neutral-950 px-6">
                        <div>
                            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Log Notifikasi</h3>
                            <p className="text-[9px] text-orange-500 font-bold uppercase tracking-widest mt-1.5">{unreadCount} Pesan Baru</p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="p-2.5 hover:bg-white/5 rounded-xl transition-all text-neutral-500 hover:text-orange-400"
                                title="Tandai semua dibaca"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto py-2 custom-scrollbar min-h-[180px] bg-neutral-950/30">
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                                    className={`px-6 py-4 border-b border-white/[0.03] transition-all cursor-pointer hover:bg-white/5 ${!notif.is_read ? 'bg-orange-500/5' : ''}`}
                                >
                                    <div className="flex gap-4">
                                        <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'bg-neutral-800'}`} />
                                        <div className="flex-1">
                                            <p className={`text-[12px] leading-tight mb-1.5 ${!notif.is_read ? 'text-white font-black' : 'text-neutral-500 font-medium'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-[11px] text-neutral-500 leading-relaxed font-medium mb-2 opacity-80">
                                                {notif.body}
                                            </p>
                                            <div className="flex items-center gap-2 text-[9px] font-black text-neutral-700 uppercase tracking-widest">
                                                <Clock className="w-3 h-3" />
                                                {notif.created_at ? formatTime(notif.created_at) : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-[200px] flex flex-col items-center justify-center p-10 text-center">
                                <div className="w-16 h-16 bg-neutral-900/50 rounded-[2rem] flex items-center justify-center mb-4 border border-neutral-800">
                                    <Bell className="w-8 h-8 text-neutral-800 opacity-30" />
                                </div>
                                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em]">Semua notifikasi telah dibaca.</p>
                            </div>
                        )}
                    </div>

                    {/* Action Footer */}
                    <div className="p-4 bg-neutral-950 border-t border-neutral-900 px-6 pb-6">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/dashboard/wali/notifikasi');
                            }}
                            className="w-full py-4 rounded-2xl bg-[#0a0a0a] hover:bg-orange-500/10 hover:text-orange-400 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 transition-all border border-neutral-800"
                        >
                            Lihat Semua Notifikasi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
