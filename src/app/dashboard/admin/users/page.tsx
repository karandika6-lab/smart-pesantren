'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getCurrentUser,
    clearSession,
    User,
    ROLE_NAMES,
    ROLE_COLORS,
    UserRole
} from '@/lib/auth';
import { Profile } from '@/types/database.types';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    CheckCircle2,
    UserX,
    UserCheck,
    Building2,
    Loader2,
    KeyRound,
    ArrowLeft,
    Users,
    RefreshCw,
    Phone,
    MoreVertical
} from 'lucide-react';
import AddUserModal, { NewUserData } from '@/components/admin/AddUserModal';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';

// ============================================
// Types
// ============================================


const ROLE_OPTIONS: { value: UserRole | 'all'; label: string }[] = [
    { value: 'all', label: 'Semua Role' },
    { value: 'admin_keuangan', label: 'Admin Keuangan' },
    { value: 'admin_akademik', label: 'Admin Akademik' },
    { value: 'kesantrian', label: 'Bagian Kesantrian' },
    { value: 'admin_absensi', label: 'Admin Absensi' },
    { value: 'wali_kelas', label: 'Wali Kelas' },
    { value: 'ustadz', label: 'Ustadz' },
    { value: 'wali_santri', label: 'Wali Santri' },
    { value: 'santri', label: 'Santri' },
];

const STATUS_OPTIONS = [
    { value: 'all', label: 'Semua Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

import { usersService } from '@/lib/services/users';
import { pesantrenService, Pesantren } from '@/lib/services/pesantren';

import EditUserModal from '@/components/admin/EditUserModal';
import ResetPasswordModal from '@/components/admin/ResetPasswordModal';
import { systemService } from '@/lib/services/system';

export default function UserManagementPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // User list state
    const [users, setUsers] = useState<Profile[]>([]);
    const [pesantrens, setPesantrens] = useState<Pesantren[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [filterPesantren, setFilterPesantren] = useState<string>('all');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // UI states
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            const [userData, pesantrenData] = await Promise.all([
                usersService.getAll(),
                pesantrenService.getAll()
            ]);
            setUsers(userData);
            setPesantrens(pesantrenData);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'super_admin') {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchUsers();
        });
        return () => cancelAnimationFrame(timer);
    }, [router, fetchUsers]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    // Filter users
    const filteredUsers = users.filter((u: Profile) => {
        const matchSearch = (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchRole = filterRole === 'all' || u.role === filterRole;
        const matchStatus = filterStatus === 'all' ||
            (filterStatus === 'active' ? u.is_active : !u.is_active);
        const matchPesantren = filterPesantren === 'all' || u.pesantren_id === filterPesantren;

        return matchSearch && matchRole && matchStatus && matchPesantren;
    });

    // Handle create user
    const handleCreateUser = async (userData: NewUserData) => {
        try {
            const result = await usersService.create(
                userData.email,
                userData.password,
                userData.name,
                userData.role as UserRole,
                userData.phone,
                userData.pesantrenId
            );

            if (!result.success) {
                alert(result.error || 'Failed to create user');
                return;
            }

            await systemService.logAction('CREATE_USER', 'Profile', userData.email, { name: userData.name, role: userData.role });

            fetchUsers();
            setShowAddModal(false);
            setSuccessMessage(`User ${userData.name} berhasil ditambahkan!`);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 4000);
        } catch {
            alert('Gagal menambah user');
        }
    };

    // Handle edit user
    const handleEditUser = (u: Profile) => {
        setSelectedUser(u);
        setShowEditModal(true);
    };

    const handleUpdateUser = async (userId: string, data: { name: string; role: UserRole; phone: string }) => {
        try {
            // Update profile info
            await usersService.update(userId, {
                name: data.name,
                phone: data.phone
            });

            // Update role if changed
            const oldUser = users.find(u => u.id === userId);
            if (oldUser && oldUser.role !== data.role) {
                await usersService.updateRole(userId, data.role);
            }

            await systemService.logAction('UPDATE_USER', 'Profile', userId, { ...data, oldRole: oldUser?.role });

            fetchUsers();
            setShowEditModal(false);
            setSuccessMessage(`User ${data.name} berhasil diperbarui!`);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 4000);
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Gagal memperbarui user');
        }
    };

    // Handle delete user
    const handleDeleteUser = async (userId: string) => {
        // Prevent self-deletion
        if (user?.id === userId) {
            alert('Anda tidak dapat menghapus akun Anda sendiri.');
            return;
        }

        try {
            const userToDelete = users.find(u => u.id === userId);

            // Call service which calls RPC delete_user_complete
            await usersService.delete(userId);

            await systemService.logAction('DELETE_USER', 'Profile', userId, { name: userToDelete?.name, email: userToDelete?.email });

            setUsers(users.filter(u => u.id !== userId));
            setShowDeleteConfirm(null);
            setSuccessMessage(`User ${userToDelete?.name} berhasil dihapus permanen!`);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 4000);
        } catch (error: unknown) {
            console.error('Delete error:', error);
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem';
            alert(`Gagal menghapus user: ${message}`);
        }
    };

    // Toggle user status
    const handleToggleStatus = async (userToUpdate: Profile) => {
        try {
            const result = await usersService.toggleActive(userToUpdate.id);
            await systemService.logAction('TOGGLE_STATUS_USER', 'Profile', userToUpdate.id, { active: result.is_active });
            fetchUsers();
        } catch {
            alert('Gagal mengubah status');
        }
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase tracking-widest font-black text-purple-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                    <span>Loading User Management...</span>
                </div>
            </div>
        );
    }

    // Quick stats

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-[60] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-medium">{successMessage}</span>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <UserX className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Hapus User?</h3>
                                <p className="text-sm text-gray-500">
                                    {users.find(u => u.id === showDeleteConfirm)?.name}
                                </p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Tindakan ini tidak dapat dibatalkan. User akan dihapus permanen dari sistem.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleDeleteUser(showDeleteConfirm)}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            <AddUserModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleCreateUser}
            />

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={showEditModal}
                user={selectedUser}
                onClose={() => setShowEditModal(false)}
                onSubmit={handleUpdateUser}
            />

            {/* Reset Password Modal */}
            <ResetPasswordModal
                isOpen={showResetPasswordModal}
                user={selectedUser}
                onClose={() => setShowResetPasswordModal(false)}
                onSuccess={() => {
                    setSuccessMessage(`Password ${selectedUser?.name} berhasil direset!`);
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 4000);
                }}
                adminId={user?.id || ''}
            />

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
                                <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                                <p className="text-gray-500">Kelola semua akun pengguna sistem</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-500/30"
                            >
                                <Plus className="w-5 h-5" />
                                Tambah User Baru
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{users.length}</p>
                                    <p className="text-sm text-gray-500">Total Users</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <UserCheck className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.is_active).length}</p>
                                    <p className="text-sm text-gray-500">Active</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <UserX className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{users.filter(u => !u.is_active).length}</p>
                                    <p className="text-sm text-gray-500">Inactive</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters & Actions */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
                        <div className="p-4 flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari nama, email, atau telepon..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                                />
                            </div>

                            {/* Role Filter */}
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}
                                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                            >
                                {ROLE_OPTIONS.map(role => (
                                    <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                            </select>

                            {/* Status Filter */}
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                            >
                                {STATUS_OPTIONS.map(status => (
                                    <option key={status.value} value={status.value}>{status.label}</option>
                                ))}
                            </select>

                            {/* Pesantren Filter */}
                            <select
                                value={filterPesantren}
                                onChange={(e) => setFilterPesantren(e.target.value)}
                                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                            >
                                <option value="all">Semua Pesantren</option>
                                {pesantrens.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>

                            {/* Refresh */}
                            <button
                                onClick={fetchUsers}
                                className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* User Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">User</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Unit Pesantren</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Role</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Status</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Dibuat</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Users className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <p className="font-medium text-gray-800 mb-1">Tidak ada user ditemukan</p>
                                                <p className="text-sm text-gray-500">Coba ubah filter pencarian Anda</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map(u => {
                                            const roleColor = ROLE_COLORS[u.role as UserRole] || ROLE_COLORS.ustadz;
                                            return (
                                                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${roleColor.bg}`}>
                                                                <span className={`font-medium ${roleColor.text}`}>{u.name.charAt(0)}</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-800">{u.name}</p>
                                                                <p className="text-sm text-gray-500">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-1.5 text-gray-600 px-3 py-1 bg-gray-50 rounded-lg w-fit border border-gray-100">
                                                            <Building2 className="w-3.5 h-3.5 text-purple-500" />
                                                            <span className="text-xs font-semibold">
                                                                {pesantrens.find(p => p.id === u.pesantren_id)?.name || 'Pusat'}
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 flex items-center gap-1 text-gray-400 text-[11px]">
                                                            <Phone className="w-3 h-3" />
                                                            <span>{u.phone || '-'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColor.bg} ${roleColor.text}`}>
                                                                {ROLE_NAMES[u.role as UserRole]}
                                                            </span>
                                                            {/* Secondary roles feature removed - not in current DB schema */}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => handleToggleStatus(u)}
                                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${u.is_active
                                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            {u.is_active ? 'Active' : 'Inactive'}
                                                        </button>
                                                    </td>
                                                    <td className="p-4 text-gray-500 text-sm">
                                                        {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => handleEditUser(u)}
                                                                disabled={u.role === 'super_admin'}
                                                                className={`p-2 rounded-lg transition-colors ${u.role === 'super_admin' ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-purple-50 text-purple-600'}`}
                                                                title={u.role === 'super_admin' ? 'Super Admin tidak dapat diedit' : 'Edit User'}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setShowDeleteConfirm(u.id)}
                                                                disabled={u.id === user?.id || u.role === 'super_admin'}
                                                                className={`p-2 rounded-lg transition-colors ${u.id === user?.id || u.role === 'super_admin' ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-red-50 text-red-600'}`}
                                                                title={u.role === 'super_admin' ? 'Super Admin tidak dapat dihapus' : 'Hapus User'}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedUser(u);
                                                                    setShowResetPasswordModal(true);
                                                                }}
                                                                disabled={u.role === 'super_admin'}
                                                                className={`p-2 rounded-lg transition-colors ${u.role === 'super_admin' ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-amber-50 text-amber-600'}`}
                                                                title="Reset Password"
                                                            >
                                                                <KeyRound className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                                                                title="More Options"
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-gray-500">
                                Menampilkan {filteredUsers.length} dari {users.length} users
                            </p>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>
                                    Sebelumnya
                                </button>
                                <button className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm">
                                    1
                                </button>
                                <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
