import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    try {
        const supabase = getSupabaseAdmin();
        const { userId, token, deviceInfo } = await req.json();

        if (!userId || !token) {
            return NextResponse.json({ error: 'Missing userId or token' }, { status: 400 });
        }

        // Upsert the token
        const { error } = await supabase
            .from('user_fcm_tokens')
            .upsert({
                user_id: userId,
                fcm_token: token,
                device_info: deviceInfo || 'unknown',
                last_used: new Date().toISOString()
            }, {
                onConflict: 'fcm_token'
            });

        if (error) {
            console.error('Failed to register FCM token:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Token registered' });
    } catch (error: any) {
        console.error('Registration API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
