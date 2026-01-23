import { supabase } from './src/lib/supabase';

async function check() {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current Auth User:', user?.email, user?.id);

    const { data: profiles, error } = await supabase.from('profiles').select('*');
    console.log('Profiles Count:', profiles?.length);
    console.log('Profiles:', profiles?.map(p => ({ email: p.email, role: p.role, pesantren_id: p.pesantren_id, is_active: p.is_active })));

    if (error) console.error('Error:', error);
}

check();
