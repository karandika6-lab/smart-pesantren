'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Plus, BookOpen } from 'lucide-react';
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
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Gagal menyimpan data';
            setError(message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 lg:p-10 transition-all duration-500">
            {/* Background Decorative Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="relative bg-[#0c0c0c]/90 border border-white/5 rounded-[3rem] w-full max-w-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-3xl animate-in fade-in zoom-in duration-300">
                {/* Decorative Accent Bar */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

                {/* Header */}
                <div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between relative">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                            {editData ? <Save className="w-6 h-6 text-emerald-500" /> : <Plus className="w-6 h-6 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />}
                        </div>
                        <div>
                            <h3 className="text-xl lg:text-2xl font-black text-white tracking-tighter uppercase leading-none">
                                {editData ? 'Update' : 'Register New'} <span className="text-emerald-500">Hafalan Type</span>
                            </h3>
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-2 ml-1">
                                Academic System v2.0 • Data Security Active
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-neutral-800 hover:bg-neutral-700 text-gray-500 hover:text-white rounded-2xl transition-all border border-white/5 active:scale-90"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mx-8 mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-bounce">
                        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 lg:p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                        {/* Nama Hafalan */}
                        <div className="group">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2 group-focus-within:text-emerald-500 transition-colors">
                                Nama Hafalan <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                    <BookOpen className="w-5 h-5 text-gray-600 group-focus-within:text-emerald-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: Al-Qur'an 30 Juz..."
                                    className="w-full pl-14 pr-6 py-4 bg-black border border-white/5 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-white font-bold placeholder-gray-800 transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Kategori Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="group">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2 group-focus-within:text-emerald-500">
                                    Kategori <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value as HafalanType['category'] })}
                                    className="w-full px-6 py-4 bg-black border border-white/5 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-white font-bold appearance-none cursor-pointer text-sm"
                                    required
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value} className="bg-neutral-900 font-bold p-4">
                                            {cat.label.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2 group-focus-within:text-emerald-500">
                                    Status Program
                                </label>
                                <div
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    className={`flex items-center justify-between px-6 py-4 rounded-[1.5rem] border transition-all cursor-pointer ${formData.is_active
                                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                                        : 'bg-rose-500/5 border-rose-500/20 text-rose-400 opacity-60'
                                        }`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">{formData.is_active ? 'Status Aktif' : 'Status Nonaktif'}</span>
                                    <div className={`w-2 h-2 rounded-full ${formData.is_active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`}></div>
                                </div>
                            </div>
                        </div>

                        {/* Deskripsi */}
                        <div className="group">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-2 group-focus-within:text-emerald-500 transition-colors">
                                Deskripsi Tambahan
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Tuliskan deskripsi atau petunjuk singkat program ini..."
                                rows={2}
                                className="w-full px-6 py-4 bg-black border border-white/5 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-white font-medium placeholder-gray-800 transition-all text-sm resize-none"
                            />
                        </div>

                        {/* Unit Management Strip */}
                        <div className="bg-neutral-900/40 p-6 rounded-[2rem] border border-white/5 space-y-6">
                            <h4 className="text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.4em] ml-2">Konfigurasi Unit</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="group">
                                    <label className="block text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 ml-2">Total Unit <span className="text-rose-500">*</span></label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.total_units}
                                        onChange={(e) => setFormData({ ...formData, total_units: parseInt(e.target.value) || 1 })}
                                        className="w-full px-5 py-3 bg-black border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-white font-bold text-sm"
                                        required
                                    />
                                </div>

                                <div className="group">
                                    <label className="block text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 ml-2">Nama Unit <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.unit_name}
                                        onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                                        placeholder="Juz / Surah / Bab..."
                                        className="w-full px-5 py-3 bg-black border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-white font-bold text-sm"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer Controls */}
                <div className="p-8 lg:p-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-end gap-4 bg-black/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-8 py-4 text-gray-500 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-2xl border border-white/5 hover:bg-neutral-900 transition-all active:scale-95"
                        disabled={isSaving}
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="w-full sm:w-auto px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {editData ? 'Perbarui Data' : 'Simpan Hafalan'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
