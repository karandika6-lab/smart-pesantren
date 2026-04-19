import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, User as UserIcon, Calendar, Check, AlertTriangle, Building2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function generateStaticParams() {
    return [];
}

export default async function VerifySantriPage({ params }: { params: { id: string | string[] } }) {
    // We will do a generic read from supabase. If RLS blocks it, we should use a custom admin RPC or bypass logic,
    // but for now let's attempt a normal query. 
    // Ideally this query only fetches non-sensitive info for public validation
    
    // Resolve params for Next.js 13+ app directory best practices where params could be a promise
    const id = params.id;
    
    const { data: student, error } = await supabase
        .from('students')
        .select(`
            id, 
            name, 
            nis, 
            gender, 
            status,
            photo_url,
            classes (name),
            pesantren (name, logo_url)
        `)
        .eq('id', id)
        .single();

    if (error || !student) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-rose-500 p-8 text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <XCircle className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Data Tidak Ditemukan</h1>
                        <p className="text-rose-100 text-sm">QR Code tidak valid atau santri tidak terdaftar di sistem kami.</p>
                    </div>
                    <div className="p-8 text-center">
                        <Link href="/" className="inline-block px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors uppercase text-xs tracking-wider">
                            Kembali ke Beranda
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const { pesantren: pesantrenData, classes } = student as any;

    return (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
                
                {/* Status Header */}
                <div className="bg-emerald-500 p-8 pt-10 text-center relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-400/50 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative z-10 block">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-900/20 ring-4 ring-white/30">
                            <Check className="w-10 h-10 text-emerald-500 stroke-[3]" />
                        </div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-1.5">Data Valid</h1>
                        <p className="text-emerald-100 text-sm font-medium">Berdasarkan Database Smart Pesantren</p>
                    </div>
                </div>

                <div className="p-8 relative z-20 -mt-6">
                    {/* Pesantren Info (Top overlapping banner) */}
                    <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4 mb-8">
                         {pesantrenData?.logo_url ? (
                            <img src={pesantrenData.logo_url} alt="Logo" className="w-12 h-12 object-contain rounded-lg" />
                         ) : (
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <Building2 className="w-6 h-6" />
                            </div>
                         )}
                         <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Institusi</p>
                            <p className="text-sm font-bold text-gray-800">{pesantrenData?.name || 'Pesantren Tidak Diketahui'}</p>
                         </div>
                    </div>

                    {/* Photo & Main Info */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-32 h-32 rounded-[2rem] overflow-hidden bg-gray-100 shadow-inner mb-4 relative border-4 border-white shadow-xl">
                            {student.photo_url ? (
                                <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                    <UserIcon className="w-12 h-12" />
                                </div>
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase text-center mb-1">{student.name}</h2>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full mt-2">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Tercatat Aktif</span>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm text-gray-400 border border-gray-100 flex items-center justify-center">
                                <UserIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nomor Induk (NIS)</p>
                                <p className="text-base font-bold text-gray-900 font-mono mt-0.5">{student.nis || '-'}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm text-gray-400 border border-gray-100 flex items-center justify-center">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kelas / Rombel</p>
                                <p className="text-base font-bold text-gray-900 mt-0.5">{classes?.name || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer label */}
                <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Powered by Smart Pesantren</p>
                </div>
            </div>
        </div>
    );
}
