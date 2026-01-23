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
    RaporConfig,
    StudentRaporData,
    getStoredSettings,
    getSemesterName,
    MOCK_STUDENTS
} from '@/lib/raporConfig';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import RaporSheet from '@/components/rapor/RaporSheet';
import {
    Menu,
    Bell,
    ChevronDown,
    ArrowLeft,
    Printer,
    FileText,
    Users,
    Search,
    Eye,
    X,
    Download,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';

import { homeroomService } from '@/lib/services/homeroom';
import { academicYearService } from '@/lib/services/academic';
import { raporService } from '@/lib/services/rapor';
import { raporSettingsService } from '@/lib/services/rapor-settings';

export default function WaliKelasRaporPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Settings
    const [settings, setSettings] = useState<RaporConfig | null>(null);
    const [classInfo, setClassInfo] = useState<any>(null);

    // Students data
    const [students, setStudents] = useState<StudentRaporData[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Modal & Print state
    const [selectedStudent, setSelectedStudent] = useState<StudentRaporData | null>(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    // Ref for print
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'wali_kelas') {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchInitialData(currentUser.id);
    }, [router]);

    const fetchInitialData = async (userId: string) => {
        try {
            setIsLoading(true);
            console.log('Fetching initial data for user:', userId);

            // Fetch everything we need: Class Info, Academic Year AND Rapor Settings
            const [cls, activeYear, dbSettings] = await Promise.all([
                homeroomService.getClassInfo(userId),
                academicYearService.getActive(),
                raporSettingsService.getSettings()
            ]);

            console.log('Class Info:', cls);
            console.log('Active Year from DB:', activeYear);
            console.log('Rapor Settings from DB:', dbSettings);

            if (!cls) {
                alert('Anda belum ditugaskan sebagai Wali Kelas.');
                router.replace('/dashboard/wali-kelas');
                return;
            }
            setClassInfo(cls);

            // Settings priority: Global Active Year > DB Rapor Settings > Config File Default
            const baseSettings = getStoredSettings();
            const currentSettings = {
                ...baseSettings,
                // ALWAYS prefer the Global Active Academic Year from the Management page
                academic_year: activeYear?.name || dbSettings?.academic_year || baseSettings.academic_year,
                active_semester: (activeYear?.semester || activeYear?.current_semester || dbSettings?.active_semester || 1) as 1 | 2
            };

            console.log('Final Settings Applied:', currentSettings);
            setSettings(currentSettings);

            // Fetch students and their rapor data
            const raporData = await raporService.getRaporDataByClass(cls.id, activeYear?.id, currentSettings.active_semester);
            console.log('Rapor Data Count:', raporData.length);
            setStudents(raporData as StudentRaporData[]);

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching initial data:', error);
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    // Filter students by search
    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery)
    );

    // Calculate average for a student
    const calculateAverage = (grades: { score: number }[]) => {
        if (!grades || grades.length === 0) return 0;
        const total = grades.reduce((sum, g) => sum + g.score, 0);
        return Math.round(total / grades.length);
    };

    // Handle single print
    const handlePrint = (student: StudentRaporData) => {
        setSelectedStudent(student);
        setIsPrinting(true);

        // Small delay to ensure component renders
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 500);
    };

    // Handle print all
    const handlePrintAll = () => {
        setIsPrinting(true);
        alert(`📄 Mencetak ${filteredStudents.length} rapor untuk Semester ${settings?.active_semester} (${getSemesterName(settings?.active_semester || 1)})\n\nFitur ini akan menghasilkan PDF untuk semua santri.`);
        setIsPrinting(false);
    };

    // Handle preview
    const handlePreview = (student: StudentRaporData) => {
        setSelectedStudent(student);
        setShowPreviewModal(true);
    };

    if (!user || !settings) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-gray-400">Memuat...</div>
            </div>
        );
    }

    const activeSemesterName = getSemesterName(settings.active_semester);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Sidebar */}
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="lg:pl-64 no-print">
                {/* Reusable Header Component */}
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-8">
                    {/* Breadcrumb & Title */}
                    <div className="mb-6">
                        <Link
                            href="/dashboard/wali-kelas"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Dashboard
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Cetak Rapor Santri</h1>
                                <p className="text-gray-500">Kelas {classInfo?.name || '-'} • {students.length} santri</p>
                            </div>
                            <button
                                onClick={handlePrintAll}
                                disabled={isPrinting}
                                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                            >
                                {isPrinting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Download className="w-5 h-5" />
                                )}
                                Cetak Semua (.PDF)
                            </button>
                        </div>
                    </div>

                    {/* Active Semester Info */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5 mb-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <FileText className="w-7 h-7 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">Semester Aktif</h3>
                                    <p className="text-2xl font-bold text-indigo-600">
                                        Semester {settings.active_semester} ({activeSemesterName})
                                    </p>
                                    <p className="text-sm text-gray-500">Tahun Ajaran {settings.academic_year}</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-indigo-100">
                                <p className="text-sm text-gray-600">
                                    {settings.active_semester === 2 ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 inline text-emerald-500 mr-1" />
                                            Rapor semester genap akan menyertakan <strong>Keputusan Kenaikan Kelas</strong>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-4 h-4 inline text-blue-500 mr-1" />
                                            Rapor semester ganjil (tanpa keputusan kenaikan)
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari santri berdasarkan nama atau NIS..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Students Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-600" />
                                <h3 className="font-semibold text-gray-800">Daftar Santri</h3>
                            </div>
                            <span className="text-sm text-gray-500">{filteredStudents.length} santri</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600 w-12">No</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Nama Santri</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-600">NIS</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">JK</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Rata-rata</th>
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600">Kehadiran</th>
                                        {settings.active_semester === 2 && (
                                            <th className="text-center p-4 text-sm font-semibold text-gray-600">Status</th>
                                        )}
                                        <th className="text-center p-4 text-sm font-semibold text-gray-600 w-40">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={settings.active_semester === 2 ? 8 : 7} className="p-10 text-center text-gray-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                                    <p>Memuat data santri...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan={settings.active_semester === 2 ? 8 : 7} className="p-10 text-center text-gray-400 italic">
                                                Tidak ada santri ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student, index) => {
                                            const avg = calculateAverage(student.grades);
                                            const totalAbsent = student.attendance.sakit + student.attendance.izin + student.attendance.alpha;

                                            return (
                                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-4 text-gray-500">{index + 1}</td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${student.gender === 'L' ? 'bg-blue-100' : 'bg-indigo-100'
                                                                }`}>
                                                                <span className={`font-semibold text-sm ${student.gender === 'L' ? 'text-blue-700' : 'text-indigo-700'
                                                                    }`}>
                                                                    {student.name.charAt(0)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-800">{student.name}</p>
                                                                <p className="text-xs text-gray-400">NISN: {student.nisn}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono">
                                                            {student.nis}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${student.gender === 'L'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-indigo-100 text-indigo-700'
                                                            }`}>
                                                            {student.gender}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`font-bold ${avg >= 80 ? 'text-emerald-600' :
                                                            avg >= 70 ? 'text-blue-600' :
                                                                'text-red-600'
                                                            }`}>
                                                            {avg}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`text-sm ${totalAbsent <= 3 ? 'text-emerald-600' :
                                                            totalAbsent <= 10 ? 'text-amber-600' :
                                                                'text-red-600'
                                                            }`}>
                                                            {totalAbsent} hari absen
                                                        </span>
                                                    </td>
                                                    {settings.active_semester === 2 && (
                                                        <td className="p-4 text-center">
                                                            {student.promotion?.isPromoted ? (
                                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                                                    Naik Kelas
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                                    Tinggal
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => handlePreview(student)}
                                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                                title="Preview"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handlePrint(student)}
                                                                disabled={isPrinting}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                                            >
                                                                <Printer className="w-4 h-4" />
                                                                Cetak
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
                    </div>
                </main>
            </div>

            {/* Preview Modal */}
            {showPreviewModal && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
                    <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-800">Preview Rapor</h3>
                                <p className="text-sm text-gray-500">{selectedStudent.name} - Semester {settings.active_semester}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        handlePrint(selectedStudent);
                                        setShowPreviewModal(false);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
                                >
                                    <Printer className="w-4 h-4" />
                                    Cetak
                                </button>
                                <button
                                    onClick={() => setShowPreviewModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4 bg-gray-100">
                            <div className="transform scale-75 origin-top">
                                <RaporSheet
                                    settings={settings}
                                    student={selectedStudent}
                                    semester={settings.active_semester}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Area */}
            {selectedStudent && (
                <div className="print-area">
                    <RaporSheet
                        ref={printRef}
                        settings={settings}
                        student={selectedStudent}
                        semester={settings.active_semester}
                    />
                </div>
            )}
        </div>
    );
}

