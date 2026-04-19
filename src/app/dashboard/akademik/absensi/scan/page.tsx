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
import { Html5QrcodeScanner } from 'html5-qrcode';
import { studentsService } from '@/lib/services/students';
import { attendanceService } from '@/lib/services/attendance';

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
    const [isScanning, setIsScanning] = useState(true);
    const [lastScannedName, setLastScannedName] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const lastScanTimeRef = useRef<number>(0);
    
    // Form State
    const [sessionName, setSessionName] = useState('Kegiatan Umum');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
    }, [router]);

    // Initialize Scanner
    useEffect(() => {
        if (!user) return;

        // Ensure we only create one scanner instance
        if (!scannerRef.current && isScanning) {
            scannerRef.current = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );
            
            scannerRef.current.render(onScanSuccess, onScanFailure);
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
        };
    }, [user, isScanning]); // eslint-disable-line react-hooks/exhaustive-deps

    const onScanSuccess = async (decodedText: string) => {
        // Prevent rapid duplicate scans (cooldown 3 seconds)
        const now = Date.now();
        if (now - lastScanTimeRef.current < 3000) return;
        
        try {
            // Text should be a URL like: https://domain/verify/santri/[uuid]
            // We just need the UUID at the end.
            const urlParts = decodedText.split('/');
            const studentId = urlParts[urlParts.length - 1];

            // Basic UUID validation (length 36 including hyphens)
            if (!studentId || studentId.length < 32) {
                console.warn('Invalid QR Code format', decodedText);
                return;
            }

            // Lock scanner momentarily
            lastScanTimeRef.current = now;
            
            // Check if already scanned
            if (scannedList.some(s => s.id === studentId)) {
                // Play warning beep
                playBeep(false);
                return;
            }

            // Fetch Student Details to show name
            const student = await studentsService.getById(studentId);
            if (student) {
                // Play success beep
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
                
                // Clear popup after 3s
                setTimeout(() => setLastScannedName(null), 3000);
            }
        } catch (error) {
            console.error('Error processing scan:', error);
        }
    };

    const onScanFailure = (error: any) => {
        // Ignore standard parsing errors (happens every frame it doesn't see a QR)
    };

    const playBeep = (success: boolean) => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            if (success) {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.5, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            } else {
                // Error / Duplicate Beep
                osc.type = 'square';
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                gain.gain.setValueAtTime(0.5, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            }
        } catch (e) {
            console.warn('Audio context not supported');
        }
    };

    const handleSaveBatch = async () => {
        if (scannedList.length === 0) return;
        if (!user) return;
        
        setIsSubmitting(true);
        const today = new Date().toISOString().split('T')[0];
        
        // Convert to format required by attendanceService.submitAttendance
        const payload = scannedList.map(s => ({
            student_id: s.id,
            student_name: s.name,
            nis: s.nis,
            status: 'hadir' as const,
            notes: `Discan jam ${s.time}`
        }));

        try {
            await attendanceService.submitAttendance(
                today,
                payload,
                user.id,
                sessionName,
                'kegiatan_umum'
            );
            
            // Mark all as synced
            setScannedList(prev => prev.map(s => ({ ...s, synced: true })));
            alert('Berhasil menyimpan data absensi!');
        } catch (error) {
            console.error('Error saving attendance:', error);
            alert('Gagal menyinkronkan data ke server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemove = (id: string) => {
        setScannedList(prev => prev.filter(s => s.id !== id));
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
                    <div className="mb-8">
                        <Link
                            href={user.role === 'ustadz' ? "/dashboard/ustadz" : "/dashboard/absensi"}
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Kembali
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                                    <span className="w-2 h-8 bg-blue-600 rounded-full block"></span>
                                    Scanner Absensi
                                </h1>
                                <p className="text-gray-400 mt-1">
                                    Pindai Kartu Santri untuk mencatat kehadiran Harian.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Scanner Area */}
                        <div className="space-y-6">
                            <div className="bg-neutral-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-2xl relative overflow-hidden">
                                {/* Success overlay animation */}
                                {lastScannedName && (
                                    <div className="absolute inset-0 z-50 bg-emerald-500/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                                        <CheckCircle2 className="w-20 h-20 text-white mb-4 animate-bounce" />
                                        <h2 className="text-2xl font-black text-white uppercase tracking-wider text-center">{lastScannedName}</h2>
                                        <p className="text-emerald-100 font-bold uppercase tracking-widest mt-2">Berhasil Hadir</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <ScanLine className="w-5 h-5 text-blue-500" />
                                        Arahkan Kamera
                                    </h3>
                                    
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setIsScanning(!isScanning)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${isScanning ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                        >
                                            {isScanning ? 'Tutup Kamera' : 'Buka Kamera'}
                                        </button>
                                    </div>
                                </div>

                                {/* Specific container for html5-qrcode */}
                                <div className="bg-black rounded-2xl overflow-hidden border-2 border-white/10 aspect-video relative">
                                    {isScanning ? (
                                        <div id="reader" className="w-full"></div>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                            <ScanLine className="w-12 h-12 mb-2 opacity-50" />
                                            <p className="text-sm font-bold uppercase tracking-widest">Kamera Dinonaktifkan</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Form Pengaturan Sesi */}
                            <div className="bg-neutral-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-2xl">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                    Pengaturan Sesi Absen
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pilih Nama Kegiatan/Sesi</label>
                                        <select 
                                            value={sessionName}
                                            onChange={(e) => setSessionName(e.target.value)}
                                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none font-bold"
                                        >
                                            <option value="Kegiatan Umum">Harian / Kegiatan Umum</option>
                                            <option value="Apel Pagi">Apel Pagi</option>
                                            <option value="Kajian Diniyah">Kajian Diniyah</option>
                                            <option value="Ekstrakurikuler">Ekstrakurikuler</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scanned List Area */}
                        <div className="bg-white rounded-3xl p-6 shadow-2xl flex flex-col min-h-[400px] lg:h-[700px] max-h-[60vh] lg:max-h-none">
                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                        <ListChecks className="w-6 h-6 text-emerald-500" />
                                        Daftar Hadir Instan
                                    </h3>
                                    <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">
                                        Total Scan: <span className="text-blue-600">{scannedList.length} Santri</span>
                                    </p>
                                </div>
                                <button
                                    onClick={handleSaveBatch}
                                    disabled={unsyncedCount === 0 || isSubmitting}
                                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Simpan {unsyncedCount > 0 && `(${unsyncedCount})`}
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                {scannedList.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                        <Users className="w-16 h-16 mb-4 opacity-20" />
                                        <p className="font-bold uppercase tracking-widest text-sm">Belum Ada Scan</p>
                                        <p className="text-xs font-medium max-w-xs text-center mt-2 opacity-50">Daftar santri yang berhasil dipindai akan muncul di sini secara berurutan.</p>
                                    </div>
                                ) : (
                                    scannedList.map((santri) => (
                                        <div key={santri.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all group ${santri.synced ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${santri.synced ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {santri.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 uppercase">{santri.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-black tracking-widest text-gray-500">{santri.nis}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                        <span className="text-[10px] font-bold tracking-widest text-emerald-600">Jam {santri.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                {santri.synced ? (
                                                    <span className="text-[10px] bg-emerald-500 text-white px-2 py-1 rounded-lg font-bold uppercase tracking-widest">Tersimpan</span>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleRemove(santri.id)}
                                                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-widest px-2 py-1 bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
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
