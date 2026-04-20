'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export default function NotificationManager() {
    useEffect(() => {
        const setupNotifications = async () => {
            const user = getCurrentUser();
            if (!user) return;

            try {
                // Check if running on Capacitor
                const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;

                if (isCapacitor) {
                    const { PushNotifications } = await import('@capacitor/push-notifications');

                    // Request permission
                    const perm = await PushNotifications.requestPermissions();
                    if (perm.receive === 'granted') {
                        // Register for push
                        await PushNotifications.register();

                        // Listen for token
                        PushNotifications.addListener('registration', (token) => {
                            console.log('Push registration success, token:', token.value);
                            saveToken(user.id, token.value, 'android/ios');
                        });

                        PushNotifications.addListener('registrationError', (err) => {
                            console.error('Push registration error:', err.error);
                        });
                    }
                } else {
                    // Browser FCM logic (optional, requires service worker)
                    console.log('Running in browser - push notifications require service worker setup');
                }
            } catch (error) {
                console.error('Notification Setup Error:', error);
            }
        };

        const saveToken = async (userId: string, token: string, info: string) => {
            try {
                await fetch('/api/notifications/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, token, deviceInfo: info })
                });
            } catch (e) {
                console.error('Save Token Error:', e);
            }
        };

        setupNotifications();
    }, []);

    return null;
}
