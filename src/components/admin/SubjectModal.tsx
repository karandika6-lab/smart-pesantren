'use client';

import { useState, useEffect } from 'react';
import { X, Save, BookMarked, Loader2, List, Hash, Clock } from 'lucide-react';
import type { SubjectInsert, SubjectUpdate } from '@/types/database.types';

interface SubjectData {
    id?: string;
    name?: string;
    code?: string;
    category?: string;
    credits?: number;
    is_active?: boolean;
}

interface SubjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: SubjectInsert | SubjectUpdate) => Promise<void>;
    subjectData?: SubjectData;
}

export default function SubjectModal({ isOpen, onClose, onSubmit, subjectData }: SubjectModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: 'Diniyah',
        credits: 2,
        is_active: true,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (subjectData) {
                setFormData({
                    name: subjectData.name || '',
                    code: subjectData.code || '',
                    category: subjectData.category || 'umum',
                    credits: subjectData.credits || 2,
                    is_active: subjectData.is_active ?? true,
                });
            } else {
                setFormData({
                    name: '',
                    code: '',
                    category: 'Diniyah',
                    credits: 2,
                    is_active: true,
                });
            }
        }
    }, [isOpen, subjectData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting subject:', error);
            alert('Gagal menyimpan data mata pelajaran.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 rounded-xl">
                            <BookMarked className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{subjectData ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}</h2>
                            <p className="text-xs text-gray-500 font-medium">Konfigurasi materi kurikulum pesantren</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:shadow-md rounded-xl text-gray-400 hover:text-gray-600 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nama Mata Pelajaran</label>
                        <div className="relative">
                            <BookMarked className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                required
                                type="text"
                                placeholder="Misal: Fiqih Ibadah, Bahasa Arab"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Kode Mapel</label>
                            <div className="relative">
                                <Hash className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    required
                                    type="text"
                                    placeholder="FQH-01"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold font-mono"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Kategori</label>
                            <div className="relative">
                                <List className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <select
                                    required
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold appearance-none"
                                >
                                    <option value="Diniyah">A. Mata Pelajaran Diniyah</option>
                                    <option value="Muatan Lokal">B. Muatan Lokal</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Jam Pelajaran (JP) / Minggu</label>
                        <div className="relative">
                            <Clock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                required
                                type="number"
                                min="1"
                                max="10"
                                value={formData.credits}
                                onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold"
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
                            disabled={isSubmitting}
                            className="flex-[2] py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {subjectData ? 'Simpan Perubahan' : 'Tambah Mapel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
