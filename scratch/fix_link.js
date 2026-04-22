const { createClient } = require('@supabase/supabase-client');

const supabaseUrl = 'https://wzquujqccaavwllglfam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cXV1anFjY2FhdndsbGdsZmFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg3NTA5OCwiZXhwIjoyMDg0NDUxMDk4fQ.7YsK07OdH946PoGSlRxYWGtc3hbvSy2Vwl9wTCQQVNE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    // 1. Find Student Ridho
    const { data: student } = await supabase
        .from('students')
        .select('id, name, parent_user_id')
        .ilike('name', '%Ridho Muzakki%')
        .single();
    
    console.log('--- STUDENT CHECK ---');
    console.log(student);

    if (student) {
        // 2. See profile for that parent
        if (student.parent_user_id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, name, email')
                .eq('id', student.parent_user_id)
                .single();
            console.log('--- PARENT PROFILE LINKED ---');
            console.log(profile);
        } else {
            console.log('WARNING: parent_user_id is NULL for this student');
        }

        // 3. Find if there is a parent with the ID from logcat
        const logcatId = '1e1ed58b-5ddd-41f6-91f0-45d4e76981e7';
        const { data: logcatProfile } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('id', logcatId)
            .single();
        
        console.log('--- LOGCAT USER PROFILE ---');
        console.log(logcatProfile);

        if (student.parent_user_id !== logcatId) {
            console.log('CRITICAL: User in App (' + logcatId + ') does NOT match Student\'s Parent ID (' + student.parent_user_id + ')');
            
            // Should we fix it? 
            console.log('Attempting to fix link...');
            const { error: updateError } = await supabase
                .from('students')
                .update({ parent_user_id: logcatId })
                .eq('id', student.id);
            
            if (updateError) console.error('Update failed:', updateError);
            else console.log('FIX SUCCESS: Ridho is now linked to your current device account.');
        }
    }
}

diagnose();
