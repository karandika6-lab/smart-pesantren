import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const supabaseAdmin = getSupabaseAdmin();

    try {
        const {
            name,
            nis,
            gender,
            class_id,
            parent_name,
            parent_phone,
            address,
            pesantren_id
        } = await req.json();

        // Validate required fields
        if (!name || !nis) {
            return NextResponse.json(
                { success: false, error: 'Nama dan NIS wajib diisi' },
                { status: 400 }
            );
        }

        const finalPesantrenId = pesantren_id || '00000000-0000-0000-0000-000000000001';

        // Check if NIS already exists
        const { data: existingStudent } = await supabaseAdmin
            .from('students')
            .select('id')
            .eq('nis', nis)
            .single();

        if (existingStudent) {
            return NextResponse.json(
                { success: false, error: 'NIS sudah terdaftar' },
                { status: 400 }
            );
        }

        // Generate email for student
        const studentEmail = `santri.${nis}@pesantren.local`;
        const defaultPassword = `${nis}123`; // NIS + 123

        // 1. Create auth user for student
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: studentEmail,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: {
                name,
                role: 'santri',
                pesantren_id: finalPesantrenId,
                phone: parent_phone || null
            }
        });

        if (authError) {
            console.error('Auth creation error:', authError);
            return NextResponse.json(
                { success: false, error: authError.message },
                { status: 400 }
            );
        }

        if (!authData.user) {
            return NextResponse.json(
                { success: false, error: 'User creation failed' },
                { status: 500 }
            );
        }

        // 2. Create profile for student
        await supabaseAdmin.from('profiles').insert({
            id: authData.user.id,
            email: studentEmail,
            name,
            role: 'santri',
            pesantren_id: finalPesantrenId,
            phone: parent_phone || null,
            is_active: true,
            status: 'active'
        });

        // 3. Create user_roles for student
        await supabaseAdmin.from('user_roles').insert({
            user_id: authData.user.id,
            role: 'santri',
            is_primary: true
        });

        // 4. Create student record
        const { data: studentData, error: studentError } = await supabaseAdmin
            .from('students')
            .insert({
                user_id: authData.user.id,
                nis,
                name,
                gender: gender || 'L',
                class_id: class_id || null,
                pesantren_id: finalPesantrenId,
                parent_name: parent_name || null,
                parent_phone: parent_phone || null,
                address: address || null,
                status: 'active'
            })
            .select()
            .single();

        if (studentError) {
            console.error('Student creation error:', studentError);
            return NextResponse.json(
                { success: false, error: studentError.message },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            student_id: studentData.id,
            user_id: authData.user.id,
            email: studentEmail,
            password: defaultPassword,
            message: 'Santri berhasil dibuat'
        });

    } catch (error: any) {
        console.error('Unexpected error in create-student:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
