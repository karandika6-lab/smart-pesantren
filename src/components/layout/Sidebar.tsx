'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Menu, Bell, RefreshCw, ChevronDown, Sparkles } from 'lucide-react';
import {
    User,
    ROLE_NAMES,
    UserRole,
    getAvailableRoles,
    getEffectiveRole,
    switchRole,
    getRoleDisplayText
} from '@/lib/auth';
import {
    getNavigationForRole,
    isNavItemActive,
    getAccentClasses
} from '@/lib/navigation';
import NotificationBell from './NotificationBell';

// ============================================
// Types
// ============================================

interface SidebarProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

// ============================================
// Sidebar Component
// ============================================

export default function Sidebar({ user, isOpen, onClose, onLogout }: SidebarProps) {
    const pathname = usePathname();
    const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

    if (!user) return null;

    // Get effective role (active or primary)
    const effectiveRole = getEffectiveRole(user) || user.role;
    const availableRoles = getAvailableRoles(user);
    const hasMultipleRoles = availableRoles.length > 1;

    const navigation = getNavigationForRole(effectiveRole);
    const accentClasses = getAccentClasses(navigation.accentColor);

    const handleSwitchRole = (role: UserRole) => {
        setShowRoleSwitcher(false);
        switchRole(role);
    };

    return (
        <>
            <style jsx global>{`
                .sidebar-scrollbar::-webkit-scrollbar { width: 4px; }
                .sidebar-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .sidebar-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/40 backdrop-blur-2xl border-r border-white/5 transform transition-transform duration-500 ease-in-out lg:translate-x-0 flex flex-col shadow-[20px_0_40px_rgba(0,0,0,0.6)] overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="h-24 flex items-center gap-4 px-8 border-b border-neutral-900/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none group-hover:scale-150 transition-transform duration-[2000ms]">
                        <Sparkles className="w-20 h-20 text-indigo-500" />
                    </div>
                    <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(234,88,12,0.2)]">
                        { }
                        <Image src="/logo.png" alt="Logo" width={48} height={48} className="object-cover" />
                    </div>
                    <div className="overflow-hidden">
                        <h1 className="font-bold text-white text-lg leading-tight tracking-tight truncate uppercase">Smart <span className={`${accentClasses.text}`}>P</span></h1>
                        <p className={`text-[11px] font-medium opacity-60 ${accentClasses.text}`}>{navigation.subtitle}</p>
                    </div>
                </div>

                {/* Role Switcher */}
                {hasMultipleRoles && (
                    <div className="px-6 pt-6 mb-2">
                        <div className="relative">
                            <button
                                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                                className={`w-full flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border border-neutral-800 rounded-2xl hover:border-neutral-700 transition-all group ${showRoleSwitcher ? 'ring-2 ring-indigo-500/20' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                        <RefreshCw className={`w-4 h-4 text-indigo-500 transition-transform duration-700 ${showRoleSwitcher ? 'rotate-180' : ''}`} />
                                    </div>
                                    <span className="text-[12px] font-bold text-neutral-400 group-hover:text-white transition-colors">
                                        {ROLE_NAMES[effectiveRole]}
                                    </span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-neutral-600 transition-transform duration-300 ${showRoleSwitcher ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown */}
                            {showRoleSwitcher && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-[#0a0a0a] border border-neutral-800 rounded-[1.5rem] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="p-4 border-b border-neutral-900 bg-neutral-950/50">
                                        <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] font-black">
                                            Beralih Role Portal
                                        </p>
                                    </div>
                                    <div className="p-2">
                                        {availableRoles.map((role) => (
                                            <button
                                                key={role}
                                                onClick={() => handleSwitchRole(role)}
                                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[12px] font-semibold transition-all ${role === effectiveRole
                                                    ? 'bg-indigo-500/10 text-indigo-400'
                                                    : 'text-neutral-500 hover:text-white hover:bg-neutral-900'
                                                    }`}
                                            >
                                                {ROLE_NAMES[role]}
                                                {role === effectiveRole && (
                                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.8)]" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto sidebar-scrollbar p-6 space-y-2 mt-4">
                    {navigation.items.map((item) => {
                        const isActive = isNavItemActive(item, pathname);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative overflow-hidden ${isActive
                                    ? `bg-[#0a0a0a] border border-neutral-800 shadow-[0_10px_20px_rgba(0,0,0,0.2)]`
                                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50'
                                    }`}
                            >
                                {isActive && (
                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full group-active:h-8 transition-all duration-300 ${effectiveRole === 'santri' ? 'bg-indigo-500' : 'bg-orange-500'
                                        }`} />
                                )}
                                <item.icon className={`w-5 h-5 transition-all duration-300 ${isActive ? (effectiveRole === 'santri' ? 'text-indigo-400' : 'text-orange-400') : 'text-neutral-600 group-hover:scale-110'}`} />
                                <span className={`text-[13px] transition-all font-semibold ${isActive ? 'text-white' : 'font-medium'}`}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer - Profile & Logout */}
                <div className="p-6 border-t border-neutral-900 bg-[#070707]">
                    <div className="flex items-center gap-3 p-3 bg-neutral-950/50 rounded-2xl border border-neutral-900/50 mb-4">
                        <div className={`w-9 h-9 rounded-xl ${accentClasses.bg} flex items-center justify-center font-black text-xs border ${accentClasses.border}`}>
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[13px] font-bold text-white truncate">{user.name}</p>
                            <p className="text-[10px] text-neutral-600 font-medium">{ROLE_NAMES[effectiveRole]}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-4 px-5 py-4 text-neutral-600 hover:text-rose-500 hover:bg-rose-500/5 rounded-2xl transition-all group font-semibold text-[13px]"
                    >
                        <div className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center group-hover:bg-rose-500/10 transition-colors">
                            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        </div>
                        Keluar Akun
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-[#000]/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-500"
                    onClick={onClose}
                />
            )}
        </>
    );
}

// ============================================
// Header Component
// ============================================

interface HeaderProps {
    user: User;
    onMenuClick: () => void;
}

export function DashboardHeader({ user, onMenuClick }: HeaderProps) {
    if (!user) return null;

    const effectiveRole = getEffectiveRole(user) || user.role;
    const availableRoles = getAvailableRoles(user);
    const hasMultipleRoles = availableRoles.length > 1;

    const navigation = getNavigationForRole(effectiveRole);
    const accentClasses = getAccentClasses(navigation.accentColor);

    return (
        <header className="h-24 bg-black/20 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 sm:px-6 lg:px-10 sticky top-0 z-[100] group transition-all duration-500 w-full overflow-visible">
            <div className="flex items-center gap-6 lg:hidden">
                <button
                    onClick={onMenuClick}
                    className="p-3.5 bg-[#0a0a0a] hover:bg-neutral-900 rounded-2xl transition-all border border-neutral-800"
                >
                    <Menu className="w-5 h-5 text-neutral-400" />
                </button>
            </div>

            <div className="hidden lg:flex flex-col">
                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.4em] mb-1">System Portal Integrated</p>
                <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${effectiveRole === 'santri' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(234,88,12,0.5)]'
                        }`} />
                    <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Management Environment Active</h2>
                </div>
            </div>

            <div className="flex items-center gap-4 lg:gap-8 ml-auto">
                <NotificationBell user={user} />

                <div className="flex items-center gap-4 pl-8 border-l border-neutral-800/80 h-10 group/profile cursor-pointer">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-white leading-none mb-1.5 uppercase tracking-tighter group-hover/profile:text-indigo-400 transition-colors">{user.name}</p>
                        <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${accentClasses.text} opacity-60`}>
                            {hasMultipleRoles ? getRoleDisplayText(user) : ROLE_NAMES[user.role]}
                        </p>
                    </div>
                    <div className={`w-11 h-11 ${accentClasses.bg} rounded-[1.2rem] flex items-center justify-center border-2 border-neutral-800 shadow-2xl overflow-hidden group-hover/profile:border-indigo-500/50 transition-all duration-500`}>
                        <span className={`text-white font-black text-sm uppercase`}>{user.name.charAt(0)}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
