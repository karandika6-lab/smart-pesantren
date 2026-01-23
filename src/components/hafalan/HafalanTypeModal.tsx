'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { HafalanType } from '@/lib/services/hafalan-types';

interface HafalanTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<HafalanType, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    editData?: HafalanType | null;
}

const CATEGORIES = [
    { value: 'quran', label: 'Al-Qur\'an', color: 'blue' },
    { value: 'doa', label: 'Doa', color: 'green' },
    { value: 'mufrodat', label: 'Mufrodat (Kosakata)', color: 'purple' },
    { value: 'hadits', label: 'Hadits', color: 'amber' },
    { value: 'nadhom', label: 'Nadhom (Syair)', color: 'pink' },
    { value: 'other', label: 'Lainnya', color: 'gray' }
];

export default function HafalanTypeModal({ isOpen, onClose, onSave, editData }: HafalanTypeModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'quran' as HafalanType['category'],
        total_units: 1,
        unit_name: '',
        is_active: true
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name,
                description: editData.description,
                category: editData.category,
                total_units: editData.total_units,
                unit_name: editData.unit_name,
                is_active: editData.is_active
            });
        } else {
            setFormData({
                name: '',
                description: '',
                category: 'quran',
                total_units: 1,
                unit_name: '',
                is_active: true
            });
        }
        setError('');
    }, [editData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.name.trim()) {
            setError('Nama hafalan harus diisi');
            return;
        }
        if (!formData.unit_name.trim()) {
            setError('Nama unit harus diisi');
            return;
        }
        if (formData.total_units < 1) {
            setError('Jumlah unit minimal 1');
            return;
        }

        try {
            setIsSaving(true);
            await onSave(formData);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan data');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">
                        {editData ? 'Edit Hafalan Type' : 'Tambah Hafalan Type Baru'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Nama Hafalan */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Nama Hafalan <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: Al-Qur'an 30 Juz"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                                required
                            />
                        </div>

                        {/* Kategori */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Kategori <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as HafalanType['category'] })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                                required
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Deskripsi */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Deskripsi
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Deskripsi singkat tentang hafalan ini..."
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 resize-none"
                            />
                        </div>

                        {/* Jumlah Unit & Nama Unit */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Jumlah Unit <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.total_units}
                                    onChange={(e) => setFormData({ ...formData, total_units: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Contoh: 30 untuk 30 Juz</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nama Unit <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.unit_name}
                                    onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                                    placeholder="Contoh: Juz, Surah, Bab"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Satuan unit hafalan</p>
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 bg-gray-50 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Aktif (dapat digunakan untuk program hafalan)
                                </span>
                            </label>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                        disabled={isSaving}
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Simpan
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
