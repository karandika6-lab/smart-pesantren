const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wzquujqccaavwllglfam.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cXV1anFjY2FhdndsbGdsZmFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg3NTA5OCwiZXhwIjoyMDg0NDUxMDk4fQ.7YsK07OdH946PoGSlRxYWGtc3hbvSy2Vwl9wTCQQVNE';

async function fixData() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    console.log('Searching for user Ridho...');
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, name')
        .ilike('name', '%Ridho%')
        .limit(1);

    if (pError || !profiles || profiles.length === 0) {
        console.error('User Ridho not found in profiles table');
        return;
    }

    const ridhoId = profiles[0].id;
    console.log(`Found Ridho ID: ${ridhoId}`);

    console.log('Searching for a student to link...');
    const { data: students, error: sError } = await supabase
        .from('students')
        .select('id, name');

    if (sError || !students || students.length === 0) {
        console.error('No students found to link');
        return;
    }

    // Link ALL found students to Ridho for testing
    console.log(`Linking ${students.length} students to Ridho...`);
    for (const student of students) {
        const { error: uError } = await supabase
            .from('students')
            .update({ parent_user_id: ridhoId })
            .eq('id', student.id);
        
        if (uError) console.error(`Failed to update student ${student.name}:`, uError);
    }

    console.log('SUCCESS: Students linked successfully!');
}

fixData();
