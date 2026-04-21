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

        // --- SOLUSI AUTO-LINK DATA ---
        // 1. Ambil Email user untuk mencari NIS
        const { data: profileData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();

        if (profileData?.email) {
            const email = profileData.email;
            // Cek apakah email mengikuti format santri.NIS@...
            const match = email.match(/santri\.(\d+)@/);
            if (match && match[1]) {
                const nis = match[1];
                console.log(`>>> AUTO-LINKING STUDENT NIS ${nis} TO USER ${userId}`);
                
                // Update tabel students agar parent_user_id sesuai
                await supabase
                    .from('students')
                    .update({ parent_user_id: userId })
                    .eq('nis', nis)
                    // Hanya update jika belum benar
                    .neq('parent_user_id', userId);
            }
        }
        // -----------------------------

        return NextResponse.json({ success: true, message: 'Token registered and data linked' });
    } catch (error: any) {
        console.error('Registration API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
