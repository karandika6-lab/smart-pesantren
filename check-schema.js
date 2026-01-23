
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wzquujqccaavwllglfam.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cXV1anFjY2FhdndsbGdsZmFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg3NTA5OCwiZXhwIjoyMDg0NDUxMDk4fQ.7YsK07OdH946PoGSlRxYWGtc3hbvSy2Vwl9wTCQQVNE';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkSchema() {
    console.log('Checking grades table...');
    const { data: grades, error: gError } = await supabase.from('grades').select('*').limit(1);
    if (gError) console.error('Grades error:', gError);
    else console.log('Grades columns:', Object.keys(grades[0] || {}));

    console.log('\nChecking hafalan_progress table...');
    const { data: hafalan, error: hError } = await supabase.from('hafalan_progress').select('*').limit(1);
    if (hError) console.error('Hafalan error:', hError);
    else console.log('Hafalan columns:', Object.keys(hafalan[0] || {}));

    console.log('\nChecking hafalan_progress_old table...');
    const { data: hafalanOld, error: hoError } = await supabase.from('hafalan_progress_old').select('*').limit(1);
    if (hoError) console.log('Hafalan old table might not exist.');
    else console.log('Hafalan old columns:', Object.keys(hafalanOld[0] || {}));
}

checkSchema();
