# 📱 Smart Pesantren - Android Build Guide

## Persyaratan

1. **Android Studio** (versi terbaru, Arctic Fox atau lebih baru)
2. **JDK 17** atau lebih baru
3. **Android SDK** (API 24+, Android 7.0 Nougat)
4. **Node.js** v18+

---

## Cara Membuka di Android Studio

### 1. Buka Folder Android
Buka Android Studio, kemudian pilih:
```
File → Open → Pilih folder: smart-pesantren/android
```

Atau jalankan perintah:
```bash
npm run android:open
```

### 2. Tunggu Gradle Sync
Android Studio akan otomatis melakukan sinkronisasi Gradle. Tunggu hingga selesai (bisa memakan waktu 2-5 menit pada pertama kali).

### 3. Jalankan di Emulator atau Device
1. Hubungkan device Android fisik (dengan USB Debugging aktif), atau jalankan Emulator
2. Klik tombol **Run ▶️** di Android Studio
3. Pilih device target

---

## Script NPM yang Tersedia

| Script | Deskripsi |
|--------|-----------|
| `npm run build` | Build static export Next.js |
| `npm run build:android` | Build + Sync ke Android |
| `npm run android:open` | Buka project di Android Studio |
| `npm run android:sync` | Sync perubahan web ke Android |
| `npm run android:run` | Jalankan langsung di device |

---

## Build APK untuk Release

### Debug APK
Di Android Studio:
```
Build → Build Bundle(s) / APK(s) → Build APK(s)
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK (Signed)
1. Buat keystore:
```bash
keytool -genkey -v -keystore smart-pesantren.keystore -alias smart-pesantren -keyalg RSA -keysize 2048 -validity 10000
```

2. Di Android Studio:
```
Build → Generate Signed Bundle / APK → APK → Pilih keystore
```

---

## Troubleshooting

### Blank Screen saat Buka App
- Pastikan folder `out/` sudah ter-generate (`npm run build`)
- Jalankan `npm run android:sync`

### WebView Error / CORS Issue
- Buka `capacitor.config.ts`
- Pastikan `server.androidScheme: 'https'` sudah di-set

### App Crash saat Buka
- Cek logcat di Android Studio untuk error detail
- Pastikan semua dependencies sudah terinstall

---

## Struktur Folder Android

```
android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml    # Konfigurasi app
│   │   ├── assets/                # Web assets (auto-generated)
│   │   └── res/
│   │       ├── mipmap-*/          # App icons
│   │       ├── values/
│   │       │   ├── colors.xml     # Brand colors
│   │       │   ├── strings.xml    # App strings
│   │       │   └── styles.xml     # Theme styling
│   │       └── drawable/          # Splash screen
│   └── build.gradle
├── build.gradle
└── settings.gradle
```

---

## Info Aplikasi

- **Package ID**: `com.smartpesantren.app`
- **App Name**: Smart Pesantren
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 34 (Android 14)
