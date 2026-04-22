export async function sendNotification(params: {
    studentId: string;
    title: string;
    message: string;
    type: 'absensi' | 'hafalan' | 'keuangan' | 'general';
    relatedId?: string;
}) {
    try {
        const { Capacitor } = await import('@capacitor/core');
        // Improved URL logic: Prefer env, then window origin, then hardcoded fallback
        let baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
        
        if (!baseUrl && typeof window !== 'undefined') {
            baseUrl = window.location.origin;
        }

        // Final fallback for production mobile
        if (!baseUrl || baseUrl.includes('localhost')) {
            baseUrl = 'https://smart-pesantren.vercel.app';
        }

        const apiPath = '/api/notifications/send/';
        const fullUrl = baseUrl.endsWith('/') ? `${baseUrl.slice(0, -1)}${apiPath}` : `${baseUrl}${apiPath}`;

        console.log(`>>> TRIGGERING NOTIF: ${params.type} for student ${params.studentId} at URL: ${fullUrl}`);

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: params.studentId,
                title: params.title,
                message: params.message,
                type: params.type,
                relatedId: params.relatedId
            })
        });

        const data = await response.json();
        console.log(`>>> NOTIF API RESPONSE [${params.type}]:`, data);
        return data;
    } catch (error) {
        console.error(`!!! FAILED TO SEND ${params.type} NOTIFICATION:`, error);
        return { success: false, error };
    }
}

export async function broadcastNotification(params: {
    title: string;
    message: string;
    targetRoles?: string[];
    pesantrenId?: string;
}) {
    try {
        const { Capacitor } = await import('@capacitor/core');
        // Improved URL logic
        let baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
        
        if (!baseUrl && typeof window !== 'undefined') {
            baseUrl = window.location.origin;
        }

        if (!baseUrl || baseUrl.includes('localhost')) {
            baseUrl = 'https://smart-pesantren.vercel.app';
        }

        const apiPath = '/api/notifications/broadcast/';
        const fullUrl = baseUrl.endsWith('/') ? `${baseUrl.slice(0, -1)}${apiPath}` : `${baseUrl}${apiPath}`;

        console.log(`>>> TRIGGERING BROADCAST: ${params.title}`);

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        const data = await response.json();
        console.log('>>> BROADCAST API RESPONSE:', data);
        return data;
    } catch (error) {
        console.error('!!! FAILED TO BROADCAST NOTIFICATION:', error);
        return { success: false, error };
    }
}
