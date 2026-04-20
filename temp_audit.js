
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/["']/g, '');
        env[key] = value;
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoles() {
    console.log('--- CEK ROLE DATABASE ---');
    // Ambil semua role unik dari tabel profiles
    const { data: roles } = await supabase.from('profiles').select('role');
    const uniqueRoles = [...new Set(roles?.map(r => r.role))];
    console.log('Role yang terdeteksi di database:', uniqueRoles);
    
    // Cek akun Bapak (berdasarkan email santri/wali yang Bapak maksud)
    const { data: myAcc } = await supabase.from('profiles').select('id, email, role, name').limit(5);
    console.log('\nSampel 5 Akun Terbaru:');
    myAcc?.forEach(a => console.log(`- ${a.name} | Email: ${a.email} | Role: ${a.role}`));
}
checkRoles();
