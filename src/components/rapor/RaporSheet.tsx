'use client';

import { forwardRef } from 'react';
import { convertGrade } from '@/lib/gradeConverter';
import { RaporConfig, StudentRaporData, getSemesterName } from '@/lib/raporConfig';

interface RaporSheetProps {
    settings: RaporConfig;
    student: StudentRaporData;
    semester: 1 | 2;
}

const RaporSheet = forwardRef<HTMLDivElement, RaporSheetProps>(
    ({ settings, student, semester }, ref) => {
        // Data processing
        const mapelDiniyah = student.grades
            .filter(g => {
                const cat = g.category?.toLowerCase();
                return cat === 'agama' || cat === 'diniyah';
            })
            .map(g => ({ subject: g.subject, score: g.score }));

        const mapelMuatanLokal = student.grades
            .filter(g => {
                const cat = g.category?.toLowerCase();
                return cat === 'umum' || cat === 'muatan lokal' || cat === 'muatan_lokal';
            })
            .map(g => ({ subject: g.subject, score: g.score }));

        const diniyahWithConversion = mapelDiniyah.map(g => ({
            ...g,
            conversion: convertGrade(g.score),
        }));

        const muatanLokalWithConversion = mapelMuatanLokal.map(g => ({
            ...g,
            conversion: convertGrade(g.score),
        }));

        const allGrades = [...diniyahWithConversion, ...muatanLokalWithConversion];
        const totalScore = allGrades.reduce((sum, g) => sum + g.score, 0);
        const average = allGrades.length > 0 ? Math.round(totalScore / allGrades.length) : 0;
        const averageConversion = convertGrade(average);

        const formatDate = () => {
            const now = new Date();
            const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
        };

        const isSemester2 = semester === 2;
        const isPromoted = student.promotion?.isPromoted ?? true;
        const nextClass = student.promotion?.nextClass || (parseInt(student.class) + 1).toString();

        const kepribadian = {
            'Kelakuan / Akal': 'Baik',
            'Kerajinan / Kesungguhan': 'Baik',
            'Kerapihan / Kebersihan': 'Baik'
        };

        const ranking = 1;
        const catatan = student.gender === 'L' ?
            'Alhamdulillah, ananda menunjukkan semangat belajar yang sangat baik. Pertahankan prestasimu dan teruslah istiqomah dalam murojaah hafalan.' :
            'Alhamdulillah, ananda menunjukkan semangat belajar yang sangat baik. Pertahankan prestasimu dan teruslah istiqomah dalam murojaah hafalan.';

        const toArabicDigits = (num: number): string => {
            if (!num || isNaN(num)) return '٠';
            const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
            return num.toString().split('').map(d => arabicDigits[parseInt(d)] || d).join('');
        };

        return (
            <>
                <style jsx global>{`
                    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Times+New+Roman:wght@400;700&display=swap');
                    
                    @media print {
                        @page {
                            size: 215mm 330mm !important;
                            margin: 0 !important;
                        }
                        html, body {
                            width: 215mm !important;
                            height: 330mm !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            background-color: white !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            overflow: visible !important;
                        }
                        .rapor-page {
                            width: 215mm !important;
                            min-height: 330mm !important;
                            box-shadow: none !important;
                            margin: 0 !important;
                            padding: 10mm 15mm !important;
                            page-break-after: always;
                            border: none !important;
                            background-color: white !important;
                            position: relative !important;
                            left: 0 !important;
                            top: 0 !important;
                        }
                        /* Visibility approach to avoid blank pages if display:none removes the root */
                        body * {
                            visibility: hidden;
                        }
                        .rapor-page, .rapor-page * {
                            visibility: visible;
                        }
                        .rapor-page {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 215mm !important;
                            min-height: 330mm !important;
                            padding: 10mm 15mm !important;
                            margin: 0 !important;
                            background-color: white !important;
                            box-shadow: none !important;
                            border: none !important;
                        }
                    }

                    .font-arabic { font-family: 'Amiri', serif; }
                    .report-table { width: 100%; border-collapse: collapse; font-family: 'Times New Roman', serif; }
                    .report-table th, .report-table td { border: 1px solid #000; padding: 4px; font-size: 11pt; }
                    .report-table th { text-align: center; font-weight: bold; background-color: white; }
                    
                    .info-table td { padding: 2px 5px; font-size: 11pt; border: none; }
                    
                    .box-border { border: 1px solid #000; }
                `}</style>

                <div
                    ref={ref}
                    className="rapor-page mx-auto bg-white text-black"
                    style={{
                        width: '215mm',
                        height: '330mm',
                        padding: '10mm 15mm 10mm 15mm',
                        fontFamily: "'Times New Roman', Times, serif",
                        boxSizing: 'border-box',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* KOP SURAT */}
                    <div className="flex items-center justify-center border-b-4 border-black pb-2 mb-1" style={{ borderBottomStyle: 'double' }}>
                        <div className="w-24 h-24 mr-4 flex-shrink-0">
                            <img
                                src="/logo-pesantren.png"
                                alt="Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="text-center flex-1">
                            <h3 className="text-sm font-bold uppercase tracking-wide mb-1" style={{ fontSize: '12pt' }}>YAYASAN PONDOK PESANTREN DARUL MA'ARIF</h3>
                            <h2 className="text-2xl font-bold uppercase text-green-700 mb-1" style={{ fontSize: '18pt', color: '#15803d' }}>PONDOK PESANTREN ROUDHOTUR RIDWAN</h2>
                            <p className="text-sm italic" style={{ fontSize: '10pt' }}>Desa. Sumbersari Kec. Sekampung Kab. Lampung Timur</p>
                        </div>
                    </div>
                    <div className="text-center text-xs italic border-b border-black mb-4 pb-1" style={{ fontSize: '9pt' }}>
                        Alamat : Jl. Raya Lapangan Merdeka Desa Sumbersari Kec. Sekampung Kab. Lampung Timur Kode Pos : 34382
                    </div>

                    {/* JUDUL */}
                    <div className="text-center mb-4">
                        <h1 className="font-bold border border-black inline-block px-8 py-1 uppercase" style={{ fontSize: '14pt' }}>
                            LAPORAN HASIL BELAJAR
                        </h1>
                    </div>

                    {/* IDENTITAS SANTRI */}
                    <div className="flex justify-between mb-4 px-2">
                        <table className="info-table w-1/2">
                            <tbody>
                                <tr>
                                    <td style={{ width: '150px', whiteSpace: 'nowrap', padding: '2px 0' }}>Nama Santri</td>
                                    <td width="10">:</td>
                                    <td className="font-bold uppercase text-nowrap">{student.name}</td>
                                </tr>
                                <tr>
                                    <td style={{ whiteSpace: 'nowrap', padding: '2px 0' }}>Orang Tua/Wali</td>
                                    <td>:</td>
                                    <td className="text-nowrap">{student.parentName || '................'}</td>
                                </tr>
                            </tbody>
                        </table>
                        <table className="info-table w-auto min-w-[30%]">
                            <tbody>
                                <tr>
                                    <td style={{ width: '100px', whiteSpace: 'nowrap', padding: '2px 0' }}>Kelas</td>
                                    <td width="10">:</td>
                                    <td className="font-bold">{student.class}</td>
                                </tr>
                                <tr>
                                    <td style={{ whiteSpace: 'nowrap', padding: '2px 0' }}>Tahun Pelajaran</td>
                                    <td>:</td>
                                    <td style={{ whiteSpace: 'nowrap' }}>{settings.academic_year}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* TABEL NILAI UTAMA */}
                    <div className="flex-1">
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th rowSpan={2} style={{ width: '40px' }}>No</th>
                                    <th rowSpan={2}>Mata Pelajaran</th>
                                    <th colSpan={2}>Hasil Tes</th>
                                    <th colSpan={2} className="font-arabic" style={{ fontSize: '14pt' }}>نتائج الغرض الأول</th>
                                </tr>
                                <tr>
                                    <th style={{ width: '60px' }}>Angka</th>
                                    <th style={{ width: '150px' }}>Huruf</th>
                                    <th className="font-arabic" style={{ fontSize: '12pt', width: '50px' }}>الرقم</th>
                                    <th className="font-arabic" style={{ fontSize: '12pt', width: '120px' }}>الحرف</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Kategori Diniyah */}
                                <tr className="bg-gray-100">
                                    <td colSpan={6} className="font-bold text-left px-2" style={{ backgroundColor: '#f0f0f0' }}>A. Mata Pelajaran Diniyah</td>
                                </tr>
                                {diniyahWithConversion.map((item, idx) => (
                                    <tr key={'diniyah-' + idx}>
                                        <td className="text-center">{idx + 1}</td>
                                        <td>{item.subject}</td>
                                        <td className="text-center font-bold">{item.score.toFixed(2).replace('.00', '')}</td>
                                        <td className="text-center capitalize" style={{ fontSize: '10pt' }}>{item.conversion.huruf}</td>
                                        <td className="text-center font-arabic" style={{ fontSize: '12pt' }}>{item.conversion.arab_angka}</td>
                                        <td className="text-center font-arabic" style={{ fontSize: '12pt' }}>{item.conversion.arab_huruf}</td>
                                    </tr>
                                ))}

                                {/* Kategori Muatan Lokal */}
                                <tr className="bg-gray-100">
                                    <td colSpan={6} className="font-bold text-left px-2" style={{ backgroundColor: '#f0f0f0' }}>B. Muatan Lokal</td>
                                </tr>
                                {muatanLokalWithConversion.map((item, idx) => (
                                    <tr key={'mulok-' + idx}>
                                        <td className="text-center">{idx + 1}</td>
                                        <td>{item.subject}</td>
                                        <td className="text-center font-bold">{item.score > 0 ? item.score.toFixed(2).replace('.00', '') : '-'}</td>
                                        <td className="text-center capitalize" style={{ fontSize: '10pt' }}>{item.score > 0 ? item.conversion.huruf : '-'}</td>
                                        <td className="text-center font-arabic" style={{ fontSize: '12pt' }}>{item.score > 0 ? item.conversion.arab_angka : '-'}</td>
                                        <td className="text-center font-arabic" style={{ fontSize: '12pt' }}>{item.score > 0 ? item.conversion.arab_huruf : '-'}</td>
                                    </tr>
                                ))}

                                {/* Summary Rows */}
                                <tr className="font-bold border-t-2 border-black">
                                    <td colSpan={2} className="pl-4 uppercase">JUMLAH</td>
                                    <td className="text-center">{totalScore.toFixed(2).replace('.00', '')}</td>
                                    <td className="bg-gray-200"></td>
                                    <td className="text-center font-arabic" style={{ fontSize: '12pt' }}>{toArabicDigits(Math.round(totalScore))}</td>
                                    <td className="bg-gray-200"></td>
                                </tr>
                                <tr className="font-bold">
                                    <td colSpan={2} className="pl-4 uppercase">RANGKING</td>
                                    <td className="text-center">{ranking}</td>
                                    <td className="text-center capitalize">Delapan</td>
                                    <td className="text-center font-arabic" style={{ fontSize: '12pt' }}>{toArabicDigits(ranking)}</td>
                                    <td className="text-center font-arabic" style={{ fontSize: '12pt' }}>الفرد</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* KEPRIBADIAN & ABSENSI SIDE BY SIDE */}
                    <div className="flex gap-4 mt-6 mb-4">
                        {/* Kepribadian */}
                        <div className="w-1/2">
                            <h3 className="font-bold underline mb-1 uppercase" style={{ fontSize: '10pt' }}>KEPRIBADIAN</h3>
                            <table className="report-table">
                                <tbody>
                                    <tr>
                                        <td width="30" className="text-center">1</td>
                                        <td>Kelakuan</td>
                                        <td width="40" className="text-center">A</td>
                                    </tr>
                                    <tr>
                                        <td className="text-center">2</td>
                                        <td>Kerajinan</td>
                                        <td className="text-center">A</td>
                                    </tr>
                                    <tr>
                                        <td className="text-center">3</td>
                                        <td>Kerapihan</td>
                                        <td className="text-center">A</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Absensi */}
                        <div className="w-1/2">
                            <h3 className="font-bold underline mb-1 uppercase" style={{ fontSize: '10pt' }}>Absensi</h3>
                            <table className="report-table">
                                <tbody>
                                    <tr>
                                        <td width="30" className="text-center">1</td>
                                        <td>Sakit</td>
                                        <td width="40" className="text-center">{student.attendance.sakit}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-center">2</td>
                                        <td>Izin</td>
                                        <td className="text-center">{student.attendance.izin}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-center">3</td>
                                        <td>Alpa</td>
                                        <td className="text-center">{student.attendance.alpha}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Catatan Wali Kelas */}
                    <div className="mb-4">
                        <h3 className="font-bold mb-1" style={{ fontSize: '10pt' }}>Catatan Wali Kelas:</h3>
                        <div className="border border-black p-3 italic" style={{ minHeight: '50px' }}>
                            {catatan}
                        </div>
                    </div>

                    {/* KEPUTUSAN (Semester 2 Only) */}
                    {
                        isSemester2 && (
                            <div className="mb-6 border border-black p-2 px-4">
                                <h3 className="font-bold underline mb-1 uppercase text-sm">KEPUTUSAN:</h3>
                                <p className="text-sm pl-4">
                                    Berdasarkan hasil pencapaian belajar semester I dan II, maka santri tersebut ditetapkan :
                                </p>
                                <div className="flex flex-col gap-1 mt-2 pl-8 font-bold">
                                    <div className="flex items-center gap-2">
                                        <span style={{ textDecoration: isPromoted ? 'none' : 'line-through' }}>
                                            NAIK KE KELAS : {nextClass}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span style={{ textDecoration: !isPromoted ? 'none' : 'line-through', color: !isPromoted ? 'black' : '#aaa' }}>
                                            TINGGAL DI KELAS : {student.class}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* SIGNATURES */}
                    <div className="mt-8">
                        <div className="text-right mb-8 pr-12">
                            Lampung Timur, {settings.report_date || '20 Desember 2025'}
                        </div>
                        <div className="flex justify-between text-center px-4">
                            <div className="w-1/3">
                                <p className="mb-20">Orang Tua/Wali,</p>
                                <p className="font-bold border-b border-black inline-block min-w-[150px]">{student.parentName || '....................'}</p>
                            </div>
                            <div className="w-1/3">
                                <p className="mb-20">Wali Kelas,</p>
                                <p className="font-bold border-b border-black inline-block min-w-[150px]">{student.waliKelas.name}</p>
                            </div>
                            <div className="w-1/3">
                                <p className="mb-20">Pengasuh Pondok,</p>
                                <p className="font-bold border-b border-black inline-block min-w-[150px]">{settings.pengasuh_pondok_name || 'Ky. Ridwan Khoironi S.Hi'}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </>
        );
    }
);

RaporSheet.displayName = 'RaporSheet';

export default RaporSheet;
