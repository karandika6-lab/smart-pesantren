'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, User, clearSession } from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    Calendar,
    MapPin,
    Users,
    IdCard,
    Heart,
    Loader2,
    ShieldCheck,
    Smartphone,
    Mail,
    Globe,
    Shield,
} from 'lucide-react';
import { guardianService } from '@/lib/services/guardian';

export default function ProfilAnakPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [children, setChildren] = useState<any[]>([]);
    const [activeChild, setActiveChild] = useState<any>(null);

    const fetchInitialData = async (parentId: string) => {
        try {
            const childrenList = await guardianService.getChildren(parentId);
            setChildren(childrenList);
            if (childrenList.length > 0) {
                setActiveChild(childrenList[0]);
            }
            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching initial data:', err);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_santri') {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchInitialData(currentUser.id);
        });
        return () => cancelAnimationFrame(timer);
    }, [router]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (isLoading && !activeChild) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin opacity-40" />
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Memuat Portofolio Santri...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-400 font-sans selection:bg-orange-500/30">
            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8 space-y-8 max-w-[1200px] mx-auto">
                    {/* Header Section - Slimmer */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black tracking-[0.3em] mb-1 uppercase">
                                <ShieldCheck className="w-4 h-4" />
                                Student Profile Identity
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                                Profil & <span className="text-orange-500">Biodata Santri</span>
                            </h1>
                            <p className="text-neutral-500 text-xs mt-1 font-medium">Informasi pribadi dan data akademik yang terdaftar di sistem pusat.</p>
                        </div>

                        {children.length > 1 && (
                            <div className="flex bg-[#0a0a0a] p-1 rounded-xl border border-neutral-800 shadow-lg overflow-x-auto no-scrollbar">
                                {children.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setActiveChild(c)}
                                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${activeChild?.id === c.id
                                            ? 'bg-orange-600 text-white shadow-lg'
                                            : 'text-neutral-600 hover:text-neutral-300'
                                            }`}
                                    >
                                        {c.name.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {!activeChild ? (
                        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-3xl p-16 text-center">
                            <Users className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-white">Profile Tidak Ditemukan</h3>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Profile Hero Card - Slimmer Radii & Padding */}
                            <div className="bg-[#0a0a0a] rounded-3xl border border-neutral-800/40 shadow-xl overflow-hidden relative group h-fit">
                                <div className="h-32 bg-gradient-to-br from-orange-600 via-orange-950 to-black relative">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none">
                                        <IdCard className="w-48 h-48 text-white" />
                                    </div>
                                </div>

                                <div className="px-6 md:px-10 pb-10 relative">
                                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12">
                                        <div className="relative">
                                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-[#0a0a0a] bg-[#050505] overflow-hidden shadow-2xl">
                                                <Image
                                                    src={activeChild.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChild.name)}&background=1a1a1a&color=f97316&size=512&bold=true&font-size=0.35`}
                                                    width={160}
                                                    height={160}
                                                    unoptimized
                                                    alt={activeChild.name}
                                                    className="w-full h-full object-cover transition-all duration-500 scale-105"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex-1 pb-2 text-center md:text-left">
                                            <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                                                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase leading-none">{activeChild.name}</h2>
                                                <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border flex items-center gap-2 ${activeChild.status === 'aktif' || activeChild.status === 'active' ? 'bg-orange-500/5 text-orange-500 border-orange-500/20' : 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${activeChild.status === 'aktif' || activeChild.status === 'active' ? 'bg-orange-500 animate-pulse' : 'bg-neutral-700'}`}></div>
                                                    {activeChild.status === 'aktif' || activeChild.status === 'active' ? 'Verified' : activeChild.status}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2">
                                                <div className="flex items-center gap-2 text-neutral-500 text-[10px] font-bold">
                                                    <IdCard className="w-3.5 h-3.5 text-orange-500/50" />
                                                    NIS. {activeChild.nis || '-'}
                                                </div>
                                                <div className="flex items-center gap-2 text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                                                    <Users className="w-3.5 h-3.5 text-orange-500/50" />
                                                    {activeChild.classes?.name || activeChild.class?.name || 'Class N/A'}
                                                </div>
                                                <div className="flex items-center gap-2 text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                                                    <Globe className="w-3.5 h-3.5 text-orange-500/50" />
                                                    {activeChild.gender === 'L' ? 'Ikhwan' : 'Akhwat'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Sections - Two Columns */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-12">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
                                                <div className="w-1.5 h-4 bg-orange-600 rounded-full"></div>
                                                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Identitas Santri</h3>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-5 bg-neutral-950/40 border border-neutral-800/50 rounded-2xl">
                                                        <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1.5">Dormitory</p>
                                                        <p className="font-bold text-white text-xs whitespace-nowrap overflow-hidden text-ellipsis">{activeChild.dormitory?.name || 'Belum Ditentukan'}</p>
                                                    </div>
                                                    <div className="p-5 bg-neutral-950/40 border border-neutral-800/50 rounded-2xl">
                                                        <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1.5">Group Type</p>
                                                        <p className="font-bold text-white text-xs">Formal Education</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 group/item">
                                                    <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center shrink-0 group-hover/item:border-orange-500 transition-colors">
                                                        <Calendar className="w-5 h-5 text-neutral-600 group-hover/item:text-orange-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1">Tempat, Tanggal Lahir</p>
                                                        <p className="font-bold text-white text-sm">
                                                            {activeChild.birth_place || '-'}, {activeChild.birth_date ? new Date(activeChild.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4 group/item">
                                                    <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center shrink-0 group-hover/item:border-orange-500 transition-colors">
                                                        <MapPin className="w-5 h-5 text-neutral-600 group-hover/item:text-orange-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1">Alamat Tinggal Tetap</p>
                                                        <p className="font-bold text-white text-sm leading-relaxed">{activeChild.address || 'Alamat belum dilengkapi.'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
                                                <div className="w-1.5 h-4 bg-orange-600 rounded-full"></div>
                                                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Informasi Orang Tua / Wali</h3>
                                            </div>
                                            <div className="space-y-5">
                                                <div className="p-6 bg-[#0c0c0c] border border-neutral-800/50 rounded-2xl flex items-center gap-5 group/card hover:bg-neutral-900/50 transition-all">
                                                    <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center text-neutral-700 group-hover/card:text-orange-500 transition-colors">
                                                        <Shield className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1">Penanggung Jawab Utama</p>
                                                        <p className="font-bold text-white text-sm uppercase tracking-tight truncate">{activeChild.parent_name || 'Tidak ada data wali'}</p>
                                                    </div>
                                                </div>
                                                <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-center gap-5 group/card hover:bg-orange-500/10 transition-all">
                                                    <div className="w-12 h-12 bg-[#0a0a0a] border border-orange-500/20 rounded-xl flex items-center justify-center text-orange-500">
                                                        <Smartphone className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1">Nomor Telepon Darurat</p>
                                                        <p className="font-bold text-white text-sm truncate font-mono tracking-wider">{activeChild.parent_phone || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="p-5 bg-[#0c0c0c] border border-neutral-800/50 rounded-2xl flex items-center gap-10">
                                                    <div className="flex-1">
                                                        <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-2">Health Status</p>
                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                                            Normal Condition
                                                        </div>
                                                    </div>
                                                    <div className="w-px h-10 bg-neutral-800/50"></div>
                                                    <div className="flex-1">
                                                        <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-2">Academic Term</p>
                                                        <p className="text-white font-bold text-[10px] uppercase tracking-widest">2024 / 2025 Genap</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-2 opacity-30 py-4">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <p className="text-[8px] font-black uppercase tracking-[0.2em]">Verified Student Profile • Smart Pesantren Managed Academic System</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
