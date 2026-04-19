'use client';

import { useRef, useState } from 'react';
import { X, Download, Loader2, Printer, User as UserIcon } from 'lucide-react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';

interface StudentForCard {
    id: string;
    name: string;
    nis: string;
    photo_url?: string | null;
    class_name?: string;
}

interface PrintSantriCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: StudentForCard | null;
    pesantrenName?: string;
    pesantrenLogo?: string;
}

export default function PrintSantriCardModal({ isOpen, onClose, student, pesantrenName, pesantrenLogo }: PrintSantriCardModalProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    if (!isOpen || !student) return null;

    // The QR code data points to the verification page
    const verifyUrl = `${window.location.origin}/verify/santri/${student.id}`;

    const handleDownload = async () => {
        if (!cardRef.current) return;
        
        setIsExporting(true);
        try {
            const url = await toPng(cardRef.current, {
                pixelRatio: 3, // High quality equivalent to scale: 3
                cacheBust: true, // Prevents CORS issues sometimes
                backgroundColor: '#ffffff'
            });
            
            // Create download link for Image
            const link = document.createElement('a');
            link.download = `Kartu-Santri-${student.nis}-${student.name.replace(/\s+/g, '-')}.png`;
            link.href = url;
            link.click();
        } catch (error) {
            console.error('Error generating card image:', error);
            alert('Gagal membuat gambar kartu. Pastikan koneksi stabil.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">Cetak Kartu Santri</h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">Kartu identitas dengan QR Code</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:shadow-md rounded-xl text-gray-400 hover:text-gray-600 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto bg-neutral-900/40 border-y border-white/5 flex-1 custom-scrollbar">
                    
                    {/* Visual Card (Will be exported) */}
                    <div className="w-full flex justify-center pb-8">
                        <div 
                            ref={cardRef} 
                            // ID Card Standard Size (CR80 ratio approximately 2.125 x 3.375 inches, we use roughly 54mm x 86mm, or portrait 86x54)
                            // Scaling up for better rendering
                            className="w-[300px] h-[480px] bg-white rounded-2xl shadow-xl overflow-hidden relative flex flex-col shrink-0"
                            style={{
                                backgroundImage: 'linear-gradient(to bottom, #f8fafc, #ffffff)',
                            }}
                        >
                        {/* Top Banner & Pattern */}
                        <div className="h-32 bg-blue-600 relative overflow-hidden flex-shrink-0">
                            {/* SVG Pattern overlay */}
                            <div className="absolute inset-0 opacity-20">
                                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <pattern id="pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <circle cx="2" cy="2" r="2" fill="white" />
                                        </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#pattern)" />
                                </svg>
                            </div>
                            
                            <div className="relative z-10 p-4 flex flex-col items-center border-b-[6px] border-amber-400 h-full justify-between">
                                <div className="text-center w-full flex items-center justify-center gap-2">
                                    {pesantrenLogo && (
                                        <img src={pesantrenLogo} alt="Logo" className="w-8 h-8 object-contain drop-shadow-md" crossOrigin="anonymous" />
                                    )}
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest leading-tight drop-shadow-md">
                                        KARTU TANDA SANTRI<br/>
                                        <span className="text-[8px] font-bold text-blue-100">{pesantrenName || 'Smart Pesantren'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Photo overlaying the banner */}
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-24 h-28 bg-gray-200 rounded-xl shadow-lg border-4 border-white overflow-hidden z-20">
                            {student.photo_url ? (
                                <img src={student.photo_url} alt="Photo" className="w-full h-full object-cover" crossOrigin="anonymous" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-300">
                                    <UserIcon className="w-10 h-10" />
                                </div>
                            )}
                        </div>

                        {/* Middle Info */}
                        <div className="flex-1 flex flex-col items-center pt-24 px-4 text-center">
                            <h3 className="text-[15px] font-black text-gray-900 uppercase leading-tight mb-1">{student.name}</h3>
                            <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest mb-3">
                                NIS: {student.nis}
                            </p>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                                KELAS {student.class_name || '-'}
                            </p>
                        </div>

                        {/* QR Code Section */}
                        <div className="flex flex-col items-center justify-end pb-6 flex-shrink-0">
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                <QRCode 
                                    value={verifyUrl} 
                                    size={80} 
                                    level="H"
                                />
                            </div>
                            <p className="text-[7px] font-bold text-gray-400 mt-2 tracking-widest">SCAN UNTUK VERIFIKASI</p>
                        </div>
                        
                        {/* Edge line */}
                        <div className="h-1.5 w-full bg-blue-600"></div>
                    </div>
                    </div>
                    
                </div>

                {/* Footer Action */}
                <div className="p-6 border-t border-gray-100 flex gap-3 bg-white">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                    >
                        Tutup
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={isExporting}
                        className="flex-[2] py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isExporting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        {isExporting ? 'Proses Ekspor...' : 'Unduh HD (PNG)'}
                    </button>
                </div>
            </div>
        </div>
    );
}
