import { Shield, GraduationCap, Users, User, UserCheck, Wallet, Home, ClipboardCheck, BookMarked } from 'lucide-react';
import { UserRole } from '@/lib/auth';

export const ROLE_CONFIG: Record<UserRole, { icon: any; label: string; description: string }> = {
    super_admin: { icon: Shield, label: 'Super Admin', description: 'Akses penuh ke semua fitur' },
    admin_keuangan: { icon: Wallet, label: 'Keuangan', description: 'Kelola pembayaran & anggaran' },
    admin_akademik: { icon: GraduationCap, label: 'Akademik', description: 'Kelola nilai & kurikulum' },
    kesantrian: { icon: Home, label: 'Kesantrian', description: 'Kelola asrama & kedisiplinan' },
    admin_absensi: { icon: ClipboardCheck, label: 'Absensi', description: 'Kelola kehadiran santri' },
    wali_kelas: { icon: Users, label: 'Wali Kelas', description: 'Kelola kelas & santri' },
    ustadz: { icon: BookMarked, label: 'Ustadz', description: 'Mengajar & nilai hafalan' },
    wali_santri: { icon: UserCheck, label: 'Wali Santri', description: 'Pantau anak Anda' },
    santri: { icon: User, label: 'Santri', description: 'Akses data pribadi' },
};
