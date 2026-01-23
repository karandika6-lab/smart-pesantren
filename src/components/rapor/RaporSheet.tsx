'use client';

import { forwardRef } from 'react';
import { convertGrade } from '@/lib/gradeConverter';
import { RaporConfig, StudentRaporData, getSemesterName } from '@/lib/raporConfig';

// ============================================
// Props Interface
// ============================================

interface RaporSheetProps {
    settings: RaporConfig;
    student: StudentRaporData;
    semester: 1 | 2;
}

// ============================================
// Component - F4 Paper (215mm x 330mm)
// Layout sesuai referensi user
// ============================================

const RaporSheet = forwardRef<HTMLDivElement, RaporSheetProps>(
    ({ settings, student, semester }, ref) => {
        // Use real grades from student data
        const mapelAgama = student.grades
            .filter(g => g.category === 'agama')
            .map(g => ({ subject: g.subject, score: g.score }));

        const mapelUmum = student.grades
            .filter(g => g.category === 'umum')
            .map(g => ({ subject: g.subject, score: g.score }));

        // Apply grade conversion
        const agamaWithConversion = mapelAgama.map(g => ({
            ...g,
            conversion: convertGrade(g.score),
        }));

        const umumWithConversion = mapelUmum.map(g => ({
            ...g,
            conversion: convertGrade(g.score),
        }));

        const allGrades = [...agamaWithConversion, ...umumWithConversion];

        // Calculate total and average
        const totalScore = allGrades.reduce((sum, g) => sum + g.score, 0);
        const average = Math.round(totalScore / allGrades.length);
        const averageConversion = convertGrade(average);

        // Format current date
        const formatDate = () => {
            const now = new Date();
            return now.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        };

        // Semester 2 logic
        const isSemester2 = semester === 2;
        const isPromoted = student.promotion?.isPromoted ?? true;
        const nextClass = student.promotion?.nextClass || (parseInt(student.class) + 1).toString();

        // Placeholder data
        const kepribadian = { Kelakuan: 'Baik', Kerajinan: 'Baik', Kerapihan: 'Baik' };
        const ranking = 3;
        const catatan = 'Pertahankan prestasi dan tingkatkan hafalan Al-Quran. Terus semangat dalam belajar.';

        // Convert to Arabic digits
        const toArabicDigits = (num: number): string => {
            const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
            return num.toString().split('').map(d => arabicDigits[parseInt(d)] || d).join('');
        };

        return (
            <>
                {/* Print Styles - F4 Paper */}
                <style jsx global>{`
                    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
                    
                    @media print {
                        @page {
                            size: 215mm 330mm;
                            margin: 0;
                        }
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .no-print { display: none !important; }
                        .rapor-page {
                            width: 215mm !important;
                            height: 330mm !important;
                            overflow: hidden !important;
                            page-break-after: always;
                        }
                    }
                    .font-arabic {
                        font-family: 'Amiri', 'Traditional Arabic', serif;
                    }
                `}</style>

                {/* RAPOR CONTAINER */}
                <div
                    ref={ref}
                    className="rapor-page bg-white mx-auto"
                    style={{
                        width: '215mm',
                        height: '330mm',
                        padding: '10mm 12mm',
                        fontFamily: "'Times New Roman', Times, serif",
                        color: '#000',
                        display: 'flex',
                        flexDirection: 'column',
                        boxSizing: 'border-box',
                    }}
                >
                    {/* ============================================ */}
                    {/* HEADER / KOP SURAT */}
                    {/* ============================================ */}
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '55px', flexShrink: 0 }}>
                                <img
                                    src={settings.logo_url || '/logo-pesantren.png'}
                                    alt="Logo"
                                    style={{ width: '55px', height: '55px', objectFit: 'contain' }}
                                    onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                                />
                            </div>
                            <div style={{ flex: 1, textAlign: 'center' }}>
                                <p style={{ fontSize: '9pt', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '1px' }}>
                                    {settings.yayasan_name}
                                </p>
                                <h1 style={{ fontSize: '13pt', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '2px' }}>
                                    {settings.school_name}
                                </h1>
                                {settings.school_name_arabic && (
                                    <p className="font-arabic" dir="rtl" style={{ fontSize: '11pt', marginBottom: '2px' }}>
                                        {settings.school_name_arabic}
                                    </p>
                                )}
                                <p style={{ fontSize: '7pt', marginBottom: '1px' }}>{settings.address}</p>
                                <p style={{ fontSize: '6.5pt' }}>Telp: {settings.phone} | Email: {settings.email}</p>
                            </div>
                            <div style={{ width: '55px', flexShrink: 0 }}></div>
                        </div>
                        <div style={{ borderTop: '2.5px solid #000', borderBottom: '1px solid #000', height: '3px', marginTop: '6px' }}></div>
                    </div>

                    {/* TITLE */}
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                        <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '2px' }}>
                            LAPORAN HASIL BELAJAR SANTRI
                        </h2>
                        <p style={{ fontSize: '9pt' }}>
                            Semester {semester} ({getSemesterName(semester)}) Tahun Pelajaran {settings.academic_year}
                        </p>
                    </div>

                    {/* STUDENT INFO */}
                    <div style={{ marginBottom: '8px' }}>
                        <table style={{ fontSize: '9pt' }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '1px 0', width: '100px' }}>Nama Santri</td>
                                    <td style={{ padding: '1px 0', width: '8px' }}>:</td>
                                    <td style={{ padding: '1px 0', fontWeight: 'bold' }}>{student.name}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '1px 0' }}>NIS / NISN</td>
                                    <td style={{ padding: '1px 0' }}>:</td>
                                    <td style={{ padding: '1px 0' }}>{student.nis} / {student.nisn}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '1px 0' }}>Kelas</td>
                                    <td style={{ padding: '1px 0' }}>:</td>
                                    <td style={{ padding: '1px 0' }}>{student.class}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* ============================================ */}
                    {/* GRADES TABLE */}
                    {/* ============================================ */}
                    <div style={{ marginBottom: '10px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#e8e8e8' }}>
                                    <th style={{ border: '1px solid #000', padding: '4px 2px', width: '25px', textAlign: 'center' }}>No</th>
                                    <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>Mata Pelajaran</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', width: '40px', textAlign: 'center' }}>Angka</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', width: '110px', textAlign: 'center' }}>Huruf</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', width: '40px', textAlign: 'center' }}>
                                        <span className="font-arabic" style={{ fontSize: '10pt' }}>الأرقام</span>
                                    </th>
                                    <th style={{ border: '1px solid #000', padding: '4px', width: '90px', textAlign: 'center' }}>
                                        <span className="font-arabic" style={{ fontSize: '10pt' }}>الحروف</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Group A: Agama - 6 rows */}
                                <tr style={{ backgroundColor: '#f0f0f0' }}>
                                    <td colSpan={6} style={{ border: '1px solid #000', padding: '3px 6px', fontWeight: 'bold' }}>
                                        A. Mata Pelajaran Agama
                                    </td>
                                </tr>
                                {agamaWithConversion.map((grade, idx) => (
                                    <tr key={`a-${idx}`}>
                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{idx + 1}</td>
                                        <td style={{ border: '1px solid #000', padding: '3px 6px' }}>{grade.subject}</td>
                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt' }}>
                                            {grade.score}
                                        </td>
                                        <td style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '8pt', fontStyle: 'italic' }}>
                                            {grade.conversion.huruf}
                                        </td>
                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>
                                            <span className="font-arabic" style={{ fontSize: '11pt' }}>{grade.conversion.arab_angka}</span>
                                        </td>
                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>
                                            <span className="font-arabic" style={{ fontSize: '9pt' }}>{grade.conversion.arab_huruf}</span>
                                        </td>
                                    </tr>
                                ))}

                                {/* Group B: Umum - 5 rows */}
                                <tr style={{ backgroundColor: '#f0f0f0' }}>
                                    <td colSpan={6} style={{ border: '1px solid #000', padding: '3px 6px', fontWeight: 'bold' }}>
                                        B. Mata Pelajaran Umum
                                    </td>
                                </tr>
                                {umumWithConversion.map((grade, idx) => (
                                    <tr key={`b-${idx}`}>
                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{agamaWithConversion.length + idx + 1}</td>
                                        <td style={{ border: '1px solid #000', padding: '3px 6px' }}>{grade.subject}</td>
                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt' }}>
                                            {grade.score}
                                        </td>
                                        <td style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '8pt', fontStyle: 'italic' }}>
                                            {grade.conversion.huruf}
                                        </td>
                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>
                                            <span className="font-arabic" style={{ fontSize: '11pt' }}>{grade.conversion.arab_angka}</span>
                                        </td>
                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>
                                            <span className="font-arabic" style={{ fontSize: '9pt' }}>{grade.conversion.arab_huruf}</span>
                                        </td>
                                    </tr>
                                ))}

                                {/* JUMLAH */}
                                <tr style={{ fontWeight: 'bold' }}>
                                    <td colSpan={2} style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>JUMLAH</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11pt' }}>{totalScore}</td>
                                    <td colSpan={2} style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                                        <span className="font-arabic" style={{ fontSize: '12pt' }}>{toArabicDigits(totalScore)}</span>
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>-</td>
                                </tr>

                                {/* RATA-RATA */}
                                <tr style={{ fontWeight: 'bold' }}>
                                    <td colSpan={2} style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>RATA-RATA</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11pt' }}>{average}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8pt', fontStyle: 'italic' }}>{averageConversion.huruf}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                                        <span className="font-arabic" style={{ fontSize: '12pt' }}>{averageConversion.arab_angka}</span>
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                                        <span className="font-arabic" style={{ fontSize: '9pt' }}>{averageConversion.arab_huruf}</span>
                                    </td>
                                </tr>

                                {/* RANGKING */}
                                <tr style={{ fontWeight: 'bold' }}>
                                    <td colSpan={2} style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>RANGKING</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '12pt' }}>{ranking}</td>
                                    <td colSpan={3} style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                                        <span className="font-arabic" style={{ fontSize: '12pt' }}>{toArabicDigits(ranking)}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* ============================================ */}
                    {/* KEPRIBADIAN & ABSENSI - SIDE BY SIDE */}
                    {/* ============================================ */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                        {/* Kepribadian - Left */}
                        <div style={{ width: '48%' }}>
                            <p style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '3px' }}>KEPRIBADIAN:</p>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                                <tbody>
                                    {Object.entries(kepribadian).map(([key, value]) => (
                                        <tr key={key}>
                                            <td style={{ border: '1px solid #000', padding: '3px 6px', width: '90px' }}>{key}</td>
                                            <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'center', fontWeight: 'bold' }}>{value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Absensi - Right */}
                        <div style={{ width: '52%' }}>
                            <p style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '3px' }}>ABSENSI (Ketidakhadiran):</p>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ border: '1px solid #000', padding: '3px 6px', width: '110px' }}>Sakit</td>
                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', width: '35px' }}>{student.attendance.sakit}</td>
                                        <td style={{ border: '1px solid #000', padding: '3px 6px' }}>hari</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '1px solid #000', padding: '3px 6px' }}>Izin</td>
                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{student.attendance.izin}</td>
                                        <td style={{ border: '1px solid #000', padding: '3px 6px' }}>hari</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '1px solid #000', padding: '3px 6px' }}>Tanpa Keterangan</td>
                                        <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{student.attendance.alpha}</td>
                                        <td style={{ border: '1px solid #000', padding: '3px 6px' }}>hari</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ============================================ */}
                    {/* CATATAN WALI KELAS - Full Width */}
                    {/* ============================================ */}
                    <div style={{ marginBottom: '10px' }}>
                        <p style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '3px' }}>CATATAN WALI KELAS:</p>
                        <div style={{
                            border: '1px solid #000',
                            minHeight: '50px',
                            padding: '6px 8px',
                            fontSize: '9pt',
                            fontStyle: 'italic',
                            lineHeight: '1.4'
                        }}>
                            {catatan}
                        </div>
                    </div>

                    {/* Semester 2: Kenaikan Kelas */}
                    {isSemester2 && (
                        <div style={{ border: '1.5px solid #000', padding: '6px 10px', marginBottom: '10px', fontSize: '9pt' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                KEPUTUSAN: Berdasarkan hasil yang dicapai, Santri ditetapkan:
                            </p>
                            <div style={{ display: 'flex', gap: '25px', paddingLeft: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ width: '12px', height: '12px', border: '1px solid #000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9pt' }}>
                                        {isPromoted ? '✓' : ''}
                                    </span>
                                    <span style={{ textDecoration: isPromoted ? 'none' : 'line-through' }}>Naik ke Kelas {nextClass}</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ width: '12px', height: '12px', border: '1px solid #000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9pt' }}>
                                        {!isPromoted ? '✓' : ''}
                                    </span>
                                    <span style={{ textDecoration: !isPromoted ? 'none' : 'line-through' }}>Tinggal di Kelas {student.class}</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* ============================================ */}
                    {/* SIGNATURES - Bottom */}
                    {/* ============================================ */}
                    <div style={{ marginTop: 'auto' }}>
                        <p style={{ textAlign: 'right', marginBottom: '8px', fontSize: '9pt' }}>
                            {settings.report_city}, {formatDate()}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '9pt' }}>
                            {/* Orang Tua/Wali */}
                            <div style={{ width: '30%' }}>
                                <p style={{ marginBottom: '45px' }}>Orang Tua/Wali</p>
                                <p style={{ borderTop: '1px solid #000', paddingTop: '3px', marginLeft: '10%', marginRight: '10%' }}>
                                    (..........................)
                                </p>
                            </div>

                            {/* Wali Kelas */}
                            <div style={{ width: '30%' }}>
                                <p style={{ marginBottom: '45px' }}>Wali Kelas</p>
                                <p style={{ fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '3px', marginLeft: '5%', marginRight: '5%', fontSize: '8pt' }}>
                                    {student.waliKelas.name}
                                </p>
                                <p style={{ fontSize: '7pt', marginTop: '1px' }}>NIP. {student.waliKelas.nip}</p>
                            </div>

                            {/* Pengasuh Pondok */}
                            <div style={{ width: '30%' }}>
                                <p style={{ marginBottom: '45px' }}>Pengasuh Pondok</p>
                                <p style={{ fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '3px', marginLeft: '5%', marginRight: '5%', fontSize: '8pt' }}>
                                    {settings.pengasuh_pondok_name}
                                </p>
                                <p style={{ fontSize: '7pt', marginTop: '1px' }}>NIP. {settings.pengasuh_pondok_nip}</p>
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
