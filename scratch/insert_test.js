const supabaseUrl = 'https://wzquujqccaavwllglfam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cXV1anFjY2FhdndsbGdsZmFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg3NTA5OCwiZXhwIjoyMDg0NDUxMDk4fQ.7YsK07OdH946PoGSlRxYWGtc3hbvSy2Vwl9wTCQQVNE';

async function query(table, method = 'POST', body = null, params = '') {
    const options = {
        method, headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
    };
    if (body) options.body = JSON.stringify(body);
    const url = `${supabaseUrl}/rest/v1/${table}${params}`;
    const res = await fetch(url, options);
    return await res.json();
}

async function insertTestNotif() {
    const parentId = '1e1ed58b-5ddd-41f6-91f0-45d4e76981e7';
    console.log('Sending test notification to:', parentId);
    
    const result = await query('notifications', 'POST', {
        user_id: parentId,
        title: 'TEST MANUAL LOG',
        body: 'Jika Anda melihat ini, berarti sistem riwayat log sudah benar dan masalahnya ada pada pengiriman di server.',
        type: 'general'
    });
    
    console.log('RESULT:', result);
    
    if (result && result.length > 0) {
        console.log('SUCCESS: Notification inserted. Please check your app log!');
    } else {
        console.error('FAILED TO INSERT. Check RLS or connection.');
    }
}

insertTestNotif();
