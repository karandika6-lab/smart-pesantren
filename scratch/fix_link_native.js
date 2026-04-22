const supabaseUrl = 'https://wzquujqccaavwllglfam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cXV1anFjY2FhdndsbGdsZmFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg3NTA5OCwiZXhwIjoyMDg0NDUxMDk4fQ.7YsK07OdH946PoGSlRxYWGtc3hbvSy2Vwl9wTCQQVNE';

async function query(table, method = 'GET', body = null, params = '') {
    const options = {
        method,
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    };
    if (body) options.body = JSON.stringify(body);
    
    const url = `${supabaseUrl}/rest/v1/${table}${params}`;
    const res = await fetch(url, options);
    return await res.json();
}

async function diagnose() {
    console.log('--- STARTING DIAGNOSIS ---');
    
    try {
        // 1. Find Student
        const students = await query('students', 'GET', null, '?name=ilike.*Ridho%20Muzakki*&select=id,name,parent_user_id');
        const student = students[0];
        console.log('STUDENT:', student);

        if (!student) {
            console.log('Student Ridho not found');
            return;
        }

        // 2. Logcat ID
        const logcatId = '1e1ed58b-5ddd-41f6-91f0-45d4e76981e7';
        
        // 3. Check current profiles for this ID
        const profiles = await query('profiles', 'GET', null, `?id=eq.${logcatId}&select=id,name,email`);
        console.log('LOGCAT PROFILE:', profiles[0] || 'NOT FOUND');

        if (student.parent_user_id !== logcatId) {
            console.log(`MISMATCH: Student Parent (${student.parent_user_id}) vs Logcat User (${logcatId})`);
            
            console.log('Fixing link...');
            const update = await query('students', 'PATCH', { parent_user_id: logcatId }, `?id=eq.${student.id}`);
            console.log('UPDATE RESULT:', update);
            console.log('SUCCESS: Link updated.');
        } else {
            console.log('LINK IS CORRECT. The issue is elsewhere.');
        }

    } catch (e) {
        console.error('DIAGNOSIS FAILED:', e);
    }
}

diagnose();
