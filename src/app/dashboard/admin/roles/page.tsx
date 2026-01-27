'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getCurrentUser,
    clearSession,
    User
} from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    ArrowLeft,
    Shield,
    Save,
    CheckCircle2,
    Loader2
} from 'lucide-react';

// ============================================
// Types & Data
// ============================================

interface Permission {
    id: string;
    label: string;
}

interface RolePermission {
    role: string;
    roleName: string;
    permissions: Record<string, boolean>;
}

const PERMISSIONS: Permission[] = [
    { id: 'view', label: 'View Data' },
    { id: 'create', label: 'Create' },
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete' },
    { id: 'export', label: 'Export' },
];

const INITIAL_ROLES: RolePermission[] = [
    { role: 'admin_keuangan', roleName: 'Admin Keuangan', permissions: { view: true, create: true, edit: true, delete: false, export: true } },
    { role: 'admin_akademik', roleName: 'Admin Akademik', permissions: { view: true, create: true, edit: true, delete: true, export: true } },
    { role: 'kesantrian', roleName: 'Kesantrian', permissions: { view: true, create: true, edit: true, delete: false, export: false } },
    { role: 'admin_absensi', roleName: 'Admin Absensi', permissions: { view: true, create: true, edit: false, delete: false, export: true } },
    { role: 'wali_kelas', roleName: 'Wali Kelas', permissions: { view: true, create: true, edit: true, delete: false, export: true } },
    { role: 'ustadz', roleName: 'Ustadz', permissions: { view: true, create: true, edit: false, delete: false, export: false } },
    { role: 'wali_santri', roleName: 'Wali Santri', permissions: { view: true, create: false, edit: false, delete: false, export: false } },
    { role: 'santri', roleName: 'Santri', permissions: { view: true, create: false, edit: false, delete: false, export: false } },
];

export default function RolesPermissionsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [roles, setRoles] = useState<RolePermission[]>(INITIAL_ROLES);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'super_admin') {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
        });
        return () => cancelAnimationFrame(timer);
    }, [router]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const togglePermission = (roleIndex: number, permissionId: string) => {
        const newRoles = [...roles];
        newRoles[roleIndex].permissions[permissionId] = !newRoles[roleIndex].permissions[permissionId];
        setRoles(newRoles);
    };

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 1500));
        setIsSaving(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-gray-400">Memuat...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-[60] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-medium">Permissions berhasil disimpan!</span>
                </div>
            )}

            {/* Sidebar */}
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8">
                    {/* Breadcrumb & Title */}
                    <div className="mb-6">
                        <Link
                            href="/dashboard/admin"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Dashboard
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    <Shield className="w-7 h-7 text-purple-600" />
                                    Roles & Permissions
                                </h1>
                                <p className="text-gray-500">
                                    Kelola hak akses untuk setiap role di sistem
                                </p>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-purple-500/30 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Save Permissions
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Permission Matrix Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-700 min-w-[200px]">
                                            Role
                                        </th>
                                        {PERMISSIONS.map(perm => (
                                            <th key={perm.id} className="text-center p-4 text-sm font-semibold text-gray-700 min-w-[100px]">
                                                {perm.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {roles.map((role, roleIndex) => (
                                        <tr key={role.role} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                                        <span className="text-purple-700 font-semibold text-sm">
                                                            {role.roleName.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{role.roleName}</p>
                                                        <p className="text-xs text-gray-400">{role.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {PERMISSIONS.map(perm => (
                                                <td key={perm.id} className="p-4 text-center">
                                                    <label className="inline-flex items-center justify-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={role.permissions[perm.id] || false}
                                                            onChange={() => togglePermission(roleIndex, perm.id)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${role.permissions[perm.id]
                                                            ? 'bg-purple-600 border-purple-600'
                                                            : 'bg-white border-gray-300 hover:border-purple-400'
                                                            }`}>
                                                            {role.permissions[perm.id] && (
                                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </label>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Info */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100">
                            <p className="text-sm text-gray-500">
                                💡 <strong>Tip:</strong> Super Admin memiliki akses penuh ke semua fitur dan tidak dapat diubah.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
