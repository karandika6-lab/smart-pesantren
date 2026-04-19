'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/auth';

interface NotificationLog {
    id: string;
    title: string;
    message: string;
    type: string | null;
    is_read: boolean | null;
    created_at: string | null;
}

export default function NotificationBell({ user }: { user: User }) {
    const [notifications, setNotifications] = useState<NotificationLog[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Initial Fetch & Realtime Subscription
    useEffect(() => {
        if (!user || !user.id) return;

        const fetchNotifications = async () => {
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(20); // Get latest 20

                if (!error && data) {
                    setNotifications(data);
                    setUnreadCount(data.filter(n => !n.is_read).length);
                }
            } catch (err) {
                console.error("Error fetching notifications", err);
            }
        };

        fetchNotifications();

        // Subscribe to real-time changes
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
    }, [user]);

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

    const toggleOpen = () => {
        if (!isOpen) {
            // When opening, mark as read visually in background if you want, or require a click.
            // Let's do it manually via a button to preserve bold states.
        }
        setIsOpen(!isOpen);
    };

    const formatTime = (timeStr: string) => {
        const date = new Date(timeStr);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'});
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button 
                onClick={toggleOpen}
                className="p-3.5 bg-[#0a0a0a] hover:bg-neutral-900 rounded-2xl relative transition-all group border border-neutral-800 active:scale-90"
            >
                <Bell className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                
                {unreadCount > 0 && (
                    <>
                        <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-rose-600 rounded-full border-2 border-[#0a0a0a] animate-ping"></span>
                        <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-rose-600 rounded-full border-2 border-[#0a0a0a] flex flex-col items-center justify-center">
                        </span>
                    </>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="fixed top-[90px] right-4 sm:right-10 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] sm:max-h-[400px] bg-neutral-950 border border-neutral-700 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden flex flex-col z-[9999] animate-in slide-in-from-top-4 fade-in duration-200">
                    {/* Header */}
                    <div className="p-4 border-b border-neutral-900 flex items-center justify-between bg-neutral-950">
                        <div>
                            <h3 className="text-white text-sm font-bold tracking-tight">Log Notifikasi</h3>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{unreadCount} pesan belum dibaca</p>
                        </div>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-widest px-2 py-1 bg-indigo-500/10 rounded-lg transition-colors"
                            >
                                Tandai Dibaca
                            </button>
                        )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        {notifications.length === 0 ? (
                            <div className="p-8 flex flex-col items-center justify-center text-neutral-600">
                                <Bell className="w-8 h-8 opacity-20 mb-2" />
                                <p className="text-xs font-medium">Bebas dari notifikasi.</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {notifications.map(notif => (
                                    <div 
                                        key={notif.id} 
                                        className={`p-3 rounded-2xl border transition-all ${
                                            notif.is_read 
                                                ? 'bg-transparent border-transparent hover:bg-neutral-900' 
                                                : 'bg-indigo-500/5 border-indigo-500/10'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 p-1.5 rounded-lg shrink-0 ${notif.is_read ? 'bg-neutral-900 text-neutral-500' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className={`text-xs ${notif.is_read ? 'text-neutral-400 font-medium' : 'text-indigo-100 font-bold'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest mt-2">
                                                    {notif.created_at ? formatTime(notif.created_at) : 'Baru Saja'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
