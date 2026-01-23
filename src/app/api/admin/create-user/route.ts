import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create Supabase Admin client with service role key
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
        const { email, password, name, role, pesantren_id, phone } = await req.json();

        // Validate required fields
        if (!email || !password || !name || !role) {
            return NextResponse.json(
                { success: false, error: 'Email, password, name, dan role wajib diisi' },
                { status: 400 }
            );
        }

        // Default pesantren_id if not provided
        const finalPesantrenId = pesantren_id || '00000000-0000-0000-0000-000000000001';

        // 1. Create user via Supabase Auth Admin API (SAFE & OFFICIAL)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email.toLowerCase().trim(),
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                name,
                role,
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

        // 2. Create profile in profiles table
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: authData.user.id,
                email: email.toLowerCase().trim(),
                name,
                role,
                pesantren_id: finalPesantrenId,
                phone: phone || null,
                is_active: true,
                status: 'active'
            });

        if (profileError) {
            console.error('Profile creation error:', profileError);
            // Don't fail the whole operation, profile might be created by trigger
        }

        // 3. Create user_roles entry
        const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({
                user_id: authData.user.id,
                role,
                is_primary: true
            });

        if (roleError) {
            console.error('User role creation error:', roleError);
            // Don't fail, this is not critical
        }

        // 4. Log activity
        try {
            await supabaseAdmin.from('activity_logs').insert({
                user_id: authData.user.id,
                action: 'create_user',
                entity_type: 'user',
                entity_id: authData.user.id,
                details: { email, role, created_by: 'admin' },
                pesantren_id: finalPesantrenId
            });
        } catch (logError) {
            // Logging error is not critical
            console.warn('Activity log error:', logError);
        }

        return NextResponse.json({
            success: true,
            user_id: authData.user.id,
            email: authData.user.email,
            message: 'User berhasil dibuat'
        });

    } catch (error: any) {
        console.error('Unexpected error in create-user:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
