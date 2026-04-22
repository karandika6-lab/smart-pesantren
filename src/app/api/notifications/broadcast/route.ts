import { NextResponse } from 'next/server';
import { admin, initializeAdmin } from '@/lib/firebase/admin';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    try {
        const supabaseAdmin = getSupabaseAdmin();
        const body = await req.json();
        const { title, message, targetRoles, pesantrenId } = body;

        if (!title || !message) {
            return NextResponse.json({ error: 'Missing title or message' }, { status: 400, headers: corsHeaders });
        }

        console.log(`>>> BROADCAST: ${title} to roles: ${targetRoles?.join(', ') || 'ALL'}`);

        // 1. Find all users with target roles
        let userQuery = supabaseAdmin
            .from('profiles')
            .select('id');
        
        if (targetRoles && targetRoles.length > 0) {
            userQuery = userQuery.in('role', targetRoles);
        }
        
        if (pesantrenId) {
            userQuery = userQuery.eq('pesantren_id', pesantrenId);
        }

        const { data: users, error: userError } = await userQuery;

        if (userError || !users || users.length === 0) {
            return NextResponse.json({ error: 'No target users found', details: userError }, { status: 404, headers: corsHeaders });
        }

        const userIds = users.map(u => u.id);
        console.log(`>>> FOUND ${userIds.length} TARGET USERS`);

        // 2. Insert into notifications table for all users (History)
        const notificationRecords = userIds.map(uid => ({
            user_id: uid,
            title: title,
            message: message,
            type: 'pengumuman'
        }));

        // Insert in batches of 100 to avoid limits
        for (let i = 0; i < notificationRecords.length; i += 100) {
            const batch = notificationRecords.slice(i, i + 100);
            await supabaseAdmin.from('notifications').insert(batch);
        }

        // 3. Find all FCM Tokens for these users
        const { data: tokenRows, error: tokenError } = await supabaseAdmin
            .from('user_fcm_tokens')
            .select('fcm_token')
            .in('user_id', userIds);

        if (tokenError || !tokenRows || tokenRows.length === 0) {
            return NextResponse.json({ 
                success: true, 
                message: 'Announcements saved to DB history, but no active mobile tokens found for push.' 
            }, { headers: corsHeaders });
        }

        const tokens = tokenRows.map(r => r.fcm_token);
        console.log(`>>> SENDING PUSH TO ${tokens.length} TOKENS`);

        // 4. Send Firebase Multicast
        initializeAdmin();
        
        const multicastMessage = {
            tokens: tokens,
            notification: {
                title: title,
                body: message,
            },
            data: {
                type: 'pengumuman',
                url: '/dashboard/notifikasi'
            },
            android: {
                priority: 'high' as const,
                notification: {
                    sound: 'default',
                    channelId: 'default'
                }
            }
        };

        const response = await admin.messaging().sendEachForMulticast(multicastMessage);
        console.log(`>>> MULTICAST SUCCESS: ${response.successCount}, FAILURE: ${response.failureCount}`);

        return NextResponse.json({
            success: true,
            diagnostics: {
                targetUsers: userIds.length,
                tokensCount: tokens.length,
                successCount: response.successCount,
                failureCount: response.failureCount
            }
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Broadcast Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500, headers: corsHeaders });
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
