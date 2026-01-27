// ============================================
// Grade Converter Utility
// Converts numeric grades to multiple formats
// ============================================

// ============================================
// Types
// ============================================

export interface GradeConversion {
    angka: number;
    huruf: string;           // Indonesian text (e.g., "Delapan Puluh Lima")
    arab_angka: string;      // Arabic-Indic digits (e.g., "٨٥")
    arab_huruf: string;      // Arabic text (e.g., "خمسة و ثمانون")
    grade: string;           // Letter grade (A, B, C, D, E)
    predikat: string;        // Indonesian predicate
}

// ============================================
// Indonesian Number Words (0-100)
// ============================================

const INDONESIAN_UNITS = [
    'Nol', 'Satu', 'Dua', 'Tiga', 'Empat',
    'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'
];

const INDONESIAN_TEENS = [
    'Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas',
    'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'
];

const INDONESIAN_TENS = [
    '', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh',
    'Lima Puluh', 'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'
];

// ============================================
// Arabic Number Words (0-100)
// ============================================

const ARABIC_UNITS = [
    'صفر',      // 0 - sifr
    'واحد',     // 1 - wahid
    'اثنان',    // 2 - ithnan
    'ثلاثة',    // 3 - thalatha
    'أربعة',    // 4 - arba'a
    'خمسة',     // 5 - khamsa
    'ستة',      // 6 - sitta
    'سبعة',     // 7 - sab'a
    'ثمانية',   // 8 - thamaniya
    'تسعة',     // 9 - tis'a
];

const ARABIC_TEENS = [
    'عشرة',         // 10 - 'ashara
    'أحد عشر',      // 11 - ahad 'ashar
    'اثنا عشر',     // 12 - ithna 'ashar
    'ثلاثة عشر',    // 13 - thalatha 'ashar
    'أربعة عشر',    // 14 - arba'a 'ashar
    'خمسة عشر',     // 15 - khamsa 'ashar
    'ستة عشر',      // 16 - sitta 'ashar
    'سبعة عشر',     // 17 - sab'a 'ashar
    'ثمانية عشر',   // 18 - thamaniya 'ashar
    'تسعة عشر',     // 19 - tis'a 'ashar
];

const ARABIC_TENS = [
    '',            // 0
    '',            // 10 (handled in teens)
    'عشرون',       // 20 - 'ishrun
    'ثلاثون',      // 30 - thalathun
    'أربعون',      // 40 - arba'un
    'خمسون',       // 50 - khamsun
    'ستون',        // 60 - sittun
    'سبعون',       // 70 - sab'un
    'ثمانون',      // 80 - thamanun
    'تسعون',       // 90 - tis'un
];

// Arabic-Indic digits mapping
const ARABIC_INDIC_DIGITS: Record<string, string> = {
    '0': '٠',
    '1': '١',
    '2': '٢',
    '3': '٣',
    '4': '٤',
    '5': '٥',
    '6': '٦',
    '7': '٧',
    '8': '٨',
    '9': '٩',
};

// ============================================
// Conversion Functions
// ============================================

/**
 * Convert number to Indonesian text representation
 */
function numberToIndonesian(num: number): string {
    if (num < 0 || num > 100) {
        return 'Diluar Jangkauan';
    }

    if (num === 100) {
        return 'Seratus';
    }

    if (num < 10) {
        return INDONESIAN_UNITS[num];
    }

    if (num < 20) {
        return INDONESIAN_TEENS[num - 10];
    }

    const tens = Math.floor(num / 10);
    const units = num % 10;

    if (units === 0) {
        return INDONESIAN_TENS[tens];
    }

    return `${INDONESIAN_TENS[tens]} ${INDONESIAN_UNITS[units]}`;
}

/**
 * Convert number to Arabic-Indic digits
 */
function numberToArabicIndic(num: number): string {
    return num.toString().split('').map(digit => ARABIC_INDIC_DIGITS[digit] || digit).join('');
}

/**
 * Convert number to Arabic text representation
 */
function numberToArabic(num: number): string {
    if (num < 0 || num > 100) {
        return 'خارج النطاق'; // Out of range
    }

    if (num === 100) {
        return 'مائة'; // mi'a - hundred
    }

    if (num === 0) {
        return ARABIC_UNITS[0];
    }

    if (num < 10) {
        return ARABIC_UNITS[num];
    }

    if (num >= 10 && num < 20) {
        return ARABIC_TEENS[num - 10];
    }

    const tens = Math.floor(num / 10);
    const units = num % 10;

    if (units === 0) {
        return ARABIC_TENS[tens];
    }

    // In Arabic, units come before tens with "و" (wa - and)
    return `${ARABIC_UNITS[units]} و ${ARABIC_TENS[tens]}`;
}

/**
 * Get letter grade from numeric score
 */
function getLetterGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'E';
}

/**
 * Get Indonesian predicate from score
 */
function getPredikat(score: number): string {
    if (score >= 90) return 'Sangat Baik';
    if (score >= 80) return 'Baik';
    if (score >= 70) return 'Cukup';
    if (score >= 60) return 'Kurang';
    return 'Sangat Kurang';
}

// ============================================
// Main Export Function
// ============================================

/**
 * Convert a numeric grade to multiple formats
 * @param score - Number from 0 to 100
 * @returns GradeConversion object with all formats
 */
export function convertGrade(score: number): GradeConversion {
    // Ensure score is within valid range
    const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

    return {
        angka: clampedScore,
        huruf: numberToIndonesian(clampedScore),
        arab_angka: numberToArabicIndic(clampedScore),
        arab_huruf: numberToArabic(clampedScore),
        grade: getLetterGrade(clampedScore),
        predikat: getPredikat(clampedScore),
    };
}

/**
 * Batch convert multiple grades
 * @param scores - Array of numeric scores
 * @returns Array of GradeConversion objects
 */
export function convertGrades(scores: number[]): GradeConversion[] {
    return scores.map(score => convertGrade(score));
}

/**
 * Format grade for display in reports
 * @param score - Numeric score
 * @param format - Display format
 */
export function formatGradeForReport(
    score: number,
    format: 'full' | 'short' | 'arabic' = 'full'
): string {
    const conversion = convertGrade(score);

    switch (format) {
        case 'short':
            return `${conversion.angka} (${conversion.grade})`;
        case 'arabic':
            return `${conversion.arab_angka} - ${conversion.arab_huruf}`;
        case 'full':
        default:
            return `${conversion.angka} - ${conversion.huruf} (${conversion.grade})`;
    }
}

// ============================================
// Utility: Date Converter for Islamic Calendar
// ============================================



/**
 * Simple Gregorian to Hijri approximation
 * Note: For accurate conversion, use a proper library like hijri-js
 */
export function approximateHijriYear(gregorianYear: number): number {
    // Approximate formula: Hijri year ≈ (Gregorian year - 622) × (33/32)
    return Math.floor((gregorianYear - 622) * (33 / 32));
}

/**
 * Get current Islamic year (approximate)
 */
export function getCurrentHijriYear(): number {
    return approximateHijriYear(new Date().getFullYear());
}

// ============================================
// Example Usage
// ============================================

/*
import { convertGrade, formatGradeForReport } from '@/lib/gradeConverter';

// Single conversion
const result = convertGrade(85);
console.log(result);
// Output:
// {
//   angka: 85,
//   huruf: "Delapan Puluh Lima",
//   arab_angka: "٨٥",
//   arab_huruf: "خمسة و ثمانون",
//   grade: "B",
//   predikat: "Baik"
// }

// Format for report
console.log(formatGradeForReport(85, 'arabic'));
// Output: "٨٥ - خمسة و ثمانون"
*/

export default convertGrade;
