'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    clearSession,
    User,
} from '@/lib/auth';
import {
    Search,
    Phone,
    ArrowRight,
    UserCircle,
    Send,
    MessageSquare,
    Mail
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';

import { homeroomService } from '@/lib/services/homeroom';
import { studentsService } from '@/lib/services/students';

// ============================================
// Types
// ============================================

interface ParentContact {
    id: string;
    student: string;
    parent: string;
    phone: string;
}

export default function HubungiWaliPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Data state
    const [contacts, setContacts] = useState<ParentContact[]>([]);
    const [classInfo, setClassInfo] = useState<any>(null);

    const fetchInitialData = async (teacherId: string) => {
        try {

            const cls = await homeroomService.getClassInfo(teacherId);
            if (!cls) {
                alert('Anda belum ditugaskan sebagai Wali Kelas.');
                router.replace('/dashboard/wali-kelas');
                return;
            }
            setClassInfo(cls);


            const studentData = await studentsService.getByClass(cls.id);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setContacts(studentData.map((s: any) => ({
                id: s.id,
                student: s.name,
                parent: s.parent_name || 'Wali Santri',
                phone: s.parent_phone || s.phone || ''
            })));


        } catch (error) {
            console.error('Error fetching contacts:', error);

        }
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_kelas') {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchInitialData(currentUser.id);
        });
        return () => cancelAnimationFrame(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const openWhatsApp = (phone: string, student: string) => {
        if (!phone) {
            alert('Nomor telepon tidak tersedia.');
            return;
        }
        const message = encodeURIComponent(`Assalamu'alaikum Warahmatullahi Wabarakatuh. Saya ${user?.name}, wali kelas dari ${student} di Smart Pesantren...`);
        window.open(`https://wa.me/${phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
    };

    if (!user) return null;

    const filteredData = contacts.filter(item =>
        item.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.parent.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-transparent flex flex-col">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64 flex-1">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                        <div>
                            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-[0.2em] mb-3">
                                <MessageSquare className="w-4 h-4" />
                                Hubungi Wali
                            </div>
                            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight">
                                Chat <span className="text-rose-500 italic">Orang Tua</span>
                            </h1>
                            <p className="text-neutral-500 font-medium mt-2">
                                Komunikasi langsung dengan wali santri <span className="text-white font-bold">Kelas {classInfo?.name || '...'}</span>.
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="bg-[#0c0c0c]/60 backdrop-blur-xl p-5 rounded-2xl border border-neutral-800 shadow-2xl mb-10">
                        <div className="relative group w-full md:w-96">
                            <Search className="w-5 h-5 text-neutral-600 absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-rose-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari santri atau wali..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-16 pr-8 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:bg-black focus:border-rose-500 font-bold text-white transition-all placeholder:text-neutral-700"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredData.map((contact) => (
                            <div key={contact.id} className="bg-[#0c0c0c]/60 backdrop-blur-xl p-5 rounded-2xl border border-neutral-800 shadow-xl hover:bg-neutral-900 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-bl-full -mr-10 -mt-10 group-hover:-mr-8 group-hover:-mt-8 transition-all" />

                                <div className="flex items-start gap-4 mb-6 relative z-10">
                                    <div className="w-12 h-12 bg-gradient-to-br from-rose-600 to-rose-800 rounded-xl flex items-center justify-center border border-rose-500/30 shadow-lg shadow-rose-900/20">
                                        <span className="text-white font-black text-xl">{contact.student.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-white tracking-tight leading-none mb-2">{contact.student}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{contact.parent}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <button
                                        onClick={() => openWhatsApp(contact.phone, contact.student)}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 transition-all active:scale-95 group/btn"
                                    >
                                        <Phone className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                                        WhatsApp Wali
                                    </button>
                                    <button className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-black uppercase tracking-widest text-[9px] rounded-xl border border-neutral-800 transition-all flex items-center justify-center gap-3">
                                        <Mail className="w-4 h-4" />
                                        Kirim Pengumuman
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}

