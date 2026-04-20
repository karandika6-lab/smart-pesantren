import { NextResponse } from 'next/server';
import { admin, initializeAdmin } from '@/lib/firebase/admin';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const body = await req.json();
        const { studentId, title, message, type = 'absensi', relatedId } = body;

        if (!studentId || !title || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get Student to find parent_user_id
        const { data: student, error: studentError } = await supabaseAdmin
            .from('students')
            .select('parent_user_id, name')
            .eq('id', studentId)
            .single();

        if (studentError || !student?.parent_user_id) {
            return NextResponse.json({ error: 'Parent not found for this student', details: studentError }, { status: 404 });
        }

        const parentId = student.parent_user_id;

        // 2. Insert to notifications table
        const { data: notifData, error: notifError } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: parentId,
                title: title,
                body: message,
                type: type,
                related_id: relatedId || null
            })
            .select()
            .single();

        if (notifError) console.error('Failed to insert DB notification:', notifError);

        // 3. Find parent FCM Tokens
        const { data: tokens, error: tokenError } = await supabaseAdmin
            .from('user_fcm_tokens')
            .select('fcm_token')
            .eq('user_id', parentId);

        if (tokenError || !tokens || tokens.length === 0) {
            return NextResponse.json({ success: true, message: 'Saved to DB, but parent has no FCM Token to push.' });
        }

        // 4. Push to Firebase
        initializeAdmin();
        const fcmTokens = tokens.map(t => t.fcm_token);
        
        const payload = {
            notification: {
                title: title,
                body: message,
            },
            data: {
                type: type,
                relatedId: relatedId || '',
                url: `/dashboard/wali/${type}`
            },
            tokens: fcmTokens
        };

        const response = await admin.messaging().sendEachForMulticast(payload);

        return NextResponse.json({ 
            success: true, 
            message: 'Notification sent and logged',
            firebaseResponse: response
        });

    } catch (error: any) {
        console.error('Push Notification Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
