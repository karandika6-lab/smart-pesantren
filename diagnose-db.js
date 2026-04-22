const { createClient } = require('@supabase/supabase-js');

const URL = 'https://wzquujqccaavwllglfam.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cXV1anFjY2FhdndsbGdsZmFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg3NTA5OCwiZXhwIjoyMDg0NDUxMDk4fQ.7YsK07OdH946PoGSlRxYWGtc3hbvSy2Vwl9wTCQQVNE';

const supabase = createClient(URL, KEY);

async function check() {
    console.log('--- CHECKING user_fcm_tokens COLUMNS ---');
    const { data: cols, error: colErr } = await supabase
        .from('user_fcm_tokens')
        .select('*')
        .limit(1);
    
    if (colErr) {
        console.log('Error fetching columns:', colErr.message);
    } else if (cols.length > 0) {
        console.log('Columns found from existing data:', Object.keys(cols[0]));
    } else {
        console.log('\nTable is empty. Attempting to fetch schema info via a dummy insert error...');
        const { error: dummyErr } = await supabase
            .from('user_fcm_tokens')
            .insert({ test_dummy_col: 'test' });
        console.log('Error message might contain hints:', dummyErr?.message);
    }
}

check();
