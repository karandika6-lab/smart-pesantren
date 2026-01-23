'use client';

import { useState, useEffect } from 'react';
import { X, Save, Home, Loader2, Users, Building2, User as UserIcon } from 'lucide-react';
import { dormitoriesService, usersService } from '@/lib/services';

interface DormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    dormData?: any; // If editing
}

export default function DormModal({ isOpen, onClose, onSubmit, dormData }: DormModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        building: '',
        capacity: 10,
        supervisor_id: '',
    });

    const [supervisors, setSupervisors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadOptions();
            if (dormData) {
                setFormData({
                    name: dormData.name || '',
                    building: (dormData as any).building || '',
                    capacity: dormData.capacity || 10,
                    supervisor_id: dormData.supervisor_id || '',
                });
            } else {
                setFormData({
                    name: '',
                    building: '',
                    capacity: 10,
                    supervisor_id: '',
                });
            }
        }
    }, [isOpen, dormData]);

    const loadOptions = async () => {
        try {
            setIsLoading(true);
            // Fetch potential supervisors (role = 'musyrif' or 'ustadz' or 'kesantrian')
            const filteredSupervisors = await usersService.getPotentialSupervisors();
            setSupervisors(filteredSupervisors);
        } catch (error) {
            console.error('Error loading supervisors:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting dorm:', error);
            alert('Gagal menyimpan data asrama.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-600 rounded-xl">
                            <Home className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{dormData ? 'Edit Kamar/Gedung' : 'Tambah Kamar Baru'}</h2>
                            <p className="text-xs text-gray-500 font-medium">Manajemen fasilitas hunian santri</p>
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
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nama Gedung / Blok</label>
                            <div className="relative">
                                <Building2 className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    required
                                    type="text"
                                    placeholder="Misal: Gedung Abu Bakar, Blok A"
                                    value={formData.building}
                                    onChange={e => setFormData({ ...formData, building: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 font-bold"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nomor/Nama Kamar</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Misal: 101, B-05"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Kapasitas (Santri)</label>
                                <div className="relative">
                                    <Users className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        value={formData.capacity}
                                        onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Musyrif / Penanggung Jawab</label>
                        <div className="relative">
                            <UserIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <select
                                required
                                value={formData.supervisor_id}
                                onChange={e => setFormData({ ...formData, supervisor_id: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 font-bold appearance-none"
                            >
                                <option value="">Pilih Musyrif</option>
                                {supervisors.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                                ))}
                            </select>
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
                            className="flex-[2] py-3.5 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 shadow-lg shadow-orange-500/30 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {dormData ? 'Simpan Perubahan' : 'Tambah Kamar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
