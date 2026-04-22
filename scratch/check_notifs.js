const supabaseUrl = 'https://wzquujqccaavwllglfam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cXV1anFjY2FhdndsbGdsZmFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg3NTA5OCwiZXhwIjoyMDg0NDUxMDk4fQ.7YsK07OdH946PoGSlRxYWGtc3hbvSy2Vwl9wTCQQVNE';

async function query(table, method = 'GET', body = null, params = '') {
    const options = {
        method, headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' }
    };
    const url = `${supabaseUrl}/rest/v1/${table}${params}`;
    const res = await fetch(url, options);
    return await res.json();
}

async function checkNotifs() {
    const parentId = '1e1ed58b-5ddd-41f6-91f0-45d4e76981e7';
    const notifs = await query('notifications', 'GET', null, `?user_id=eq.${parentId}&select=*&order=created_at.desc`);
    console.log(`FOUND ${notifs.length} NOTIFICATIONS FOR ${parentId}`);
    if (notifs.length > 0) {
        console.log('LATEST NOTIF:', notifs[0]);
    }
}

checkNotifs();
