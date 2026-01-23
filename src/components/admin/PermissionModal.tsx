'use client';

import { useState, useEffect } from 'react';
import { X, Save, ShieldCheck, Loader2, User as UserIcon, Calendar, FileText, Info } from 'lucide-react';
import { studentsService } from '@/lib/services';

interface PermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
}

export default function PermissionModal({ isOpen, onClose, onSubmit }: PermissionModalProps) {
    const [formData, setFormData] = useState({
        student_id: '',
        permission_type: 'pulang' as 'pulang' | 'keluar' | 'sakit' | 'kegiatan',
        start_date: new Date().toISOString().slice(0, 16), // datetime-local format
        end_date: '',
        reason: '',
        is_independent: false,
        picker_name: '',
    });

    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadOptions();
            // Reset form
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            setFormData({
                student_id: '',
                permission_type: 'pulang',
                start_date: now.toISOString().slice(0, 16),
                end_date: tomorrow.toISOString().slice(0, 16),
                reason: '',
                is_independent: false,
                picker_name: '',
            });
        }
    }, [isOpen]);

    const loadOptions = async () => {
        try {
            setIsLoading(true);
            const fetchedStudents = await studentsService.getAll({ status: 'active' });
            setStudents(fetchedStudents);
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Logic to append picker info or [MANDIRI] to reason
            let finalReason = formData.reason;
            if (formData.is_independent) {
                finalReason = `[MANDIRI] ${finalReason}`;
            } else if (formData.picker_name) {
                finalReason = `[Dijemput: ${formData.picker_name}] ${finalReason}`;
            }

            await onSubmit({
                student_id: formData.student_id,
                permission_type: formData.permission_type,
                start_date: new Date(formData.start_date).toISOString(),
                end_date: new Date(formData.end_date).toISOString(),
                reason: finalReason
            });
            onClose();
        } catch (error) {
            console.error('Error submitting permission:', error);
            alert('Gagal mencatat izin.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 rounded-xl">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Catat Izin Manual</h2>
                            <p className="text-xs text-gray-500 font-medium">Input izin walk-in / mendadak</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:shadow-md rounded-xl text-gray-400 hover:text-gray-600 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Student Selection */}
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nama Santri</label>
                            <div className="relative">
                                <UserIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <select
                                    required
                                    value={formData.student_id}
                                    onChange={e => setFormData({ ...formData, student_id: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 font-bold appearance-none"
                                >
                                    <option value="">Pilih Santri</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.class?.name || '-'})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Permission Type */}
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Jenis Izin</label>
                            <div className="flex gap-2 p-1.5 bg-gray-50 rounded-xl border border-gray-200">
                                {['pulang', 'keluar', 'sakit', 'kegiatan'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, permission_type: type as any })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all flex items-center justify-center gap-1 ${formData.permission_type === type
                                            ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-600'
                                            : 'bg-white text-gray-400 hover:text-gray-600 border border-gray-200'
                                            }`}
                                    >
                                        {formData.permission_type === type && <ShieldCheck className="w-3 h-3" />}
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Mulai</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={formData.start_date}
                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 font-bold text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Selesai</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={formData.end_date}
                                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 font-bold text-xs"
                                />
                            </div>
                        </div>

                        {/* Pickup Info */}
                        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Info className="w-4 h-4 text-orange-500" />
                                <span className="text-xs font-bold text-orange-700">Informasi Penjemputan</span>
                            </div>
                            <label className="flex items-center gap-3 mb-3 cursor-pointer">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${formData.is_independent ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-300'}`}>
                                    {formData.is_independent && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.is_independent}
                                    onChange={e => setFormData({ ...formData, is_independent: e.target.checked })}
                                />
                                <span className="text-sm font-medium text-gray-700">Pulang Sendiri / Mandiri</span>
                            </label>

                            {!formData.is_independent && (
                                <input
                                    type="text"
                                    placeholder="Nama Penjemput (cth: Pak Budi - Om)"
                                    value={formData.picker_name}
                                    onChange={e => setFormData({ ...formData, picker_name: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
                                />
                            )}
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Alasan</label>
                            <textarea
                                required
                                placeholder="Jelaskan alasan izin..."
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 font-medium h-24 text-sm"
                            />
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || isLoading}
                                className="flex-[2] py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Simpan Izin
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
