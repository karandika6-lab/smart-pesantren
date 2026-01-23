
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Try to load env from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnv = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1] : null;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    console.log('Checking attendance data for today...');
    const today = new Date().toISOString().split('T')[0];

    // 1. Check Attendance Table
    const { data: attendance, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', today);

    if (error) {
        console.error('Error fetching attendance:', error);
    } else {
        console.log(`Found ${attendance.length} attendance records for today (${today}):`);
        if (attendance.length > 0) {
            console.log(JSON.stringify(attendance[0], null, 2));
            console.log('Types found:', [...new Set(attendance.map(a => a.type))]);
            console.log('Sessions found:', [...new Set(attendance.map(a => a.session))]);
        } else {
            console.log('NO ATTENDANCE DATA FOUND FOR TODAY.');
        }
    }

    // 2. Check Violations Table (for integrity check)
    const { data: violations, error: vError } = await supabase
        .from('violations')
        .select('*')
        .eq('violation_date', today);

    if (vError) console.error('Error fetching violations:', vError);
    else console.log(`Found ${violations.length} violations for today.`);
}

checkData();
