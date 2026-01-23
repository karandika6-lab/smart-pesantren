import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wrixwraprdwapqclcpcl.supabase.co';
const supabaseKey = 'sb_publishable_iUtDtb-48dnIzPmvslbYiA_R1S6exhF';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSystemIntegrity() {
    console.log('--- SYSTEM INTEGRITY CHECK ---');

    // 1. Cek RLS Policies via RPC (jika ada) atau coba fetch data
    console.log('Testing Profile Fetch (Simulation)...');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id, email, role');

    if (pError) {
        console.log('RLS Check: FAILED');
        console.log('Error:', pError.message);
    } else {
        console.log('RLS Check: SUCCESS');
        console.log('Profiles visible:', profiles?.length);
    }

    // 2. Cek apakah ada profil tanpa pesantren_id (bisa bikin masalah saat filter)
    const { data: nullPesantren } = await supabase.from('profiles').select('email').is('pesantren_id', null);
    if (nullPesantren && nullPesantren.length > 0) {
        console.log('Warning: Found profiles without pesantren_id:', nullPesantren.map(p => p.email));
    } else {
        console.log('All profiles have pesantren_id: YES');
    }

    // 3. Cek apakah Super Admin email (karandika6@gmail.com) sudah punya role yang benar di DB
    const { data: adminCheck } = await supabase.from('profiles').select('role, pesantren_id').eq('email', 'karandika6@gmail.com').single();
    console.log('Super Admin Role in DB:', adminCheck?.role);
    console.log('Super Admin Pesantren ID:', adminCheck?.pesantren_id);

    console.log('--- CHECK COMPLETE ---');
}

checkSystemIntegrity();
