'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { App } from '@capacitor/app';

export default function MobileNavigationHandler() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        let backButtonListener: any;

        const setupListener = async () => {
            // Remove any existing listeners first to be safe, though cleanup should handle it
            await App.removeAllListeners();

            backButtonListener = await App.addListener('backButton', (data) => {
                // Define root paths where the app should exit instead of going back
                // These are the main entry points for different roles
                const rootPaths = [
                    '/login',
                    '/',
                    '/dashboard', // Generic dashboard redirect
                    '/dashboard/admin',
                    '/dashboard/keuangan',
                    '/dashboard/akademik',
                    '/dashboard/kesantrian',
                    '/dashboard/absensi',
                    '/dashboard/wali',
                    '/dashboard/santri',
                    '/dashboard/ustadz'
                ];

                // Check if the current pathname is considered a root path
                // We use exact match or check if it matches exactly one of the roots
                // Note: /dashboard/wali/tabungan is NOT a root path, so it will trigger router.back()
                const isRoot = rootPaths.some(path => pathname === path);

                if (isRoot) {
                    // If on a main screen, exit the app (or minimize)
                    App.exitApp();
                } else {
                    // Otherwise, go back in the history stack
                    // We assume Next.js router history is populated. 
                    // If it isn't (e.g. direct load), this might leave standard behavior or do nothing.
                    // But for a SPA, router.back() is the correct "Up" navigation.
                    router.back();
                }
            });
        };

        setupListener();

        // Cleanup listener on component unmount or path change
        return () => {
            if (backButtonListener) {
                backButtonListener.remove();
            }
        };
    }, [pathname, router]);

    return null;
}
