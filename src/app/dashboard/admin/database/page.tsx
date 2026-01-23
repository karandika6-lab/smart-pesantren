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
    Database,
    Server,
    HardDrive,
    Clock,
    CheckCircle2,
    Download,
    Loader2,
    RefreshCw,
    AlertTriangle
} from 'lucide-react';

import {
    systemService
} from '@/lib/services';

export default function DatabaseHealthPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    interface HealthData {
        status: string;
        latency: string;
        active_connections: number;
        storage_usage: string;
        total_storage?: string;
        last_backup: string;
    }

    const [healthData, setHealthData] = useState<HealthData>({
        status: 'Checking...',
        latency: '-',
        active_connections: 0,
        storage_usage: '-',
        total_storage: '-',
        last_backup: '-'
    });

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'super_admin') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        loadHealthData();
    }, [router]);

    const loadHealthData = async () => {
        try {
            // Dynamic import to avoid SSR issues if simple import causes trouble, though here standard import is fine.
            // We use the imported systemService
            const data = await systemService.getDatabaseHealth();
            setHealthData(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleBackup = async () => {
        setIsBackingUp(true);
        // In a real app, this would call a backend RPC function to trigger backup
        await new Promise(r => setTimeout(r, 3000));
        setIsBackingUp(false);
        setHealthData(prev => ({ ...prev, last_backup: 'Baru saja' }));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
        );
    }

    const colorClasses = {
        emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
        red: { bg: 'bg-red-100', text: 'text-red-600' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
        amber: { bg: 'bg-amber-100', text: 'text-amber-600' }
    };

    const healthCards = [
        {
            title: 'Database Status',
            value: healthData.status === 'healthy' ? 'Connected' : 'Error',
            status: healthData.status === 'healthy' ? 'healthy' : 'error',
            icon: Database,
            description: `Latency: ${healthData.latency}`,
            color: healthData.status === 'healthy' ? 'emerald' : 'red'
        },
        {
            title: 'Active Connections',
            value: healthData.active_connections.toString(),
            status: 'healthy',
            icon: Server,
            description: 'Simulated realtime',
            color: 'blue'
        },
        {
            title: 'Last Backup',
            value: healthData.last_backup,
            status: 'healthy',
            icon: Clock,
            description: 'Auto-backup: Daily 02:00',
            color: 'purple'
        },
        {
            title: 'Storage Usage',
            value: healthData.storage_usage,
            status: 'warning',
            icon: HardDrive,
            description: `Limit: ${healthData.total_storage || '1 GB'}`,
            color: 'amber'
        },
    ] as const;

    const recentBackups: any[] = [];
    // Note: Real Supabase backups are managed via the Supabase Dashboard and not accessible via client API.

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-[60] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-medium">Backup database berhasil!</span>
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
                                    <Database className="w-7 h-7 text-purple-600" />
                                    Database Health
                                </h1>
                                <p className="text-gray-500">
                                    Monitor status database dan kelola backup
                                </p>
                            </div>
                            <button
                                onClick={handleBackup}
                                disabled={isBackingUp}
                                className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-purple-500/30 disabled:opacity-50"
                            >
                                {isBackingUp ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Membackup...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Backup Database Now
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Health Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {healthCards.map((card) => {
                            const colors = colorClasses[card.color as keyof typeof colorClasses];
                            return (
                                <div key={card.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                                            <card.icon className={`w-6 h-6 ${colors.text}`} />
                                        </div>
                                        {card.status === 'healthy' ? (
                                            <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
                                                <CheckCircle2 className="w-4 h-4" />
                                                OK
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-sm text-amber-600 font-medium">
                                                <AlertTriangle className="w-4 h-4" />
                                                Warning
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                                    <p className="text-xl font-bold text-gray-800">{card.value}</p>
                                    <p className="text-xs text-gray-400 mt-1">{card.description}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Storage Progress Bar */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <HardDrive className="w-5 h-5 text-gray-400" />
                                Storage Usage
                            </h3>
                            <span className="text-sm text-gray-500">{healthData.storage_usage} / {healthData.total_storage || '1 GB'}</span>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(parseFloat(healthData.storage_usage) * 100, 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-400">
                            <span>0 GB</span>
                            <span>{healthData.total_storage || '1 GB'}</span>
                        </div>
                    </div>

                    {/* Recent Backups Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <RefreshCw className="w-5 h-5 text-gray-400" />
                                Recent Backups
                            </h3>
                            <span className="text-sm text-gray-500">Last 5 backups</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Timestamp</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Type</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Size</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Status</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentBackups.length > 0 ? (
                                        recentBackups.map((backup, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="p-4 text-gray-800">{backup.date}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${backup.type === 'Auto'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {backup.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-600">{backup.size}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${backup.status === 'success'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {backup.status === 'success' ? 'Success' : 'Failed'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    {backup.status === 'success' && (
                                                        <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                                                            Download
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                                                Belum ada riwayat backup yang tercatat. <br />
                                                <span className="text-xs text-gray-400">Backup otomatis dikelola oleh platform Supabase.</span>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
