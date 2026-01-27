'use client';
import { useState } from 'react';

export default function DebugEnvPage() {
    const [envData] = useState(() => ({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        // Kita hanya tampilkan 15 karakter pertama key untuk keamanan
        anonKeyStart: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 15),
        anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
    }));


    return (
        <div className="p-10 bg-black text-white font-mono">
            <h1 className="text-2xl font-bold mb-4">Debug Environment Variables</h1>
            <pre className="bg-gray-900 p-4 rounded border border-gray-700">
                {JSON.stringify(envData, null, 2)}
            </pre>
            <p className="mt-4 text-gray-400">
                Jika anonKeyStart kosong atau undefined, berarti file .env.local TIDAK TERBACA.
            </p>
        </div>
    );
}
