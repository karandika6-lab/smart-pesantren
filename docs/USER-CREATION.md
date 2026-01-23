# User Creation - Production Implementation

## ✅ Implementasi Baru (Production-Ready)

### Arsitektur
```
Frontend (users.ts) 
  → API Route (/api/admin/create-user) 
    → Supabase Auth Admin API 
      → Database (profiles, user_roles)
```

### Keuntungan
1. ✅ **100% Aman** - Menggunakan official Supabase Auth API
2. ✅ **Tidak ada Error 500** - Tidak bergantung pada trigger yang bisa gagal
3. ✅ **Auto-validation** - Email format, password strength, dll
4. ✅ **Auto-confirmation** - Email langsung confirmed
5. ✅ **Production-ready** - Siap untuk deployment

---

## 📝 Cara Menggunakan

### Dari Frontend
```typescript
import { usersService } from '@/lib/services/users';

const result = await usersService.create(
  'user@example.com',  // email
  'password123',       // password
  'Nama User',         // name
  'admin_akademik',    // role
  '08123456789',       // phone (optional)
  'pesantren-uuid'     // pesantren_id (optional)
);

if (result.success) {
  console.log('User created:', result.user);
} else {
  console.error('Error:', result.error);
}
```

### Role yang Valid
- `super_admin`
- `admin_keuangan`
- `admin_akademik`
- `kesantrian`
- `admin_absensi`
- `wali_kelas`
- `ustadz`
- `wali_santri`
- `santri`

---

## 🔧 Technical Details

### API Endpoint
**POST** `/api/admin/create-user`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Nama User",
  "role": "admin_akademik",
  "phone": "08123456789",
  "pesantren_id": "uuid-pesantren"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user_id": "uuid-user",
  "email": "user@example.com",
  "message": "User berhasil dibuat"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Email already exists"
}
```

---

## 🚫 Yang TIDAK Boleh Dilakukan

### ❌ JANGAN insert langsung ke auth.users
```sql
-- JANGAN LAKUKAN INI!
INSERT INTO auth.users (email, encrypted_password, ...) VALUES (...);
```

### ❌ JANGAN gunakan RPC yang lama
```typescript
// JANGAN LAKUKAN INI!
await supabase.rpc('create_user_by_admin', { ... });
await supabase.rpc('admin_create_user', { ... });
```

### ✅ GUNAKAN API Route
```typescript
// LAKUKAN INI!
await usersService.create(email, password, name, role);
```

---

## 🔐 Security

### Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # WAJIB untuk API route
```

### Service Role Key
- **HANYA** digunakan di server-side (API routes)
- **JANGAN** expose ke client
- **JANGAN** commit ke git (gunakan .env.local)

---

## 🧪 Testing

### Test Manual
1. Login sebagai Super Admin
2. Buka halaman Kelola Pengguna
3. Klik "Tambah Pengguna"
4. Isi form dan submit
5. Cek di Supabase Dashboard → Authentication → Users
6. User harus muncul dengan status "Confirmed"

### Test Login User Baru
1. Logout dari Super Admin
2. Login dengan email/password user baru
3. Harus berhasil tanpa error 500
4. Dashboard sesuai role harus tampil

---

## 📊 Monitoring

### Log Activity
Setiap user creation akan tercatat di tabel `activity_logs`:
```sql
SELECT * FROM activity_logs 
WHERE action = 'create_user' 
ORDER BY created_at DESC;
```

### Check User Status
```sql
SELECT 
  u.email,
  u.email_confirmed_at,
  p.role,
  p.is_active,
  ur.role as user_role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'user@example.com';
```

---

## 🐛 Troubleshooting

### Error: "No API key found"
- Pastikan `.env.local` sudah benar
- Restart Next.js server: `npm run dev`

### Error: "Email already exists"
- Email sudah terdaftar
- Gunakan email lain atau hapus user lama

### Error: "Service role key invalid"
- Cek `SUPABASE_SERVICE_ROLE_KEY` di `.env.local`
- Ambil dari Dashboard → Settings → API → service_role

### User tidak bisa login
- Cek apakah email confirmed: `SELECT email_confirmed_at FROM auth.users WHERE email = '...'`
- Cek apakah profile ada: `SELECT * FROM profiles WHERE email = '...'`
- Cek apakah user_roles ada: `SELECT * FROM user_roles WHERE user_id = '...'`

---

## 📚 References

- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

**Last Updated:** 2026-01-20  
**Status:** ✅ Production-Ready
