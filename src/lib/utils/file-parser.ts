// File Parser Utility - Supports Excel (.xlsx, .xls, .csv) and Word (.docx)
import * as XLSX from 'xlsx';

export interface ParsedStudentData {
    no: number;
    nis: string;
    nama: string;
    ttl: string;
    jenisKelamin: 'L' | 'P';
    namaAyah: string;
    namaIbu: string;
    noHpWali: string;
    alamat: string;
    kelas?: string;
    isValid: boolean;
    errors: string[];
}

export interface ParseResult {
    success: boolean;
    data: ParsedStudentData[];
    totalRows: number;
    validRows: number;
    invalidRows: number;
    message?: string;
}

// Column name variations that we accept - UPDATED based on user's actual file format
const COLUMN_MAPPINGS: Record<string, string[]> = {
    no: ['no', 'nomor', '#', 'num'],
    // NAMA INDUK SANTRI adalah NIS, bukan nama orang tua!
    nis: ['nama induk santri', 'nis', 'nisn', 'no induk', 'nomor induk', 'induk santri'],
    nama: ['nama santri', 'nama', 'nama lengkap', 'name'],
    ttl: ['ttl', 'tempat tanggal lahir', 'tanggal lahir', 'tgl lahir', 'birth'],
    jenisKelamin: ['jenis kelamin', 'jk', 'gender', 'l/p', 'kelamin'],
    namaAyah: ['nama ayah', 'ayah', 'father', 'bapak'],
    namaIbu: ['nama ibu', 'ibu', 'mother'],
    // Variasi untuk No HP Wali termasuk format dari file user
    noHpWali: ['no hp wali santri', 'no hp', 'hp', 'telp', 'telepon', 'phone', 'no hp wali', 'hp wali', 'kontak', 'no. hp', 'nohp'],
    alamat: ['alamat', 'address', 'alamat lengkap'],
    kelas: ['kelas', 'class', 'tingkat'],
};

function normalizeColumnName(name: string): string {
    if (!name) return '';
    // Convert newlines, tabs, and multiple spaces to single space
    // This handles Excel headers that wrap to multiple lines
    return name
        .toString()
        .toLowerCase()
        .replace(/[\r\n\t]+/g, ' ')  // Replace newlines/tabs with space
        .replace(/\s+/g, ' ')         // Collapse multiple spaces
        .trim()
        .replace(/[^a-z0-9\s]/g, ''); // Remove special chars
}

function mapColumnToField(columnName: string): string | null {
    const normalized = normalizeColumnName(columnName);
    if (!normalized) return null;

    // Debug log to see what's being matched
    console.log('Mapping column:', columnName, '→', normalized);

    // Check exact matches first, then partial
    for (const [field, variations] of Object.entries(COLUMN_MAPPINGS)) {
        // Exact match
        if (variations.includes(normalized)) {
            console.log('  → Exact match:', field);
            return field;
        }
    }

    // Partial match (longer patterns first to avoid false matches)
    for (const [field, variations] of Object.entries(COLUMN_MAPPINGS)) {
        for (const v of variations) {
            // Only match if the variation is fully contained AND makes sense
            if (normalized.includes(v) && v.length >= 3) {
                console.log('  → Partial match:', field, 'via', v);
                return field;
            }
        }
    }

    console.log('  → No match found');
    return null;
}

// Updated to handle "Laki Laki", "Perempuan", "Laki-laki", etc.
function normalizeGender(value: string): 'L' | 'P' {
    if (!value) return 'L';
    const normalized = value.toString().toLowerCase().trim().replace(/[-_]/g, ' ');

    // Check for female first (more specific patterns)
    if (['p', 'perempuan', 'female', 'f', 'putri', 'wanita', '2', 'pr'].includes(normalized)) {
        return 'P';
    }
    // Check for male
    if (['l', 'laki laki', 'laki-laki', 'laki', 'male', 'm', 'putra', '1', 'lk'].includes(normalized)) {
        return 'L';
    }
    // If contains 'perempuan' or 'wanita'
    if (normalized.includes('perempuan') || normalized.includes('wanita') || normalized.includes('putri')) {
        return 'P';
    }
    // If contains 'laki'
    if (normalized.includes('laki')) {
        return 'L';
    }

    return 'L'; // Default
}

function validateRow(row: Partial<ParsedStudentData>, rowIndex: number): ParsedStudentData {
    const errors: string[] = [];

    // Helper function to safely convert to string and trim
    const safeString = (val: unknown): string => {
        if (val === null || val === undefined) return '';
        return String(val).trim();
    };

    // Get string values
    const nis = safeString(row.nis);
    const nama = safeString(row.nama);
    const jk = safeString(row.jenisKelamin);

    // Validate required fields
    if (!nis) {
        errors.push('NIS wajib diisi');
    }
    if (!nama) {
        errors.push('Nama wajib diisi');
    }
    if (!jk) {
        errors.push('Jenis kelamin wajib diisi');
    }

    return {
        no: row.no || rowIndex,
        nis: row.nis?.toString().trim() || '',
        nama: row.nama?.toString().trim() || '',
        ttl: row.ttl?.toString().trim() || '',
        jenisKelamin: normalizeGender(row.jenisKelamin || ''),
        namaAyah: row.namaAyah?.toString().trim() || '',
        namaIbu: row.namaIbu?.toString().trim() || '',
        noHpWali: row.noHpWali?.toString().trim() || '',
        alamat: row.alamat?.toString().trim() || '',
        kelas: row.kelas?.toString().trim() || '',
        isValid: errors.length === 0,
        errors
    };
}

export async function parseExcelFile(file: File): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON with header
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

                if (jsonData.length < 2) {
                    resolve({
                        success: false,
                        data: [],
                        totalRows: 0,
                        validRows: 0,
                        invalidRows: 0,
                        message: 'File tidak memiliki data atau hanya header saja'
                    });
                    return;
                }

                // First row is headers
                const headers = jsonData[0].map((h: unknown) => h?.toString() || '');
                const columnMap: Record<number, string> = {};

                headers.forEach((header, index) => {
                    const field = mapColumnToField(header);
                    if (field) {
                        columnMap[index] = field;
                    }
                });

                // Parse data rows
                const parsedData: ParsedStudentData[] = [];

                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0 || row.every(cell => !cell)) continue;

                    const rowData: Partial<ParsedStudentData> = {};

                    row.forEach((cell, index) => {
                        const field = columnMap[index];
                        if (field) {
                            (rowData as Record<string, unknown>)[field] = cell;
                        }
                    });

                    const validated = validateRow(rowData, i);
                    parsedData.push(validated);
                }

                const validRows = parsedData.filter(d => d.isValid).length;

                resolve({
                    success: true,
                    data: parsedData,
                    totalRows: parsedData.length,
                    validRows,
                    invalidRows: parsedData.length - validRows,
                    message: `Berhasil membaca ${parsedData.length} baris data`
                });

            } catch (error) {
                console.error('Error parsing Excel:', error);
                reject(new Error('Gagal membaca file Excel. Pastikan format file benar.'));
            }
        };

        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsArrayBuffer(file);
    });
}

export async function parseWordFile(file: File): Promise<ParseResult> {
    // Dynamic import mammoth for Word parsing
    const mammoth = await import('mammoth');

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target?.result as ArrayBuffer;

                // Try HTML extraction first for better table parsing
                const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
                const html = htmlResult.value;

                let parsedData: ParsedStudentData[] = [];

                // Method 1: Parse HTML tables
                if (html.includes('<table') || html.includes('<tr')) {
                    parsedData = parseHtmlTable(html);
                }

                // Method 2: If no tables found, try raw text parsing
                if (parsedData.length === 0) {
                    const textResult = await mammoth.extractRawText({ arrayBuffer });
                    const text = textResult.value;
                    parsedData = parseRawText(text);
                }

                const validRows = parsedData.filter(d => d.isValid).length;

                if (parsedData.length === 0) {
                    resolve({
                        success: false,
                        data: [],
                        totalRows: 0,
                        validRows: 0,
                        invalidRows: 0,
                        message: 'Tidak ditemukan data tabel di file Word.\n\n💡 SARAN: Simpan ulang file sebagai Excel (.xlsx) agar lebih mudah dibaca.'
                    });
                    return;
                }

                resolve({
                    success: true,
                    data: parsedData,
                    totalRows: parsedData.length,
                    validRows,
                    invalidRows: parsedData.length - validRows,
                    message: `Berhasil membaca ${parsedData.length} baris data dari Word`
                });

            } catch (error) {
                console.error('Error parsing Word:', error);
                reject(new Error('Gagal membaca file Word. Coba simpan ulang sebagai Excel (.xlsx)'));
            }
        };

        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsArrayBuffer(file);
    });
}

// Parse HTML table from Word document
function parseHtmlTable(html: string): ParsedStudentData[] {
    const parsedData: ParsedStudentData[] = [];

    // Create a temporary DOM to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find all table rows
    const rows = doc.querySelectorAll('tr');

    if (rows.length < 2) return [];

    // First row is header - map columns
    const headerCells = rows[0].querySelectorAll('td, th');
    const columnMap: Record<number, string> = {};

    headerCells.forEach((cell, index) => {
        const text = cell.textContent?.trim() || '';
        const field = mapColumnToField(text);
        if (field) {
            columnMap[index] = field;
        }
    });

    // If no columns mapped, try fixed order based on user's format
    if (Object.keys(columnMap).length === 0) {
        // Assume fixed order: NO, NIS, NAMA, TTL, JK, AYAH, HP, ALAMAT
        const fixedOrder = ['no', 'nis', 'nama', 'ttl', 'jenisKelamin', 'namaAyah', 'noHpWali', 'alamat'];
        fixedOrder.forEach((field, idx) => {
            columnMap[idx] = field;
        });
    }

    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td, th');
        if (cells.length < 3) continue;

        const rowData: Partial<ParsedStudentData> = {};

        cells.forEach((cell, index) => {
            const field = columnMap[index];
            const value = cell.textContent?.trim() || '';
            if (field && value) {
                (rowData as Record<string, unknown>)[field] = value;
            }
        });

        // Only add if has NIS or name
        if (rowData.nis || rowData.nama) {
            const validated = validateRow(rowData, i);
            parsedData.push(validated);
        }
    }

    return parsedData;
}

// Parse raw text (fallback)
function parseRawText(text: string): ParsedStudentData[] {
    const parsedData: ParsedStudentData[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) return [];

    // Try to detect column from first line
    const headerLine = lines[0];
    const columnMap: Record<number, string> = {};

    // Check if first line looks like a header
    const headerCells = headerLine.split(/\t|  +/).map(c => c.trim()).filter(c => c);
    headerCells.forEach((cell, index) => {
        const field = mapColumnToField(cell);
        if (field) {
            columnMap[index] = field;
        }
    });

    // If header detected, skip first line
    const startIndex = Object.keys(columnMap).length > 0 ? 1 : 0;

    // If no header detected, use fixed order
    if (Object.keys(columnMap).length === 0) {
        const fixedOrder = ['no', 'nis', 'nama', 'ttl', 'jenisKelamin', 'namaAyah', 'noHpWali', 'alamat'];
        fixedOrder.forEach((field, idx) => {
            columnMap[idx] = field;
        });
    }

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by tab or multiple spaces
        const cells = line.split(/\t|  +/).map(c => c.trim()).filter(c => c);

        if (cells.length >= 3) {
            const rowData: Partial<ParsedStudentData> = {};

            cells.forEach((cell, index) => {
                const field = columnMap[index];
                if (field) {
                    (rowData as Record<string, unknown>)[field] = cell;
                }
            });

            if (rowData.nis || rowData.nama) {
                const validated = validateRow(rowData, i);
                parsedData.push(validated);
            }
        }
    }

    return parsedData;
}

export async function parseFile(file: File): Promise<ParseResult> {
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop();

    switch (extension) {
        case 'xlsx':
        case 'xls':
        case 'csv':
            return parseExcelFile(file);
        case 'docx':
        case 'doc':
            return parseWordFile(file);
        default:
            return {
                success: false,
                data: [],
                totalRows: 0,
                validRows: 0,
                invalidRows: 0,
                message: `Format file .${extension} tidak didukung. Gunakan Excel (.xlsx, .xls, .csv) atau Word (.docx)`
            };
    }
}
