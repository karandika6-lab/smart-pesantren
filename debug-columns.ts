import { supabase } from './src/lib/supabase';

async function check() {
    const { data, error } = await supabase.from('violations').select('*').limit(1);
    if (error) {
        console.error('Error fetching violations:', error);
    } else {
        console.log('Violation columns:', Object.keys(data[0] || {}));
    }

    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
    if (pError) {
        console.error('Error fetching profiles:', pError);
    } else {
        console.log('Profile columns:', Object.keys(profiles[0] || {}));
    }
}

check();
