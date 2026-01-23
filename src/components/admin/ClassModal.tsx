'use client';

import { useState, useEffect } from 'react';
import { X, Save, School, Loader2, Users } from 'lucide-react';
import { academicYearService } from '@/lib/services';
import type { ClassInsert, ClassUpdate } from '@/types/database.types';

interface ClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ClassInsert | ClassUpdate) => Promise<void>;
    classData?: any; // If editing
}

export default function ClassModal({ isOpen, onClose, onSubmit, classData }: ClassModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        grade_level: 7,
        homeroom_teacher_id: '',
        academic_year_id: '',
        capacity: 40,
    });

    const [teachers, setTeachers] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadOptions();
            if (classData) {
                setFormData({
                    name: classData.name || '',
                    grade_level: classData.grade_level || 7,
                    homeroom_teacher_id: classData.homeroom_teacher_id || '',
                    academic_year_id: classData.academic_year_id || '',
                    capacity: classData.capacity || 40,
                });
            } else {
                setFormData({
                    name: '',
                    grade_level: 7,
                    homeroom_teacher_id: '',
                    academic_year_id: '',
                    capacity: 40,
                });
            }
        }
    }, [isOpen, classData]);

    const loadOptions = async () => {
        try {
            setIsLoading(true);
            const { teachersService } = await import('@/lib/services');
            const [fetchedTeachers, fetchedYears] = await Promise.all([
                teachersService.getAll({ isActive: true }),
                academicYearService.getAll()
            ]);

            // Use teachers from teachers table (correct IDs)
            setTeachers(fetchedTeachers);
            setAcademicYears(fetchedYears);

            // Default academic year if creating new
            if (!classData && fetchedYears.length > 0) {
                const activeYear = fetchedYears.find(y => y.is_active);
                if (activeYear) {
                    setFormData(prev => ({ ...prev, academic_year_id: activeYear.id }));
                }
            }
        } catch (error) {
            console.error('Error loading modal options:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Prepare data - only include non-empty values for optional fields
            const dataToSend: any = {
                name: formData.name,
                grade_level: formData.grade_level,
                capacity: formData.capacity || 40,
            };

            // Only add optional fields if they have values
            if (formData.homeroom_teacher_id) {
                dataToSend.homeroom_teacher_id = formData.homeroom_teacher_id;
            }
            if (formData.academic_year_id) {
                dataToSend.academic_year_id = formData.academic_year_id;
            }

            console.log('Submitting class data:', dataToSend);

            await onSubmit(dataToSend);
            onClose();
        } catch (error: any) {
            console.error('Error submitting class:', error);
            const msg = error?.message || error?.details || 'Unknown error';
            alert(`Gagal menyimpan data kelas: ${msg}`);
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
                            <School className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{classData ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h2>
                            <p className="text-xs text-gray-500 font-medium">Lengkapi informasi rombongan belajar</p>
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nama Kelas</label>
                            <input
                                required
                                type="text"
                                placeholder="Misal: 7A, 10-IPA"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Jenjang (Grade)</label>
                            <select
                                required
                                value={formData.grade_level}
                                onChange={e => setFormData({ ...formData, grade_level: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold"
                            >
                                {[7, 8, 9, 10, 11, 12].map(lvl => (
                                    <option key={lvl} value={lvl}>Kelas {lvl}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Wali Kelas</label>
                        <select
                            required
                            value={formData.homeroom_teacher_id}
                            onChange={e => setFormData({ ...formData, homeroom_teacher_id: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold"
                        >
                            <option value="">-- Pilih Wali Kelas --</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tahun Ajaran</label>
                            <select
                                required
                                value={formData.academic_year_id}
                                onChange={e => setFormData({ ...formData, academic_year_id: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold"
                            >
                                <option value="">-- Pilih T.A --</option>
                                {academicYears.map(y => (
                                    <option key={y.id} value={y.id}>{y.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Kapasitas Santri</label>
                            <div className="relative">
                                <Users className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    value={formData.capacity}
                                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold"
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
                            disabled={isSubmitting || isLoading}
                            className="flex-[2] py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {classData ? 'Simpan Perubahan' : 'Tambah Kelas'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
