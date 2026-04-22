export async function sendNotification(params: {
    studentId: string;
    title: string;
    message: string;
    type: 'absensi' | 'hafalan' | 'keuangan' | 'general';
    relatedId?: string;
}) {
    try {
        const { Capacitor } = await import('@capacitor/core');
        let baseUrl = '';
        if (typeof window !== 'undefined') {
            if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
                // If in dev or mobile, check env or fallback to current origin
                baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
            } else {
                baseUrl = window.location.origin;
            }
        }
        
        // Ensure production URL is used if on mobile
        if (Capacitor.getPlatform() !== 'web') {
            baseUrl = 'https://smart-pesantren.vercel.app';
        }

        const apiPath = '/api/notifications/send/';
        const fullUrl = baseUrl.endsWith('/') ? `${baseUrl.slice(0, -1)}${apiPath}` : `${baseUrl}${apiPath}`;

        console.log(`>>> TRIGGERING NOTIF: ${params.type} for student ${params.studentId}`);

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
        let baseUrl = '';
        if (typeof window !== 'undefined') {
            if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
                baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
            } else {
                baseUrl = window.location.origin;
            }
        }
        
        if (Capacitor.getPlatform() !== 'web') {
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
