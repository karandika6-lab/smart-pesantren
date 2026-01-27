'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    ClipboardList,
    FileText,
    Download,
    Calendar,
    Filter,
    ArrowUpRight,
    PieChart,
    BarChart3,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { kesantrianService } from '@/lib/services/kesantrian';
import { dormitoriesService } from '@/lib/services/dormitories';
import { generatePDF } from '@/lib/pdf-generator';

export default function LaporanKesantrianPage() {
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    const handleDownload = async (type: string) => {
        setIsGenerating(type);
        try {
            let data: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

            switch (type) {
                case 'monthly-violations':
                    // Fetch all violations (filtering handled in generator or here if needed)
                    // For now getting all, ideally filtered by month selected
                    const allViolations = await kesantrianService.getAllViolations();
                    // Optional: Filter for current month if needed, but report says "Laporan Bulanan"
                    // Let's assume we want all for this demo or filtered by the UI "Januari 2026" text if it was real state
                    data = allViolations;
                    break;

                case 'top-offenders':
                    data = await kesantrianService.getTopViolators();
                    break;

                case 'permits-summary':
                    // Combine pending and history if needed, or just history
                    // Reports usually want finalized data
                    const history = await kesantrianService.getPermissionHistory();
                    data = history;
                    break;

                case 'dorm-occupancy':
                    data = await dormitoriesService.getAll();
                    break;
            }

            if (data && data.length > 0) {
                generatePDF(type, data);
            } else {
                alert('Tidak ada data untuk laporan ini.');
            }

        } catch (error) {
            console.error('Error generating report:', error);
            alert('Gagal membuat laporan. Silakan coba lagi.');
        } finally {
            setIsGenerating(null);
        }
    };

    const reports = [
        {
            id: 'monthly-violations',
            title: 'Laporan Pelanggaran Bulanan',
            desc: 'Rekap seluruh pelanggaran santri per bulan beserta poin akumulasi.',
            icon: FileText,
            color: 'rose'
        },
        {
            id: 'top-offenders',
            title: 'Santri Top Poin (Bermasalah)',
            desc: 'Daftar santri dengan poin pelanggaran tertinggi untuk tindak lanjut.',
            icon: BarChart3,
            color: 'orange'
        },
        {
            id: 'permits-summary',
            title: 'Rekap Perizinan Keluar',
            desc: 'Data statistik perizinan santri, alasan terbanyak, dan keterlambatan kembali.',
            icon: PieChart,
            color: 'indigo'
        },
        {
            id: 'dorm-occupancy',
            title: 'Laporan Okupansi Asrama',
            desc: 'Status hunian gedung dan kamar per semester berjalan.',
            icon: ClipboardList,
            color: 'emerald'
        }
    ];

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/dashboard/kesantrian"
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mb-2 transition-colors font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Dashboard
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <ClipboardList className="w-8 h-8 text-orange-600" />
                            Pusat Laporan Kesantrian
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Export data kedisiplinan dan perizinan dalam format PDF/Excel
                        </p>
                    </div>
                </div>
            </div>

            {/* Export Controls */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 mb-8 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-600 tracking-wide">Januari 2026</span>
                    <Filter className="w-4 h-4 text-gray-300 ml-2" />
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-sm font-bold text-gray-600 tracking-wide">Semua Jenjang</span>
                    <ArrowUpRight className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em] ml-auto mr-4 hidden lg:block">Data Sync: 10m ago</p>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reports.map((report) => (
                    <div key={report.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 group hover:border-orange-200 transition-all duration-300 relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${report.color}-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform`} />

                        <div className="relative z-10">
                            <div className={`w-14 h-14 bg-${report.color}-50 text-${report.color}-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                                <report.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-lg font-extrabold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{report.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-8">{report.desc}</p>

                            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Terakhir Dibuat</span>
                                    <span className="text-xs font-bold text-gray-700">31 Des 2025</span>
                                </div>
                                <button
                                    onClick={() => handleDownload(report.id)}
                                    disabled={isGenerating !== null}
                                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl text-xs transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isGenerating === report.id ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            DOWNLOAD PDF
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Tips */}
            <div className="mt-12 bg-orange-50/50 rounded-[2rem] p-8 border border-orange-100 border-dashed">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><CheckCircle2 className="w-5 h-5" /></div>
                    <h4 className="font-bold text-gray-800 uppercase tracking-wider">Tips Pelaporan</h4>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                    Pastikan seluruh data pelanggaran dan perizinan telah divalidasi oleh Musyrif Gedung masing-masing sebelum mengunduh laporan bulanan. Data santri top poin akan direset setiap pergantian tahun ajaran baru.
                </p>
            </div>
        </div>
    );
}
