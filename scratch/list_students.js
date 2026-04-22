const supabaseUrl = 'https://wzquujqccaavwllglfam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cXV1anFjY2FhdndsbGdsZmFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg3NTA5OCwiZXhwIjoyMDg0NDUxMDk4fQ.7YsK07OdH946PoGSlRxYWGtc3hbvSy2Vwl9wTCQQVNE';

async function listStudents() {
    const url = `${supabaseUrl}/rest/v1/students?select=id,name,parent_user_id&limit=5`;
    const res = await fetch(url, {
        method: 'GET',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const data = await res.json();
    console.log('STUDENTS:', JSON.stringify(data, null, 2));
}

listStudents();
