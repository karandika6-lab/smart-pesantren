// Test Supabase Connection
// Jalankan dengan: npx ts-node --skip-project src/lib/test-connection.ts
// Atau gunakan di komponen React

import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Test koneksi ke Supabase dengan query sederhana
 */
export async function testConnection() {
    console.log('🔍 Testing Supabase connection...\n');

    // Cek konfigurasi
    if (!isSupabaseConfigured()) {
        console.error('❌ Supabase belum dikonfigurasi!');
        console.log('   Pastikan file .env.local sudah dibuat dengan:');
        console.log('   - NEXT_PUBLIC_SUPABASE_URL');
        console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
        return false;
    }

    console.log('✅ Environment variables terkonfigurasi\n');

    try {
        // Test 1: Query ke tabel 'test'
        console.log('📋 Mencoba query SELECT * FROM test...');
        const { data, error } = await supabase
            .from('test')
            .select('*');

        if (error) {
            // Jika tabel tidak ada, itu normal untuk project baru
            if (error.code === '42P01') {
                console.log('⚠️  Tabel "test" belum ada');
                console.log('   Buat tabel test di Supabase Dashboard → SQL Editor:\n');
                console.log('   CREATE TABLE test (');
                console.log('     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
                console.log('     message TEXT,');
                console.log('     created_at TIMESTAMPTZ DEFAULT NOW()');
                console.log('   );\n');
            } else {
                console.error('❌ Error query:', error.message);
            }
        } else {
            console.log('✅ Query berhasil!');
            console.log(`   Data ditemukan: ${data?.length || 0} row(s)`);
            if (data && data.length > 0) {
                console.log('   Sample:', JSON.stringify(data[0], null, 2));
            }
        }

        // Test 2: Cek koneksi auth
        console.log('\n🔐 Testing auth connection...');
        const { data: session } = await supabase.auth.getSession();
        console.log('✅ Auth service connected');
        console.log(`   Session aktif: ${session?.session ? 'Ya' : 'Tidak'}`);

        return true;

    } catch (err) {
        console.error('❌ Connection failed:', err);
        return false;
    }
}

// Untuk penggunaan di React component
export async function queryTestTable() {
    const { data, error } = await supabase
        .from('test')
        .select('*');

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// Self-execute jika dijalankan langsung
if (typeof window === 'undefined' && require.main === module) {
    testConnection().then(success => {
        process.exit(success ? 0 : 1);
    });
}
