// ============================================
// Rapor Configuration - Shared Settings
// ============================================
// This file simulates database-stored settings
// In production, these would be fetched from an API/Database

export interface RaporConfig {
    // Institution Information (Kop Surat)
    yayasan_name: string;
    school_name: string;
    school_name_arabic: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logo_url: string;

    // Signatories - Changed from kepala_madrasah to pengasuh_pondok
    pengasuh_pondok_name: string;
    pengasuh_pondok_nip: string;

    // Report Settings
    active_semester: 1 | 2;
    academic_year: string;
    city_date: string;
    report_city: string;
}

// ============================================
// Default/Mock Settings (Simulating Database)
// ============================================

export const APP_SETTINGS: RaporConfig = {
    // Kop Surat
    yayasan_name: "YAYASAN PONDOK PESANTREN DARUL MA'ARIF",
    school_name: "PONDOK PESANTREN MODERN DARUL MA'ARIF",
    school_name_arabic: "معهد دار المعارف الحديث",
    address: "Jl. Pesantren No. 123, Desa Sukamaju, Kec. Way Jepara, Lampung Timur 34195",
    phone: "(0725) 123456",
    email: "info@ppdarulmaaarif.sch.id",
    website: "www.ppdarulmaarif.sch.id",
    logo_url: "",

    // Signatories - Pengasuh Pondok
    pengasuh_pondok_name: "Ky. Ridwan Khoironi, S.Hi",
    pengasuh_pondok_nip: "19700515 199903 1 001",

    // Report Settings
    active_semester: 1,
    academic_year: "2024/2025",
    city_date: "Lampung Timur, 15 Desember 2024",
    report_city: "Lampung Timur",
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get the current semester name in Indonesian
 */
export function getSemesterName(semester: 1 | 2): 'Ganjil' | 'Genap' {
    return semester === 1 ? 'Ganjil' : 'Genap';
}

/**
 * Format date for rapor signature
 */
export function formatRaporDate(city: string, date?: Date): string {
    const d = date || new Date();
    const formatted = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    return `${city}, ${formatted}`;
}

/**
 * Simulate fetching settings from API/localStorage
 * In production, this would be an async fetch call
 */
export function getStoredSettings(): RaporConfig {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('rapor_settings');
        if (stored) {
            try {
                return { ...APP_SETTINGS, ...JSON.parse(stored) };
            } catch {
                return APP_SETTINGS;
            }
        }
    }
    return APP_SETTINGS;
}

/**
 * Simulate saving settings (localStorage)
 * In production, this would be an API call
 */
export function saveSettings(settings: Partial<RaporConfig>): boolean {
    if (typeof window !== 'undefined') {
        try {
            const current = getStoredSettings();
            const updated = { ...current, ...settings };
            localStorage.setItem('rapor_settings', JSON.stringify(updated));
            return true;
        } catch {
            return false;
        }
    }
    return false;
}

// ============================================
// Mock Student Data for Testing
// ============================================

export interface StudentRaporData {
    id: string;
    name: string;
    nis: string;
    nisn: string;
    class: string;
    gender: 'L' | 'P';
    grades: {
        subject: string;
        score: number;
        category: 'agama' | 'umum';
    }[];
    attendance: {
        sakit: number;
        izin: number;
        alpha: number;
    };
    waliKelas: {
        name: string;
        nip: string;
    };
    // For Semester 2 (Genap)
    promotion?: {
        isPromoted: boolean;
        nextClass: string;
    };
}

export const MOCK_STUDENTS: StudentRaporData[] = [
    {
        id: '1',
        name: 'Ahmad Fauzi',
        nis: '2024001',
        nisn: '0051234567',
        class: '9A',
        gender: 'L',
        grades: [
            { subject: 'Al-Quran Hadits', score: 88, category: 'agama' },
            { subject: 'Akidah Akhlak', score: 85, category: 'agama' },
            { subject: 'Fiqih', score: 90, category: 'agama' },
            { subject: 'SKI', score: 82, category: 'agama' },
            { subject: 'Bahasa Arab', score: 78, category: 'agama' },
            { subject: 'Matematika', score: 75, category: 'umum' },
            { subject: 'IPA', score: 80, category: 'umum' },
            { subject: 'IPS', score: 85, category: 'umum' },
            { subject: 'Bahasa Indonesia', score: 82, category: 'umum' },
            { subject: 'Bahasa Inggris', score: 78, category: 'umum' },
        ],
        attendance: { sakit: 2, izin: 1, alpha: 0 },
        waliKelas: { name: 'Ustadzah Fatimah, S.Pd.I', nip: '198505152010012001' },
        promotion: { isPromoted: true, nextClass: '10A' },
    },
    {
        id: '2',
        name: 'Muhammad Rizki',
        nis: '2024002',
        nisn: '0051234568',
        class: '9A',
        gender: 'L',
        grades: [
            { subject: 'Al-Quran Hadits', score: 85, category: 'agama' },
            { subject: 'Akidah Akhlak', score: 88, category: 'agama' },
            { subject: 'Fiqih', score: 82, category: 'agama' },
            { subject: 'SKI', score: 79, category: 'agama' },
            { subject: 'Bahasa Arab', score: 75, category: 'agama' },
            { subject: 'Matematika', score: 90, category: 'umum' },
            { subject: 'IPA', score: 88, category: 'umum' },
            { subject: 'IPS', score: 82, category: 'umum' },
            { subject: 'Bahasa Indonesia', score: 85, category: 'umum' },
            { subject: 'Bahasa Inggris', score: 80, category: 'umum' },
        ],
        attendance: { sakit: 1, izin: 2, alpha: 0 },
        waliKelas: { name: 'Ustadzah Fatimah, S.Pd.I', nip: '198505152010012001' },
        promotion: { isPromoted: true, nextClass: '10A' },
    },
    {
        id: '3',
        name: 'Fatimah Azzahra',
        nis: '2024003',
        nisn: '0051234569',
        class: '9A',
        gender: 'P',
        grades: [
            { subject: 'Al-Quran Hadits', score: 92, category: 'agama' },
            { subject: 'Akidah Akhlak', score: 95, category: 'agama' },
            { subject: 'Fiqih', score: 88, category: 'agama' },
            { subject: 'SKI', score: 90, category: 'agama' },
            { subject: 'Bahasa Arab', score: 85, category: 'agama' },
            { subject: 'Matematika', score: 82, category: 'umum' },
            { subject: 'IPA', score: 85, category: 'umum' },
            { subject: 'IPS', score: 88, category: 'umum' },
            { subject: 'Bahasa Indonesia', score: 90, category: 'umum' },
            { subject: 'Bahasa Inggris', score: 85, category: 'umum' },
        ],
        attendance: { sakit: 0, izin: 1, alpha: 0 },
        waliKelas: { name: 'Ustadzah Fatimah, S.Pd.I', nip: '198505152010012001' },
        promotion: { isPromoted: true, nextClass: '10A' },
    },
    {
        id: '4',
        name: 'Abdullah Hasan',
        nis: '2024004',
        nisn: '0051234570',
        class: '9A',
        gender: 'L',
        grades: [
            { subject: 'Al-Quran Hadits', score: 70, category: 'agama' },
            { subject: 'Akidah Akhlak', score: 72, category: 'agama' },
            { subject: 'Fiqih', score: 68, category: 'agama' },
            { subject: 'SKI', score: 65, category: 'agama' },
            { subject: 'Bahasa Arab', score: 60, category: 'agama' },
            { subject: 'Matematika', score: 55, category: 'umum' },
            { subject: 'IPA', score: 62, category: 'umum' },
            { subject: 'IPS', score: 70, category: 'umum' },
            { subject: 'Bahasa Indonesia', score: 68, category: 'umum' },
            { subject: 'Bahasa Inggris', score: 58, category: 'umum' },
        ],
        attendance: { sakit: 5, izin: 3, alpha: 2 },
        waliKelas: { name: 'Ustadzah Fatimah, S.Pd.I', nip: '198505152010012001' },
        promotion: { isPromoted: false, nextClass: '9A' },
    },
    {
        id: '5',
        name: 'Aisyah Putri',
        nis: '2024005',
        nisn: '0051234571',
        class: '9A',
        gender: 'P',
        grades: [
            { subject: 'Al-Quran Hadits', score: 88, category: 'agama' },
            { subject: 'Akidah Akhlak', score: 90, category: 'agama' },
            { subject: 'Fiqih', score: 85, category: 'agama' },
            { subject: 'SKI', score: 82, category: 'agama' },
            { subject: 'Bahasa Arab', score: 80, category: 'agama' },
            { subject: 'Matematika', score: 78, category: 'umum' },
            { subject: 'IPA', score: 82, category: 'umum' },
            { subject: 'IPS', score: 85, category: 'umum' },
            { subject: 'Bahasa Indonesia', score: 88, category: 'umum' },
            { subject: 'Bahasa Inggris', score: 82, category: 'umum' },
        ],
        attendance: { sakit: 1, izin: 0, alpha: 0 },
        waliKelas: { name: 'Ustadzah Fatimah, S.Pd.I', nip: '198505152010012001' },
        promotion: { isPromoted: true, nextClass: '10A' },
    },
];
