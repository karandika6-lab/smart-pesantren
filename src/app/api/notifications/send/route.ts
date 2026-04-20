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
        console.log(`>>> LOOKING FOR STUDENT WITH ID: ${studentId}`);
        const { data: student, error: studentError } = await supabaseAdmin
            .from('students')
            .select('parent_user_id, name, email')
            .eq('id', studentId)
            .single();

        if (studentError) {
            console.error('!!! ERROR FETCHING STUDENT:', studentError);
            return NextResponse.json({ error: 'Student not found', details: studentError }, { status: 404 });
        }

        if (!student?.parent_user_id) {
            console.warn(`!!! STUDENT ${student?.name} HAS NO PARENT LINKED (parent_user_id is null)`);
            
            // Try to find ANY user with the same email as the student
            if (student?.email) {
                console.log(`>>> TRYING FALLBACK: FINDING ANY USER WITH EMAIL: ${student.email}`);
                const { data: matchedProfile } = await supabaseAdmin
                    .from('profiles')
                    .select('id, role')
                    .eq('email', student.email)
                    .limit(1)
                    .single();
                
                if (matchedProfile) {
                    console.log(`>>> FALLBACK SUCCESS: FOUND MATCHING USER ID: ${matchedProfile.id} WITH ROLE: ${matchedProfile.role}`);
                    student.parent_user_id = matchedProfile.id;
                }
            }
            
            if (!student?.parent_user_id) {
                return NextResponse.json({ error: 'Parent link missing and fallback failed' }, { status: 404 });
            }
        }

        const parentId = student.parent_user_id;
        console.log(`>>> SENDING NOTIF FOR STUDENT: ${student.name} (${studentId}) TO PARENT: ${parentId}`);

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

        if (notifError) {
            console.error('!!! DB NOTIF INSERT ERROR:', notifError);
        } else {
            console.log('>>> DB NOTIF INSERT SUCCESS');
        }

        // 3. Find parent FCM Tokens
        const { data: tokens, error: tokenError } = await supabaseAdmin
            .from('user_fcm_tokens')
            .select('fcm_token')
            .eq('user_id', parentId);

        console.log(`>>> FOUND ${tokens?.length || 0} TOKENS FOR PARENT: ${parentId}`);

        if (tokenError || !tokens || tokens.length === 0) {
            console.warn('!!! CLIENTS NOT REGISTERED FOR THIS PARENT');
            return NextResponse.json({ success: true, message: 'Saved to DB, but parent has no FCM Token to push.' });
        }

        // 4. Push to Firebase
        initializeAdmin();
        
        // 4. Send with Firebase Admin
        console.log(`>>> SENDING TO ${tokens.length} TOKENS FOR PARENT: ${parentId}`);
        
        const messages = tokens.map(t => ({
            token: t.fcm_token,
            notification: {
                title: title || 'Notifikasi Baru',
                body: message || 'Anda menerima pesan baru'
            },
            data: {
                type: type,
                relatedId: relatedId || '',
                url: `/dashboard/wali/${type}`
            },
            android: {
                priority: 'high' as const,
                notification: {
                    sound: 'default',
                    channelId: 'default'
                }
            }
        }));

        const results = await Promise.all(
            messages.map(msg => 
                admin.messaging().send(msg)
                    .then(id => ({ success: true, id }))
                    .catch(err => ({ success: false, error: err.message }))
            )
        );

        console.log('>>> FIREBASE RESULTS:', results);

        return NextResponse.json({ 
            success: true, 
            diagnostics: {
                studentName: student.name,
                studentEmail: student.email,
                parentFound: !!parentId,
                tokensCount: tokens.length,
                firebaseResults: results
            }
        });

    } catch (error: any) {
        console.error('Push Notification Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
