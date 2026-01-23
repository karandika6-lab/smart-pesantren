'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2, UserPlus } from 'lucide-react';

const DEMO_USERS = [
    { email: 'admin@pesantren.com', password: 'admin123', name: 'Super Admin', role: 'super_admin' },
    { email: 'keuangan@pesantren.com', password: 'keuangan123', name: 'Admin Keuangan', role: 'admin_keuangan' },
    { email: 'akademik@pesantren.com', password: 'akademik123', name: 'Admin Akademik', role: 'admin_akademik' },
    { email: 'kesantrian@pesantren.com', password: 'kesantrian123', name: 'Staff Kesantrian', role: 'kesantrian' },
    { email: 'ustadz@pesantren.com', password: 'ustadz123', name: 'Ustadz Ahmad', role: 'ustadz' },
    { email: 'walikelas@pesantren.com', password: 'walikelas123', name: 'Wali Kelas 7A', role: 'wali_kelas' },
    { email: 'wali@pesantren.com', password: 'wali123', name: 'Bpk. Ahmad', role: 'wali_santri' },
    { email: 'santri@pesantren.com', password: 'santri123', name: 'Muhammad Rizki', role: 'santri' },
];

interface UserStatus {
    email: string;
    status: 'pending' | 'success' | 'error' | 'exists';
    message: string;
}

export default function SeederPage() {
    const [statuses, setStatuses] = useState<UserStatus[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const createUsers = async () => {
        setIsRunning(true);
        setStatuses([]);

        for (const user of DEMO_USERS) {
            // Update status to pending
            setStatuses(prev => [...prev, {
                email: user.email,
                status: 'pending',
                message: 'Membuat user...'
            }]);

            try {
                // Try to sign up the user
                const { data, error } = await supabase.auth.signUp({
                    email: user.email,
                    password: user.password,
                    options: {
                        data: {
                            name: user.name,
                            role: user.role,
                        },
                    },
                });

                if (error) {
                    if (error.message.includes('already registered')) {
                        setStatuses(prev =>
                            prev.map(s => s.email === user.email
                                ? { ...s, status: 'exists', message: 'User sudah terdaftar' }
                                : s
                            )
                        );
                    } else {
                        setStatuses(prev =>
                            prev.map(s => s.email === user.email
                                ? { ...s, status: 'error', message: error.message }
                                : s
                            )
                        );
                    }
                } else if (data.user) {
                    // User created, now update profile role
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: data.user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                        });

                    if (profileError) {
                        setStatuses(prev =>
                            prev.map(s => s.email === user.email
                                ? { ...s, status: 'error', message: `Profile error: ${profileError.message}` }
                                : s
                            )
                        );
                    } else {
                        setStatuses(prev =>
                            prev.map(s => s.email === user.email
                                ? { ...s, status: 'success', message: 'Berhasil dibuat!' }
                                : s
                            )
                        );
                    }
                }
            } catch (err: any) {
                setStatuses(prev =>
                    prev.map(s => s.email === user.email
                        ? { ...s, status: 'error', message: err.message }
                        : s
                    )
                );
            }

            // Small delay between users
            await new Promise(r => setTimeout(r, 500));
        }

        setIsRunning(false);
    };

    const getStatusIcon = (status: UserStatus['status']) => {
        switch (status) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
            case 'exists': return <CheckCircle className="w-5 h-5 text-yellow-600" />;
            default: return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
        }
    };

    const getStatusColor = (status: UserStatus['status']) => {
        switch (status) {
            case 'success': return 'bg-green-50 border-green-200';
            case 'error': return 'bg-red-50 border-red-200';
            case 'exists': return 'bg-yellow-50 border-yellow-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <UserPlus className="w-8 h-8 text-emerald-600" />
                        <h1 className="text-2xl font-bold text-gray-800">
                            Buat User Demo
                        </h1>
                    </div>

                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>ℹ️ Info:</strong> Halaman ini membuat 8 user demo untuk testing.
                            User akan dibuat via Supabase Auth API (bukan SQL langsung).
                        </p>
                    </div>

                    {statuses.length > 0 && (
                        <div className="space-y-3 mb-6">
                            {statuses.map((status, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(status.status)}`}
                                >
                                    {getStatusIcon(status.status)}
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">{status.email}</p>
                                        <p className="text-sm text-gray-600">{status.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={createUsers}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {isRunning ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Membuat User...
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                Buat 8 User Demo
                            </>
                        )}
                    </button>

                    <div className="mt-8 border-t pt-6">
                        <h3 className="font-semibold text-gray-700 mb-3">Daftar Akun Demo:</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {DEMO_USERS.map((user, i) => (
                                <div key={i} className="text-gray-600">
                                    <span className="font-medium">{user.role}:</span> {user.email}
                                </div>
                            ))}
                        </div>
                        <p className="mt-3 text-xs text-gray-500">
                            Password masing-masing: nama role + 123 (contoh: admin123)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
