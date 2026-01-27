'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2, Database, RefreshCw } from 'lucide-react';

interface TestResult {
    name: string;
    status: 'pending' | 'success' | 'error';
    message: string;
}

export default function TestConnectionPage() {
    const [results, setResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const runTests = async () => {
        setIsRunning(true);
        setResults([]);

        const testResults: TestResult[] = [];

        // Test 1: Environment Variables
        testResults.push({
            name: 'Environment Variables',
            status: isSupabaseConfigured() ? 'success' : 'error',
            message: isSupabaseConfigured()
                ? 'SUPABASE_URL dan ANON_KEY terkonfigurasi'
                : 'Environment variables belum diset di .env.local'
        });
        setResults([...testResults]);

        if (!isSupabaseConfigured()) {
            setIsRunning(false);
            return;
        }

        // Test 2: Auth Connection
        try {
            const { data: session, error } = await supabase.auth.getSession();
            testResults.push({
                name: 'Auth Service',
                status: error ? 'error' : 'success',
                message: error
                    ? `Error: ${error.message}`
                    : `Terkoneksi (Session: ${session?.session ? 'Aktif' : 'Tidak ada'})`
            });
        } catch (err: unknown) {
            testResults.push({
                name: 'Auth Service',
                status: 'error',
                message: `Exception: ${err instanceof Error ? err.message : String(err)}`
            });
        }
        setResults([...testResults]);

        // Test 3: Database Query (tabel test)
        try {
            const { data, error } = await supabase.from('test').select('*').limit(5);

            if (error) {
                if (error.code === '42P01') {
                    testResults.push({
                        name: 'Query Tabel "test"',
                        status: 'error',
                        message: 'Tabel "test" belum ada. Buat di SQL Editor.'
                    });
                } else {
                    testResults.push({
                        name: 'Query Tabel "test"',
                        status: 'error',
                        message: `Error: ${error.message}`
                    });
                }
            } else {
                testResults.push({
                    name: 'Query Tabel "test"',
                    status: 'success',
                    message: `Berhasil! Ditemukan ${data?.length || 0} row(s)`
                });
            }
        } catch (err: unknown) {
            testResults.push({
                name: 'Query Tabel "test"',
                status: 'error',
                message: `Exception: ${err instanceof Error ? err.message : String(err)}`
            });
        }
        setResults([...testResults]);

        // Test 4: Database Query (tabel profiles - dari schema)
        try {
            const { data, error } = await supabase.from('profiles').select('id, email, role').limit(5);

            if (error) {
                if (error.code === '42P01') {
                    testResults.push({
                        name: 'Query Tabel "profiles"',
                        status: 'error',
                        message: 'Tabel belum ada. Deploy schema.sql terlebih dahulu.'
                    });
                } else {
                    testResults.push({
                        name: 'Query Tabel "profiles"',
                        status: 'error',
                        message: `Error: ${error.message}`
                    });
                }
            } else {
                testResults.push({
                    name: 'Query Tabel "profiles"',
                    status: 'success',
                    message: `Berhasil! Ditemukan ${data?.length || 0} user(s)`
                });
            }
        } catch (err: unknown) {
            testResults.push({
                name: 'Query Tabel "profiles"',
                status: 'error',
                message: `Exception: ${err instanceof Error ? err.message : String(err)}`
            });
        }
        setResults([...testResults]);

        setIsRunning(false);
    };

    useEffect(() => {
        const timer = requestAnimationFrame(() => {
            runTests();
        });
        return () => cancelAnimationFrame(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Database className="w-8 h-8 text-emerald-600" />
                        <h1 className="text-2xl font-bold text-gray-800">
                            Test Koneksi Supabase
                        </h1>
                    </div>

                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">
                            <strong>Project URL:</strong>
                        </p>
                        <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                            {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Tidak dikonfigurasi'}
                        </code>
                    </div>

                    <div className="space-y-4 mb-6">
                        {results.map((result, index) => (
                            <div
                                key={index}
                                className={`flex items-start gap-3 p-4 rounded-lg border ${result.status === 'success'
                                    ? 'bg-green-50 border-green-200'
                                    : result.status === 'error'
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                {result.status === 'success' && (
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                )}
                                {result.status === 'error' && (
                                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                )}
                                {result.status === 'pending' && (
                                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin flex-shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <p className="font-medium text-gray-800">{result.name}</p>
                                    <p className="text-sm text-gray-600">{result.message}</p>
                                </div>
                            </div>
                        ))}

                        {isRunning && results.length < 4 && (
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                                <p className="text-gray-600">Menjalankan test...</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={runTests}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                        {isRunning ? 'Testing...' : 'Jalankan Ulang Test'}
                    </button>

                    <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                            <strong>💡 Tips:</strong> Jika test gagal, pastikan:
                        </p>
                        <ul className="text-sm text-amber-700 mt-2 list-disc list-inside space-y-1">
                            <li>File <code>.env.local</code> sudah dibuat dengan kredensial yang benar</li>
                            <li>Restart dev server setelah membuat <code>.env.local</code></li>
                            <li>Schema database sudah di-deploy ke Supabase</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
