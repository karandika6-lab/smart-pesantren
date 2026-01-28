import {
    LayoutDashboard,
    Users,
    CalendarDays,
    CalendarCheck,
    BookOpen,
    Shield,
    Database,
    Activity,
    Settings,
    BookMarked,
    GraduationCap,
    Receipt,
    CreditCard,
    DollarSign,
    PieChart,
    Home,
    Clock,
    AlertTriangle,
    ClipboardList,
    ClipboardCheck,
    TrendingUp,
    FileEdit,
    Printer,
    FileText,
    MessageCircle,
    Calendar,
    Award,
    User,
    Wallet,
    LucideIcon
} from 'lucide-react';
import { UserRole } from './auth';

// ============================================
// Types
// ============================================

export interface NavItem {
    icon: LucideIcon;
    label: string;
    href: string;
    matchPaths?: string[]; // Additional paths that should mark this item as active
}

export interface RoleNavigation {
    title: string;
    subtitle: string;
    accentColor: string;
    bgColor: string;
    textColor: string;
    items: NavItem[];
}

// ============================================
// Navigation Configuration by Role
// ============================================

export const ROLE_NAVIGATION: Record<UserRole, RoleNavigation> = {
    super_admin: {
        title: 'Smart Pesantren',
        subtitle: 'Super Admin',
        accentColor: 'purple',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
            { icon: BookOpen, label: 'Pesantren Management', href: '/dashboard/admin/pesantren' },
            { icon: Users, label: 'User Management', href: '/dashboard/admin/users' },
            { icon: Shield, label: 'Roles & Permissions', href: '/dashboard/admin/roles' },
            { icon: Database, label: 'Database', href: '/dashboard/admin/database' },
            { icon: Activity, label: 'Activity Logs', href: '/dashboard/admin/logs' },
            { icon: Settings, label: 'Settings', href: '/dashboard/admin/settings' },
        ],
    },

    admin_akademik: {
        title: 'Smart Pesantren',
        subtitle: 'Portal Akademik',
        accentColor: 'blue',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/akademik' },
            { icon: CalendarDays, label: 'Tahun Ajaran', href: '/dashboard/akademik/tahun-ajaran' },
            {
                icon: Users,
                label: 'Manajemen Kelas',
                href: '/dashboard/akademik/kelas',
                matchPaths: ['/dashboard/akademik/kelas']
            },
            { icon: Calendar, label: 'Jadwal Pelajaran', href: '/dashboard/akademik/jadwal' },
            {
                icon: Users,
                label: 'Data Santri',
                href: '/dashboard/akademik/santri',
                matchPaths: ['/dashboard/akademik/santri']
            },
            { icon: BookMarked, label: 'Mata Pelajaran', href: '/dashboard/akademik/mapel' },
            { icon: GraduationCap, label: 'Data Guru', href: '/dashboard/akademik/guru' },
            { icon: Settings, label: 'Pengaturan Rapor', href: '/dashboard/akademik/rapor-settings' },
            { icon: BookOpen, label: 'Hafalan Types', href: '/dashboard/akademik/hafalan-types' },
        ],
    },

    admin_keuangan: {
        title: 'Smart Pesantren',
        subtitle: 'Portal Keuangan',
        accentColor: 'emerald',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/keuangan' },
            { icon: Receipt, label: 'Tagihan SPP', href: '/dashboard/keuangan/tagihan' },
            { icon: CreditCard, label: 'Pembayaran', href: '/dashboard/keuangan/pembayaran' },
            { icon: DollarSign, label: 'Pengeluaran', href: '/dashboard/keuangan/pengeluaran' },
            { icon: PieChart, label: 'Laporan', href: '/dashboard/keuangan/laporan' },
            { icon: Wallet, label: 'Tabungan Santri', href: '/dashboard/keuangan/tabungan' },
        ],
    },

    kesantrian: {
        title: 'Smart Pesantren',
        subtitle: 'Bagian Kesantrian',
        accentColor: 'orange',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/kesantrian' },
            { icon: Home, label: 'Data Asrama', href: '/dashboard/kesantrian/asrama' },
            { icon: Clock, label: 'Kelola Sesi', href: '/dashboard/absensi/sesi' },
            { icon: AlertTriangle, label: 'Pelanggaran', href: '/dashboard/kesantrian/pelanggaran' },
            { icon: Shield, label: 'Perizinan', href: '/dashboard/kesantrian/perizinan' },
            { icon: ClipboardList, label: 'Laporan', href: '/dashboard/kesantrian/laporan' },
        ],
    },

    admin_absensi: {
        title: 'Smart Pesantren',
        subtitle: 'Portal Absensi',
        accentColor: 'cyan',
        bgColor: 'bg-cyan-50',
        textColor: 'text-cyan-700',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/absensi' },
            { icon: ClipboardCheck, label: 'Input Absensi', href: '/dashboard/absensi/input' },
            { icon: Clock, label: 'Kelola Sesi', href: '/dashboard/absensi/sesi' },
            { icon: Users, label: 'Rekap Kelas', href: '/dashboard/absensi/rekap' },
            { icon: TrendingUp, label: 'Laporan', href: '/dashboard/absensi/laporan' },
        ],
    },

    wali_kelas: {
        title: 'Smart Pesantren',
        subtitle: 'Portal Wali Kelas',
        accentColor: 'pink',
        bgColor: 'bg-pink-50',
        textColor: 'text-pink-700',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/wali-kelas' },
            {
                icon: Users,
                label: 'Data Santri',
                href: '/dashboard/wali-kelas/santri',
                matchPaths: ['/dashboard/wali-kelas/santri']
            },
            {
                icon: FileEdit,
                label: 'Input Nilai',
                href: '/dashboard/wali-kelas/nilai',
                matchPaths: ['/dashboard/wali-kelas/nilai']
            },
            {
                icon: BookOpen,
                label: 'Input Hafalan',
                href: '/dashboard/wali-kelas/hafalan',
                matchPaths: ['/dashboard/wali-kelas/hafalan']
            },
            {
                icon: Printer,
                label: 'Cetak Rapor',
                href: '/dashboard/wali-kelas/rapor',
                matchPaths: ['/dashboard/wali-kelas/rapor']
            },
            {
                icon: CalendarCheck,
                label: 'Rekap Absensi',
                href: '/dashboard/wali-kelas/absensi',
                matchPaths: ['/dashboard/wali-kelas/absensi']
            },
            {
                icon: MessageCircle,
                label: 'Hubungi Wali',
                href: '/dashboard/wali-kelas/chat',
                matchPaths: ['/dashboard/wali-kelas/chat', '/dashboard/wali-kelas/kontak']
            },
        ],
    },

    ustadz: {
        title: 'Smart Pesantren',
        subtitle: 'Portal Ustadz',
        accentColor: 'violet',
        bgColor: 'bg-violet-50',
        textColor: 'text-violet-700',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/ustadz' },
            { icon: BookOpen, label: 'Input Tahfidz', href: '/dashboard/ustadz/tahfidz' },
            { icon: ClipboardCheck, label: 'Input Nilai', href: '/dashboard/ustadz/nilai' },
            { icon: Users, label: 'Santri Saya', href: '/dashboard/ustadz/santri' },
            { icon: CalendarDays, label: 'Jadwal Mengajar', href: '/dashboard/ustadz/jadwal' },
        ],
    },

    wali_santri: {
        title: 'Smart Pesantren',
        subtitle: 'Portal Wali Santri',
        accentColor: 'orange',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/wali' },
            { icon: Users, label: 'Profil Anak', href: '/dashboard/wali/profil' },
            { icon: ClipboardCheck, label: 'Kehadiran', href: '/dashboard/wali/absensi' },
            { icon: TrendingUp, label: 'Progress Hafalan', href: '/dashboard/wali/hafalan' },
            { icon: FileText, label: 'Nilai & Rapor', href: '/dashboard/wali/nilai' },
            { icon: CreditCard, label: 'Pembayaran', href: '/dashboard/wali/pembayaran' },
            { icon: Wallet, label: 'Tabungan', href: '/dashboard/wali/tabungan' },
        ],
    },

    santri: {
        title: 'Smart Pesantren',
        subtitle: 'Portal Santri',
        accentColor: 'indigo',
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-700',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/santri' },
            { icon: Calendar, label: 'Jadwal Pelajaran', href: '/dashboard/santri/jadwal' },
            { icon: BookOpen, label: 'Riwayat Nilai', href: '/dashboard/santri/nilai' },
            { icon: Award, label: 'Progress Hafalan', href: '/dashboard/santri/hafalan' },
            { icon: User, label: 'Profil Saya', href: '/dashboard/santri/profil' },
        ],
    },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get navigation config for a specific role
 */
export function getNavigationForRole(role: UserRole): RoleNavigation {
    return ROLE_NAVIGATION[role];
}

/**
 * Check if a nav item should be marked as active based on current path
 */
export function isNavItemActive(item: NavItem, currentPath: string): boolean {
    // Exact match
    if (currentPath === item.href) {
        return true;
    }

    // Check additional match paths
    if (item.matchPaths) {
        for (const path of item.matchPaths) {
            if (currentPath.startsWith(path)) {
                return true;
            }
        }
    }

    // Check if current path starts with item href (for nested routes)
    // But only for non-dashboard items to avoid all items being active
    if (item.href !== '/dashboard/akademik' &&
        item.href !== '/dashboard/wali-kelas' &&
        currentPath.startsWith(item.href)) {
        return true;
    }

    return false;
}

/**
 * Get accent color classes for a role
 */
export function getAccentClasses(accentColor: string): {
    bg: string;
    text: string;
    border: string;
    hover: string;
} {
    const colorMap: Record<string, { bg: string; text: string; border: string; hover: string }> = {
        purple: {
            bg: 'bg-purple-50 dark:bg-purple-500/10',
            text: 'text-purple-700 dark:text-purple-400',
            border: 'border-purple-200 dark:border-purple-500/20',
            hover: 'hover:bg-purple-100 dark:hover:bg-purple-500/20'
        },
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-500/10',
            text: 'text-blue-700 dark:text-blue-400',
            border: 'border-blue-200 dark:border-blue-500/20',
            hover: 'hover:bg-blue-100 dark:hover:bg-blue-500/20'
        },
        emerald: {
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            text: 'text-emerald-700 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-500/20',
            hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
        },
        orange: {
            bg: 'bg-orange-50 dark:bg-orange-500/10',
            text: 'text-orange-700 dark:text-orange-400',
            border: 'border-orange-200 dark:border-orange-500/20',
            hover: 'hover:bg-orange-100 dark:hover:bg-orange-500/20'
        },
        cyan: {
            bg: 'bg-cyan-50 dark:bg-cyan-500/10',
            text: 'text-cyan-700 dark:text-cyan-400',
            border: 'border-cyan-200 dark:border-cyan-500/20',
            hover: 'hover:bg-cyan-100 dark:hover:bg-cyan-500/20'
        },
        pink: {
            bg: 'bg-pink-50 dark:bg-pink-500/10',
            text: 'text-pink-700 dark:text-pink-400',
            border: 'border-pink-200 dark:border-pink-500/20',
            hover: 'hover:bg-pink-100 dark:hover:bg-pink-500/20'
        },
        indigo: {
            bg: 'bg-indigo-50 dark:bg-indigo-500/10',
            text: 'text-indigo-700 dark:text-indigo-400',
            border: 'border-indigo-200 dark:border-indigo-500/20',
            hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
        },
        teal: {
            bg: 'bg-teal-50 dark:bg-teal-500/10',
            text: 'text-teal-700 dark:text-teal-400',
            border: 'border-teal-200 dark:border-teal-500/20',
            hover: 'hover:bg-teal-100 dark:hover:bg-teal-500/20'
        },
        violet: {
            bg: 'bg-violet-50 dark:bg-violet-500/10',
            text: 'text-violet-700 dark:text-violet-400',
            border: 'border-violet-200 dark:border-violet-500/20',
            hover: 'hover:bg-violet-100 dark:hover:bg-violet-500/20'
        },
    };

    return colorMap[accentColor] || colorMap.blue;
}
