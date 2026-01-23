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
    Settings,
    Save,
    Upload,
    CheckCircle2,
    Loader2,
    Globe,
    Shield,
    Bell,
    Palette
} from 'lucide-react';

import { settingsService, academicYearService } from '@/lib/services';

export default function GlobalSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Form state
    const [settings, setSettings] = useState({
        appName: '',
        tagline: '',
        logoUrl: '',
        primaryColor: '#8b5cf6',
        maintenanceMode: false,
        allowRegistration: true,
        emailNotifications: true,
        smsNotifications: false,
        autoBackup: true,
        sessionTimeout: 30,
        activeAcademicYearId: '',
    });

    const [academicYears, setAcademicYears] = useState<any[]>([]);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'super_admin') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        loadData();
    }, [router]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [fetchedSettings, fetchedYears] = await Promise.all([
                settingsService.get(),
                academicYearService.getAll()
            ]);

            setSettings({
                appName: fetchedSettings.app_name,
                tagline: fetchedSettings.tagline || '',
                logoUrl: fetchedSettings.logo_url || '',
                primaryColor: fetchedSettings.primary_color,
                maintenanceMode: fetchedSettings.maintenance_mode,
                allowRegistration: fetchedSettings.allow_registration,
                emailNotifications: fetchedSettings.email_notifications,
                smsNotifications: fetchedSettings.sms_notifications,
                autoBackup: fetchedSettings.auto_backup,
                sessionTimeout: fetchedSettings.session_timeout,
                activeAcademicYearId: fetchedSettings.active_academic_year_id || '',
            });

            setAcademicYears(fetchedYears);
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading settings:', error);
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await settingsService.update({
                app_name: settings.appName,
                tagline: settings.tagline,
                logo_url: settings.logoUrl,
                primary_color: settings.primaryColor,
                maintenance_mode: settings.maintenanceMode,
                allow_registration: settings.allowRegistration,
                email_notifications: settings.emailNotifications,
                sms_notifications: settings.smsNotifications,
                auto_backup: settings.autoBackup,
                session_timeout: settings.sessionTimeout,
                active_academic_year_id: settings.activeAcademicYearId || null,
            });

            // If academic year changed, we might need to update that table too or it's handled by this foreign key
            if (settings.activeAcademicYearId) {
                // Optional: Ensure only one is active in academic_years table if we want redundancy
                // await academicYearService.setActive(settings.activeAcademicYearId);
            }

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Gagal menyimpan settings.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!user || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-[60] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-medium">Settings berhasil disimpan!</span>
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
                                    <Settings className="w-7 h-7 text-purple-600" />
                                    Global Settings
                                </h1>
                                <p className="text-gray-500">
                                    Konfigurasi pengaturan global aplikasi
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
                                        Save Settings
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* General Settings */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-purple-600" />
                                General Settings
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">App Name</label>
                                    <input
                                        type="text"
                                        value={settings.appName}
                                        onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
                                    <input
                                        type="text"
                                        value={settings.tagline}
                                        onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Logo</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center overflow-hidden">
                                            {settings.logoUrl ? (
                                                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-white font-bold text-xl">SP</span>
                                            )}
                                        </div>
                                        <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                                            <Upload className="w-4 h-4" />
                                            <span>Pilih File</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setSettings({ ...settings, logoUrl: reader.result as string });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Recommended: 512x512px, PNG or SVG</p>
                                </div>
                            </div>
                        </div>

                        {/* Appearance */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                <Palette className="w-5 h-5 text-purple-600" />
                                Appearance
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Color</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={settings.primaryColor}
                                            onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                            className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={settings.primaryColor}
                                            onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tahun Ajaran Aktif</label>
                                    <select
                                        value={settings.activeAcademicYearId}
                                        onChange={(e) => setSettings({ ...settings, activeAcademicYearId: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-gray-900 font-bold"
                                        disabled={academicYears.length === 0}
                                    >
                                        <option value="">-- Pilih Tahun Ajaran --</option>
                                        {academicYears.map(year => (
                                            <option key={year.id} value={year.id}>{year.name} {year.is_active ? '(Aktif)' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Session Timeout (minutes)</label>
                                    <input
                                        type="number"
                                        value={settings.sessionTimeout}
                                        onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Security Settings */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-600" />
                                Security & Access
                            </h3>
                            <div className="space-y-4">
                                {/* Maintenance Mode */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-800">Maintenance Mode</p>
                                        <p className="text-sm text-gray-500">Disable access for non-admin users</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.maintenanceMode}
                                            onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>

                                {/* Allow Registration */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-800">Allow New Registrations</p>
                                        <p className="text-sm text-gray-500">Enable self-registration for new users</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.allowRegistration}
                                            onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>

                                {/* Auto Backup */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-800">Auto Backup</p>
                                        <p className="text-sm text-gray-500">Daily automatic database backup at 02:00</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.autoBackup}
                                            onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Notification Settings */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                <Bell className="w-5 h-5 text-purple-600" />
                                Notifications
                            </h3>
                            <div className="space-y-4">
                                {/* Email Notifications */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-800">Email Notifications</p>
                                        <p className="text-sm text-gray-500">Send system alerts via email</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.emailNotifications}
                                            onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>

                                {/* SMS Notifications */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-800">SMS Notifications</p>
                                        <p className="text-sm text-gray-500">Send critical alerts via SMS</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.smsNotifications}
                                            onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
