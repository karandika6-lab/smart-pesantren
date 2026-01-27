'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Loader2, User as UserIcon, Calendar, ClipboardList } from 'lucide-react';
import { studentsService } from '@/lib/services';

interface Student {
    id: string;
    name: string;
    class?: { name: string } | null;
}

interface ViolationFormData {
    student_id: string;
    type: 'ringan' | 'sedang' | 'berat';
    description: string;
    points: number;
    punishment: string;
    date: string;
    status: 'pending' | 'completed' | 'cancelled';
}

interface ViolationData {
    id?: string;
    student_id?: string;
    type?: 'ringan' | 'sedang' | 'berat';
    description?: string;
    points?: number;
    punishment?: string;
    date?: string;
    status?: 'pending' | 'completed' | 'cancelled';
}

interface ViolationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ViolationFormData) => Promise<void>;
    violationData?: ViolationData;
}

export default function ViolationModal({ isOpen, onClose, onSubmit, violationData }: ViolationModalProps) {
    const [formData, setFormData] = useState({
        student_id: '',
        type: 'ringan' as 'ringan' | 'sedang' | 'berat',
        description: '',
        points: 5,
        punishment: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pending' as 'pending' | 'completed' | 'cancelled',
    });

    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadOptions();
            if (violationData) {
                setFormData({
                    student_id: violationData.student_id || '',
                    type: violationData.type || 'ringan',
                    description: violationData.description || '',
                    points: violationData.points || 5,
                    punishment: violationData.punishment || '',
                    date: violationData.date || new Date().toISOString().split('T')[0],
                    status: violationData.status || 'pending',
                });
            } else {
                setFormData({
                    student_id: '',
                    type: 'ringan',
                    description: '',
                    points: 5,
                    punishment: '',
                    date: new Date().toISOString().split('T')[0],
                    status: 'pending',
                });
            }
        }
    }, [isOpen, violationData]);

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

    // Auto-fill points based on type
    const handleTypeChange = (type: 'ringan' | 'sedang' | 'berat') => {
        let pts = 5;
        if (type === 'sedang') pts = 25;
        if (type === 'berat') pts = 75;
        setFormData({ ...formData, type, points: pts });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting violation:', error);
            alert('Gagal mencatat pelanggaran.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-rose-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-600 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{violationData ? 'Edit Catatan Pelanggaran' : 'Catat Pelanggaran Baru'}</h2>
                            <p className="text-xs text-gray-500 font-medium">Buku Hitam Digital - Kedisiplinan Santri</p>
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
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nama Santri</label>
                                <div className="relative">
                                    <UserIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <select
                                        required
                                        value={formData.student_id}
                                        onChange={e => setFormData({ ...formData, student_id: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 font-bold appearance-none"
                                    >
                                        <option value="">Pilih Santri</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.class?.name || '-'})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tingkat Pelanggaran</label>
                                <select
                                    required
                                    value={formData.type}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    onChange={e => handleTypeChange(e.target.value as any)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 font-bold"
                                >
                                    <option value="ringan">Ringan</option>
                                    <option value="sedang">Sedang</option>
                                    <option value="berat">Berat</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Poin Pengurang</label>
                                <input
                                    required
                                    type="number"
                                    value={formData.points}
                                    onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 font-bold text-red-600"
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tanggal Kejadian</label>
                                <div className="relative">
                                    <Calendar className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        required
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Status Takzir</label>
                                <select
                                    required
                                    value={formData.status}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 font-bold"
                                >
                                    <option value="pending">Belum Diproses</option>
                                    <option value="completed">Sudah Dijalankan</option>
                                    <option value="cancelled">Dibatalkan</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Deskripsi Pelanggaran</label>
                            <textarea
                                required
                                placeholder="Jelaskan detail pelanggaran..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 font-medium h-24"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Hukuman (Takzir)</label>
                            <div className="relative">
                                <ClipboardList className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                                <textarea
                                    placeholder="Tindakan yang diberikan (takzir)..."
                                    value={formData.punishment}
                                    onChange={e => setFormData({ ...formData, punishment: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 font-medium h-20"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
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
                                className="flex-[2] py-3.5 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-500/30 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {violationData ? 'Simpan Perubahan' : 'Catat Pelanggaran'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
