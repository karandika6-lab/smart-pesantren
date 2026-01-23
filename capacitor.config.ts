import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.smartpesantren.app',
    appName: 'Smart Pesantren',
    webDir: 'out',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: '#050505',
            showSpinner: true,
            spinnerColor: '#f97316',
            androidScaleType: 'CENTER_CROP'
        },
        StatusBar: {
            overlaysWebView: false,
            backgroundColor: '#050505',
            style: 'DARK'
        },
        Keyboard: {
            resize: 'body',
            resizeOnFullScreen: true
        }
    },
    android: {
        allowMixedContent: true,
        backgroundColor: '#050505',
        webContentsDebuggingEnabled: true
    }
};

export default config;

