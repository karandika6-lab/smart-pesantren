'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    clearSession,
    User,
    UserRole,
    ROLE_NAMES,
    ROLE_COLORS
} from '@/lib/auth';
import {
    ChartCard,
    UserDistributionChart,
    LoginTrafficChart,
    DormitoryChart
} from '@/components/charts';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    Settings,
    Shield,
    Database,
    Activity,
    LogOut,
    Menu,
    Bell,
    ChevronDown,
    Plus,
    Search,
    Edit,
    Trash2,
    MoreVertical,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Server,
    Cpu,
    HardDrive,
    Wifi,
    Clock,
    X,
    Loader2,
    UserPlus,
    Key,
    Mail
} from 'lucide-react';

import { usersService } from '@/lib/services/users';
import { studentsService } from '@/lib/services/students';
import { teachersService } from '@/lib/services/teachers';
import { kesantrianService } from '@/lib/services/kesantrian';
import { dormitoriesService } from '@/lib/services/dormitories';
import { Profile } from '@/types/database.types';
import { pesantrenService, Pesantren } from '@/lib/services/pesantren';


// ============================================
// Types
// ============================================

interface SystemHealth {
    name: string;
    status: 'healthy' | 'warning' | 'error';
    value: string;
    icon: any;
}

const ROLE_OPTIONS = [
    { value: 'admin_keuangan', label: 'Admin Keuangan' },
    { value: 'admin_akademik', label: 'Admin Akademik' },
    { value: 'kesantrian', label: 'Bagian Kesantrian' },
    { value: 'admin_absensi', label: 'Admin Absensi' },
    { value: 'wali_kelas', label: 'Wali Kelas' },
    { value: 'ustadz', label: 'Ustadz' },
    { value: 'wali_santri', label: 'Wali Santri' },
    { value: 'santri', label: 'Santri' },
];

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [showUserModal, setShowUserModal] = useState(false);

    // Real Data State
    const [users, setUsers] = useState<any[]>([]);
    const [pesantrens, setPesantrens] = useState<Pesantren[]>([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalPesantren: 0,
        systemHealth: 'Optimal',
    });
    const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
    const [userDistribution, setUserDistribution] = useState<any[]>([]);
    const [loginTraffic, setLoginTraffic] = useState<any[]>([]);
    const [pesantrenGrowth, setPesantrenGrowth] = useState<any[]>([]);

    // Form state
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        role: '' as UserRole,
        password: '',
        pesantrenId: '',
        sendInvite: true,
    });

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [editingUser, setEditingUser] = useState<any>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'super_admin') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchDashboardData();

        const unsubscribe = usersService.subscribeToChanges(() => fetchDashboardData());
        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [router]);

    const fetchDashboardData = async () => {
        try {
            // Helper to handle individual service errors
            const safeFetch = async (promise: Promise<any>, defaultValue: any) => {
                try {
                    return await promise;
                } catch (e) {
                    console.error('Service call failed:', e);
                    return defaultValue;
                }
            };

            const [
                allUsers,
                userStats,
                allPesantren,
                health,
                loginTrafficData,
                growthData
            ] = await Promise.all([
                safeFetch(usersService.getAll(), []),
                safeFetch(usersService.getStats(), { total: 0, active: 0, byRole: {} }),
                safeFetch(pesantrenService.getAll(), []),
                safeFetch(usersService.getSystemHealth(), []),
                safeFetch(pesantrenService.getLoginTraffic(), []),
                safeFetch(pesantrenService.getGrowthStats(), [])
            ]);

            setUsers(allUsers);
            setPesantrens(allPesantren);
            setStats({
                totalUsers: userStats.total,
                activeUsers: userStats.active,
                totalPesantren: allPesantren.length,
                systemHealth: 'Optimal'
            });
            setSystemHealth(health);
            setLoginTraffic(loginTrafficData); // Actual login traffic
            setPesantrenGrowth(growthData);    // Pesantren growth data

            // Calculate global distribution
            const distribution = [
                { name: 'SaaS Admin', value: allUsers.filter((u: any) => u.role === 'super_admin').length, color: '#8b5cf6' },
                { name: 'Unit Staff', value: allUsers.filter((u: any) => u.role !== 'super_admin' && u.role !== 'santri' && u.role !== 'wali_santri').length, color: '#3b82f6' },
                { name: 'Santri/Wali', value: allUsers.filter((u: any) => u.role === 'santri' || u.role === 'wali_santri').length, color: '#10b981' },
            ];
            setUserDistribution(distribution.filter(d => d.value > 0));

            setIsLoading(false);
        } catch (error) {
            console.error('Critical dashboard error:', error);
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleSaveUser = async () => {
        setIsSaving(true);
        try {
            if (editingUser) {
                await usersService.update(editingUser.id, {
                    name: userForm.name,
                    email: userForm.email
                });
                alert('User berhasil diperbarui!');
            } else {
                await usersService.create(
                    userForm.email,
                    userForm.password,
                    userForm.name,
                    userForm.role,
                    '',
                    (userForm as any).pesantrenId
                );
            }
            setIsSaving(false);
            setShowUserModal(false);
            setEditingUser(null);
            setShowSuccess(true);
            setUserForm({ name: '', email: '', role: '' as UserRole, password: '', pesantrenId: '', sendInvite: true });
            setTimeout(() => setShowSuccess(false), 3000);
            fetchDashboardData();
        } catch (err: any) {
            alert('Error: ' + err.message);
            setIsSaving(false);
        }
    };

    const handleEditUser = (u: any) => {
        setEditingUser(u);
        setUserForm({
            name: u.name,
            email: u.email,
            role: u.role,
            password: '',
            pesantrenId: u.pesantren_id || '',
            sendInvite: false
        });
        setShowUserModal(true);
    };

    const handleToggleStatus = async (id: string) => {
        try {
            await usersService.toggleActive(id);
            fetchDashboardData();
        } catch (err: any) {
            alert('Gagal mengubah status: ' + err.message);
        }
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                    <div className="text-gray-400 font-medium">Menghubungkan ke database...</div>
                </div>
            </div>
        );
    }

    // Filter users
    const filteredUsers = users.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchRole = filterRole === 'all' || u.role === filterRole;
        return matchSearch && matchRole;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-[60] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-medium">User berhasil ditambahkan!</span>
                </div>
            )}

            {/* Add User Modal */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">
                                    {editingUser ? 'Edit User' : 'Tambah User Baru'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {editingUser ? 'Perbarui informasi profil user' : 'Buat akun untuk staff atau santri baru'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowUserModal(false);
                                    setEditingUser(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={userForm.name}
                                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                    placeholder="Masukkan nama lengkap"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        value={userForm.email}
                                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                        placeholder="email@pesantren.com"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                                <select
                                    value={userForm.role}
                                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                                >
                                    <option value="">-- Pilih Role --</option>
                                    {ROLE_OPTIONS.map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <Key className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="password"
                                        value={userForm.password}
                                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                        placeholder="Minimal 8 karakter"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            {/* Send Invite */}
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={userForm.sendInvite}
                                    onChange={(e) => setUserForm({ ...userForm, sendInvite: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-sm text-gray-700">Kirim undangan via email</span>
                            </label>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setShowUserModal(false)}
                                className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveUser}
                                disabled={isSaving}
                                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    editingUser ? 'Simpan Perubahan' : 'Buat Akun'
                                )}
                            </button>
                        </div>
                    </div>
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
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 lg:p-8 text-white mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Shield className="w-8 h-8" />
                                    <h2 className="text-2xl font-bold">Super Admin Dashboard</h2>
                                </div>
                                <p className="text-purple-100">
                                    Kelola pengguna, konfigurasi sistem, dan pantau aktivitas.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowUserModal(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Tambah User Baru
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                                <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
                            <p className="text-sm text-gray-500">Users (Global)</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{stats.activeUsers}</p>
                            <p className="text-sm text-gray-500">Active Sessions</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalPesantren}</p>
                            <p className="text-sm text-gray-500">Total Pesantren</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                                <Activity className="w-5 h-5 text-amber-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{stats.systemHealth}</p>
                            <p className="text-sm text-gray-500">SaaS Health</p>
                        </div>
                    </div>

                    {/* Data Visualization Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <ChartCard
                            title="Distribusi Pengguna"
                            subtitle="Berdasarkan kategori role"
                        >
                            <UserDistributionChart data={userDistribution} height={280} />
                        </ChartCard>

                        <ChartCard
                            title="Traffic Login"
                            subtitle="7 hari terakhir"
                        >
                            <LoginTrafficChart data={loginTraffic} color="#8b5cf6" height={280} />
                        </ChartCard>

                        <ChartCard
                            title="Pertumbuhan Pesantren"
                            subtitle="Unit yang baru bergabung"
                        >
                            <LoginTrafficChart data={pesantrenGrowth} color="#10b981" height={280} />
                        </ChartCard>
                    </div>

                    {/* System Health */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-purple-600" />
                            System Health Status
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {systemHealth.map(health => (
                                <div
                                    key={health.name}
                                    className={`p-4 rounded-xl border ${health.status === 'healthy' ? 'bg-emerald-50 border-emerald-200' :
                                        health.status === 'warning' ? 'bg-amber-50 border-amber-200' :
                                            'bg-red-50 border-red-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        {health.status === 'healthy' ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        ) : health.status === 'warning' ? (
                                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-600" />
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-gray-800">{health.name}</p>
                                    <p className={`text-sm ${health.status === 'healthy' ? 'text-emerald-600' :
                                        health.status === 'warning' ? 'text-amber-600' :
                                            'text-red-600'
                                        }`}>{health.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* User Management Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <h3 className="font-semibold text-gray-800">User Management</h3>
                                <div className="flex gap-3 md:ml-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Cari user..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                                        />
                                    </div>
                                    <select
                                        value={filterRole}
                                        onChange={(e) => setFilterRole(e.target.value)}
                                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                                    >
                                        <option value="all">Semua Role</option>
                                        {ROLE_OPTIONS.map(role => (
                                            <option key={role.value} value={role.value}>{role.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">User</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Role</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Status</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Terdaftar</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map(u => {
                                        const roleColor = ROLE_COLORS[u.role as keyof typeof ROLE_COLORS] || ROLE_COLORS.ustadz;
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
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColor.bg} ${roleColor.text}`}>
                                                        {ROLE_NAMES[u.role as keyof typeof ROLE_NAMES] || u.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => handleToggleStatus(u.id)}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${u.is_active
                                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-rose-100 hover:text-rose-700'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700'
                                                            }`}
                                                    >
                                                        {u.is_active ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td className="p-4 text-gray-600 text-sm">
                                                    {u.last_login
                                                        ? new Date(u.last_login).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(u.last_login).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                                                        : '-'}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEditUser(u)}
                                                            disabled={u.role === 'super_admin'}
                                                            className={`p-2 rounded-lg transition-colors ${u.role === 'super_admin' ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-purple-50 text-purple-600'}`}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (u.role === 'super_admin') return;
                                                                if (confirm(`Hapus user ${u.name}?`)) {
                                                                    await usersService.delete(u.id);
                                                                    fetchDashboardData();
                                                                }
                                                            }}
                                                            disabled={u.role === 'super_admin'}
                                                            className={`p-2 rounded-lg transition-colors ${u.role === 'super_admin' ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-red-50 text-red-600'}`}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Menampilkan {filteredUsers.length} dari {users.length} users
                            </p>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                                    Sebelumnya
                                </button>
                                <button className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm">
                                    1
                                </button>
                                <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
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
