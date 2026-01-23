'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    clearSession,
    User,
    ROLE_NAMES
} from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    User as UserIcon,
    Camera,
    Calendar,
    MapPin,
    Users,
    IdCard,
    Heart,
    Loader2,
    Activity,
    ShieldCheck,
    Contact,
    Smartphone,
    Mail,
    Globe,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import { guardianService } from '@/lib/services/guardian';

export default function ProfilAnakPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [children, setChildren] = useState<any[]>([]);
    const [activeChild, setActiveChild] = useState<any>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_santri') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchInitialData(currentUser.id);
    }, [router]);

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
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 space-y-10 max-w-[1200px] mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-orange-500 text-xs font-bold tracking-[0.2em] mb-2 uppercase">
                                <ShieldCheck className="w-4 h-4" />
                                Verified Student Profile
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                Profil & <span className="text-orange-500">Data Biodata</span>
                            </h1>
                            <p className="text-neutral-500 text-sm mt-2 font-medium">Informasi komprehensif data diri, akademik, dan keluarga santri.</p>
                        </div>

                        {children.length > 1 && (
                            <div className="flex bg-[#0a0a0a] p-1.5 rounded-2xl border border-neutral-800 shadow-xl overflow-x-auto no-scrollbar">
                                {children.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setActiveChild(c)}
                                        className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${activeChild?.id === c.id
                                            ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]'
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
                        <div className="bg-[#0a0a0a] border border-neutral-800/50 rounded-[3rem] p-24 text-center shadow-2xl">
                            <Users className="w-20 h-20 text-neutral-800 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-white px-2">Data Profile Tidak Ditemukan</h3>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Profile Hero Card */}
                            <div className="bg-[#0a0a0a] rounded-[3rem] border border-neutral-800/40 shadow-2xl overflow-hidden relative group">
                                <div className="h-48 bg-gradient-to-br from-orange-600 via-orange-950 to-black relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse"></div>
                                    <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-[2000ms]">
                                        <IdCard className="w-64 h-64 text-white" />
                                    </div>
                                </div>

                                <div className="px-6 md:px-16 pb-12 md:pb-16 relative">
                                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10 -mt-16 md:-mt-20">
                                        <div className="relative group/photo">
                                            <div className="w-40 h-40 md:w-48 md:h-48 rounded-[3rem] border-[10px] border-[#0a0a0a] bg-[#050505] overflow-hidden shadow-2xl relative">
                                                <img
                                                    src={activeChild.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChild.name)}&background=1a1a1a&color=f97316&size=512&bold=true&font-size=0.35`}
                                                    alt={activeChild.name}
                                                    className="w-full h-full object-cover grayscale-[0.2] group-hover/photo:grayscale-0 transition-all duration-500 scale-105 group-hover/photo:scale-110"
                                                />
                                            </div>
                                            <button className="absolute bottom-4 right-4 p-3.5 bg-white text-orange-600 rounded-2xl shadow-2xl border border-neutral-100 hover:scale-110 transition-all active:scale-95">
                                                <Camera className="w-5 h-5 flex-shrink-0" />
                                            </button>
                                        </div>

                                        <div className="flex-1 pb-4 text-center md:text-left">
                                            <div className="flex flex-col md:flex-row items-center md:items-center gap-4 mb-4 md:mb-3">
                                                <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none uppercase">{activeChild.name}</h2>
                                                <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${activeChild.status === 'aktif' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${activeChild.status === 'aktif' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-neutral-700'}`}></div>
                                                    {activeChild.status || 'Active'}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3">
                                                <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold font-mono">
                                                    <IdCard className="w-4 h-4 text-orange-500/50" />
                                                    NIS. {activeChild.nis || '2024.0001'}
                                                </div>
                                                <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                                                    <Users className="w-4 h-4 text-orange-500/50" />
                                                    {activeChild.classes?.name || 'Formal - XI A'}
                                                </div>
                                                <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                                                    <Globe className="w-4 h-4 text-orange-500/50" />
                                                    {activeChild.gender === 'L' ? 'Ikhwan' : 'Akhwat'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Stats / Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-20">
                                        {/* Left Column: Data Pribadi */}
                                        <div className="space-y-10">
                                            <div className="flex items-center gap-4 border-b border-neutral-800/50 pb-6">
                                                <div className="w-1.5 h-6 bg-orange-600 rounded-full"></div>
                                                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Data Identitas Pribadi</h3>
                                            </div>

                                            <div className="space-y-8">
                                                <div className="flex gap-6 group/item">
                                                    <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center shrink-0 group-hover/item:border-orange-500 transition-colors">
                                                        <Calendar className="w-6 h-6 text-neutral-600 group-hover/item:text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2">Tempat, Tanggal Lahir</p>
                                                        <p className="font-bold text-white text-base">
                                                            {activeChild.birth_place || 'Banjarmasin'}, {activeChild.birth_date ? new Date(activeChild.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '17 Agustus 2008'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-6 group/item">
                                                    <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center shrink-0 group-hover/item:border-orange-500 transition-colors">
                                                        <MapPin className="w-6 h-6 text-neutral-600 group-hover/item:text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2">Domisili / Alamat</p>
                                                        <p className="font-bold text-white text-base leading-relaxed">
                                                            {activeChild.address || 'Jl. Ahmad Yani No. 12, Kel. Pemurus Baru, Kec. Banjarmasin Selatan'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-6 group/item">
                                                    <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center shrink-0 group-hover/item:border-orange-500 transition-colors">
                                                        <Contact className="w-6 h-6 text-neutral-600 group-hover/item:text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2">Kontak Terdaftar</p>
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-8 gap-y-4 mt-3">
                                                            <div className="flex items-center gap-3 text-white font-bold text-sm bg-neutral-900/50 sm:bg-transparent p-3 sm:p-0 rounded-2xl border border-neutral-800/50 sm:border-none">
                                                                <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center sm:hidden">
                                                                    <Smartphone className="w-4 h-4 text-orange-500" />
                                                                </div>
                                                                <Smartphone className="w-3.5 h-3.5 text-neutral-700 hidden sm:block" />
                                                                +62 821 **** ****
                                                            </div>
                                                            <div className="flex items-center gap-3 text-white font-bold text-sm lowercase bg-neutral-900/50 sm:bg-transparent p-3 sm:p-0 rounded-2xl border border-neutral-800/50 sm:border-none">
                                                                <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center sm:hidden">
                                                                    <Mail className="w-4 h-4 text-orange-500" />
                                                                </div>
                                                                <Mail className="w-3.5 h-3.5 text-neutral-700 hidden sm:block" />
                                                                {activeChild.name?.split(' ')[0].toLowerCase() || 'santri'}@smart-p.id
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Data Wali */}
                                        <div className="space-y-10">
                                            <div className="flex items-center gap-4 border-b border-neutral-800/50 pb-6">
                                                <div className="w-1.5 h-6 bg-orange-600 rounded-full"></div>
                                                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Informasi Keluarga & Wali</h3>
                                            </div>

                                            <div className="space-y-8 bg-neutral-900/10 p-2 rounded-[2.5rem] border border-neutral-800/20 shadow-inner">
                                                <div className="p-5 md:p-6 bg-[#0c0c0c] border border-neutral-800/50 rounded-[2rem] flex items-center gap-4 md:gap-6 group/card hover:bg-[#111] transition-all">
                                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-neutral-900 rounded-2xl flex items-center justify-center text-neutral-700 group-hover/card:text-orange-500 transition-colors shrink-0">
                                                        <Users className="w-6 h-6 md:w-7 md:h-7" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1 md:mb-1.5">Nama Ayah Kandung</p>
                                                        <p className="font-bold text-white text-sm md:text-base truncate">{activeChild.father_name || 'H. Ahmad Syarifuddin'}</p>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-neutral-800 group-hover/card:translate-x-1 transition-transform shrink-0" />
                                                </div>

                                                <div className="p-5 md:p-6 bg-[#0c0c0c] border border-neutral-800/50 rounded-[2rem] flex items-center gap-4 md:gap-6 group/card hover:bg-[#111] transition-all">
                                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-neutral-900 rounded-2xl flex items-center justify-center text-neutral-700 group-hover/card:text-orange-500 transition-colors shrink-0">
                                                        <Users className="w-6 h-6 md:w-7 md:h-7" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1 md:mb-1.5">Nama Ibu Kandung</p>
                                                        <p className="font-bold text-white text-sm md:text-base truncate">{activeChild.mother_name || 'Hj. Siti Aminah'}</p>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-neutral-800 group-hover/card:translate-x-1 transition-transform shrink-0" />
                                                </div>

                                                <div className="p-5 md:p-6 bg-orange-500/5 border border-orange-500/10 rounded-[2rem] flex items-center gap-4 md:gap-6 group/card hover:bg-orange-500/10 transition-all">
                                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-[#0a0a0a] border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.1)] shrink-0">
                                                        <Heart className="w-6 h-6 md:w-7 md:h-7" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1 md:mb-1.5">Wali Penanggung Jawab</p>
                                                        <p className="font-bold text-white text-sm md:text-base uppercase tracking-tight truncate">{activeChild.guardian_name || 'Wali Santri Terdaftar'}</p>
                                                    </div>
                                                    <ArrowRight className="w-5 h-5 text-orange-950 group-hover/card:translate-x-1 transition-transform shrink-0" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Badge */}
                            <div className="flex items-center justify-center gap-3 opacity-40 py-4">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">Terdaftar Secara Resmi di Sistem Informasi Akademik Smart Pesantren</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
