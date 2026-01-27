'use client';

import { useState } from 'react';
import {
    X,
    Loader2,
    UserPlus,
    Mail,
    Key,
    Phone,
    User,
    ChevronDown,
    Eye,
    EyeOff,
    AlertCircle
} from 'lucide-react';
import { UserRole, getCurrentUser } from '@/lib/auth';
import { pesantrenService, Pesantren } from '@/lib/services/pesantren';
import { useEffect } from 'react';

// ============================================
// Types
// ============================================

export interface NewUserData {
    name: string;
    email: string;
    password: string;
    role: UserRole | '';
    phone: string;
    pesantrenId: string;
}

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userData: NewUserData) => Promise<void>;
}

// ============================================
// Role Options for Dropdown
// ============================================

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

// ============================================
// Component
// ============================================

export default function AddUserModal({ isOpen, onClose, onSubmit }: AddUserModalProps) {
    const [formData, setFormData] = useState<NewUserData>({
        name: '',
        email: '',
        password: '',
        role: '',
        phone: '',
        pesantrenId: '',
    });

    const [isRoleOpen, setIsRoleOpen] = useState(false);
    const [isPesantrenOpen, setIsPesantrenOpen] = useState(false);

    const [pesantrenList, setPesantrenList] = useState<Pesantren[]>([]);
    const currentUser = getCurrentUser();

    useEffect(() => {
        if (isOpen && currentUser?.role === 'super_admin') {
            pesantrenService.getAll().then(setPesantrenList);
        }
    }, [isOpen, currentUser]);

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nama lengkap wajib diisi';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'Nama minimal 3 karakter';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email wajib diisi';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Format email tidak valid';
        }

        if (!formData.password) {
            newErrors.password = 'Password wajib diisi';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password minimal 6 karakter';
        }

        if (!formData.role) {
            newErrors.role = 'Role wajib dipilih';
        }

        if (currentUser?.role === 'super_admin' && !formData.pesantrenId) {
            newErrors.pesantrenId = 'Pesantren wajib dipilih';
        }

        if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
            newErrors.phone = 'Format nomor telepon tidak valid';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            // Reset form on success
            setFormData({ name: '', email: '', password: '', role: '', phone: '', pesantrenId: '' });
            setErrors({});
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle close
    const handleClose = () => {
        if (!isSubmitting) {
            setFormData({ name: '', email: '', password: '', role: '', phone: '', pesantrenId: '' });
            setErrors({});
            onClose();
        }
    };

    // Generate random password
    const generatePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, password });
        setShowPassword(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-white/10 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Tambah User Baru</h3>
                            <p className="text-sm text-gray-500">Buat akun untuk staff atau santri</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg disabled:opacity-50 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-5">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Nama Lengkap <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, name: e.target.value });
                                        if (errors.name) setErrors({ ...errors, name: '' });
                                    }}
                                    placeholder="Masukkan nama lengkap"
                                    disabled={isSubmitting}
                                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all disabled:opacity-50 ${errors.name ? 'border-red-300 bg-red-50 dark:bg-red-500/10' : 'border-gray-200 dark:border-white/10'
                                        }`}
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (errors.email) setErrors({ ...errors, email: '' });
                                    }}
                                    placeholder="email@pesantren.com"
                                    disabled={isSubmitting}
                                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all disabled:opacity-50 ${errors.email ? 'border-red-300 bg-red-50 dark:bg-red-500/10' : 'border-gray-200 dark:border-white/10'
                                        }`}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Key className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => {
                                        setFormData({ ...formData, password: e.target.value });
                                        if (errors.password) setErrors({ ...errors, password: '' });
                                    }}
                                    placeholder="Minimal 6 karakter"
                                    disabled={isSubmitting}
                                    className={`w-full pl-10 pr-20 py-3 bg-gray-50 dark:bg-black/20 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all disabled:opacity-50 ${errors.password ? 'border-red-300 bg-red-50 dark:bg-red-500/10' : 'border-gray-200 dark:border-white/10'
                                        }`}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                                {errors.password ? (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.password}
                                    </p>
                                ) : (
                                    <span />
                                )}
                                <button
                                    type="button"
                                    onClick={generatePassword}
                                    disabled={isSubmitting}
                                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                                >
                                    Generate Password
                                </button>
                            </div>
                        </div>

                        {/* Role Selection (Custom Dropdown) */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRoleOpen(!isRoleOpen);
                                    setIsPesantrenOpen(false);
                                }}
                                disabled={isSubmitting}
                                className={`w-full px-4 py-3 text-left bg-gray-50 dark:bg-neutral-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all dark:text-white disabled:opacity-50 flex items-center justify-between ${errors.role ? 'border-red-300 bg-red-50 dark:bg-red-500/10' : 'border-gray-200 dark:border-white/10'
                                    }`}
                            >
                                <span className={!formData.role ? 'text-gray-500 dark:text-gray-400' : ''}>
                                    {formData.role ? ROLE_OPTIONS.find(r => r.value === formData.role)?.label : '-- Pilih Role --'}
                                </span>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isRoleOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isRoleOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                                    {ROLE_OPTIONS.map(role => (
                                        <button
                                            key={role.value}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, role: role.value });
                                                if (errors.role) setErrors({ ...errors, role: '' });
                                                setIsRoleOpen(false);
                                            }}
                                            className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${formData.role === role.value
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 font-medium'
                                                : 'text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <div className="font-medium">{role.label}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{role.description}</div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {errors.role && (
                                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.role}
                                </p>
                            )}
                        </div>

                        {/* Pesantren Selection (Custom Dropdown for Super Admin) */}
                        {currentUser?.role === 'super_admin' && (
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Unit Pesantren <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPesantrenOpen(!isPesantrenOpen);
                                        setIsRoleOpen(false);
                                    }}
                                    disabled={isSubmitting}
                                    className={`w-full px-4 py-3 text-left bg-gray-50 dark:bg-neutral-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all dark:text-white disabled:opacity-50 flex items-center justify-between ${errors.pesantrenId ? 'border-red-300 bg-red-50 dark:bg-red-500/10' : 'border-gray-200 dark:border-white/10'
                                        }`}
                                >
                                    <span className={!formData.pesantrenId ? 'text-gray-500 dark:text-gray-400' : ''}>
                                        {formData.pesantrenId ? pesantrenList.find(p => p.id === formData.pesantrenId)?.name : '-- Pilih Pesantren --'}
                                    </span>
                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isPesantrenOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isPesantrenOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                                        {pesantrenList.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, pesantrenId: p.id });
                                                    if (errors.pesantrenId) setErrors({ ...errors, pesantrenId: '' });
                                                    setIsPesantrenOpen(false);
                                                }}
                                                className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${formData.pesantrenId === p.id
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 font-medium'
                                                    : 'text-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {errors.pesantrenId && (
                                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.pesantrenId}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Phone (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Nomor Telepon <span className="text-gray-400">(Opsional)</span>
                            </label>
                            <div className="relative">
                                <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        setFormData({ ...formData, phone: e.target.value });
                                        if (errors.phone) setErrors({ ...errors, phone: '' });
                                    }}
                                    placeholder="08xxxxxxxxxx"
                                    disabled={isSubmitting}
                                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all disabled:opacity-50 ${errors.phone ? 'border-red-300 bg-red-50 dark:bg-red-500/10' : 'border-gray-200 dark:border-white/10'
                                        }`}
                                />
                            </div>
                            {errors.phone && (
                                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.phone}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 dark:border-white/5 flex gap-3 shrink-0 bg-gray-50 dark:bg-neutral-900/50">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 py-3 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-emerald-500/30"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Membuat Akun...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Buat Akun
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
