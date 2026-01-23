'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getCurrentUser,
    clearSession,
    User,
    ROLE_NAMES
} from '@/lib/auth';
import {
    APP_SETTINGS,
    RaporConfig,
    getStoredSettings,
    saveSettings,
    getSemesterName
} from '@/lib/raporConfig';
import { raporSettingsService } from '@/lib/services/rapor-settings';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/layout/Sidebar';
import {
    Menu,
    Bell,
    ChevronDown,
    ArrowLeft,
    Save,
    Loader2,
    CheckCircle2,
    Building,
    User as UserIcon,
    CalendarDays,
    BookOpen,
    RotateCcw,
    Eye,
    Upload,
    ImageIcon,
    X
} from 'lucide-react';

export default function RaporSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Settings state - initialized with stored/default values
    const [settings, setSettings] = useState<RaporConfig>(APP_SETTINGS);

    // UI state
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_akademik' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        loadSettings();
    }, [router]);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            // Try to load from database first
            const dbSettings = await raporSettingsService.getSettings();
            if (dbSettings) {
                setSettings({
                    ...APP_SETTINGS,
                    yayasan_name: dbSettings.yayasan_name || APP_SETTINGS.yayasan_name,
                    school_name: dbSettings.school_name || APP_SETTINGS.school_name,
                    school_name_arabic: dbSettings.school_name_arabic || '',
                    address: dbSettings.address || '',
                    phone: dbSettings.phone || '',
                    email: dbSettings.email || '',
                    website: dbSettings.website || '',
                    logo_url: dbSettings.logo_url || '',
                    pengasuh_pondok_name: dbSettings.pengasuh_pondok_name || '',
                    pengasuh_pondok_nip: dbSettings.pengasuh_pondok_nip || '',
                    active_semester: dbSettings.active_semester || 1,
                    academic_year: dbSettings.academic_year || '2024/2025',
                    report_city: dbSettings.report_city || '',
                    city_date: ''
                });
            } else {
                // Fallback to localStorage
                const stored = getStoredSettings();
                setSettings(stored);
            }
        } catch (e) {
            console.warn('Load from DB failed, using localStorage:', e);
            const stored = getStoredSettings();
            setSettings(stored);
        }
        setIsLoading(false);
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    const handleSave = async () => {
        setIsSaving(true);

        try {
            // Save to database
            await raporSettingsService.updateSettings({
                yayasan_name: settings.yayasan_name,
                school_name: settings.school_name,
                school_name_arabic: settings.school_name_arabic,
                address: settings.address,
                phone: settings.phone,
                email: settings.email,
                website: settings.website,
                logo_url: settings.logo_url,
                pengasuh_pondok_name: (settings as any).pengasuh_pondok_name || '',
                pengasuh_pondok_nip: (settings as any).pengasuh_pondok_nip || '',
                active_semester: settings.active_semester,
                academic_year: settings.academic_year,
                report_city: settings.report_city
            });

            // Also save to localStorage for backup
            saveSettings(settings);

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Save error:', error);
            // Fallback to localStorage only
            saveSettings(settings);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }

        setIsSaving(false);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Hanya file gambar yang diperbolehkan!');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file maksimal 2MB!');
            return;
        }

        setIsUploading(true);
        try {
            const logoUrl = await raporSettingsService.uploadLogo(file);
            setSettings({ ...settings, logo_url: logoUrl });
            alert('Logo berhasil diupload!');
        } catch (error: any) {
            console.error('Upload error:', error);
            alert('Gagal upload logo: ' + (error.message || 'Unknown error'));
        }
        setIsUploading(false);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveLogo = () => {
        if (confirm('Hapus logo?')) {
            setSettings({ ...settings, logo_url: '' });
        }
    };

    const handleReset = () => {
        if (confirm('Reset semua pengaturan ke default?')) {
            setSettings(APP_SETTINGS);
            localStorage.removeItem('rapor_settings');
        }
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="text-gray-500">Memuat pengaturan...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-[60] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-right">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-medium">Pengaturan berhasil disimpan! (Simulasi)</span>
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
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
                    >
                        <Menu className="w-5 h-5 text-gray-600" />
                    </button>

                    <div className="flex items-center gap-4 ml-auto">
                        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                            <Bell className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-700 font-semibold text-sm">{user.name.charAt(0)}</span>
                            </div>
                            <div className="hidden md:block">
                                <p className="text-sm font-medium text-gray-800">{user.name}</p>
                                <p className="text-xs text-gray-400">{ROLE_NAMES[user.role]}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>
                </header>

                <main className="p-4 lg:p-8">
                    {/* Breadcrumb & Title */}
                    <div className="mb-6">
                        <Link
                            href="/dashboard/akademik"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Dashboard
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Pengaturan Template Rapor</h1>
                                <p className="text-gray-500">Konfigurasi kop surat, penandatangan, dan semester aktif</p>
                            </div>
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <Eye className="w-5 h-5" />
                                {showPreview ? 'Tutup Preview' : 'Preview Kop Surat'}
                            </button>
                        </div>
                    </div>

                    {/* Preview Section */}
                    {showPreview && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
                            <h3 className="text-sm font-semibold text-gray-500 mb-4">PREVIEW KOP SURAT:</h3>
                            <div style={{ fontFamily: "'Times New Roman', serif" }} className="border border-gray-300 p-6">
                                <div className="flex items-center gap-4 mb-2">
                                    {settings.logo_url ? (
                                        <img src={settings.logo_url} alt="Logo" className="w-16 h-16 object-contain" />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                                            LOGO
                                        </div>
                                    )}
                                    <div className="flex-1 text-center">
                                        <p className="text-sm font-bold tracking-wide">{settings.yayasan_name}</p>
                                        <h2 className="text-xl font-bold tracking-wider">{settings.school_name}</h2>
                                        <p className="text-sm">{settings.address}</p>
                                        <p className="text-xs">Telp: {settings.phone} | Email: {settings.email}</p>
                                    </div>
                                    <div className="w-16"></div>
                                </div>
                                <div className="border-t-4 border-b border-black h-1 mt-2"></div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Institution Info - Left Column */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Building className="w-5 h-5 text-blue-600" />
                                <h3 className="font-semibold text-gray-800">Informasi Lembaga (Kop Surat)</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Yayasan</label>
                                    <input
                                        type="text"
                                        value={settings.yayasan_name}
                                        onChange={(e) => setSettings({ ...settings, yayasan_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Pesantren/Madrasah</label>
                                    <input
                                        type="text"
                                        value={settings.school_name}
                                        onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Lengkap</label>
                                    <textarea
                                        rows={2}
                                        value={settings.address}
                                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Telepon</label>
                                        <input
                                            type="text"
                                            value={settings.phone}
                                            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                                        <input
                                            type="email"
                                            value={settings.email}
                                            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Logo Upload */}
                                <div className="pt-4 border-t border-gray-100">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo Pondok (untuk Kop Rapor)</label>
                                    <div className="flex items-start gap-4">
                                        {settings.logo_url ? (
                                            <div className="relative">
                                                <img src={settings.logo_url} alt="Logo" className="w-20 h-20 object-contain border border-gray-200 rounded-xl bg-white p-2" />
                                                <button
                                                    onClick={handleRemoveLogo}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                                                {isUploading ? (
                                                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                                ) : (
                                                    <ImageIcon className="w-8 h-8 text-gray-300" />
                                                )}
                                            </div>
                                        )}
                                        <div className="flex-1 space-y-3">
                                            {/* File Upload Button */}
                                            <div>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    className="hidden"
                                                    id="logo-upload"
                                                />
                                                <label
                                                    htmlFor="logo-upload"
                                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium cursor-pointer transition-all ${isUploading
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                        }`}
                                                >
                                                    {isUploading ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Mengupload...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-4 h-4" />
                                                            Upload Logo
                                                        </>
                                                    )}
                                                </label>
                                            </div>

                                            {/* Or use URL */}
                                            <div className="text-xs text-gray-400 flex items-center gap-2">
                                                <div className="flex-1 h-px bg-gray-200"></div>
                                                <span>atau gunakan URL</span>
                                                <div className="flex-1 h-px bg-gray-200"></div>
                                            </div>

                                            <input
                                                type="text"
                                                placeholder="https://example.com/logo.png"
                                                value={settings.logo_url}
                                                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm"
                                            />
                                            <p className="text-xs text-gray-400">Format: PNG, JPG (maks 2MB)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Signatories */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <UserIcon className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-semibold text-gray-800">Penandatangan</h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Pengasuh Pondok</label>
                                        <input
                                            type="text"
                                            value={(settings as any).pengasuh_pondok_name || (settings as any).kepala_madrasah_name || ''}
                                            onChange={(e) => setSettings({ ...settings, pengasuh_pondok_name: e.target.value } as any)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">NIP Pengasuh Pondok</label>
                                        <input
                                            type="text"
                                            value={(settings as any).pengasuh_pondok_nip || (settings as any).kepala_madrasah_nip || ''}
                                            onChange={(e) => setSettings({ ...settings, pengasuh_pondok_nip: e.target.value } as any)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Semester & Academic Year */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <CalendarDays className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-semibold text-gray-800">Semester & Tahun Ajaran</h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Semester Aktif</label>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setSettings({ ...settings, active_semester: 1 })}
                                                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${settings.active_semester === 1
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                Semester 1 (Ganjil)
                                            </button>
                                            <button
                                                onClick={() => setSettings({ ...settings, active_semester: 2 })}
                                                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${settings.active_semester === 2
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                Semester 2 (Genap)
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Semester aktif menentukan jenis rapor yang akan dicetak oleh Wali Kelas.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tahun Ajaran</label>
                                        <input
                                            type="text"
                                            value={settings.academic_year}
                                            onChange={(e) => setSettings({ ...settings, academic_year: e.target.value })}
                                            placeholder="2024/2025"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Kota/Kabupaten</label>
                                        <input
                                            type="text"
                                            value={settings.report_city}
                                            onChange={(e) => setSettings({ ...settings, report_city: e.target.value })}
                                            placeholder="Lampung Timur"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                    <h4 className="font-semibold text-blue-800">Informasi</h4>
                                </div>
                                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                                    <li>Semester aktif saat ini: <strong>Semester {settings.active_semester} ({getSemesterName(settings.active_semester)})</strong></li>
                                    <li>Tahun ajaran: <strong>{settings.academic_year}</strong></li>
                                    <li>Pengaturan ini akan diterapkan ke semua rapor yang dicetak</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-col md:flex-row gap-4 justify-end">
                        <button
                            onClick={handleReset}
                            className="px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-5 h-5" />
                            Reset ke Default
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Simpan Pengaturan
                                </>
                            )}
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}
