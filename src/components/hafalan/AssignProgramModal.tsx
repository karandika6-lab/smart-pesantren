'use client';

import { useState } from 'react';
import { X, Plus, Loader2, BookOpen } from 'lucide-react';
import { hafalanTypesService, HafalanType } from '@/lib/services/hafalan-types';
import { useEffect } from 'react';

interface AssignProgramModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAssign: (hafalanTypeId: string, notes?: string) => Promise<void>;
    studentName: string;
}

export default function AssignProgramModal({ isOpen, onClose, onAssign, studentName }: AssignProgramModalProps) {
    const [hafalanTypes, setHafalanTypes] = useState<HafalanType[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchHafalanTypes();
            setSelectedTypeId('');
            setNotes('');
            setError('');
        }
    }, [isOpen]);

    const fetchHafalanTypes = async () => {
        try {
            setIsLoading(true);
            const types = await hafalanTypesService.getAll();
            setHafalanTypes(types);
        } catch (error) {
            console.error('Error fetching hafalan types:', error);
            setError('Gagal memuat daftar hafalan types');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTypeId) {
            setError('Pilih jenis hafalan terlebih dahulu');
            return;
        }

        try {
            setIsSaving(true);
            setError('');
            await onAssign(selectedTypeId, notes);
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Gagal menugaskan program hafalan';
            setError(message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const selectedType = hafalanTypes.find(t => t.id === selectedTypeId);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Tugaskan Program Hafalan</h3>
                        <p className="text-sm text-gray-500 mt-1">Untuk: <span className="font-semibold text-indigo-600">{studentName}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="py-8 text-center">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                            <p className="text-gray-500">Memuat daftar hafalan...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Pilih Hafalan Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Jenis Hafalan <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedTypeId}
                                    onChange={(e) => setSelectedTypeId(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                                    required
                                >
                                    <option value="">-- Pilih Jenis Hafalan --</option>
                                    {hafalanTypes.map(type => (
                                        <option key={type.id} value={type.id}>
                                            {type.name} ({type.total_units} {type.unit_name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Detail Hafalan Type */}
                            {selectedType && (
                                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <BookOpen className="w-5 h-5 text-indigo-600 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-semibold text-indigo-900">{selectedType.name}</p>
                                            <p className="text-sm text-indigo-700 mt-1">{selectedType.description}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-indigo-600">
                                                <span className="px-2 py-1 bg-indigo-100 rounded-full font-medium">
                                                    {selectedType.total_units} {selectedType.unit_name}
                                                </span>
                                                <span className="px-2 py-1 bg-indigo-100 rounded-full font-medium capitalize">
                                                    {selectedType.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Catatan */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Catatan (Opsional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Tambahkan catatan khusus untuk santri ini..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 resize-none"
                                />
                            </div>
                        </div>
                    )}
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
                        disabled={isSaving || isLoading || !selectedTypeId}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Menugaskan...
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                Tugaskan Program
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
