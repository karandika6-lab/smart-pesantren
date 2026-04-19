# 📋 DESKRIPSI LENGKAP APLIKASI SMART PESANTREN
## Sistem Informasi Manajemen Pondok Pesantren Berbasis Web dan Mobile
### Dokumentasi untuk Skripsi

---

## 🎯 1. GAMBARAN UMUM APLIKASI

### 1.1 Nama Aplikasi
**Smart Pesantren Ecosystem v2.0**

### 1.2 Deskripsi Singkat
Smart Pesantren adalah aplikasi sistem informasi manajemen pesantren modern yang dirancang untuk mendigitalisasi seluruh ekosistem operasional pondok pesantren. Aplikasi ini menyediakan platform terintegrasi untuk pemantauan akademik, program hafalan, kedisiplinan santri, pengelolaan keuangan, dan komunikasi antara pesantren dengan wali santri secara **real-time**.

### 1.3 Tujuan Aplikasi
- Memodemisasi sistem administrasi pesantren yang sebelumnya manual
- Meningkatkan efisiensi pengelolaan data santri, guru, dan keuangan
- Memfasilitasi monitoring perkembangan akademik dan hafalan santri
- Mempermudah komunikasi antara pihak pesantren dengan wali santri
- Menyediakan dashboard analitik untuk pengambilan keputusan

### 1.4 Ruang Lingkup
Aplikasi mencakup 6 modul utama:
1. **Modul Akademik** - Pengelolaan data santri, guru, kelas, mapel, jadwal, dan nilai
2. **Modul Keuangan** - Pengelolaan tagihan, pembayaran, pengeluaran, dan tabungan
3. **Modul Kesantrian** - Pengelolaan asrama, pelanggaran, dan perizinan
4. **Modul Absensi** - Pencatatan kehadiran dengan berbagai sesi
5. **Modul Hafalan** - Tracking progress hafalan Al-Quran dan kitab
6. **Modul Rapor** - Generasi laporan akademik semester

---

## 🛠️ 2. TEKNOLOGI YANG DIGUNAKAN (TECH STACK)

### 2.1 Frontend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Next.js** | 16.1.1 | Framework React untuk SSR dan routing |
| **React** | 19.2.3 | Library UI component-based |
| **TypeScript** | 5.x | Static typing untuk JavaScript |
| **Tailwind CSS** | v4 | Utility-first CSS framework |
| **Framer Motion** | 12.29.0 | Library animasi untuk transisi UI |
| **Three.js** | 0.182.0 | 3D graphics untuk animasi landing page |
| **Recharts** | 3.6.0 | Library chart untuk visualisasi data |
| **Lucide React** | 0.562.0 | Icon library modern |

### 2.2 Backend & Database
| Teknologi | Fungsi |
|-----------|--------|
| **Supabase** | Backend-as-a-Service (BaaS) - Auth, Database, Storage |
| **PostgreSQL** | Database relasional (via Supabase) |
| **Row Level Security (RLS)** | Keamanan data berbasis baris |
| **Supabase RPC** | Remote Procedure Calls untuk operasi kompleks |

### 2.3 Mobile Development
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Capacitor** | 8.0.1 | Native mobile wrapper |
| **Android** | - | Target platform mobile |

### 2.4 Tools Pendukung
| Tool | Fungsi |
|------|--------|
| **jsPDF** | Generasi dokumen PDF (rapor) |
| **xlsx** | Import/export data Excel |
| **html2canvas** | Konversi HTML ke gambar untuk PDF |
| **date-fns** | Manipulasi tanggal dan waktu |
| **Zustand** | State management ringan |

---

## 👥 3. SISTEM MULTI-ROLE (HAK AKSES PENGGUNA)

Aplikasi menerapkan sistem **9 role pengguna** dengan hak akses berbeda:

| No | Role ID | Nama Tampilan | Akses Dashboard | Deskripsi Fungsi |
|----|---------|---------------|-----------------|------------------|
| 1 | `super_admin` | Super Admin | /dashboard/admin | Akses penuh: manajemen user, pesantren, database, log |
| 2 | `admin_keuangan` | Admin Keuangan | /dashboard/keuangan | Tagihan, pembayaran, pengeluaran, laporan keuangan |
| 3 | `admin_akademik` | Admin Akademik | /dashboard/akademik | Data akademik: santri, guru, kelas, mapel, jadwal, rapor |
| 4 | `kesantrian` | Bagian Kesantrian | /dashboard/kesantrian | Asrama, pelanggaran, perizinan, absensi kesantrian |
| 5 | `admin_absensi` | Admin Absensi | /dashboard/absensi | Pencatatan absensi, sesi, rekap kehadiran |
| 6 | `wali_kelas` | Wali Kelas | /dashboard/wali-kelas | Monitoring kelas binaan, input nilai, cetak rapor |
| 7 | `ustadz` | Ustadz | /dashboard/ustadz | Input nilai dan hafalan santri yang diajar |
| 8 | `wali_santri` | Wali Santri | /dashboard/wali | Portal orangtua: monitoring anak, pembayaran |
| 9 | `santri` | Santri | /dashboard/santri | Portal siswa: lihat jadwal, nilai, hafalan |

### Fitur Multi-Role
Sistem mendukung multi-role dimana satu user dapat memiliki lebih dari satu role. Contoh: Santri yang juga sebagai wali_santri (orangtua).

---

## 🗄️ 4. STRUKTUR DATABASE

### 4.1 Entity Relationship Diagram (ERD) - Tabel Utama

#### A. Core Tables (Tabel Inti)
```
pesantren (id, name, address, phone, email, logo_url, website)
    └── Multi-tenant support untuk beberapa pesantren

profiles (id, email, name, role, phone, avatar_url, pesantren_id, is_active)
    └── Linked to auth.users via id
    
user_roles (id, user_id, role, is_primary)
    └── Pivot table untuk multi-role support

activity_logs (id, user_id, action, entity_type, entity_id, details)
    └── Audit trail untuk tracking aktivitas

login_activity (id, user_id, user_email, user_role, login_at)
    └── Tracking login untuk analitik
```

#### B. Akademik Tables
```
academic_years (id, name, semester, start_date, end_date, is_active, pesantren_id)
    └── Tahun ajaran dengan semester

teachers (id, user_id, nip, name, gender, phone, email, specialization, pesantren_id)
    └── Data guru/ustadz

classes (id, name, grade_level, homeroom_teacher_id, academic_year_id, capacity, pesantren_id)
    └── Data kelas dengan wali kelas

students (id, user_id, nis, name, gender, birth_date, class_id, dormitory_id, parent_name, parent_phone, pesantren_id)
    └── Data santri lengkap

subjects (id, code, name, category, credits, pesantren_id)
    └── Mata pelajaran

schedules (id, class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room, pesantren_id)
    └── Jadwal pelajaran

grades (id, student_id, subject_id, teacher_id, academic_year_id, semester, tugas_score, uts_score, uas_score, final_score, grade_letter, is_published)
    └── Nilai akademik per semester
```

#### C. Hafalan Tables
```
hafalan_types (id, name, description, category, total_units, pesantren_id)
    └── Jenis hafalan: Al-Quran (30 Juz), Kitab Kuning, dll

hafalan_programs (id, student_id, hafalan_type_id, assigned_by, target_completion_date, status, notes)
    └── Program hafalan per santri

hafalan_progress (id, program_id, student_id, unit_number, unit_name, progress_percentage, grade, evaluated_by, evaluated_at)
    └── Progress per unit hafalan
```

#### D. Keuangan Tables
```
invoice_types (id, name, amount, is_recurring, recurrence_period, pesantren_id)
    └── Jenis tagihan: SPP, Uang Makan, Uang Gedung, dll

invoices (id, student_id, invoice_type_id, invoice_number, description, amount, due_date, status, paid_amount, pesantren_id)
    └── Tagihan per santri (status: pending/partial/paid/overdue)

payments (id, invoice_id, student_id, amount, payment_date, payment_method, reference_number, received_by, pesantren_id)
    └── Record pembayaran (cash/transfer)

expenses (id, category, description, amount, expense_date, receipt_url, approved_by, recorded_by, pesantren_id)
    └── Record pengeluaran pesantren
```

#### E. Kesantrian Tables
```
dormitories (id, name, building, capacity, current_occupancy, supervisor_id, gender, pesantren_id)
    └── Data asrama putra/putri

violations (id, student_id, violation_date, category, type, description, points, punishment, status, reported_by, pesantren_id)
    └── Pelanggaran (kategori: ringan/sedang/berat)

permissions (id, student_id, permission_type, reason, start_date, end_date, status, approved_by, pesantren_id)
    └── Perizinan (type: pulang/keluar/sakit/kegiatan)
```

#### F. Absensi Tables
```
attendance (id, student_id, date, type, session, status, check_in_time, notes, recorded_by, pesantren_id)
    └── Kehadiran (type: class/prayer/activity, status: hadir/sakit/izin/alpha/telat)

attendance_sessions (id, pesantren_id, name, category, start_time, end_time, is_active)
    └── Sesi absensi (academic/prayer/activity)

attendance_summary (id, student_id, academic_year_id, total_days, present_days, sick_days, permitted_days, absent_days)
    └── Ringkasan kehadiran per tahun ajaran
```

#### G. Parent Portal Tables
```
student_guardians (id, student_id, guardian_id, relationship)
    └── Relasi santri dengan wali

announcements (id, title, content, target_roles, priority, is_active, created_by, pesantren_id)
    └── Pengumuman dengan target role

notifications (id, user_id, title, message, type, is_read, link)
    └── Notifikasi personal
```

#### H. Rapor Settings
```
rapor_settings (id, pesantren_id, yayasan_name, school_name, school_name_arabic, address, headmaster_name, headmaster_nip, passing_grade, rapor_date)
    └── Konfigurasi format rapor per pesantren
```

---

## 📱 5. DESKRIPSI FITUR PER MODUL

### 5.1 Landing Page Publik
- Animasi 3D interaktif menggunakan Three.js
- Hero section dengan statistik pesantren
- Features section menampilkan keunggulan
- CTA "Masuk Portal" untuk login
- Desain responsif dan modern

### 5.2 Sistem Autentikasi
| Fitur | Deskripsi |
|-------|-----------|
| Login | Email + password dengan validasi |
| Multi-role Login | Pilih role saat login jika punya multiple roles |
| Session Management | Auto-refresh token via Supabase |
| Password Reset | Reset via email |
| Role-based Redirect | Auto redirect ke dashboard sesuai role |

### 5.3 Dashboard Super Admin
| Sub-Menu | Fitur |
|----------|-------|
| Dashboard | Statistik: total user, pesantren, login hari ini, growth chart |
| Users | CRUD user, assign role, reset password, toggle status |
| Pesantren | Konfigurasi data pesantren |
| Roles | Manajemen permission per role |
| Activity Logs | Audit trail aktivitas user |
| Database | Akses langsung ke data |
| Settings | Pengaturan global sistem |

### 5.4 Dashboard Admin Akademik
| Sub-Menu | Fitur |
|----------|-------|
| Dashboard | Statistik: total santri, guru, kelas, mapel |
| Data Santri | CRUD santri, import Excel, assign kelas |
| Data Guru | CRUD ustadz dengan spesialisasi |
| Kelas | CRUD kelas, assign wali kelas, lihat anggota |
| Mata Pelajaran | CRUD mapel dengan kategori |
| Jadwal | Pengaturan jadwal per kelas per hari |
| Tahun Ajaran | Manajemen tahun ajaran aktif |
| Pengaturan Rapor | Header, logo, KKM, tanda tangan |
| Hafalan Types | Jenis program hafalan |

### 5.5 Dashboard Admin Keuangan
| Sub-Menu | Fitur |
|----------|-------|
| Dashboard | Statistik: income, expense, balance, unpaid |
| Tagihan | CRUD tagihan per santri/kelas, filter status |
| Pembayaran | Input pembayaran (cash/transfer), update invoice |
| Pengeluaran | CRUD pengeluaran dengan kategori |
| Laporan | Export laporan periode, grafik cashflow |
| Tabungan Santri | Sistem pocket money santri |

### 5.6 Dashboard Kesantrian
| Sub-Menu | Fitur |
|----------|-------|
| Dashboard | Statistik: asrama, pelanggaran bulan ini, izin pending |
| Asrama | CRUD asrama, assign supervisor, kapasitas |
| Pelanggaran | Input pelanggaran dengan kategori dan poin |
| Perizinan | Approval/reject request izin dari wali |
| Laporan | Rekap pelanggaran dan perizinan |

### 5.7 Dashboard Admin Absensi
| Sub-Menu | Fitur |
|----------|-------|
| Dashboard | Statistik: kehadiran hari ini per status |
| Input Absensi | Input per kelas dan sesi |
| Rekap Kelas | Summary kehadiran per kelas |
| Sesi Absensi | CRUD sesi (academic/prayer/activity) |
| Laporan | Export rekap absensi periode |

### 5.8 Dashboard Wali Kelas
| Sub-Menu | Fitur |
|----------|-------|
| Dashboard | Statistik kelas binaan |
| Data Santri | List santri kelas dengan detail |
| Input Nilai | Input/edit nilai per mapel |
| Hafalan | Monitor progress hafalan santri |
| Absensi | Rekap kehadiran kelas |
| Pelanggaran | Lihat pelanggaran santri kelas |
| Rapor | Cetak rapor PDF per santri |
| Hubungi Wali | Kontak wali santri |

### 5.9 Dashboard Ustadz
| Sub-Menu | Fitur |
|----------|-------|
| Dashboard | Statistik: kelas dan santri yang diajar |
| Input Nilai | Input nilai mapel yang diampu |
| Santri Saya | List santri yang diajar |
| Jadwal Mengajar | View jadwal mengajar |
| Tahfidz | Input progress hafalan (untuk ustadz tahfidz) |

### 5.10 Dashboard Wali Santri
| Sub-Menu | Fitur |
|----------|-------|
| Dashboard | Ringkasan anak: kelas, tagihan, pelanggaran |
| Absensi | Monitoring kehadiran anak |
| Nilai | Lihat nilai dan ranking |
| Hafalan | Progress hafalan anak |
| Pembayaran | Tagihan dan history pembayaran |
| Tabungan | Saldo tabungan anak |
| Profil | Detail data anak |

### 5.11 Dashboard Santri
| Sub-Menu | Fitur |
|----------|-------|
| Dashboard | GPA, ranking, hafalan progress |
| Jadwal | Jadwal pelajaran hari ini |
| Nilai | Nilai per semester |
| Hafalan | Progress hafalan personal |
| Profil | View/edit profil pribadi |

---

## 🔐 6. SISTEM KEAMANAN

### 6.1 Authentication
- Password hashing dengan bcrypt via Supabase Auth
- JWT token untuk session management
- Refresh token dengan auto-renewal
- Session invalidation pada logout/password change

### 6.2 Authorization (Row Level Security)
- Semua tabel dilindungi RLS
- Data isolation per pesantren_id (multi-tenant)
- Policy berbasis user role
- Protect super admin dari penghapusan

### 6.3 Data Protection
- Input sanitization
- SQL injection prevention (via Supabase client)
- HTTPS enforcement
- Secure API routes

---

## 📊 7. VISUALISASI DATA

| Chart Type | Lokasi | Data Yang Divisualisasikan |
|------------|--------|----------------------------|
| Bar Chart | Keuangan | Cashflow bulanan (income vs expense) |
| Pie Chart | Keuangan | Status invoice, payment method |
| Pie Chart | Akademik | Gender ratio santri |
| Area Chart | Akademik | Teacher workload |
| Line Chart | Santri | GPA history per semester |
| Radar Chart | Kesantrian | Violation by category |
| Bar Chart | Absensi | Weekly attendance trend |
| Donut Chart | Santri | Hafalan progress |

---

## 📱 8. INTEGRASI MOBILE (ANDROID)

### 8.1 Teknologi
- **Capacitor.js** sebagai native wrapper
- Shared codebase dengan web (Next.js)
- Build menggunakan Android Studio

### 8.2 Native Plugins
| Plugin | Fungsi |
|--------|--------|
| @capacitor/app | App lifecycle management |
| @capacitor/splash-screen | Custom splash screen |
| @capacitor/status-bar | Status bar control |
| @capacitor/keyboard | Virtual keyboard handling |
| @capacitor/network | Network connectivity detection |
| @capacitor/filesystem | File operations |
| @capacitor/share | Native share functionality |

### 8.3 Build Output
- Debug APK untuk testing
- Signed Release APK untuk distribusi
- GitHub Actions untuk CI/CD

---

## 📐 9. STRUKTUR DIREKTORI

```
smart-pesantren/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/admin/            # API Routes (create-user, reset-password, etc)
│   │   ├── dashboard/            # 9 Role-based Dashboards
│   │   │   ├── admin/            # Super Admin (7 sub-pages)
│   │   │   ├── akademik/         # Admin Akademik (9 sub-pages)
│   │   │   ├── keuangan/         # Admin Keuangan (6 sub-pages)
│   │   │   ├── kesantrian/       # Kesantrian (5 sub-pages)
│   │   │   ├── absensi/          # Admin Absensi (5 sub-pages)
│   │   │   ├── wali-kelas/       # Wali Kelas (8 sub-pages)
│   │   │   ├── ustadz/           # Ustadz (5 sub-pages)
│   │   │   ├── wali/             # Wali Santri (7 sub-pages)
│   │   │   └── santri/           # Santri (5 sub-pages)
│   │   ├── login/                # Login page
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/               # Reusable Components
│   │   ├── admin/                # Modal components (11 files)
│   │   ├── charts/               # Chart components (2 files)
│   │   ├── hafalan/              # Hafalan components
│   │   ├── layout/               # Sidebar, Header
│   │   ├── login/                # Login hero, form
│   │   └── rapor/                # Rapor sheet component
│   ├── lib/                      # Utilities & Services
│   │   ├── services/             # 32 API service files
│   │   ├── auth.ts               # Authentication logic (576 lines)
│   │   ├── navigation.ts         # Role-based navigation config
│   │   ├── supabase.ts           # Supabase client
│   │   ├── gradeConverter.ts     # Grade conversion utilities
│   │   └── raporConfig.ts        # Rapor configuration
│   └── types/                    # TypeScript definitions
│       └── database.types.ts     # Auto-generated Supabase types (2492 lines)
├── supabase/                     # Database Scripts
│   ├── MASTER-SETUP.sql          # Complete DB setup (1111 lines)
│   └── migrations/               # SQL migration files
├── android/                      # Capacitor Android Project
├── public/                       # Static assets
├── package.json                  # Dependencies
└── capacitor.config.ts           # Mobile config
```

---

## 🔄 10. ALUR KERJA SISTEM

### 10.1 Registrasi Santri Baru
```
Admin Akademik → Input data santri → Sistem buat akun user otomatis → 
Santri terdaftar di kelas → Wali dapat akses portal
```

### 10.2 Proses Akademik
```
Admin → Setup jadwal → Ustadz input nilai → 
Wali Kelas review & lock → Cetak rapor
```

### 10.3 Proses Keuangan  
```
Admin Keuangan → Buat tagihan → Wali lihat di portal → 
Input pembayaran → Status otomatis update
```

### 10.4 Monitoring Hafalan
```
Admin → Setup jenis hafalan → Ustadz assign ke santri → 
Input progress & grade → Wali monitor di portal
```

### 10.5 Pengelolaan Kesantrian
```
Kesantrian → Input pelanggaran/izin → Poin terakumulasi → 
Wali Kelas & Wali Santri dapat lihat di portal
```

---

## 📈 11. STATISTIK KODE

| Kategori | Jumlah |
|----------|--------|
| Total Pages (TSX) | ~75 halaman |
| Service Files | 32 files |
| Component Files | ~20 files |
| Database Tables | 25+ tabel |
| SQL Functions (RPC) | 20+ functions |
| Total Lines MASTER-SETUP.sql | 1,111 lines |
| Total Lines database.types.ts | 2,492 lines |
| Dependencies | 30+ packages |

---

## 🎨 12. DESAIN UI/UX

### 12.1 Design Principles
- **Role-based Theming**: Setiap role memiliki warna aksen berbeda
- **Glassmorphism**: Efek kaca pada card dan modal
- **Micro-animations**: Transisi halus dengan Framer Motion
- **Responsive**: Desktop, tablet, mobile

### 12.2 Color Scheme per Role
| Role | Warna Aksen |
|------|-------------|
| Super Admin | Purple |
| Admin Akademik | Blue |
| Admin Keuangan | Emerald |
| Kesantrian | Orange |
| Admin Absensi | Teal |
| Wali Kelas | Pink |
| Ustadz | Violet |
| Wali Santri | Orange |
| Santri | Indigo |

---

## ✅ 13. KESIMPULAN

**Smart Pesantren Ecosystem v2.0** adalah sistem informasi manajemen pesantren komprehensif dengan karakteristik:

1. **Multi-Tenant** - Dapat digunakan oleh beberapa pesantren
2. **Multi-Role** - 9 role pengguna dengan hak akses berbeda
3. **Real-Time** - Data ter-update real-time via Supabase
4. **Cross-Platform** - Web responsive + Android native app
5. **Modern Stack** - Next.js 16, React 19, TypeScript, Supabase
6. **Secure** - RLS, bcrypt, session management
7. **Scalable** - Arsitektur modular dan service-based
8. **Indonesian Context** - Dirancang khusus untuk kebutuhan pesantren Indonesia

---

## 📚 REKOMENDASI TAMBAHAN UNTUK SKRIPSI

### A. Metodologi Pengembangan
Disarankan menambahkan penjelasan mengenai:
- Metode SDLC yang digunakan (Agile/Waterfall/Scrum)
- Tahapan pengembangan (analysis, design, implementation, testing)
- Tools yang digunakan (VS Code, Git, GitHub)

### B. Use Case Diagram
Buat diagram use case untuk:
- Setiap aktor (9 role)
- Interaksi dengan sistem
- Include dan extend relationships

### C. Activity Diagram
Buat activity diagram untuk alur utama:
- Proses registrasi santri
- Proses pembayaran
- Proses input nilai sampai cetak rapor
- Proses perizinan santri

### D. Sequence Diagram
Untuk operasi kritis seperti:
- Login flow
- Create invoice dan payment
- Input hafalan progress

### E. Class Diagram
Representasi OOP dari:
- Service classes
- Component hierarchy
- Type interfaces

### F. Testing Documentation
- Unit testing untuk services
- Integration testing untuk API
- User acceptance testing checklist

### G. Deployment Architecture
- Diagram arsitektur deployment
- Supabase cloud infrastructure
- Android distribution strategy

### H. Screenshots
Lengkapi dengan screenshot setiap halaman untuk lampiran.

---

*Dokumen ini dibuat secara otomatis berdasarkan analisis kode sumber aplikasi Smart Pesantren.*

*Tanggal Generate: 6 Februari 2026*
