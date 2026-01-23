import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(req: NextRequest) {
    try {
        const { name, nip, email, phone, specialization, gender, pesantren_id } = await req.json();

        // Validate required fields
        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Nama wajib diisi' },
                { status: 400 }
            );
        }

        const finalPesantrenId = pesantren_id || '00000000-0000-0000-0000-000000000001';

        // Generate email if not provided
        const teacherEmail = email || `guru.${name.toLowerCase().replace(/\s+/g, '.')}@pesantren.local`;
        const defaultPassword = 'guru123'; // Default password for teachers

        // 1. Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: teacherEmail,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: {
                name,
                role: 'ustadz',
                pesantren_id: finalPesantrenId,
                phone: phone || null
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

        // 2. Create profile
        await supabaseAdmin.from('profiles').insert({
            id: authData.user.id,
            email: teacherEmail,
            name,
            role: 'ustadz',
            pesantren_id: finalPesantrenId,
            phone: phone || null,
            is_active: true,
            status: 'active'
        });

        // 3. Create user_roles
        await supabaseAdmin.from('user_roles').insert({
            user_id: authData.user.id,
            role: 'ustadz',
            is_primary: true
        });

        // 4. Create teacher record
        const { data: teacherData, error: teacherError } = await supabaseAdmin
            .from('teachers')
            .insert({
                user_id: authData.user.id,
                name,
                nip: nip || null,
                phone: phone || null,
                email: teacherEmail,
                specialization: specialization || null,
                gender: gender || 'L',
                is_active: true,
                pesantren_id: finalPesantrenId,
                status: 'active'
            })
            .select()
            .single();

        if (teacherError) {
            console.error('Teacher creation error:', teacherError);
            return NextResponse.json(
                { success: false, error: teacherError.message },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            teacher_id: teacherData.id,
            user_id: authData.user.id,
            email: teacherEmail,
            password: defaultPassword,
            message: 'Guru berhasil dibuat'
        });

    } catch (error: any) {
        console.error('Unexpected error in create-teacher:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
