// ═══════════════════════════════════════════════════════════
// DIAGNOSTIC SCRIPT: Test Supabase Connection & Login
// Jalankan: node diagnose-supabase.js
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://wzquujqccaavwllglfam.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cXV1anFjY2FhdndsbGdsZmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzUwOTgsImV4cCI6MjA4NDQ1MTA5OH0.L1pMA3ia5SWxBuihUSLLgd7a-9TyS_drrlb6ixa2FbA';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cXV1anFjY2FhdndsbGdsZmFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg3NTA5OCwiZXhwIjoyMDg0NDUxMDk4fQ.7YsK07OdH946PoGSlRxYWGtc3hbvSy2Vwl9wTCQQVNE';

const TEST_EMAIL = 'karandika6@gmail.com';
const TEST_PASSWORD = 'admin123';

async function diagnose() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 SUPABASE DIAGNOSTIC TOOL');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Test 1: Check if Supabase is reachable
    console.log('📡 TEST 1: Checking Supabase connectivity...');
    try {
        const healthRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: { 'apikey': ANON_KEY }
        });
        console.log(`   Status: ${healthRes.status} ${healthRes.statusText}`);
        if (healthRes.status === 200) {
            console.log('   ✅ Supabase REST API is reachable\n');
        } else {
            console.log('   ❌ Supabase REST API issue\n');
        }
    } catch (e) {
        console.log(`   ❌ Network error: ${e.message}\n`);
    }

    // Test 2: Check if profiles table exists
    console.log('📊 TEST 2: Checking profiles table...');
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?limit=1`, {
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`
            }
        });
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        if (res.status === 200) {
            console.log(`   ✅ profiles table exists, ${Array.isArray(data) ? data.length : 0} rows found`);
            if (data.length > 0) {
                console.log(`   Sample: ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`);
            }
        } else {
            console.log(`   ❌ Error: ${JSON.stringify(data)}`);
        }
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
    }
    console.log('');

    // Test 3: Check pesantren table
    console.log('🏫 TEST 3: Checking pesantren table...');
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/pesantren?limit=5`, {
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`
            }
        });
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        if (res.status === 200) {
            console.log(`   ✅ pesantren table exists, ${Array.isArray(data) ? data.length : 0} rows:`);
            data.forEach(p => console.log(`      - ${p.name}`));
        } else {
            console.log(`   ❌ Error: ${JSON.stringify(data)}`);
        }
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
    }
    console.log('');

    // Test 4: Check auth.users via Admin API
    console.log('👤 TEST 4: Checking if user exists in auth.users...');
    try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`
            }
        });
        const data = await res.json();
        if (res.status === 200 && data.users) {
            const user = data.users.find(u => u.email === TEST_EMAIL);
            if (user) {
                console.log(`   ✅ User found in auth.users:`);
                console.log(`      ID: ${user.id}`);
                console.log(`      Email: ${user.email}`);
                console.log(`      Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'NO ❌'}`);
                console.log(`      Created: ${user.created_at}`);
                console.log(`      Identities: ${user.identities?.length || 0}`);
            } else {
                console.log(`   ❌ User ${TEST_EMAIL} NOT FOUND in auth.users!`);
                console.log(`   Available users: ${data.users.map(u => u.email).join(', ')}`);
            }
        } else {
            console.log(`   ❌ Error fetching users: ${JSON.stringify(data)}`);
        }
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
    }
    console.log('');

    // Test 5: Attempt Login
    console.log('🔐 TEST 5: Attempting login via REST API...');
    try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })
        });

        const data = await res.json();
        console.log(`   HTTP Status: ${res.status} ${res.statusText}`);

        if (res.status === 200) {
            console.log('   ✅ LOGIN SUCCESSFUL!');
            console.log(`   Access Token: ${data.access_token?.substring(0, 30)}...`);
            console.log(`   User ID: ${data.user?.id}`);
        } else {
            console.log('   ❌ LOGIN FAILED!');
            console.log(`   Error Code: ${data.error_code || data.code}`);
            console.log(`   Message: ${data.msg || data.message || data.error_description}`);
            console.log(`   Full Response: ${JSON.stringify(data, null, 2)}`);
        }
    } catch (e) {
        console.log(`   ❌ Network Error: ${e.message}`);
    }
    console.log('');

    // Test 6: Check triggers on auth.users
    console.log('⚡ TEST 6: Checking database triggers...');
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
            method: 'POST',
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        // This won't work but we need to check via SQL
        console.log('   ℹ️  Run this in SQL Editor to check triggers:');
        console.log('   SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgrelid = \'auth.users\'::regclass;');
    } catch (e) {
        console.log(`   ℹ️  Cannot check triggers via REST. Use SQL Editor.`);
    }
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 DIAGNOSIS COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
}

diagnose().catch(console.error);
