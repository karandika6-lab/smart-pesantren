'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    User
} from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    ArrowLeft,
    CheckCircle2,
    Calendar,
    Users,
    Save,
    Loader2,
    ScanLine,
    ListChecks
} from 'lucide-react';
import Link from 'next/link';
import { Html5Qrcode } from 'html5-qrcode';
import { studentsService } from '@/lib/services/students';
import { attendanceService } from '@/lib/services/attendance';
import { getLocalDate } from '@/lib/services/helpers';
import { AlertCircle, RefreshCcw, ShieldCheck, Zap } from 'lucide-react';

interface ScannedStudent {
    id: string;
    name: string;
    nis: string;
    time: string;
    status: 'hadir' | 'tidak_hadir';
    synced: boolean;
}

export default function AbsensiScannerPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Scanner State
    const [scannedList, setScannedList] = useState<ScannedStudent[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastScannedName, setLastScannedName] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScanTimeRef = useRef<number>(0);
    const [scanError, setScanError] = useState<string | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isSecureContext, setIsSecureContext] = useState(true);
    
    // Form State
    const [sessionName, setSessionName] = useState('Kegiatan Umum');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [autoSync, setAutoSync] = useState(false);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);

        // Check secure context (HTTPS requirement)
        if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
            setIsSecureContext(false);
        }

        // Load from local storage if exists
        const saved = localStorage.getItem('qr_scanned_list');
        if (saved) {
            try {
                setScannedList(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load saved scans');
            }
        }
    }, [router]);

    // Save to local storage whenever scannedList changes
    useEffect(() => {
        if (scannedList.length > 0) {
            localStorage.setItem('qr_scanned_list', JSON.stringify(scannedList));
        }
    }, [scannedList]);

    const startScanner = async () => {
        if (!isSecureContext) {
            setScanError("Kamera memerlukan koneksi HTTPS agar bisa terbuka di perangkat mobile.");
            return;
        }

        try {
            setScanError(null);
            setIsScanning(true);
            
            // Short delay to ensure DOM and WebView are stabilized
            await new Promise(r => setTimeout(r, 300));

            // Create target element if it somehow disappeared
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode("reader");
            }

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            await scannerRef.current.start(
                { facingMode: "environment" }, // Prefer back camera
                config,
                onScanSuccess,
                onScanFailure
            );
            
            setIsCameraReady(true);
        } catch (err: any) {
            console.error("Failed to start scanner:", err);
            setIsScanning(false);
            
            if (err?.includes?.("Permission")) {
                setScanError("Izin kamera ditolak. Silakan aktifkan izin kamera di pengaturan browser/aplikasi Anda.");
            } else if (err?.includes?.("NotFound")) {
                setScanError("Kamera tidak ditemukan di perangkat ini.");
            } else {
                setScanError(`Gagal membuka kamera: ${err?.message || "Kesalahan tidak dikenal"}`);
            }
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                setIsCameraReady(false);
                setIsScanning(false);
            } catch (err) {
                console.error("Failed to stop scanner:", err);
            }
        } else {
            setIsScanning(false);
        }
    };

    useEffect(() => {
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const onScanSuccess = async (decodedText: string) => {
        const now = Date.now();
        if (now - lastScanTimeRef.current < 2500) return;
        
        try {
            // Extract UUID (matches xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
            const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
            const match = decodedText.match(uuidRegex);
            const studentId = match ? match[0] : null;

            if (!studentId) {
                console.warn('Invalid QR format');
                return;
            }

            lastScanTimeRef.current = now;
            
            if (scannedList.some(s => s.id === studentId && !s.synced)) {
                playBeep(false);
                return;
            }

            const student = await studentsService.getById(studentId);
            if (student) {
                playBeep(true);
                
                const newStudent: ScannedStudent = {
                    id: student.id,
                    name: student.name,
                    nis: student.nis || '-',
                    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    status: 'hadir',
                    synced: false
                };
                
                setScannedList(prev => [newStudent, ...prev]);
                setLastScannedName(student.name);
                setTimeout(() => setLastScannedName(null), 3000);

                if (autoSync) {
                    await syncSingleStudent(newStudent);
                }
            }
        } catch (error) {
            console.error('Scan error:', error);
        }
    };

    const syncSingleStudent = async (student: ScannedStudent) => {
        if (!user) return;
        const today = getLocalDate();
        try {
            await attendanceService.submitAttendance(
                today,
                [{
                    student_id: student.id,
                    student_name: student.name,
                    nis: student.nis,
                    status: 'hadir',
                    notes: `Auto-Sync jam ${student.time}`
                }],
                user.id,
                sessionName,
                'activity'
            );
            setScannedList(prev => prev.map(s => s.id === student.id ? { ...s, synced: true } : s));
        } catch (e) {
            console.error('Auto-sync failed');
        }
    };

    const onScanFailure = () => {};

    const playBeep = (success: boolean) => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = success ? 'sine' : 'square';
            osc.frequency.setValueAtTime(success ? 800 : 300, ctx.currentTime);
            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + (success ? 0.1 : 0.2));
        } catch (e) {}
    };

    const handleSaveBatch = async () => {
        if (scannedList.filter(s => !s.synced).length === 0) return;
        if (!user) return;
        
        setIsSubmitting(true);
        const today = new Date().toISOString().split('T')[0];
        const unsynced = scannedList.filter(s => !s.synced);
        
        const payload = unsynced.map(s => ({
            student_id: s.id,
            student_name: s.name,
            nis: s.nis,
            status: 'hadir' as const,
            notes: `Batch-Sync jam ${s.time}`
        }));

        try {
            await attendanceService.submitAttendance(today, payload, user.id, sessionName, 'kegiatan_umum');
            setScannedList(prev => prev.map(s => ({ ...s, synced: true })));
            localStorage.removeItem('qr_scanned_list');
            alert('Berhasil menyimpan data absensi!');
        } catch (error) {
            alert('Gagal menyinkronkan data.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemove = (id: string) => {
        setScannedList(prev => prev.filter(s => s.id !== id));
        if (scannedList.length <= 1) localStorage.removeItem('qr_scanned_list');
    };

    if (!user) return null;

    const unsyncedCount = scannedList.filter(s => !s.synced).length;

    return (
        <div className="min-h-screen bg-[#050505] flex">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={() => { /* Handle logout */ }}
            />

            <div className="flex-1 lg:ml-64 flex flex-col items-center">
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8 w-full max-w-6xl">
                    {/* Header */}
                    <div className="mb-6 lg:mb-10">
                        <Link
                            href={user.role === 'ustadz' ? "/dashboard/ustadz" : "/dashboard/absensi"}
                            className="inline-flex items-center gap-2 text-xs lg:text-sm text-neutral-500 hover:text-white mb-6 underline-offset-4 hover:underline transition-all group font-black uppercase tracking-widest"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Kembali ke Portal
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <h1 className="text-2xl lg:text-4xl font-black text-white tracking-tight uppercase leading-none">
                                    Scanner <span className="text-blue-500">Absensi</span>
                                </h1>
                                <p className="text-neutral-500 text-[10px] lg:text-xs font-bold uppercase tracking-[0.2em] mt-2">
                                    Pindai Kartu Santri • Mode Kehadiran Instan
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                        {/* Scanner Area */}
                        <div className="space-y-6">
                            <div className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] p-6 lg:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                                {/* Success overlay animation */}
                                {lastScannedName && (
                                    <div className="absolute inset-0 z-50 bg-emerald-500/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                            <CheckCircle2 className="w-16 h-16 text-white" />
                                        </div>
                                        <h2 className="text-2xl lg:text-4xl font-black text-white uppercase tracking-tight text-center px-6 leading-none">{lastScannedName}</h2>
                                        <p className="text-emerald-100 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">BERHASIL TERCATAT</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${isScanning ? 'bg-blue-500/20 text-blue-400' : 'bg-neutral-800 text-neutral-500'}`}>
                                            <ScanLine className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Arahkan Kamera</h3>
                                    </div>
                                    
                                    <button 
                                        onClick={isScanning ? stopScanner : startScanner}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isScanning ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/20' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'}`}
                                    >
                                        {isScanning ? 'Matikan Kamera' : 'Buka Kamera'}
                                    </button>
                                </div>

                                {/* Scanner Container */}
                                <div className="bg-black rounded-3xl overflow-hidden border-2 border-white/5 aspect-square lg:aspect-video relative group-hover:border-blue-500/20 transition-colors shadow-inner flex items-center justify-center">
                                    {/* Permanently in DOM, but hidden when not scanning */}
                                    <div 
                                        id="reader" 
                                        className={`w-full h-full transition-opacity duration-500 ${isScanning && isCameraReady ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}
                                    ></div>

                                    {/* Placeholder when not scanning */}
                                    {!isScanning && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-800 p-8 text-center animate-in fade-in duration-500">
                                            <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                                                <ShieldCheck className="w-8 h-8 opacity-20" />
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">Klik tombol &ldquo;Buka Kamera&rdquo; untuk memulai pemindaian QR</p>
                                        </div>
                                    )}

                                    {/* Loading state */}
                                    {isScanning && !isCameraReady && !scanError && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 animate-in fade-in">
                                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Inisialisasi Kamera...</p>
                                        </div>
                                    )}

                                    {/* Scan Errors Overlay */}
                                    {scanError && (
                                        <div className="absolute inset-0 z-[60] bg-rose-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                                                <AlertCircle className="w-10 h-10 text-rose-500" />
                                            </div>
                                            <h4 className="text-white font-black uppercase tracking-widest text-sm mb-4">Gagal Mengakses Kamera</h4>
                                            <p className="text-rose-200/60 text-xs font-medium leading-relaxed max-w-xs">{scanError}</p>
                                            <button 
                                                onClick={startScanner}
                                                className="mt-8 px-6 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-200 transition-colors"
                                            >
                                                <RefreshCcw className="w-4 h-4" />
                                                Coba Lagi
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Form Settings */}
                            <div className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] p-6 lg:p-8 backdrop-blur-xl shadow-2xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-neutral-800 rounded-xl text-neutral-400">
                                                <Zap className="w-4 h-4" />
                                            </div>
                                            <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Opsi Sesi</h3>
                                        </div>
                                        <div>
                                            <label className="block text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-2 px-1">Sesi Kegiatan</label>
                                            <select 
                                                value={sessionName}
                                                onChange={(e) => setSessionName(e.target.value)}
                                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 appearance-none font-bold text-xs"
                                            >
                                                <option value="Kegiatan Umum">Harian / Umum</option>
                                                <option value="Apel Pagi">Apel Pagi</option>
                                                <option value="Kajian Diniyah">Kajian</option>
                                                <option value="Ekstrakurikuler">Eskul</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-neutral-800 rounded-xl text-neutral-400">
                                                <RefreshCcw className="w-4 h-4" />
                                            </div>
                                            <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Sinkronisasi</h3>
                                        </div>
                                        <div 
                                            onClick={() => setAutoSync(!autoSync)}
                                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${autoSync ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-neutral-950 border-white/5 hover:border-white/10'}`}
                                        >
                                            <div>
                                                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${autoSync ? 'text-emerald-400' : 'text-neutral-400'}`}>Auto-Simpan</p>
                                                <p className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">Langsung ke DB</p>
                                            </div>
                                            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${autoSync ? 'bg-emerald-500' : 'bg-neutral-800'}`}>
                                                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${autoSync ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scanned List Area */}
                        <div className="bg-white rounded-[2.5rem] shadow-2xl flex flex-col h-[500px] lg:h-auto lg:max-h-[850px] overflow-hidden">
                            <div className="p-8 lg:p-10 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-neutral-50/50">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                                            <ListChecks className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-sm lg:text-lg font-black text-gray-900 uppercase tracking-tight">Daftar Hadir</h3>
                                    </div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                        Total Scan: <span className="text-blue-600 underline underline-offset-4 decoration-blue-200">{scannedList.length} Santri</span>
                                    </p>
                                </div>
                                <button
                                    onClick={handleSaveBatch}
                                    disabled={unsyncedCount === 0 || isSubmitting}
                                    className="px-6 py-4 bg-gray-900 hover:bg-black disabled:bg-gray-100 disabled:text-gray-300 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3 shadow-xl active:scale-95 group"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Simpan {unsyncedCount > 0 && `(${unsyncedCount})`}
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-4">
                                {scannedList.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-300 p-10 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6 border border-gray-100">
                                            <Users className="w-10 h-10 opacity-20" />
                                        </div>
                                        <p className="font-black uppercase tracking-[0.2em] text-[10px] leading-relaxed">Belum ada data pindaian dalam sesi ini</p>
                                    </div>
                                ) : (
                                    scannedList.map((santri) => (
                                        <div key={santri.id} className={`p-4 lg:p-6 rounded-3xl border flex items-center justify-between transition-all group ${santri.synced ? 'bg-emerald-50/40 border-emerald-100' : 'bg-gray-50/50 border-gray-100 hover:border-blue-200'}`}>
                                            <div className="flex items-center gap-4 lg:gap-6">
                                                <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${santri.synced ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {santri.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm lg:text-base font-black text-gray-900 uppercase tracking-tight">{santri.name}</p>
                                                    <div className="flex items-center gap-3 mt-1 lg:mt-2">
                                                        <span className="text-[9px] font-black tracking-widest text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{santri.nis}</span>
                                                        <span className="text-[9px] font-black tracking-widest text-blue-600 uppercase">Jam {santri.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                {santri.synced ? (
                                                    <div className="flex items-center gap-2 bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md shadow-emerald-500/20">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Saved
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleRemove(santri.id)}
                                                        className="text-[9px] font-black text-rose-500 hover:text-white uppercase tracking-widest px-4 py-2 hover:bg-rose-500 rounded-xl transition-all border border-rose-100 lg:opacity-0 lg:group-hover:opacity-100"
                                                    >
                                                        Batal
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
