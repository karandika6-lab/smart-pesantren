# Smart Pesantren Ecosystem v2.0

Digitalisasi ekosistem pesantren modern dengan fitur pemantauan akademik, program hafalan, dan kedisiplinan santri secara real-time. Dibangun menggunakan Next.js dan diintegrasikan ke Android menggunakan Capacitor.js.

## Fitur Utama
- **Landing Page Premium**: Animasi 3D modern dan desain responsif.
- **Multi-Role Dashboard**: Akses khusus untuk Admin, Guru, Wali Santri, dan Santri.
- **Monitoring Hafalan**: Pelacakan progres hafalan Al-Qur'an dan kitab secara digital.
- **Aplikasi Android**: Integrasi native untuk pengalaman pengguna yang lebih baik di ponsel.

## Pengembangan Lokal

### Prasyarat
- Node.js 18+
- Android Studio (untuk build Android)
- Supabase Account (untuk database)

### Instalasi
```bash
npm install
```

### Menjalankan Web
```bash
npm run dev
```

### Menjalankan Android
Pastikan sudah melakukan build web terlebih dahulu:
```bash
npm run build:android
npm run android:open
```

## Dokumentasi Tambahan
- [Android Build Guide](file:///ANDROID_BUILD.md) - Panduan detail untuk teknis Android.

## Tech Stack
- **Frontend**: Next.js 15+, Tailwind CSS, Framer Motion.
- **3D Engine**: Three.js (@react-three/fiber).
- **Backend**: Supabase (Auth & DB).
- **Mobile Wrapper**: Capacitor.js.
