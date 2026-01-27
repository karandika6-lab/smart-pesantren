'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    getCurrentUser,
    clearSession,
    User
} from '@/lib/auth';
import {
    APP_SETTINGS,
    RaporConfig,
    saveSettings,
    getSemesterName,
    getStoredSettings
} from '@/lib/raporConfig';
import { raporSettingsService } from '@/lib/services/rapor-settings';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
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

    const loadSettings = useCallback(async () => {
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
        } catch (_e) {
            console.warn('Load from DB failed, using localStorage:', _e);
            const stored = getStoredSettings();
            setSettings(stored);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_akademik' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            loadSettings();
        });
        return () => cancelAnimationFrame(timer);
    }, [router, loadSettings]);

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
                pengasuh_pondok_name: settings.pengasuh_pondok_name || '',
                pengasuh_pondok_nip: settings.pengasuh_pondok_nip || '',
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
        } catch (error: unknown) {
            console.error('Upload error:', error);
            alert('Gagal mengupload logo: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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
        <div className="min-h-screen bg-[#050505] flex">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500/20 backdrop-blur-md border border-emerald-500/50 text-emerald-400 px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-xs">Konfigurasi Berhasil Disimpan</span>
                </div>
            )}

            {/* Sidebar */}
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="flex-1 lg:ml-64">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8">
                    {/* Breadcrumb & Title */}
                    <div className="mb-10">
                        <Link
                            href="/dashboard/akademik"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Kembali ke Dashboard
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
                                    <span className="w-2 h-8 bg-blue-600 rounded-full block"></span>
                                    Konfigurasi Template Rapor
                                </h1>
                                <p className="text-gray-400 mt-1 font-medium">
                                    Pengaturan identitas lembaga, logo, and penandatangan berkas rapor.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${showPreview
                                    ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                    : 'bg-neutral-900/40 border-white/5 text-gray-400 hover:text-white backdrop-blur-sm'
                                    }`}
                            >
                                <Eye className="w-5 h-5" />
                                {showPreview ? 'Tutup Preview' : 'Preview Kop Rapor'}
                            </button>
                        </div>
                    </div>

                    {/* Preview Section - Modern Glass Style */}
                    {showPreview && (
                        <div className="relative bg-white rounded-[2.5rem] p-12 mb-10 shadow-[0_20px_60px_rgba(255,255,255,0.05)] border border-white overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="absolute top-0 right-10 bg-blue-600 px-6 py-2 rounded-b-2xl font-black text-[10px] text-white uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20">PREVIEW AKTIF</div>

                            <div style={{ fontFamily: "'Times New Roman', serif" }} className="text-black max-w-4xl mx-auto">
                                <div className="flex items-center gap-8 py-4">
                                    {settings.logo_url ? (
                                        <div className="w-24 h-24 flex items-center justify-center border-2 border-gray-100 rounded-3xl p-2 bg-white shadow-inner shrink-0 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                            <Image src={settings.logo_url} alt="Logo" width={96} height={96} className="w-full h-full object-contain" unoptimized />
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center text-gray-300 text-[10px] font-bold uppercase tracking-widest shrink-0">
                                            LOGO
                                        </div>
                                    )}
                                    <div className="flex-1 text-center">
                                        <p className="text-lg font-bold tracking-wide mb-1 uppercase leading-tight">{settings.yayasan_name}</p>
                                        <h2 className="text-3xl font-black tracking-wider uppercase mb-2 text-blue-900">{settings.school_name}</h2>
                                        <p className="text-sm font-medium italic text-gray-600 mb-1">{settings.address}</p>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Telp: {settings.phone} | Email: {settings.email}</p>
                                    </div>
                                    <div className="w-24 lg:block hidden"></div>
                                </div>
                                <div className="h-1 bg-black w-full mt-4"></div>
                                <div className="h-0.5 bg-black w-full mt-0.5"></div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Institution Info - Left Column */}
                        <div className="bg-neutral-900/40 border border-white/5 rounded-[3rem] p-8 backdrop-blur-md shadow-2xl space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                    <Building className="w-5 h-5 text-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                                </div>
                                <h3 className="font-black text-white text-lg tracking-tight uppercase">Identitas Lembaga</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-2">Nama Yayasan</label>
                                        <input
                                            type="text"
                                            placeholder="Yayasan Pendidikan Islam..."
                                            value={settings.yayasan_name}
                                            onChange={(e) => setSettings({ ...settings, yayasan_name: e.target.value })}
                                            className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-2">Nama Instansi</label>
                                        <input
                                            type="text"
                                            placeholder="Pondok Pesantren..."
                                            value={settings.school_name}
                                            onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                                            className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-2">Alamat Operasional</label>
                                    <textarea
                                        rows={3}
                                        value={settings.address}
                                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                        className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-2">Telepon</label>
                                        <input
                                            type="text"
                                            value={settings.phone}
                                            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                            className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-2">Email Official</label>
                                        <input
                                            type="email"
                                            value={settings.email}
                                            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                            className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Logo Upload - 3D Card Style */}
                                <div className="pt-8 border-t border-white/5">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-2 mb-4 block">Logo Header Rapor</label>
                                    <div className="bg-black/20 border border-white/5 rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-8">
                                        {settings.logo_url ? (
                                            <div className="relative group shrink-0">
                                                <div className="absolute -inset-2 bg-blue-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <Image src={settings.logo_url} alt="Logo" width={112} height={112} className="relative w-28 h-28 object-contain bg-white rounded-[2rem] p-4 border border-white/10 shadow-2xl" unoptimized />
                                                <button
                                                    onClick={handleRemoveLogo}
                                                    className="absolute -top-2 -right-2 w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center hover:bg-rose-500 active:scale-95 shadow-lg border border-white/20 z-10"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-28 h-28 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center bg-black/40 gap-2 overflow-hidden relative shrink-0">
                                                {isUploading ? (
                                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                                ) : (
                                                    <>
                                                        <ImageIcon className="w-10 h-10 text-gray-700" />
                                                        <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Tiada Logo</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex-1 space-y-4 w-full">
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
                                                className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all shadow-lg ${isUploading
                                                    ? 'bg-neutral-800 text-gray-500 cursor-not-allowed'
                                                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20 active:scale-95'
                                                    }`}
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-5 h-5" />
                                                        Upload Berkas Logo
                                                    </>
                                                )}
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                    <BookOpen className="w-4 h-4 text-gray-700" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="URL logo (opsional)..."
                                                    value={settings.logo_url}
                                                    onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                                                    className="w-full pl-12 pr-6 py-3 bg-black/40 border border-white/5 rounded-xl text-white placeholder-gray-700 focus:outline-none text-xs font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-8">
                            {/* Signatories */}
                            <div className="bg-neutral-900/40 border border-white/5 rounded-[3rem] p-8 backdrop-blur-md shadow-2xl">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                                        <UserIcon className="w-5 h-5 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
                                    </div>
                                    <h3 className="font-black text-white text-lg tracking-tight uppercase">Pejabat Berwenang</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-2">Pengasuh Pondok</label>
                                        <input
                                            type="text"
                                            value={settings.pengasuh_pondok_name || ''}
                                            onChange={(e) => setSettings({ ...settings, pengasuh_pondok_name: e.target.value })}
                                            className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-2">NIP / NIY / NIK</label>
                                        <input
                                            type="text"
                                            value={settings.pengasuh_pondok_nip || ''}
                                            onChange={(e) => setSettings({ ...settings, pengasuh_pondok_nip: e.target.value })}
                                            className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold font-mono tracking-tighter"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Semester & Academic Year */}
                            <div className="bg-neutral-900/40 border border-white/5 rounded-[3rem] p-8 backdrop-blur-md shadow-2xl">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                        <CalendarDays className="w-5 h-5 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                                    </div>
                                    <h3 className="font-black text-white text-lg tracking-tight uppercase">Kalender Akademik</h3>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-2">Semester Berjalan</label>
                                        <div className="flex p-2 bg-black/60 rounded-[1.8rem] border border-white/5 gap-2">
                                            <button
                                                onClick={() => setSettings({ ...settings, active_semester: 1 })}
                                                className={`flex-1 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${settings.active_semester === 1
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40'
                                                    : 'text-gray-500 hover:text-gray-300'
                                                    }`}
                                            >
                                                Ganjil (1)
                                            </button>
                                            <button
                                                onClick={() => setSettings({ ...settings, active_semester: 2 })}
                                                className={`flex-1 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${settings.active_semester === 2
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40'
                                                    : 'text-gray-500 hover:text-gray-300'
                                                    }`}
                                            >
                                                Genap (2)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-2">Tahun Ajaran</label>
                                            <input
                                                type="text"
                                                value={settings.academic_year}
                                                onChange={(e) => setSettings({ ...settings, academic_year: e.target.value })}
                                                placeholder="2024/2025"
                                                className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-2">Kota Penerbitan</label>
                                            <input
                                                type="text"
                                                value={settings.report_city}
                                                onChange={(e) => setSettings({ ...settings, report_city: e.target.value })}
                                                placeholder="Nama Kota"
                                                className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Info Box */}
                            <div className="group relative bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/30 rounded-[2.5rem] p-8 overflow-hidden transition-all duration-500 hover:shadow-2xl">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[50px] group-hover:bg-blue-500/20 transition-all duration-700"></div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                                        <BookOpen className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <h4 className="font-black text-blue-400 text-sm uppercase tracking-widest">Informasi Sistem</h4>
                                </div>
                                <div className="space-y-3 relative z-10">
                                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Status Periode</span>
                                        <span className="text-xs font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Aktif</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Semester</span>
                                        <span className="text-xs font-black text-white uppercase tracking-widest">{settings.active_semester === 1 ? 'Ganjil' : 'Genap'}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Target Rapor</span>
                                        <span className="text-xs font-black text-white uppercase tracking-widest">{getSemesterName(settings.active_semester)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-12 flex flex-col md:flex-row gap-6 justify-end">
                        <button
                            onClick={handleReset}
                            className="px-8 py-5 border border-white/10 text-gray-500 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <RotateCcw className="w-5 h-5" />
                            Reset Default
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-3xl transition-all flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(37,99,235,0.3)] disabled:opacity-50 active:scale-95 group"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Save className="w-6 h-6 transition-transform group-hover:rotate-12" />
                                    Simpan Perubahan
                                </>
                            )}
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}
