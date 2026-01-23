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

        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickSet = (password: string) => {
        setNewPassword(password);
        setConfirmPassword(password);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto my-4">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <KeyRound className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Reset Password</h3>
                            <p className="text-sm text-gray-500">{user.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-600">
                            <strong>Email:</strong> {user.email}
                        </p>
                    </div>

                    {/* Quick Set Buttons */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Password Cepat
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['guru123', 'password123', 'santri123', 'admin123'].map(pwd => (
                                <button
                                    key={pwd}
                                    type="button"
                                    onClick={() => handleQuickSet(pwd)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 text-sm font-medium rounded-lg transition-colors"
                                >
                                    {pwd}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Password Baru
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Minimal 6 karakter"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 pr-12"
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
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Konfirmasi Password
                        </label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ulangi password"
                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${confirmPassword && confirmPassword !== newPassword
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-gray-200 focus:border-purple-500'
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
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !newPassword || !confirmPassword}
                            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
