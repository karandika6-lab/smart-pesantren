'use client';

import { useState } from 'react';
import { KeyRound, Loader2, X, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface ResetPasswordModalProps {
    isOpen: boolean;
    user: { id: string; name: string; email: string } | null;
    onClose: () => void;
    onSuccess: () => void;
    adminId: string;
}

export default function ResetPasswordModal({
    isOpen,
    user,
    onClose,
    onSuccess,
    adminId
}: ResetPasswordModalProps) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validations
        if (newPassword.length < 6) {
            setError('Password harus minimal 6 karakter');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Password dan konfirmasi tidak cocok');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    newPassword,
                    adminId
                })
            });

            const result = await response.json();

            if (!result.success) {
                setError(result.error || 'Gagal mereset password');
                setIsLoading(false);
                return;
            }

            // Success
            setNewPassword('');
            setConfirmPassword('');
            onSuccess();
            onClose();

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickSet = (password: string) => {
        setNewPassword(password);
        setConfirmPassword(password);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto transition-all duration-300">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto my-4 transition-all scale-100">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 rounded-xl flex items-center justify-center">
                            <KeyRound className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Reset Password</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong className="text-gray-800 dark:text-gray-200">Email:</strong> {user.email}
                        </p>
                    </div>

                    {/* Quick Set Buttons */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Password Cepat
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['guru123', 'password123', 'santri123', 'admin123'].map(pwd => (
                                <button
                                    key={pwd}
                                    type="button"
                                    onClick={() => handleQuickSet(pwd)}
                                    className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-400 text-sm font-medium rounded-lg transition-colors border border-transparent dark:border-white/5"
                                >
                                    {pwd}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Password Baru
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Minimal 6 karakter"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 pr-12 dark:text-white transition-all"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Konfirmasi Password
                        </label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ulangi password"
                            className={`w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:text-white transition-all ${confirmPassword && confirmPassword !== newPassword
                                ? 'border-red-300 dark:border-red-500/50 focus:border-red-500'
                                : 'border-gray-200 dark:border-white/10 focus:border-purple-500'
                                }`}
                            required
                        />
                        {confirmPassword && confirmPassword === newPassword && (
                            <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Password cocok
                            </p>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !newPassword || !confirmPassword}
                            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-500/20 active:scale-95"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Mereset...
                                </>
                            ) : (
                                <>
                                    <KeyRound className="w-5 h-5" />
                                    Reset Password
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
