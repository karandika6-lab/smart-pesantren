'use client';

import { useState, useEffect } from 'react';
import {
    X,
    Loader2,
    Edit,
    Mail,
    Phone,
    User,
    ChevronDown,
    AlertCircle,
    Save
} from 'lucide-react';
import { ROLE_NAMES, UserRole } from '@/lib/auth';

interface EditUserModalProps {
    isOpen: boolean;
    user: any;
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
        if (!validateForm()) return;

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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Edit className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Edit User</h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                            <div className="relative">
                                <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-purple-500/30 ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role System</label>
                            <div className="relative">
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:ring-2 focus:ring-purple-500/30"
                                >
                                    {ROLE_OPTIONS.map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            <p className="mt-2 text-xs text-gray-500 p-2 bg-gray-50 rounded border border-gray-100">
                                {ROLE_OPTIONS.find(r => r.value === formData.role)?.description}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Telepon</label>
                            <div className="relative">
                                <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="08xxxxxxxxxx"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/30"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-100"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
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
