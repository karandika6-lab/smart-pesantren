import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wrixwraprdwapqclcpcl.supabase.co';
const supabaseKey = 'sb_publishable_iUtDtb-48dnIzPmvslbYiA_R1S6exhF'; // Note: this key looks suspicious
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- DIAGNOSIS START ---');

    // 1. Check current counts
    try {
        const { count, error: countError } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        console.log('Total Profiles in DB (Count):', count);
        if (countError) console.log('Count Error:', countError.message);

        // 2. Check all profiles (limited)
        const { data: profiles, error } = await supabase.from('profiles').select('id, email, role, pesantren_id');
        if (error) {
            console.error('Error fetching profiles:', error.message);
        } else {
            console.log('Profiles found:', profiles?.length || 0);
            profiles?.forEach(p => {
                console.log(`- ${p.email} [${p.role}] ID: ${p.id} PS: ${p.pesantren_id}`);
            });
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }

    console.log('--- DIAGNOSIS END ---');
}

diagnose();
