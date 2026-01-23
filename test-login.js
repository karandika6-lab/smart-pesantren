// test-login.js
// ALAT DIAGNOSA MANUAL - Menguji Login Supabase Tanpa Frontend

const SUPABASE_URL = 'https://wrixwraprdwapqclcpcl.supabase.co';
// Ganti dengan ANON KEY Legacy Anda (eyJ...) 
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyaXh3cmFwcmR3YXBxY2xjcGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTY1MTYsImV4cCI6MjA4MzI3MjUxNn0.x4MjE9lLiE5QI0JXbyKtdxuS7S7AvKahelBmKmqU1KI';

const USER_EMAIL = 'gurutest.final@pesantren.id';
const USER_PASS = 'guru123';

console.log('--- SUPABASE LOGIN DIAGNOSTIC TOOL ---');
console.log(`Target: ${SUPABASE_URL}`);
console.log(`User:   ${USER_EMAIL}`);
console.log('Attempting login via RAW FETCH API...');

async function testLogin() {
    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': ANON_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: USER_EMAIL,
                password: USER_PASS
            })
        });

        console.log(`\nHTTP Status: ${response.status} ${response.statusText}`);

        const data = await response.text();
        console.log('Response Body:');
        console.log(data);

        if (response.status === 200) {
            console.log('\n✅ KESIMPULAN: Server Supabase SEHAT. Masalah ada di kode Frontend Next.js / Cache Browser.');
        } else if (response.status === 500) {
            console.log('\n❌ KESIMPULAN: Server Supabase RUSAK/CRASH. Anda HARUS Restart Project di Dashboard Supabase.');
        } else {
            console.log('\n⚠️  KESIMPULAN: Login Ditolak (Mungkin password salah atau email belum confirm).');
        }

    } catch (err) {
        console.error('Network Error:', err);
    }
}

testLogin();
