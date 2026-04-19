'use client';

import { useEffect, useState, useCallback } from 'react';
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
    Activity,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    User as UserIcon,
    Shield,
    FileEdit,
    Trash2,
    LogIn,
    Download
} from 'lucide-react';

import { systemService, SystemLog } from '@/lib/services/system';
import { Loader2 } from 'lucide-react';

export default function ActivityLogsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [currentPage] = useState(1);
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await systemService.getLogs();
            setLogs(data);
            setIsLoading(false);
        } catch (_error) {
            console.error('Error fetching logs:', _error);
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
            fetchLogs();
        });
        return () => cancelAnimationFrame(timer);
    }, [router, fetchLogs]);

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                    <span className="text-purple-900 font-black uppercase tracking-widest text-xs">Memuat Log Aktivitas...</span>
                </div>
            </div>
        );
    }

    const getActionIcon = (action: string) => {
        const act = action.toUpperCase();
        if (act.includes('LOGIN')) return LogIn;
        if (act.includes('CREATE')) return FileEdit;
        if (act.includes('UPDATE')) return FileEdit;
        if (act.includes('DELETE')) return Trash2;
        if (act.includes('EXPORT')) return Download;
        if (act.includes('BACKUP')) return Shield;
        return Activity;
    };

    const getActionColor = (action: string) => {
        const act = action.toUpperCase();
        if (act.includes('LOGIN')) return 'bg-blue-100 text-blue-700';
        if (act.includes('CREATE')) return 'bg-emerald-100 text-emerald-700';
        if (act.includes('UPDATE')) return 'bg-amber-100 text-amber-700';
        if (act.includes('DELETE')) return 'bg-red-100 text-red-700';
        if (act.includes('EXPORT')) return 'bg-purple-100 text-purple-700';
        if (act.includes('BACKUP')) return 'bg-indigo-100 text-indigo-700';
        return 'bg-gray-100 text-gray-700';
    };

    const filteredLogs = logs.filter(log => {
        const matchSearch = (log.userName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (log.action?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (log.target?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchAction = filterAction === 'all' || log.action === filterAction;
        return matchSearch && matchAction;
    });

    return (
        <div className="min-h-screen bg-gray-50">
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
                    {/* Breadcrumb & Title */}
                    <div className="mb-6 lg:mb-10">
                        <Link
                            href="/dashboard/admin"
                            className="inline-flex items-center gap-2 text-xs lg:text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                            Kembali ke Dashboard
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-3 lg:gap-4">
                                <div className="w-10 h-10 lg:w-14 lg:h-14 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center border border-purple-200 dark:border-purple-500/20 shadow-sm">
                                    <Activity className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600" />
                                </div>
                                <div>
                                    <h1 className="text-lg lg:text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
                                        Activity <span className="text-purple-600">Logs</span>
                                    </h1>
                                    <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[8px] lg:text-[10px] mt-1 lg:mt-2">
                                        Audit trail aktivitas sistem
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 lg:px-6 lg:py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl lg:rounded-2xl text-gray-700 dark:text-gray-300 font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm active:scale-95">
                                    <Download className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                    CSV
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari user, action, atau target..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-gray-400" />
                                <select
                                    value={filterAction}
                                    onChange={(e) => setFilterAction(e.target.value)}
                                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                                >
                                    <option value="all">All Actions</option>
                                    <option value="LOGIN">Login</option>
                                    <option value="CREATE">Create</option>
                                    <option value="UPDATE">Update</option>
                                    <option value="DELETE">Delete</option>
                                    <option value="EXPORT">Export</option>
                                    <option value="BACKUP">Backup</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Logs Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Timestamp</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">User</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Action</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Target</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">IP Address</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredLogs.map((log) => {
                                        const ActionIcon = getActionIcon(log.action);
                                        return (
                                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4">
                                                    <span className="text-sm text-gray-800 font-mono">{log.timestamp}</span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                            <UserIcon className="w-4 h-4 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-800 text-sm">{log.userName}</p>
                                                            <p className="text-xs text-gray-400">{log.userRole}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${getActionColor(log.action)}`}>
                                                        <ActionIcon className="w-3.5 h-3.5" />
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm text-gray-600">{log.target}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm text-gray-500 font-mono">{log.ipAddress}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    {log.status === 'success' ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            <span className="text-xs font-medium">Success</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-red-600">
                                                            <XCircle className="w-4 h-4" />
                                                            <span className="text-xs font-medium">Failed</span>
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Menampilkan {filteredLogs.length} dari 500 logs
                            </p>
                            <div className="flex items-center gap-2">
                                <button className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">
                                    {currentPage}
                                </span>
                                <span className="text-gray-400">of 50</span>
                                <button className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
