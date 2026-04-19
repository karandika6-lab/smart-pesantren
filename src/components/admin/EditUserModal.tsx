'use client';

import { useState, useEffect } from 'react';
import {
    X,
    Loader2,
    Edit,
    Phone,
    User as UserIcon,
    ChevronDown,
    Check,
    Save
} from 'lucide-react';
import { UserRole } from '@/lib/auth';

// Simplified type that works with both auth.User and database.Profile
interface EditableUser {
    id: string;
    email: string;
    name: string;
    role: string | null;
    phone?: string | null;
}

interface EditUserModalProps {
    isOpen: boolean;
    user: EditableUser | null;
    onClose: () => void;
    onSubmit: (userId: string, data: { name: string; role: UserRole; phone: string }) => Promise<void>;
}

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
    { value: 'admin_keuangan', label: 'Admin Keuangan', description: 'Kelola SPP, pembayaran, keuangan' },
    { value: 'admin_akademik', label: 'Admin Akademik', description: 'Kelola kurikulum dan jadwal' },
    { value: 'kesantrian', label: 'Bagian Kesantrian', description: 'Kelola disiplin dan asrama' },
    { value: 'admin_absensi', label: 'Admin Absensi', description: 'Petugas piket absensi' },
    { value: 'wali_kelas', label: 'Wali Kelas', description: 'Supervisor kelas' },
    { value: 'ustadz', label: 'Ustadz/Guru', description: 'Input nilai dan hafalan' },
    { value: 'wali_santri', label: 'Wali Santri', description: 'Orang tua/wali murid' },
    { value: 'santri', label: 'Santri', description: 'Siswa pesantren' },
];

export default function EditUserModal({ isOpen, user, onClose, onSubmit }: EditUserModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        role: '' as UserRole,
        phone: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                role: user.role as UserRole || 'santri',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = 'Nama lengkap wajib diisi';
        if (!formData.role) newErrors.role = 'Role wajib dipilih';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !user) return;

        setIsSubmitting(true);
        try {
            await onSubmit(user.id, formData);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-white/10 max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/10 rounded-xl flex items-center justify-center">
                            <Edit className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Edit User</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nama Lengkap</label>
                            <div className="relative">
                                <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 border rounded-xl focus:ring-2 focus:ring-purple-500/30 dark:text-white transition-all ${errors.name ? 'border-red-300 dark:border-red-500/50' : 'border-gray-200 dark:border-white/10'}`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role System</label>
                            <div className="relative">
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-white/10 rounded-xl appearance-none focus:ring-2 focus:ring-purple-500/30 dark:text-white"
                                >
                                    {ROLE_OPTIONS.map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-50 dark:bg-white/5 rounded border border-gray-100 dark:border-white/10">
                                {ROLE_OPTIONS.find(r => r.value === formData.role)?.description}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nomor Telepon</label>
                            <div className="relative">
                                <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="08xxxxxxxxxx"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/30 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 dark:border-white/5 flex gap-3 bg-gray-50 dark:bg-neutral-900/50">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 py-3 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 transition-all active:scale-95"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
