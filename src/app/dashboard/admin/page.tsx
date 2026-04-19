'use client';

import { useEffect, useState, useCallback } from 'react';
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
    LoginTrafficChart
} from '@/components/charts';
import AddUserModal, { NewUserData } from '@/components/admin/AddUserModal';
import EditUserModal from '@/components/admin/EditUserModal';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    Users,
    AlertTriangle,
    Loader2,
    CheckCircle2,
    Shield,
    Plus,
    BookOpen,
    Activity,
    XCircle,
    Search,
    Edit,
    Trash2
} from 'lucide-react';

import { pesantrenService, Pesantren, ChartDataPoint } from '@/lib/services/pesantren';
import { usersService, LoginTrafficItem, SystemHealthItem } from '@/lib/services/users';


// ============================================
// Types
// ============================================

interface DashboardUser extends User {
    is_active?: boolean;
    last_login?: string;
    created_at?: string;
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

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Real Data State
    const [users, setUsers] = useState<DashboardUser[]>([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalPesantren: 0,
        systemHealth: 'Optimal',
    });
    const [systemHealth, setSystemHealth] = useState<SystemHealthItem[]>([]);
    const [userDistribution, setUserDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
    const [loginTraffic, setLoginTraffic] = useState<ChartDataPoint[]>([]);
    const [pesantrenGrowth, setPesantrenGrowth] = useState<ChartDataPoint[]>([]);

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchDashboardData = useCallback(async () => {
        try {
            const safeFetch = async <T, D>(promise: Promise<T>, defaultValue: D): Promise<T | D> => {
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

            setUsers(allUsers as DashboardUser[]);
            setStats({
                totalUsers: (userStats as { total: number }).total,
                activeUsers: (userStats as { active: number }).active,
                totalPesantren: (allPesantren as Pesantren[]).length,
                systemHealth: 'Optimal'
            });
            setSystemHealth(health as SystemHealthItem[]);
            setLoginTraffic(loginTrafficData as ChartDataPoint[]);
            setPesantrenGrowth(growthData as ChartDataPoint[]);

            const distribution = [
                { name: 'SaaS Admin', value: (allUsers as User[]).filter((u: User) => u.role === 'super_admin').length, color: '#8b5cf6' },
                { name: 'Unit Staff', value: (allUsers as User[]).filter((u: User) => u.role !== 'super_admin' && u.role !== 'santri' && u.role !== 'wali_santri').length, color: '#3b82f6' },
                { name: 'Santri/Wali', value: (allUsers as User[]).filter((u: User) => u.role === 'santri' || u.role === 'wali_santri').length, color: '#10b981' },
            ];
            setUserDistribution(distribution.filter(d => d.value > 0));

            setIsLoading(false);
        } catch (error) {
            console.error('Critical dashboard error:', error);
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
            fetchDashboardData();
        });

        const unsubscribe = usersService.subscribeToChanges(() => fetchDashboardData());
        return () => {
            cancelAnimationFrame(timer);
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [router, fetchDashboardData]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleCreateUser = async (userData: NewUserData) => {
        try {
            await usersService.create(
                userData.email,
                userData.password,
                userData.name,
                userData.role as UserRole,
                userData.phone,
                userData.pesantrenId
            );

            setShowAddModal(false);
            setSuccessMessage(`User ${userData.name} berhasil ditambahkan!`);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            fetchDashboardData();
        } catch (err) {
            alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const handleUpdateUser = async (userId: string, data: { name: string; role: UserRole; phone: string }) => {
        try {
            await usersService.update(userId, {
                name: data.name,
                phone: data.phone
            });

            // Also update role if needed
            const currentUser = users.find(u => u.id === userId);
            if (currentUser && currentUser.role !== data.role) {
                await usersService.updateRole(userId, data.role);
            }

            setShowEditModal(false);
            setEditingUser(null);
            setSuccessMessage(`User ${data.name} berhasil diperbarui!`);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            fetchDashboardData();
        } catch (err) {
            alert('Error updating user: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const handleEditUser = (u: User) => {
        setEditingUser(u);
        setShowEditModal(true);
    };

    const handleToggleStatus = async (id: string) => {
        try {
            await usersService.toggleActive(id);
            fetchDashboardData();
        } catch (err) {
            alert('Gagal mengubah status: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
    const filteredUsers = users.filter((u: DashboardUser) => {
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
                    <span className="font-medium">{successMessage}</span>
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
                user={editingUser}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                }}
                onSubmit={handleUpdateUser}
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

                <main className="p-4 lg:p-10 max-w-[1600px] mx-auto">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-purple-900 to-indigo-950 rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-10 text-white mb-6 lg:mb-10 border border-purple-500/20 shadow-2xl overflow-hidden relative">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full -mr-20 -mt-20 mix-blend-overlay" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8">
                            <div>
                                <div className="flex items-center gap-3 lg:gap-5">
                                    <div className="w-10 h-10 lg:w-16 lg:h-16 bg-white/10 rounded-xl lg:rounded-2xl border border-white/10 flex items-center justify-center shadow-inner backdrop-blur-md">
                                        <Shield className="w-5 h-5 lg:w-8 lg:h-8 text-purple-200" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg lg:text-3xl font-black tracking-tight leading-none uppercase">Super Admin <span className="text-purple-300">Dashboard</span></h2>
                                        <p className="text-purple-200/50 text-[8px] lg:text-[10px] font-bold uppercase tracking-[0.2em] mt-1 lg:mt-2">System Control Center</p>
                                    </div>
                                </div>
                                <p className="text-purple-100/60 text-sm lg:text-base font-medium mt-4 lg:mt-6 max-w-xl hidden sm:block">
                                    Kelola pengguna, konfigurasi sistem, dan pantau aktivitas operasional pesantren secara real-time.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="w-full md:w-auto px-6 py-2.5 lg:px-8 lg:py-4 bg-white text-purple-900 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-sm uppercase tracking-widest hover:bg-purple-50 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600" />
                                Tambah User
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid - Mobile 2 Columns */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm transition-all hover:border-purple-200 hover:shadow-md">
                            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <p className="text-3xl font-black text-gray-800 tracking-tight">{stats.totalUsers}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Users (Global)</p>
                        </div>
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <p className="text-3xl font-black text-gray-800 tracking-tight">{stats.activeUsers}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Active Sessions</p>
                        </div>
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                            </div>
                            <p className="text-3xl font-black text-gray-800 tracking-tight">{stats.totalPesantren}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Total Pesantren</p>
                        </div>
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm transition-all hover:border-amber-200 hover:shadow-md">
                            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                                <Activity className="w-6 h-6 text-amber-600" />
                            </div>
                            <p className="text-2xl font-black text-gray-800 tracking-tight truncate">{stats.systemHealth}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">SaaS Health</p>
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
                            <LoginTrafficChart
                                data={loginTraffic}
                                color="#8b5cf6"
                                height={280}
                            />
                        </ChartCard>

                        <ChartCard
                            title="Pertumbuhan Pesantren"
                            subtitle="Unit yang baru bergabung"
                        >
                            <LoginTrafficChart
                                data={pesantrenGrowth}
                                color="#10b981"
                                height={280}
                            />
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
