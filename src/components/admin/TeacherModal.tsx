'use client';

import { useState, useEffect } from 'react';
import { X, Save, GraduationCap, Loader2, User as UserIcon, Mail, Phone, MapPin } from 'lucide-react';
import { teachersService, usersService } from '@/lib/services';
import type { TeacherInsert, TeacherUpdate } from '@/types/database.types';

interface TeacherModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TeacherInsert | TeacherUpdate) => Promise<void>;
    teacherData?: any; // If editing
}

export default function TeacherModal({ isOpen, onClose, onSubmit, teacherData }: TeacherModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        nip: '',
        gender: 'L' as 'L' | 'P',
        specialization: '',
        phone: '',
        address: '',
        email: '',
        is_active: true,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (teacherData) {
                setFormData({
                    name: teacherData.name || '',
                    nip: teacherData.nip || '',
                    gender: teacherData.gender || 'L',
                    specialization: teacherData.specialization || '',
                    phone: teacherData.phone || '',
                    address: teacherData.address || '',
                    email: teacherData.email || '',
                    is_active: teacherData.is_active ?? true,
                });
            } else {
                setFormData({
                    name: '',
                    nip: '',
                    gender: 'L',
                    specialization: '',
                    phone: '',
                    address: '',
                    email: '',
                    is_active: true,
                });
            }
        }
    }, [isOpen, teacherData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submitData = { ...formData };

            // Auto-generate email if empty (for new teachers)
            if (!teacherData && !formData.email) {
                // Generate from NIP if available, otherwise from name
                const baseEmail = formData.nip
                    ? formData.nip.toLowerCase().replace(/[^a-z0-9]/g, '')
                    : formData.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
                submitData.email = `${baseEmail}@ustadz.pesantren.id`;
            }

            await onSubmit(submitData);
            onClose();
        } catch (error) {
            console.error('Error submitting teacher:', error);
            alert('Gagal menyimpan data guru.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 rounded-xl">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{teacherData ? 'Edit Data Guru' : 'Tambah Guru Baru'}</h2>
                            <p className="text-xs text-gray-500 font-medium">Informasi profil dan spesialisasi pengajar</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:shadow-md rounded-xl text-gray-400 hover:text-gray-600 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nama & NIP */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nama Lengkap & Gelar</label>
                                <div className="relative">
                                    <UserIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Misal: Ustadz Ahmad, S.Pd"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 font-bold"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">NIP / Kode Guru</label>
                                <input
                                    type="text"
                                    placeholder="Opsional"
                                    value={formData.nip}
                                    onChange={e => setFormData({ ...formData, nip: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 font-bold font-mono"
                                />
                            </div>
                        </div>

                        {/* Gender & Specialization */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Jenis Kelamin</label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, gender: 'L' })}
                                        className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-2xl cursor-pointer transition-all font-bold ${formData.gender === 'L'
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                            : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                            }`}
                                    >
                                        Laki-Laki
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, gender: 'P' })}
                                        className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-2xl cursor-pointer transition-all font-bold ${formData.gender === 'P'
                                            ? 'border-pink-600 bg-pink-50 text-pink-600'
                                            : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                            }`}
                                    >
                                        Perempuan
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Spesialisasi / Mapel</label>
                                <input
                                    type="text"
                                    placeholder="Misal: Fiqih, Matematika"
                                    value={formData.specialization}
                                    onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Email & Phone */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                    Email
                                    {teacherData ? (
                                        <span className="text-indigo-500 normal-case font-normal">(akun login)</span>
                                    ) : (
                                        <span className="text-emerald-500 normal-case font-normal">(auto jika kosong)</span>
                                    )}
                                </label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        placeholder={teacherData ? 'Email akun guru' : (formData.nip ? `${formData.nip.toLowerCase().replace(/[^a-z0-9]/g, '')}@ustadz.pesantren.id` : 'Auto: nip@ustadz.pesantren.id')}
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 font-bold placeholder:text-gray-400 placeholder:font-normal"
                                    />
                                </div>
                                {!teacherData && (
                                    <p className="text-xs text-gray-400 mt-1">Kosongkan untuk generate otomatis dari NIP</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nomor Telepon/WA</label>
                                <div className="relative">
                                    <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="0812..."
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Alamat Tinggal</label>
                            <div className="relative h-full">
                                <MapPin className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                                <textarea
                                    placeholder="Alamat lengkap..."
                                    rows={3}
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 font-bold resize-none"
                                />
                            </div>
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
                            className="flex-[2] py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {teacherData ? 'Simpan Perubahan' : 'Tambah Guru'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
