const supabaseUrl = 'https://wzquujqccaavwllglfam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cXV1anFjY2FhdndsbGdsZmFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg3NTA5OCwiZXhwIjoyMDg0NDUxMDk4fQ.7YsK07OdH946PoGSlRxYWGtc3hbvSy2Vwl9wTCQQVNE';

async function checkColumns() {
    // We try to fetch 1 row to see the keys
    const url = `${supabaseUrl}/rest/v1/notifications?limit=1`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (res.ok) {
        const data = await res.json();
        console.log('SAMPLE DATA KEYS:', data.length > 0 ? Object.keys(data[0]) : 'TABLE EMPTY');
    } else {
        console.error('FAILED TO FETCH:', await res.text());
    }
}

checkColumns();
