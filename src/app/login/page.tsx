'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
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
    Clock,
    Wallet,
    ClipboardCheck,
    BookMarked,
    ArrowRight,
    Activity,
    Globe,
    Cpu
} from 'lucide-react';
import {
    getRedirectRoute,
    cacheUser,
    UserRole
} from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import LoginHero3D from '@/components/login/LoginHero3D';

export default function LoginPage() {
    const router = useRouter();

    const ROLE_DISPLAY: Record<UserRole, { label: string; icon: any }> = {
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

    const [selectedRole, setSelectedRole] = useState<UserRole | null>('super_admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
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
                            const userRoles = roleCheck.map((r: any) => r.role) || [];
                            if (userRoles.includes(selectedRole) || userRoles.includes('super_admin')) {
                                hasAccess = true;
                            }
                        }
                    } catch (rpcErr) { }
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
                try { await supabase.rpc('handle_user_login', { p_role: selectedRole }); } catch (logErr) { }
                router.push(getRedirectRoute(selectedRole));
            }
        } catch (err: any) {
            setError('Terjadi masalah pada autentikasi. Silakan coba lagi.');
            setIsLoading(false);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="min-h-screen flex bg-[#050505] text-white lg:overflow-hidden font-sans relative">
            {/* Background 3D Hero - Orange Theme */}
            <LoginHero3D />

            {/* Overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-black/40 pointer-events-none z-[1]" />

            {/* MAIN CONTENT SPLIT */}
            <div className="flex-1 flex flex-col lg:flex-row z-10 relative">
                {/* LEFT SIDE - BRANDING Area (Fills space, hidden on mobile) */}
                <div className="hidden lg:flex flex-1 flex-col p-6 lg:p-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-8"
                    >
                        <Link href="/" className="flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-all w-fit group">
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-black uppercase tracking-widest">Beranda</span>
                        </Link>
                    </motion.div>

                    <div className="flex-1 flex flex-col justify-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="max-w-2xl space-y-6"
                        >
                            {/* Full Landing Page 3D Animation Scene (Scaled for Login) */}
                            <div className="relative perspective-2000 flex items-center justify-start min-h-[180px] mb-8 mt-16">
                                <div className="absolute inset-0 bg-orange-600/5 rounded-full blur-[80px] animate-pulse"></div>

                                {/* Dynamic 3D Scene */}
                                <div className="relative w-[300px] h-full flex items-center justify-center transform-style-3d animate-float-slow scale-75">
                                    {/* Central Core */}
                                    <div className="relative w-48 h-48 transform-style-3d animate-auto-flip-3d hover:rotate-y-180 transition-transform duration-[3000ms] ease-in-out">
                                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl shadow-[0_0_50px_rgba(234,88,12,0.4)] border border-white/20 transform-style-3d">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <BookOpen className="w-24 h-24 text-white animate-pulse" />
                                            </div>

                                            {/* Orbital Rings */}
                                            <div className="absolute -inset-8 border-2 border-orange-500/30 rounded-full rotate-x-45 animate-spin-slow"></div>
                                            <div className="absolute -inset-16 border border-indigo-500/20 rounded-full rotate-y-60 animate-spin-reverse"></div>
                                            <div className="absolute -inset-24 border border-white/10 rounded-full rotate-z-12 animate-spin-slow"></div>
                                        </div>
                                    </div>

                                    {/* Floating Tech Nodes */}
                                    {[
                                        { icon: Shield, pos: 'top-4 -left-12', z: 'translateZ(60px)', color: 'bg-orange-500' },
                                        { icon: Activity, pos: 'bottom-0 -right-10', z: 'translateZ(100px)', color: 'bg-emerald-500' },
                                        { icon: Globe, pos: 'top-10 -right-20', z: 'translateZ(-40px)', color: 'bg-blue-500' },
                                        { icon: Cpu, pos: '-bottom-10 left-10', z: 'translateZ(50px)', color: 'bg-indigo-500' },
                                    ].map((node, i) => (
                                        <div
                                            key={i}
                                            style={{ transform: node.z }}
                                            className={`absolute ${node.pos} glass p-4 rounded-[1.5rem] border border-white/10 shadow-2xl animate-float select-none pointer-events-none`}
                                        >
                                            <div className={`w-8 h-8 ${node.color}/20 rounded-xl flex items-center justify-center mb-2`}>
                                                <node.icon className={`w-4 h-4 ${node.color.replace('bg-', 'text-')}`} />
                                            </div>
                                            <div className="h-1 w-8 bg-neutral-800 rounded-full overflow-hidden">
                                                <div className={`h-full ${node.color} w-3/4 animate-pulse`}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 pt-0">
                                <h1 className="text-7xl font-black tracking-tighter leading-none drop-shadow-[0_0_40px_rgba(249,115,22,0.4)]">
                                    SMART <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-amber-600 animate-pulse-slow">PESANTREN</span>
                                </h1>
                                <p className="text-lg text-gray-400 font-medium leading-relaxed max-w-sm hidden lg:block border-l-2 border-orange-500/30 pl-6">
                                    Platform terintegrasi untuk pemantauan akademik, program hafalan terpadu, dan kedisiplinan santri.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* RIGHT SIDE - SIDE PANEL LOGIN FORM */}
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 30, stiffness: 100, duration: 0.8 }}
                    className="w-full lg:w-[480px] bg-black/20 lg:bg-black/40 backdrop-blur-2xl lg:backdrop-blur-3xl lg:border-l border-white/10 relative flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-20"
                >
                    <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 lg:py-4 flex flex-col justify-center min-h-screen lg:min-h-0 relative">
                        {/* Mobile Back Button (Top Left) */}
                        <div className="lg:hidden absolute top-6 left-6">
                            <Link href="/" className="flex items-center gap-1.5 text-orange-500/80 hover:text-orange-500 transition-colors group">
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Beranda</span>
                            </Link>
                        </div>

                        {/* Mobile Branding (Only visible on mobile) */}
                        <div className="lg:hidden mb-8 flex flex-col items-center">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(234,88,12,0.4)] mb-4"
                            >
                                <BookOpen className="w-8 h-8 text-white" />
                            </motion.div>
                            <h1 className="text-3xl font-black tracking-tighter uppercase">
                                Smart <span className="text-orange-500">Pesantren</span>
                            </h1>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="mb-4 text-center lg:text-left">
                                <h2 className="text-3xl font-black mb-1 tracking-tight uppercase">Login</h2>
                                <div className="h-1 w-12 bg-orange-500 rounded-full mb-3 mx-auto lg:mx-0" />
                                <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.25em]">Sistem Manajemen Terpadu</p>
                            </div>

                            {/* ROLE SELECTOR GRID */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {ALL_ROLES.map((role) => {
                                    const config = ROLE_DISPLAY[role];
                                    const Icon = config.icon;
                                    const isSelected = selectedRole === role;
                                    return (
                                        <motion.button
                                            key={role}
                                            whileHover={{ y: -3 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedRole(role)}
                                            className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition-all duration-500 ${isSelected
                                                ? 'bg-orange-500/10 border-orange-500/60 shadow-[0_0_30px_rgba(249,115,22,0.15)]'
                                                : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.06]'
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 transition-colors duration-500 ${isSelected ? 'text-orange-500' : 'text-gray-600'}`} />
                                            <span className={`text-[7px] font-black uppercase tracking-widest text-center leading-tight transition-colors duration-500 ${isSelected ? 'text-orange-400' : 'text-gray-600'}`}>
                                                {config.label}
                                            </span>
                                            {isSelected && (
                                                <motion.div layoutId="selection-ring" className="absolute inset-0 border-2 border-orange-500/40 rounded-xl pointer-events-none" />
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                                        >
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            <span className="flex-1 text-center">{error}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="relative group">
                                        <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-orange-500 group-focus-within:scale-110 transition-transform">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="email@pesantren.com"
                                            required
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition-all font-bold placeholder:text-gray-800"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Secure Password</label>
                                    <div className="relative group">
                                        <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-orange-500 group-focus-within:scale-110 transition-transform">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-xs text-white focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition-all font-bold placeholder:text-gray-800"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-orange-500 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-1">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="peer w-6 h-6 opacity-0 absolute cursor-pointer"
                                            />
                                            <div className="w-6 h-6 border-2 border-white/10 rounded-lg bg-white/[0.03] peer-checked:bg-orange-600 peer-checked:border-orange-600 transition-all flex items-center justify-center group-hover:border-white/20">
                                                <CheckCircle2 className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-300 transition-colors">Tetap Masuk</span>
                                    </label>
                                    <Link href="#" className="text-[10px] text-orange-500 font-black uppercase tracking-widest hover:text-orange-400 transition-colors underline-offset-4 hover:underline">Lupa Password?</Link>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full relative group overflow-hidden rounded-2xl shadow-xl shadow-orange-950/20"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 transition-all group-hover:scale-110" />
                                    <div className="relative py-3.5 flex items-center justify-center gap-2 text-white font-black text-[10px] uppercase tracking-[0.25em]">
                                        {isLoading ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                <span>Masuk Portal Sekarang</span>
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </div>
                                </motion.button>
                            </form>
                        </motion.div>
                    </div>

                    <div className="p-4 border-t border-white/5 text-center">
                        <p className="text-gray-500/40 text-[9px] font-medium tracking-[0.2em]">
                            &copy; 2026 <span className="text-gray-400/60 transition-colors hover:text-orange-500/50 cursor-default uppercase">Smart Pesantren Ecosystem</span> • All Rights Reserved
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
