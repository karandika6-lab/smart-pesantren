import * as admin from 'firebase-admin';

function initializeAdmin() {
    if (!admin.apps.length) {
        try {
            // First try reading from raw JSON string (Recommended for Vercel)
            const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
            
            if (serviceAccountRaw) {
                // Remove extra escapes just in case and replace actual \n with newline characters
                const parsedKey = JSON.parse(serviceAccountRaw);
                if (parsedKey.private_key) {
                    parsedKey.private_key = parsedKey.private_key.replace(/\\n/g, '\n');
                }
                admin.initializeApp({
                    credential: admin.credential.cert(parsedKey)
                });
                console.log('Firebase Admin Initialized from raw string key');
                return;
            }

            // Fallback to File path (for Local Dev)
            const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
            if (serviceAccountPath) {
                const fs = require('fs');
                const path = require('path');
                const absolutePath = path.resolve(process.cwd(), serviceAccountPath.replace('./', ''));
                if (fs.existsSync(absolutePath)) {
                    const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount)
                    });
                    console.log('Firebase Admin Initialized from file');
                } else {
                    console.warn('Firebase Service account file not found locally. Skipping file init.');
                }
            } else {
                console.error('No FIREBASE_SERVICE_ACCOUNT provided!');
            }
        } catch (error) {
            console.error('Firebase admin initialization error', error);
        }
    }
}

export { admin, initializeAdmin };
