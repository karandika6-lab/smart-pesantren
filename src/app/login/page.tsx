'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    AlertCircle,
    Shield,
    GraduationCap,
    Home,
    Users,
    User,
    UserCheck,
    ChevronLeft,
    CheckCircle2,
    Wallet,
    ClipboardCheck,
    BookMarked,
    ArrowRight,
    Activity,
    Globe,
    Cpu,
    LucideIcon
} from 'lucide-react';
import {
    getRedirectRoute,
    cacheUser,
    UserRole
} from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const ROLE_DISPLAY: Record<UserRole, { label: string; icon: LucideIcon }> = {
    super_admin: { label: 'Admin', icon: Shield },
    admin_keuangan: { label: 'Keuangan', icon: Wallet },
    admin_akademik: { label: 'Akademik', icon: GraduationCap },
    kesantrian: { label: 'Kesantrian', icon: Home },
    admin_absensi: { label: 'Absensi', icon: ClipboardCheck },
    wali_kelas: { label: 'Wali Kelas', icon: Users },
    ustadz: { label: 'Guru/Ustadz', icon: BookMarked },
    wali_santri: { label: 'Wali Santri', icon: UserCheck },
    santri: { label: 'Santri', icon: User }
};

const ALL_ROLES = Object.keys(ROLE_DISPLAY) as UserRole[];

export default function LoginPage() {
    const router = useRouter();

    const [selectedRole, setSelectedRole] = useState<UserRole | null>('super_admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = requestAnimationFrame(() => {
            setIsMounted(true);
        });
        return () => cancelAnimationFrame(timer);
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!selectedRole) {
            setError('Silakan pilih portal terlebih dahulu');
            return;
        }
        setIsLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password,
            });

            if (authError) {
                setError(authError.message.includes('Invalid login credentials') ? 'Email atau password salah' : authError.message);
                setIsLoading(false);
                return;
            }

            if (authData.user) {
                let hasAccess = false;
                const userMeta = authData.user.user_metadata;
                const availableRoles = userMeta?.available_roles || [];

                if (availableRoles.includes(selectedRole)) {
                    hasAccess = true;
                }

                if (!hasAccess) {
                    try {
                        const { data: roleCheck, error: rpcError } = await supabase
                            .rpc('get_user_roles', { user_email: email.toLowerCase().trim() });
                        if (!rpcError && roleCheck) {
                            const userRoles = (roleCheck as { role: string }[]).map((r) => r.role) || [];
                            if (userRoles.includes(selectedRole) || userRoles.includes('super_admin')) {
                                hasAccess = true;
                            }
                        }
                    } catch { }
                }

                if (!hasAccess) {
                    const { data: userRoleData } = await supabase
                        .from('user_roles')
                        .select('role')
                        .eq('user_id', authData.user.id)
                        .eq('role', selectedRole)
                        .maybeSingle();
                    if (userRoleData) hasAccess = true;
                }

                if (!hasAccess) {
                    const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user.id).maybeSingle();
                    if (profile?.role === selectedRole || profile?.role === 'super_admin') hasAccess = true;
                }

                if (!hasAccess && (selectedRole === 'santri' || selectedRole === 'wali_santri')) {
                    const { data: studentData } = await supabase
                        .from('students')
                        .select('id, available_roles')
                        .eq('user_id', authData.user.id)
                        .single();
                    if (studentData) {
                        const studentRoles = studentData.available_roles || ['santri', 'wali_santri'];
                        if (studentRoles.includes(selectedRole)) hasAccess = true;
                    }
                }

                if (!hasAccess) {
                    await supabase.auth.signOut();
                    setError(`Akun Anda tidak memiliki akses ke portal ${ROLE_DISPLAY[selectedRole].label}`);
                    setIsLoading(false);
                    return;
                }

                const user = { id: authData.user.id, email: authData.user.email || email, name: authData.user.user_metadata?.name || email.split('@')[0], role: selectedRole };
                cacheUser(user);
                localStorage.setItem('activeRole', selectedRole);
                try { await supabase.rpc('handle_user_login', { p_role: selectedRole }); } catch { }
                router.push(getRedirectRoute(selectedRole));
            }
        } catch (err: unknown) {
            console.error('Login error:', err);
            setError('Terjadi masalah pada autentikasi. Silakan coba lagi.');
            setIsLoading(false);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="h-screen flex bg-transparent text-white overflow-hidden font-sans relative">
            {/* MAIN CONTENT SPLIT */}
            <div className="flex-1 flex flex-col lg:flex-row z-10 relative h-full">

                {/* LEFT SIDE - BRANDING Area (Desktop Only) */}
                <div className="hidden lg:flex flex-[1.4] flex-col p-10 xl:p-14 h-full relative overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute top-10 left-10 z-50"
                    >
                        <Link href="/" className="flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-all w-fit group">
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Beranda</span>
                        </Link>
                    </motion.div>

                    <div className="flex-1 flex flex-col h-full justify-center lg:pl-4">
                        {/* Visual Branding Section - Optimized Size */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1 }}
                            className="relative perspective-2000 flex items-center justify-start h-[160px] lg:h-[220px] mb-6 lg:mb-8"
                        >
                            <div className="absolute inset-0 bg-orange-600/10 rounded-full blur-[100px] animate-pulse"></div>

                            {/* Dynamic 3D Scene Mockup - Balanced Size */}
                            <div className="relative w-40 h-40 lg:w-48 lg:h-48 flex items-center justify-center transform-style-3d animate-float-slow">
                                <div className="relative w-40 h-40 lg:w-48 lg:h-48 transform-style-3d animate-auto-flip-3d">
                                    <div className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(234,88,12,0.3)] border border-white/10 bg-black/40 backdrop-blur-md">
                                        <Image src="/logo.png" alt="Logo" fill className="object-cover p-3" />
                                    </div>
                                    <div className="absolute -inset-8 border border-orange-500/10 rounded-full rotate-x-45 animate-spin-slow"></div>

                                    {[
                                        { icon: Shield, pos: '-top-6 -left-6', color: 'bg-orange-500' },
                                        { icon: Globe, pos: 'top-6 -right-12', color: 'bg-blue-500' },
                                        { icon: Cpu, pos: '-bottom-8 -right-4', color: 'bg-emerald-500' },
                                        { icon: GraduationCap, pos: '-bottom-4 -left-10', color: 'bg-purple-500' },
                                    ].map((node, i) => (
                                        <div key={i} className={`absolute ${node.pos} glass p-2.5 rounded-xl border border-white/10 shadow-2xl animate-float z-30`}>
                                            <node.icon className={`w-4 h-4 ${node.color.replace('bg-', 'text-')}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Branding Text - Reduced Size based on feedback */}
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="space-y-3 lg:space-y-4"
                            >
                                <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[0.9] drop-shadow-[0_0_40px_rgba(249,115,22,0.4)]">
                                    SMART <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-amber-600">PESANTREN</span>
                                </h1>
                                <div className="flex items-center gap-4 lg:gap-5">
                                    <div className="h-[2px] w-8 lg:w-10 bg-orange-500/50"></div>
                                    <p className="text-[10px] lg:text-xs text-gray-400 font-bold uppercase tracking-[0.3em] leading-relaxed max-w-sm lg:max-w-md">
                                        Digital Ecosystem for Modern <br /> Islamic Education.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - SIDE PANEL LOGIN FORM */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full lg:w-[440px] xl:w-[460px] h-full relative flex flex-col z-20 bg-black/20 lg:bg-black/40 backdrop-blur-sm lg:backdrop-blur-3xl border-l border-white/5 shadow-[-30px_0_60px_rgba(0,0,0,0.5)] overflow-y-auto lg:overflow-hidden"
                >
                    <div className="flex-1 flex flex-col px-6 lg:px-8 xl:px-10 h-full justify-between py-6">
                        {/* Mobile Header */}
                        <div className="lg:hidden flex items-center justify-between py-4 mb-2">
                            <Link href="/" className="p-2 bg-white/5 rounded-xl border border-white/10 text-orange-500">
                                <ChevronLeft className="w-4 h-4" />
                            </Link>
                            <h1 className="text-lg font-black uppercase tracking-tighter">Smart <span className="text-orange-500">SP</span></h1>
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                            {/* LOGIN TITLE - Proportional Size */}
                            <div className="mb-2 text-center lg:text-left pt-1">
                                <div className="flex items-center gap-2 mb-1 lg:justify-start justify-center">
                                    <h2 className="text-2xl lg:text-3xl font-black tracking-tighter uppercase leading-none">LOGIN</h2>
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-orange-500/40 to-transparent rounded-full" />
                                </div>
                                <p className="text-neutral-500 text-[8px] font-black uppercase tracking-[0.4em] lg:ml-0.5">Sistem Manajemen Terpadu</p>
                            </div>

                            {/* ROLE SELECTOR GRID - Optimized Density */}
                            <div className="grid grid-cols-3 gap-1.5 mb-2 lg:mb-4">
                                {ALL_ROLES.map((role) => {
                                    const config = ROLE_DISPLAY[role];
                                    const Icon = config.icon;
                                    const isSelected = selectedRole === role;
                                    return (
                                        <motion.button
                                            key={role}
                                            whileHover={{ y: -1, scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedRole(role)}
                                            className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg border transition-all duration-300 ${isSelected
                                                ? 'bg-orange-500/10 border-orange-500/50 shadow-md'
                                                : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                                                }`}
                                        >
                                            <div className={`p-1.5 rounded-lg transition-all duration-300 ${isSelected ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white/5 text-neutral-600'}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className={`text-[7px] font-black uppercase tracking-widest text-center leading-tight transition-colors duration-300 ${isSelected ? 'text-white' : 'text-neutral-500'}`}>
                                                {config.label}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <div className="w-1 h-3 bg-orange-500 rounded-full" />
                                        <Mail className="w-3 h-3 text-orange-500/60" />
                                        Email Portal
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="email@pesantren.id"
                                        required
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg py-2 lg:py-2.5 px-3 text-xs lg:text-sm text-white focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.06] transition-all font-bold placeholder:text-neutral-700"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <div className="w-1 h-3 bg-orange-500 rounded-full" />
                                        <Lock className="w-3 h-3 text-orange-500/60" />
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 lg:py-3 px-4 text-xs lg:text-sm text-white focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.06] transition-all font-bold placeholder:text-neutral-700"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-orange-500 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                                        <div className="relative">
                                            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="sr-only peer" />
                                            <div className="w-4 h-4 border border-white/10 rounded bg-white/[0.03] peer-checked:bg-orange-600 peer-checked:border-orange-500 transition-all" />
                                            <div className="absolute inset-0 flex items-center justify-center text-white scale-0 peer-checked:scale-100 transition-transform"><CheckCircle2 className="w-2.5 h-2.5" /></div>
                                        </div>
                                        <span className="text-[8px] lg:text-[9px] font-black text-neutral-600 uppercase tracking-widest group-hover:text-neutral-400 transition-colors">Ingat Saya</span>
                                    </label>
                                    <Link href="#" className="text-[8px] lg:text-[9px] text-orange-500 font-black uppercase tracking-widest hover:text-orange-400 transition-colors hover:underline underline-offset-4">Lupa Password?</Link>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.01, y: -1 }}
                                    whileTap={{ scale: 0.99 }}
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full group pt-2 lg:pt-3"
                                >
                                    <div className="relative overflow-hidden rounded-xl p-[1px] bg-gradient-to-r from-orange-600 to-amber-600 shadow-lg shadow-orange-950/20">
                                        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 transition-all group-hover:scale-105" />
                                        <div className="relative bg-transparent py-3 flex items-center justify-center gap-2 text-white">
                                            <span className="font-black text-[10px] lg:text-[11px] uppercase tracking-[0.3em]">
                                                {isLoading ? 'Processing...' : 'Masuk Portal'}
                                            </span>
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                                        </div>
                                    </div>
                                </motion.button>
                            </form>
                        </div>

                        {/* Footer Copyright - Fixed */}
                        <div className="py-4 lg:py-6 text-center border-t border-white/5 flex-shrink-0 mt-4">
                            <p className="text-neutral-700 text-[8px] font-black tracking-[0.3em] uppercase">
                                &copy; 2026 Smart Pesantren Ecosystem
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
