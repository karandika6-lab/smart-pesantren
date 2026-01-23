'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getCurrentUser,
    clearSession,
    User,
    ROLE_NAMES
} from '@/lib/auth';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import {
    ArrowLeft,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Download,
    Trash2,
    Save,
    Eye,
    FileWarning,
    Table,
    FileText,
    Users,
    UserPlus,
    Phone
} from 'lucide-react';
import { parseFile, ParsedStudentData, ParseResult } from '@/lib/utils/file-parser';
import { supabase } from '@/lib/supabase';
import { classesService } from '@/lib/services/classes';

// ============================================
// Types
// ============================================

interface ClassOption {
    id: string;
    name: string;
}

// ============================================
// Column Mapping Info
// ============================================

const EXPECTED_COLUMNS = [
    { key: 'no', label: 'NO', required: false },
    { key: 'nis', label: 'NAMA INDUK SANTRI', required: true },
    { key: 'nama', label: 'NAMA SANTRI', required: true },
    { key: 'ttl', label: 'TTL', required: false },
    { key: 'jenisKelamin', label: 'JENIS KELAMIN', required: true },
    { key: 'namaAyah', label: 'NAMA AYAH', required: false },
    { key: 'noHpWali', label: 'No Hp wali santri', required: false },
    { key: 'alamat', label: 'ALAMAT', required: false },
];

export default function ImportSantriPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // File upload state
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);

    // Data state
    const [parsedData, setParsedData] = useState<ParsedStudentData[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    // Class selection
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');

    // Auto-create user option (1 akun = santri + wali)
    const [createStudentAccount, setCreateStudentAccount] = useState(true);

    // Save state
    const [isSaving, setIsSaving] = useState(false);
    const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });
    const [saveResults, setSaveResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
    const [saveComplete, setSaveComplete] = useState(false);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin_akademik' && currentUser.role !== 'super_admin')) {
            router.replace('/login');
            return;
        }
        setUser(currentUser);
        fetchClasses();
    }, [router]);

    const fetchClasses = async () => {
        try {
            const data = await classesService.getAll();
            setClasses(data.map(c => ({ id: c.id, name: c.name })));
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    // Drag & Drop handlers
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, []);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileSelect = async (file: File) => {
        const validExtensions = ['.xlsx', '.xls', '.csv', '.docx', '.doc'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!validExtensions.includes(fileExtension)) {
            alert('Format file tidak didukung. Gunakan file Excel (.xlsx, .xls, .csv) atau Word (.docx)');
            return;
        }

        setUploadedFile(file);
        setIsProcessing(true);
        setParseError(null);

        try {
            const result: ParseResult = await parseFile(file);

            if (!result.success || result.data.length === 0) {
                setParseError(result.message || 'Tidak ada data yang dapat dibaca');
                setIsProcessing(false);
                return;
            }

            setParsedData(result.data);
            setShowPreview(true);
        } catch (error: any) {
            console.error('Parse error:', error);
            setParseError(error.message || 'Gagal memproses file');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveFile = () => {
        setUploadedFile(null);
        setParsedData([]);
        setShowPreview(false);
        setParseError(null);
        setSaveComplete(false);
        setSaveResults({ success: 0, failed: 0, errors: [] });
    };

    const handleSaveToDatabase = async () => {
        const validData = parsedData.filter(d => d.isValid);
        if (validData.length === 0) {
            alert('Tidak ada data valid untuk disimpan!');
            return;
        }

        if (!selectedClassId) {
            alert('Pilih kelas terlebih dahulu!');
            return;
        }

        // Validasi pesantren_id - PENTING untuk multi-tenancy
        if (!user?.pesantrenId) {
            console.warn('Warning: pesantrenId is not set for current user');
            if (!confirm('Peringatan: Pesantren ID tidak terdeteksi. Santri mungkin akan masuk ke pesantren yang salah. Lanjutkan?')) {
                return;
            }
        }

        setIsSaving(true);
        setSaveProgress({ current: 0, total: validData.length });
        const results = { success: 0, failed: 0, errors: [] as string[] };

        console.log('Starting import for', validData.length, 'students to class', selectedClassId, 'pesantren:', user?.pesantrenId);

        for (let i = 0; i < validData.length; i++) {
            const row = validData[i];
            setSaveProgress({ current: i + 1, total: validData.length });

            try {
                // Prepare data for RPC - Unified account (1 akun = santri + wali)
                const studentData = {
                    nis: String(row.nis),
                    name: String(row.nama),
                    gender: row.jenisKelamin,
                    class_id: selectedClassId,
                    birth_info: row.ttl || '',
                    parent_name: row.namaAyah || row.namaIbu || 'Wali ' + row.nama,
                    parent_phone: row.noHpWali || null,
                    address: row.alamat || '',
                    // IMPORTANT: Include pesantren_id from current user
                    pesantren_id: user?.pesantrenId || null,
                    // Auto user creation - 1 akun bisa dual role
                    email: `santri.${row.nis}@pesantren.local`,
                    create_student_account: createStudentAccount
                };

                console.log(`[${i + 1}/${validData.length}] Saving:`, row.nama, 'NIS:', row.nis);

                // Try RPC first
                const { data: rpcData, error: rpcError } = await supabase.rpc('automated_registration', {
                    p_type: 'student',
                    p_data: studentData
                });

                if (rpcError) {
                    console.warn('RPC error:', rpcError);

                    // Fallback: Direct insert without user creation
                    console.log('Fallback: Using direct insert...');
                    const { data: insertData, error: insertError } = await supabase
                        .from('students')
                        .insert({
                            nis: String(row.nis),
                            name: String(row.nama),
                            gender: row.jenisKelamin,
                            class_id: selectedClassId,
                            birth_info: row.ttl || '',
                            parent_name: row.namaAyah || row.namaIbu || '',
                            parent_phone: row.noHpWali || '',
                            address: row.alamat || '',
                            pesantren_id: user?.pesantrenId || null,
                            status: 'active'
                        })
                        .select();

                    if (insertError) {
                        console.error('Insert error:', insertError);
                        throw new Error(insertError.message || insertError.code);
                    }

                    console.log('Direct insert success:', insertData);
                    results.success++;
                } else {
                    // Check RPC response
                    if (rpcData && rpcData.success === false) {
                        console.warn('RPC returned failure:', rpcData.message);
                        throw new Error(rpcData.message || 'RPC failed');
                    }
                    console.log('RPC success:', rpcData);
                    results.success++;
                }
            } catch (error: any) {
                console.error(`Error saving row ${i + 1}:`, error);
                results.failed++;
                results.errors.push(`Baris ${i + 1} (${row.nama}): ${error.message || 'Unknown error'}`);
            }

            // Small delay to prevent overwhelming the server
            await new Promise(r => setTimeout(r, 100));
        }

        console.log('Import complete:', results);
        setSaveResults(results);
        setIsSaving(false);
        setSaveComplete(true);
    };

    const downloadTemplate = () => {
        // Format sesuai dengan file user
        const headers = ['NO', 'NAMA INDUK SANTRI', 'NAMA SANTRI', 'TTL', 'JENIS KELAMIN', 'NAMA AYAH', 'NAMA IBU', 'ALAMAT'];
        const sampleRows = [
            ['1', '0272170721', 'Adelia Andriyani', 'Merandung Sari, 03 April 2008', 'Perempuan', 'Abu Bakar', '', 'Toba'],
            ['2', '0273170721', 'Agus Sulis Tiani', 'Sukaraja Tiga, 14 Agustus 2008', 'Perempuan', 'Miskani', '', 'Melaris'],
            ['3', '0276170721', 'Al Faiz Maulana Setiawan', 'Bandar Lampung, 17 Februari 2009', 'Laki Laki', 'Sugianto', '', 'Telusan Lunyai'],
        ];

        const csvContent = [headers.join(','), ...sampleRows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'template_import_santri.csv';
        link.click();
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    const validCount = parsedData.filter(d => d.isValid).length;
    const invalidCount = parsedData.filter(d => !d.isValid).length;

    return (
        <div className="min-h-screen bg-black">
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
                            href="/dashboard/akademik/santri"
                            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Data Santri
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white">Import Data Santri</h1>
                                <p className="text-gray-400">Upload file Excel atau Word untuk import data santri secara massal</p>
                            </div>
                            <button
                                onClick={downloadTemplate}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 font-medium rounded-xl hover:bg-gray-800 transition-colors"
                            >
                                <Download className="w-5 h-5" />
                                Download Template
                            </button>
                        </div>
                    </div>

                    {/* Column Mapping Info */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Table className="w-5 h-5 text-blue-400 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-blue-300 mb-2">Format Kolom yang Diharapkan</h3>
                                <div className="flex flex-wrap gap-2">
                                    {EXPECTED_COLUMNS.map(col => (
                                        <span
                                            key={col.key}
                                            className={`px-2 py-1 rounded text-xs font-medium ${col.required
                                                ? 'bg-blue-500/30 text-blue-300'
                                                : 'bg-gray-700 text-gray-400'
                                                }`}
                                        >
                                            {col.label} {col.required && '*'}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-sm text-blue-400 mt-2">* = Wajib diisi | Format: Excel (.xlsx, .xls, .csv) atau Word (.docx)</p>
                            </div>
                        </div>
                    </div>

                    {/* Upload Area */}
                    {!showPreview && (
                        <div
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${isDragging
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                                }`}
                        >
                            {isProcessing ? (
                                <div className="space-y-4">
                                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
                                    <div>
                                        <p className="font-semibold text-white">Memproses File...</p>
                                        <p className="text-sm text-gray-400">{uploadedFile?.name}</p>
                                    </div>
                                </div>
                            ) : parseError ? (
                                <div className="space-y-4">
                                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                                    <div>
                                        <p className="font-semibold text-red-400">Gagal Memproses File</p>
                                        <p className="text-sm text-gray-400">{parseError}</p>
                                    </div>
                                    <button
                                        onClick={handleRemoveFile}
                                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                                    >
                                        Coba Lagi
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileSpreadsheet className="w-10 h-10 text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">
                                        Drag & Drop File di Sini
                                    </h3>
                                    <p className="text-gray-400 mb-4">atau klik untuk memilih file</p>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv,.docx,.doc"
                                        onChange={handleFileInputChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <FileSpreadsheet className="w-4 h-4" /> Excel
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-4 h-4" /> Word
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Preview Section */}
                    {showPreview && !saveComplete && (
                        <div className="space-y-6">
                            {/* File Info & Stats */}
                            <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                            <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{uploadedFile?.name}</p>
                                            <p className="text-sm text-gray-400">
                                                {parsedData.length} baris data terdeteksi
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="text-sm font-medium">{validCount} Valid</span>
                                        </div>
                                        {invalidCount > 0 && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg">
                                                <AlertCircle className="w-4 h-4" />
                                                <span className="text-sm font-medium">{invalidCount} Error</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={handleRemoveFile}
                                            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Settings */}
                            <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
                                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-400" />
                                    Pengaturan Import
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Class Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                            Kelas Tujuan *
                                        </label>
                                        <select
                                            value={selectedClassId}
                                            onChange={(e) => setSelectedClassId(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        >
                                            <option value="">Pilih Kelas...</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Auto create unified account (santri + wali) */}
                                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                        <input
                                            type="checkbox"
                                            id="createStudent"
                                            checked={createStudentAccount}
                                            onChange={(e) => setCreateStudentAccount(e.target.checked)}
                                            className="w-5 h-5 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <label htmlFor="createStudent" className="flex flex-col text-gray-300">
                                            <span className="flex items-center gap-2 font-medium">
                                                <UserPlus className="w-4 h-4 text-emerald-400" />
                                                Buat Akun Login
                                            </span>
                                            <span className="text-xs text-gray-500">1 akun = bisa login Santri & Wali</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Info box for dual-role */}
                                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <p className="text-xs text-blue-300">
                                        <strong>💡 Info:</strong> Setiap santri mendapat 1 akun yang bisa digunakan untuk login sebagai <strong>Santri</strong> atau <strong>Wali Santri</strong> dengan email & password yang sama.
                                    </p>
                                </div>
                            </div>

                            {/* Data Preview Table */}
                            <div className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
                                <div className="p-5 border-b border-gray-700 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-5 h-5 text-gray-400" />
                                        <h3 className="font-semibold text-white">Preview Data Import</h3>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-700/50 border-b border-gray-600">
                                            <tr>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-400">Status</th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-400">NO</th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-400">NIS</th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-400">Nama Santri</th>
                                                <th className="text-center p-4 text-sm font-semibold text-gray-400">JK</th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-400">No HP Wali</th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-400">Nama Ayah</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {parsedData.slice(0, 20).map((row, index) => (
                                                <tr key={index} className={`hover:bg-gray-700/30 ${!row.isValid ? 'bg-red-500/10' : ''}`}>
                                                    <td className="p-4">
                                                        {row.isValid ? (
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                        ) : (
                                                            <div className="group relative">
                                                                <AlertCircle className="w-5 h-5 text-red-500" />
                                                                <div className="absolute left-0 top-6 hidden group-hover:block bg-red-900 text-white text-xs p-2 rounded-lg shadow-lg z-10 whitespace-nowrap">
                                                                    {row.errors.join(', ')}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-gray-400">{row.no}</td>
                                                    <td className="p-4">
                                                        <span className={`font-medium ${!row.nis ? 'text-red-400' : 'text-white'}`}>
                                                            {row.nis || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-medium text-white">{row.nama}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.jenisKelamin === 'L'
                                                            ? 'bg-blue-500/20 text-blue-400'
                                                            : 'bg-pink-500/20 text-pink-400'
                                                            }`}>
                                                            {row.jenisKelamin}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-gray-400 text-sm">{row.noHpWali || '-'}</td>
                                                    <td className="p-4 text-gray-400 text-sm">{row.namaAyah || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {parsedData.length > 20 && (
                                        <div className="p-4 text-center text-gray-500 bg-gray-700/30">
                                            ... dan {parsedData.length - 20} data lainnya
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar (saat saving) */}
                            {isSaving && (
                                <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-white font-medium">Mengimpor data...</span>
                                        <span className="text-gray-400">{saveProgress.current} / {saveProgress.total}</span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                            style={{ width: `${(saveProgress.current / saveProgress.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col md:flex-row gap-4 justify-end">
                                <button
                                    onClick={handleRemoveFile}
                                    disabled={isSaving}
                                    className="px-6 py-3 border border-gray-600 text-gray-300 font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    Batalkan Import
                                </button>
                                <button
                                    onClick={handleSaveToDatabase}
                                    disabled={isSaving || validCount === 0 || !selectedClassId}
                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Simpan ke Database ({validCount} data)
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Warning for invalid data */}
                            {invalidCount > 0 && (
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <FileWarning className="w-5 h-5 text-amber-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-amber-300">Perhatian</h4>
                                            <p className="text-sm text-amber-400/80">
                                                Terdapat {invalidCount} baris data yang tidak valid dan tidak akan disimpan.
                                                Hover pada ikon error untuk melihat detail kesalahan.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Save Complete Result */}
                    {saveComplete && (
                        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-8 text-center">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Import Selesai!</h2>
                            <p className="text-gray-400 mb-6">
                                {saveResults.success} data berhasil diimpor
                                {saveResults.failed > 0 && `, ${saveResults.failed} gagal`}
                            </p>

                            {saveResults.errors.length > 0 && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-left max-h-40 overflow-y-auto">
                                    <h4 className="font-semibold text-red-300 mb-2">Error Details:</h4>
                                    <ul className="text-sm text-red-400 space-y-1">
                                        {saveResults.errors.map((err, i) => (
                                            <li key={i}>• {err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={handleRemoveFile}
                                    className="px-6 py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-colors"
                                >
                                    Import Lagi
                                </button>
                                <Link
                                    href="/dashboard/akademik/santri"
                                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                                >
                                    Lihat Data Santri
                                </Link>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
