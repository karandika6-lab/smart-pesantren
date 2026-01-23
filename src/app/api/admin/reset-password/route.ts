import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, newPassword } = body;

        if (!userId || !newPassword) {
            return NextResponse.json({ success: false, error: 'Data tidak lengkap' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceRoleKey) {
            return NextResponse.json({ success: false, error: 'Server Config Error' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        console.log(`[ResetPassword] Start RPC reset for: ${userId}`);

        // Gunakan RPC Langsung - Bypass Auth API
        const { data, error } = await supabaseAdmin.rpc('admin_reset_password', {
            target_user_id: userId,
            new_password: newPassword
        });

        if (error) {
            console.error('[ResetPassword] RPC Error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Cek return dari function
        // Data format: { success: boolean, message: string }
        if (data && !data.success) {
            console.error('[ResetPassword] RPC Logic Fail:', data);
            return NextResponse.json({ success: false, error: data.message }, { status: 404 });
        }

        console.log('[ResetPassword] Success via RPC');
        return NextResponse.json({ success: true, message: 'Password berhasil direset (RPC Method)' });

    } catch (error: any) {
        console.error('[ResetPassword] Exception:', error);
        return NextResponse.json({ success: false, error: `Server Error: ${error.message}` }, { status: 500 });
    }
}
