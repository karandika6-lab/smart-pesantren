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
    MessageSquare,
    Phone,
    ArrowRight,
    UserCircle,
    Send
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
    const [classInfo, setClassInfo] = useState<any>(null);
    const [contacts, setContacts] = useState<ParentContact[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_kelas') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchInitialData(currentUser.id);
    }, [router]);

    const fetchInitialData = async (teacherId: string) => {
        try {
            setIsLoading(true);
            const cls = await homeroomService.getClassInfo(teacherId);
            if (!cls) {
                alert('Anda belum ditugaskan sebagai Wali Kelas.');
                router.replace('/dashboard/wali-kelas');
                return;
            }
            setClassInfo(cls);

            const studentData = await studentsService.getByClass(cls.id);
            setContacts(studentData.map(s => ({
                id: s.id,
                student: s.name,
                parent: (s as any).parent_name || 'Wali Santri',
                phone: (s as any).parent_phone || (s as any).phone || ''
            })));

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching contacts:', error);
            setIsLoading(false);
        }
    };

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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64 flex-1">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Hubungi Wali Santri</h1>
                        <p className="text-gray-500">Komunikasi langsung dengan orang tua/wali santri kelas 9A.</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-8">
                        <div className="relative w-full md:w-96">
                            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari santri atau wali..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-medium text-gray-900"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredData.map((contact) => (
                            <div key={contact.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-rose-200 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-12 -mt-12 group-hover:-mr-8 group-hover:-mt-8 transition-all" />

                                <div className="flex items-start gap-4 mb-6 relative z-10">
                                    <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                                        <UserCircle className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-800 leading-tight mb-1">{contact.parent}</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Wali dari {contact.student}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <button
                                        onClick={() => openWhatsApp(contact.phone, contact.student)}
                                        className="w-full flex items-center justify-between p-4 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all group/btn"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Send className="w-5 h-5" />
                                            <span className="font-bold text-sm">WhatsApp</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </button>

                                    <a
                                        href={`tel:${contact.phone}`}
                                        className="w-full flex items-center justify-between p-4 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-100 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-5 h-5" />
                                            <span className="font-bold text-sm">Panggil Telepon</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}

