import { getSupabaseAdmin } from './src/lib/supabaseAdmin';

async function diagnose() {
    const supabase = getSupabaseAdmin();
    
    // 1. Find the student
    const { data: student } = await supabase
        .from('students')
        .select('id, name, parent_user_id')
        .ilike('name', '%Ridho Muzakki%')
        .single();
    
    if (!student) {
        console.log('Student not found');
        return;
    }
    
    console.log('STUDENT:', student);
    
    if (student.parent_user_id) {
        // 2. Check the parent profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, email, role')
            .eq('id', student.parent_user_id)
            .single();
        
        console.log('PARENT PROFILE:', profile);
        
        // 3. Check notifications for this parent
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', student.parent_user_id);
        
        console.log('NOTIFICATIONS COUNT FOR PARENT:', count);
    } else {
        console.log('PARENT USER ID IS NULL IN DATABASE!');
    }
}

diagnose();
