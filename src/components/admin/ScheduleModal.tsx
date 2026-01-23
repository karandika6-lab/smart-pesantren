'use client';

import { useState, useEffect } from 'react';
import { X, Save, CalendarDays, Loader2, Clock, BookOpen, User as UserIcon, School } from 'lucide-react';
import { subjectsService, teachersService, classesService, schedulesService } from '@/lib/services';
import type { ScheduleInsert, ScheduleUpdate } from '@/types/database.types';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ScheduleInsert | ScheduleUpdate) => Promise<void>;
    scheduleData?: any; // If editing
    defaultClassId?: string;
}

const DAYS = [
    { label: 'Senin', value: 1 },
    { label: 'Selasa', value: 2 },
    { label: 'Rabu', value: 3 },
    { label: 'Kamis', value: 4 },
    { label: 'Jumat', value: 5 },
    { label: 'Sabtu', value: 6 },
    { label: 'Minggu', value: 0 },
];

export default function ScheduleModal({ isOpen, onClose, onSubmit, scheduleData, defaultClassId }: ScheduleModalProps) {
    const [formData, setFormData] = useState({
        class_id: '',
        subject_id: '',
        teacher_id: '',
        day_of_week: 1,
        start_time: '07:30',
        end_time: '09:00',
        room: '',
    });

    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadOptions();
            if (scheduleData) {
                setFormData({
                    class_id: scheduleData.class_id || '',
                    subject_id: scheduleData.subject_id || '',
                    teacher_id: scheduleData.teacher_id || '',
                    day_of_week: scheduleData.day_of_week ?? 1,
                    start_time: scheduleData.start_time?.substring(0, 5) || '07:30',
                    end_time: scheduleData.end_time?.substring(0, 5) || '09:00',
                    room: scheduleData.room || '',
                });
            } else {
                setFormData({
                    class_id: defaultClassId || '',
                    subject_id: '',
                    teacher_id: '',
                    day_of_week: 1,
                    start_time: '07:30',
                    end_time: '09:00',
                    room: '',
                });
            }
        }
    }, [isOpen, scheduleData, defaultClassId]);

    const loadOptions = async () => {
        try {
            setIsLoading(true);
            const [fetchedClasses, fetchedSubjects, fetchedTeachers] = await Promise.all([
                classesService.getAll(),
                subjectsService.getAll(true),
                teachersService.getAll({ isActive: true })
            ]);
            setClasses(fetchedClasses);
            setSubjects(fetchedSubjects);
            setTeachers(fetchedTeachers);
        } catch (error) {
            console.error('Error loading schedule options:', error);
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
            console.error('Error submitting schedule:', error);
            alert('Gagal menyimpan jadwal. Pastikan tidak ada bentrok waktu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 rounded-xl">
                            <CalendarDays className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{scheduleData ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h2>
                            <p className="text-xs text-gray-500 font-medium">Atur waktu belajar mengajar santri</p>
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
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Kelas</label>
                            <div className="relative">
                                <School className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <select
                                    required
                                    value={formData.class_id}
                                    onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold appearance-none"
                                >
                                    <option value="">Pilih Kelas</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Hari</label>
                            <div className="relative">
                                <CalendarDays className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <select
                                    required
                                    value={formData.day_of_week}
                                    onChange={e => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold appearance-none"
                                >
                                    {DAYS.map(d => (
                                        <option key={d.value} value={d.value}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Jam Mulai</label>
                            <div className="relative">
                                <Clock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    required
                                    type="time"
                                    value={formData.start_time}
                                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Jam Selesai</label>
                            <div className="relative">
                                <Clock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    required
                                    type="time"
                                    value={formData.end_time}
                                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Mata Pelajaran</label>
                        <div className="relative">
                            <BookOpen className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <select
                                required
                                value={formData.subject_id}
                                onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold appearance-none"
                            >
                                <option value="">Pilih Mapel</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Pengajar / Ustadz</label>
                        <div className="relative">
                            <UserIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <select
                                required
                                value={formData.teacher_id}
                                onChange={e => setFormData({ ...formData, teacher_id: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold appearance-none"
                            >
                                <option value="">Pilih Pengajar</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
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
                            className="flex-[2] py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {scheduleData ? 'Simpan Perubahan' : 'Tambah Jadwal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
