import { supabase } from './src/lib/supabase';

async function diagnose() {
    console.log('--- DIAGNOSTIC START ---');

    // 1. Check current profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.log('No user logged in');
        return;
    }
    console.log('Logged in as:', user.email);

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    console.log('Profile Pesantren ID:', profile?.pesantren_id);
    console.log('Profile Role:', profile?.role);

    // 2. Check last 5 invoices (ignore RLS if using service_role, but here we use client)
    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*, students(name)')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching invoices:', error.message);
    } else {
        console.log(`Found ${invoices?.length} invoices:`);
        invoices?.forEach(inv => {
            console.log(`- ID: ${inv.id}, Type: ${inv.invoice_type}, Amount: ${inv.amount}, Pesantren: ${inv.pesantren_id}, Student: ${inv.students?.name || 'NULL'}`);
        });
    }

    // 3. Check students visibility
    const { data: students } = await supabase
        .from('students')
        .select('id, name, pesantren_id')
        .limit(5);
    console.log(`Found ${students?.length} students visible:`);
    students?.forEach(s => console.log(`- ${s.name} (${s.pesantren_id})`));

    console.log('--- DIAGNOSTIC END ---');
}

diagnose();
