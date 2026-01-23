'use client';

import { useState, useEffect } from 'react';
import { X, Save, Users, Loader2, User as UserIcon, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { classesService } from '@/lib/services/classes';

interface SantriModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    santriData?: any;
}

export default function SantriModal({ isOpen, onClose, onSubmit, santriData }: SantriModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        nis: '',
        gender: 'L' as 'L' | 'P',
        class_id: '',
        birth_place: '',
        birth_date: '',
        address: '',
        parent_name: '',
        parent_phone: '',
        status: 'active',
        email: '', // Email for student account
    });

    const [classes, setClasses] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingClasses, setIsLoadingClasses] = useState(false);
    const [existingEmail, setExistingEmail] = useState(''); // Track existing email for edit mode

    useEffect(() => {
        if (isOpen) {
            fetchClasses();
            if (santriData) {
                // Load existing email from profiles if available
                loadExistingEmail(santriData.user_id || santriData.id);

                setFormData({
                    name: santriData.name || '',
                    nis: santriData.nis || '',
                    gender: santriData.gender || 'L',
                    class_id: santriData.class_id || '',
                    birth_place: santriData.birth_place || '',
                    birth_date: santriData.birth_date || '',
                    address: santriData.address || '',
                    parent_name: santriData.parent_name || '',
                    parent_phone: santriData.parent_phone || '',
                    status: santriData.status || 'active',
                    email: santriData.email || '',
                });
            } else {
                setExistingEmail('');
                setFormData({
                    name: '',
                    nis: '',
                    gender: 'L',
                    class_id: '',
                    birth_place: '',
                    birth_date: '',
                    address: '',
                    parent_name: '',
                    parent_phone: '',
                    status: 'active',
                    email: '',
                });
            }
        }
    }, [isOpen, santriData]);

    // Load email from profiles table for existing student
    const loadExistingEmail = async (userId: string) => {
        if (!userId) return;
        try {
            const { supabase } = await import('@/lib/supabase');
            const { data } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', userId)
                .single();

            if (data?.email) {
                setExistingEmail(data.email);
                setFormData(prev => ({ ...prev, email: data.email }));
            }
        } catch (e) {
            console.warn('Could not load existing email:', e);
        }
    };

    const fetchClasses = async () => {
        setIsLoadingClasses(true);
        try {
            const data = await classesService.getAll();
            setClasses(data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        } finally {
            setIsLoadingClasses(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submitData = { ...formData };

            // Only auto-generate email for NEW students (not editing)
            if (!santriData) {
                // New student - auto-generate if empty
                submitData.email = formData.email || `${formData.nis.toLowerCase().replace(/[^a-z0-9]/g, '')}@santri.pesantren.id`;
            } else {
                // Editing existing student
                if (!formData.email && existingEmail) {
                    // If form is empty but there's existing email, keep the existing one
                    submitData.email = existingEmail;
                }
                // If form has value, use that value (user intentionally changed it)
            }

            await onSubmit(submitData);
            onClose();
        } catch (error) {
            console.error('Error submitting santri:', error);
            alert('Gagal menyimpan data santri.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 rounded-xl">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{santriData ? 'Edit Data Santri' : 'Tambah Santri Baru'}</h2>
                            <p className="text-xs text-gray-500 font-medium">Informasi akademik dan data wali santri</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:shadow-md rounded-xl text-gray-400 hover:text-gray-600 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Section 1: Data Santri */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-2">Informasi Santri</h3>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                                <div className="relative">
                                    <UserIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Nama sesuai ijazah"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">NIS</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Induk"
                                        value={formData.nis}
                                        onChange={e => setFormData({ ...formData, nis: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Kelas</label>
                                    <select
                                        required
                                        value={formData.class_id}
                                        onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold appearance-none"
                                    >
                                        <option value="">Pilih...</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                    Email Santri
                                    {santriData ? (
                                        <span className="text-blue-500 normal-case font-normal">(akun login)</span>
                                    ) : (
                                        <span className="text-emerald-500 normal-case font-normal">(auto dari NIS)</span>
                                    )}
                                </label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        placeholder={santriData ? 'Email akun santri' : (formData.nis ? `${formData.nis.toLowerCase().replace(/[^a-z0-9]/g, '')}@santri.pesantren.id` : 'Auto: nis@santri.pesantren.id')}
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold placeholder:text-gray-400 placeholder:font-normal"
                                        readOnly={!!santriData && !!existingEmail} // Readonly if editing with existing email
                                    />
                                </div>
                                {santriData ? (
                                    existingEmail ? (
                                        <p className="text-xs text-blue-500 mt-1">✓ Email sudah terdaftar di sistem</p>
                                    ) : (
                                        <p className="text-xs text-amber-500 mt-1">⚠ Santri belum memiliki akun</p>
                                    )
                                ) : (
                                    <p className="text-xs text-gray-400 mt-1">Kosongkan untuk generate otomatis</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Jenis Kelamin</label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, gender: 'L' })}
                                        className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-2xl cursor-pointer transition-all font-bold ${formData.gender === 'L'
                                                ? 'border-blue-600 bg-blue-50 text-blue-600'
                                                : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                            }`}
                                    >
                                        LAKI-LAKI
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, gender: 'P' })}
                                        className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-2xl cursor-pointer transition-all font-bold ${formData.gender === 'P'
                                                ? 'border-pink-600 bg-pink-50 text-pink-600'
                                                : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                            }`}
                                    >
                                        PEREMPUAN
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Data Wali */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider border-b border-emerald-100 pb-2">Informasi Wali Santri</h3>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nama Ayah / Wali</label>
                                <div className="relative">
                                    <UserIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Nama lengkap wali"
                                        value={formData.parent_name}
                                        onChange={e => setFormData({ ...formData, parent_name: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900 font-bold"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">WhatsApp Wali <span className="text-gray-300 normal-case font-normal">(opsional)</span></label>
                                <div className="relative">
                                    <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="081234..."
                                        value={formData.parent_phone}
                                        onChange={e => setFormData({ ...formData, parent_phone: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900 font-bold"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tempat Lahir <span className="text-gray-300 normal-case font-normal">(opsional)</span></label>
                                    <input
                                        type="text"
                                        placeholder="Kota"
                                        value={formData.birth_place}
                                        onChange={e => setFormData({ ...formData, birth_place: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tgl Lahir <span className="text-gray-300 normal-case font-normal">(opsional)</span></label>
                                    <div className="relative">
                                        <Calendar className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        <input
                                            type="date"
                                            value={formData.birth_date}
                                            onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Alamat Lengkap <span className="text-gray-300 normal-case font-normal">(opsional)</span></label>
                                <div className="relative">
                                    <MapPin className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                                    <textarea
                                        placeholder="Alamat domisili"
                                        rows={2}
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-bold resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            {santriData ? 'Simpan Perubahan' : 'Tambah Santri & Auto-Akun Wali'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
