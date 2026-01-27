'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearSession, cacheUser, updateProfile, User } from '@/lib/auth';
import {
    Camera,
    Calendar,
    MapPin,
    Phone,
    IdCard,
    Users,
    Shield,
    Loader2,
    Save,
    Edit2,
    X,
    ShieldCheck,
    Globe
} from 'lucide-react';
import Sidebar, { DashboardHeader } from '@/components/layout/Sidebar';
import { studentsService } from '@/lib/services/students';
import { supabase } from '@/lib/supabase';

export default function ProfilSayaPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [studentData, setStudentData] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        address: '',
        birth_place: '',
        birth_date: '',
        parent_name: ''
    });

    const fetchData = useCallback(async (userId: string) => {
        try {
            setIsLoading(true);
            const { data: student, error } = await supabase
                .from('students')
                .select(`
                    *,
                    class:classes(name),
                    dormitory:dormitories(name)
                `)
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            setStudentData(student);
            setEditForm({
                name: student.name || '',
                phone: student.parent_phone || '',
                address: student.address || '',
                birth_place: student.birth_place || '',
                birth_date: student.birth_date || '',
                parent_name: student.parent_name || ''
            });
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'santri') {
            router.replace('/login');
            return;
        }
        const timer = requestAnimationFrame(() => {
            setUser(currentUser);
            fetchData(currentUser.id);
        });
        return () => cancelAnimationFrame(timer);
    }, [router, fetchData]);

    const handleSave = async () => {
        if (!studentData) return;
        setIsSaving(true);
        try {
            // 1. Update students table
            await studentsService.update(studentData.id, {
                name: editForm.name,
                parent_phone: editForm.phone,
                address: editForm.address,
                birth_place: editForm.birth_place,
                birth_date: editForm.birth_date || null, // Convert empty string to null for DB compatibility
                parent_name: editForm.parent_name
            });

            // Refresh local state
            setStudentData({
                ...studentData,
                name: editForm.name,
                parent_phone: editForm.phone,
                address: editForm.address,
                birth_place: editForm.birth_place,
                birth_date: editForm.birth_date,
                parent_name: editForm.parent_name
            });

            // 2. Sync with Profiles table if student has a linked user account
            if (studentData.user_id) {
                await updateProfile(studentData.user_id, {
                    name: editForm.name,
                    phone: editForm.phone
                });

                // 3. Update local storage cache to reflect new name in sidebar/header
                const currentUser = getCurrentUser();
                if (currentUser && currentUser.id === studentData.user_id) {
                    cacheUser({
                        ...currentUser,
                        name: editForm.name,
                        phone: editForm.phone
                    });
                }
            }

            setIsEditing(false);
            // Optional: Add a success message notification here if a toast system exists
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('Gagal menyimpan perubahan. Silakan coba lagi.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        router.replace('/login');
    };

    if (isLoading && !studentData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin opacity-40" />
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Memuat Portofolio Santri...</p>
                </div>
            </div>
        );
    }

    if (!user || !studentData) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-400 font-sans selection:bg-indigo-500/30">

            <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

            <div className="lg:pl-64 flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 lg:p-10 space-y-10 max-w-[1200px] mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-[0.2em] mb-2 uppercase">
                                <ShieldCheck className="w-4 h-4" />
                                Student Profile Identity
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                                Profil & <span className="text-indigo-500">Biodata Santri</span>
                            </h1>
                            <p className="text-neutral-500 text-sm mt-2 font-medium">Informasi pribadi dan data akademik yang terdaftar di sistem pusat.</p>
                        </div>

                        <button
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            disabled={isSaving}
                            className={`px-8 py-4 rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 ${isEditing
                                ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-700'
                                : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white hover:bg-neutral-800'
                                }`}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4 text-indigo-500" />}
                            {isEditing ? 'Simpan Perubahan' : 'Update Informasi'}
                        </button>
                    </div>

                    <div className="space-y-10">
                        {/* Profile Hero Card */}
                        <div className="bg-[#0a0a0a] rounded-[3rem] border border-neutral-800/40 shadow-2xl overflow-hidden relative group">
                            <div className="h-48 bg-gradient-to-br from-indigo-600 via-indigo-950 to-black relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse"></div>
                                <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-[2000ms]">
                                    <IdCard className="w-64 h-64 text-white" />
                                </div>
                                {isEditing && (
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all backdrop-blur-md border border-white/10 group/exit"
                                    >
                                        <X className="w-5 h-5 group-hover/exit:rotate-90 transition-transform font-black" />
                                    </button>
                                )}
                            </div>

                            <div className="px-8 md:px-16 pb-16 relative">
                                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10 -mt-20">
                                    <div className="relative group/photo">
                                        <div className="w-40 h-40 md:w-48 md:h-48 rounded-[3.5rem] border-[10px] border-[#0a0a0a] bg-[#050505] overflow-hidden shadow-2xl relative">
                                            <Image
                                                src={studentData.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name)}&background=1a1a1a&color=6366f1&size=512&bold=true&font-size=0.35`}
                                                alt={studentData.name}
                                                width={192}
                                                height={192}
                                                className="w-full h-full object-cover grayscale-[0.2] group-hover/photo:grayscale-0 transition-all duration-500 scale-105 group-hover/photo:scale-110"
                                                unoptimized
                                            />
                                        </div>
                                        {isEditing && (
                                            <button className="absolute bottom-4 right-4 p-3.5 bg-white text-indigo-600 rounded-2xl shadow-2xl border border-neutral-100 hover:scale-110 transition-all active:scale-95">
                                                <Camera className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 pb-4 text-center md:text-left w-full">
                                        <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-4 mb-4">
                                            {isEditing ? (
                                                <div className="w-full max-w-sm mx-auto md:mx-0">
                                                    <input
                                                        type="text"
                                                        value={editForm.name}
                                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                        className="text-2xl lg:text-4xl font-extrabold text-white tracking-tight leading-none uppercase bg-transparent border-b border-indigo-500 focus:outline-none w-full py-1 text-center md:text-left"
                                                        placeholder="Nama Lengkap"
                                                    />
                                                </div>
                                            ) : (
                                                <h2 className="text-2xl lg:text-4xl font-extrabold text-white tracking-tight leading-none uppercase break-words">{studentData.name}</h2>
                                            )}
                                            <div className="flex justify-center md:justify-start">
                                                <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 h-fit ${studentData.status === 'active' ? 'bg-indigo-500/5 text-indigo-400 border-indigo-500/20' : 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${studentData.status === 'active' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-neutral-700'}`}></div>
                                                    {studentData.status === 'active' ? 'Verified' : studentData.status}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-8 gap-y-3">
                                            <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold font-mono">
                                                <IdCard className="w-4 h-4 text-indigo-500/50" />
                                                NIS. {studentData.nis || '2024.0001'}
                                            </div>
                                            <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                                                <Users className="w-4 h-4 text-indigo-500/50" />
                                                {studentData.class?.name || 'Class N/A'}
                                            </div>
                                            <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                                                <Globe className="w-4 h-4 text-indigo-500/50" />
                                                {studentData.gender === 'L' ? 'Ikhwan' : 'Akhwat'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Sections */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mt-12 lg:mt-20">
                                    {/* Data Pribadi */}
                                    <div className="space-y-10">
                                        <div className="flex items-center gap-4 border-b border-neutral-800/50 pb-6">
                                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Data Identitas Pribadi</h3>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                                                <div className="p-6 bg-neutral-950/40 border border-neutral-800/50 rounded-[2rem] shadow-inner group/stat">
                                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2 group-hover/stat:text-indigo-400 transition-colors">Dormitory</p>
                                                    <p className="font-bold text-white text-base break-words">{studentData.dormitory?.name || 'Belum Ditentukan'}</p>
                                                </div>
                                                <div className="p-6 bg-neutral-950/40 border border-neutral-800/50 rounded-[2rem] shadow-inner group/stat">
                                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2 group-hover/stat:text-indigo-400 transition-colors">Group Type</p>
                                                    <p className="font-bold text-white text-base">Formal Education</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-6 group/item">
                                                <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center shrink-0 group-hover/item:border-indigo-500 transition-colors">
                                                    <Calendar className="w-6 h-6 text-neutral-600 group-hover/item:text-indigo-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2">Tempat, Tanggal Lahir</p>
                                                    {isEditing ? (
                                                        <div className="flex flex-col sm:flex-row gap-4">
                                                            <input
                                                                type="text"
                                                                value={editForm.birth_place}
                                                                onChange={(e) => setEditForm({ ...editForm, birth_place: e.target.value })}
                                                                className="flex-[2] bg-[#050505] border border-neutral-800 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50"
                                                                placeholder="Tempat Lahir"
                                                            />
                                                            <input
                                                                type="date"
                                                                value={editForm.birth_date}
                                                                onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                                                                className="flex-[3] bg-[#050505] border border-neutral-800 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p className="font-bold text-white text-base">
                                                            {studentData.birth_place || 'N/A'}, {studentData.birth_date ? new Date(studentData.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-6 group/item">
                                                <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center shrink-0 group-hover/item:border-indigo-500 transition-colors">
                                                    <MapPin className="w-6 h-6 text-neutral-600 group-hover/item:text-indigo-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2">Alamat Tinggal Tetap</p>
                                                    {isEditing ? (
                                                        <textarea
                                                            value={editForm.address}
                                                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                                            className="w-full bg-[#050505] border border-neutral-800 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 min-h-[120px] transition-all"
                                                        />
                                                    ) : (
                                                        <p className="font-bold text-white text-base leading-relaxed">{studentData.address || 'Alamat belum dilengkapi.'}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data Keluarga */}
                                    <div className="space-y-10">
                                        <div className="flex items-center gap-4 border-b border-neutral-800/50 pb-6">
                                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Informasi Orang Tua / Wali</h3>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="p-8 bg-[#0c0c0c] border border-neutral-800/50 rounded-[2.5rem] flex items-center gap-6 group/card hover:bg-[#111] transition-all">
                                                <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center text-neutral-700 group-hover/card:text-indigo-500 transition-colors">
                                                    <Shield className="w-7 h-7" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1.5">Penanggung Jawab Utama</p>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editForm.parent_name}
                                                            onChange={(e) => setEditForm({ ...editForm, parent_name: e.target.value })}
                                                            className="w-full bg-[#050505] border border-neutral-800 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50"
                                                            placeholder="Nama Orang Tua / Wali"
                                                        />
                                                    ) : (
                                                        <p className="font-bold text-white text-base">{studentData.parent_name || 'Tidak ada data wali'}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] flex items-center gap-6 group/card hover:bg-indigo-500/10 transition-all">
                                                <div className="w-14 h-14 bg-[#0a0a0a] border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.1)]">
                                                    <Phone className="w-7 h-7" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1.5">Nomor Telepon Darurat</p>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editForm.phone}
                                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                            className="w-full bg-[#050505] border border-neutral-800 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                                                            placeholder="08xxxxxxxxxx"
                                                        />
                                                    ) : (
                                                        <p className="font-bold text-white text-base font-mono tracking-wider">{studentData.parent_phone || 'N/A'}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-6 sm:p-8 bg-[#0c0c0c] border border-neutral-800/50 rounded-[2.5rem] flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-3">Health Status</p>
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/5 text-rose-500 border border-rose-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                        Normal Condition
                                                    </div>
                                                </div>
                                                <div className="hidden sm:block w-px h-10 bg-neutral-800/50"></div>
                                                <div className="sm:hidden w-full h-px bg-neutral-800/50"></div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-3">Academic Term</p>
                                                    <p className="text-white font-bold text-xs uppercase tracking-widest">2024 / 2025 Genap</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Verification Footer */}
                        <div className="flex items-center justify-center gap-3 opacity-30 py-4">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">Digital Identity Card • Smart Pesantren Managed Academic System</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
