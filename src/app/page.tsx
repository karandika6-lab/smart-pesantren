'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getCurrentUserSync,
  getRedirectRoute,
  User,
  ROLE_NAMES
} from '@/lib/auth';
import {
  Loader2,
  ArrowRight,
  Shield,
  BookOpen,
  Users,
  Activity,
  Star,
  LayoutDashboard,
  Terminal,
  Zap,
  Globe,
  Lock,
  Cpu,
  Sparkles
} from 'lucide-react';
import LoginHero3D from '@/components/login/LoginHero3D';

// ============================================
// Internal Components
// ============================================

function CounterEnd({ value }: { value: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const target = parseInt(value.replace(/[^0-9]/g, '')) || 0;
  const suffix = value.replace(/[0-9]/g, '');

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const stepTime = Math.abs(Math.floor(duration / target));

    const timer = setInterval(() => {
      start += 1;
      setDisplayValue(start);
      if (start >= target) clearInterval(timer);
    }, Math.max(stepTime, 20));

    return () => clearInterval(timer);
  }, [target]);

  return <span>{displayValue.toLocaleString()}{suffix}</span>;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const cachedUser = getCurrentUserSync();
    setUser(cachedUser);
    setLoading(false);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    { label: 'Santri Aktif', value: '1,250+', icon: Users, color: 'text-blue-500' },
    { label: 'Program Hafalan', value: '12+', icon: BookOpen, color: 'text-orange-500' },
    { label: 'Tingkat Kehadiran', value: '98.5%', icon: Activity, color: 'text-emerald-500' },
    { label: 'Prestasi Akademik', value: '45+', icon: Star, color: 'text-amber-500' },
  ];

  const portals = [
    {
      title: 'Portal Wali Santri',
      desc: 'Pantau perkembangan hafalan, nilai akademik, dan kedisiplinan buah hati secara real-time dari genggaman.',
      icon: Shield,
      color: 'from-orange-500 to-amber-600',
      features: ['Hafalan Daily', 'Tagihan SPP', 'Absensi Real-time']
    },
    {
      title: 'Portal Santri',
      desc: 'Akses jadwal pelajaran, materi, dan progres capaian pribadi untuk mendukung kemandirian belajar.',
      icon: LayoutDashboard,
      color: 'from-blue-500 to-indigo-600',
      features: ['Jadwal Harian', 'Capaian Hafalan', 'Poin Kedisiplinan']
    },
    {
      title: 'Sistem Terintegrasi',
      desc: 'Sinergi data antara pengasuhan, akademik, dan orang tua dalam satu platform digital yang aman.',
      icon: Terminal,
      color: 'from-purple-500 to-violet-600',
      features: ['Cloud Sync', 'Notifikasi Push', 'Analisis Data']
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-orange-500/30 overflow-x-hidden relative">

      <style jsx global>{`
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(2deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                @keyframes float-slow {
                    0% { transform: translateY(0px) rotateX(0deg) rotateY(0deg); }
                    50% { transform: translateY(-30px) rotateX(10deg) rotateY(10deg); }
                    100% { transform: translateY(0px) rotateX(0deg) rotateY(0deg); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes spin-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                @keyframes ping-slow {
                    0% { transform: scale(1); opacity: 0.2; }
                    50% { transform: scale(2); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 0.2; }
                }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
                .animate-spin-slow { animation: spin-slow 15s linear infinite; }
                .animate-spin-reverse { animation: spin-reverse 20s linear infinite; }
                .animate-ping-slow { animation: ping-slow 4s ease-in-out infinite; }
                .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); }
                .perspective-2000 { perspective: 2000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .rotate-x-45 { transform: rotateX(45deg); }
                .rotate-y-60 { transform: rotateY(60deg); }
                .rotate-z-12 { transform: rotateZ(12deg); }
            `}</style>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-3 sm:py-4 bg-black/50 backdrop-blur-xl border-b border-white/5' : 'py-6 sm:py-8'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(234,88,12,0.3)] group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter">Smart <span className="text-orange-500">P</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
            <a href="#fitur" className="hover:text-white transition-colors">Program</a>
            <a href="#statistik" className="hover:text-white transition-colors">Statistik</a>
            <a href="#portal" className="hover:text-white transition-colors">Layanan</a>
          </div>

          <Link
            href={user ? getRedirectRoute(user.role) : '/login'}
            className="relative group overflow-hidden px-6 sm:px-10 py-3 sm:py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-full transition-all hover:pr-14 shadow-[0_10px_30px_rgba(234,88,12,0.3)] hover:shadow-orange-500/50"
          >
            <span className="relative z-10">{user ? 'Dashboard' : 'Masuk Portal'}</span>
            <ArrowRight className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 w-3 sm:w-4 h-3 sm:h-4 opacity-0 group-hover:opacity-100 transition-all" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-32 lg:pt-44 pb-8 lg:pb-12 px-4 sm:px-6 lg:min-h-[100vh] flex flex-col">
        {/* Background Decor */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-12 items-center w-full">
          <div className="space-y-3 lg:space-y-4 relative z-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Digital Ecosystem v2.0</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.05]">
              Digitalisasi <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600">
                Pesantren Modern
              </span>
            </h1>

            <p className="text-sm sm:text-lg lg:text-xl text-neutral-400 leading-relaxed max-w-xl font-medium">
              Platform terintegrasi untuk pemantauan akademik, program hafalan terpadu, dan kedisiplinan santri secara akurat dan real-time.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <Link
                href="/login"
                className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-[0_20px_40px_rgba(234,88,12,0.3)] hover:scale-105 transition-all flex items-center justify-center gap-3 group"
              >
                Mulai Sekarang
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-4 text-neutral-500 font-bold text-[10px] sm:text-[11px] uppercase tracking-widest">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                Live Monitoring Active
              </div>
            </div>
          </div>

          {/* Pure CSS 3D Animation Scene */}
          <div className="relative group perspective-2000 hidden lg:flex items-center justify-center min-h-[500px]">
            <div className="absolute -inset-20 bg-orange-600/10 rounded-full blur-[150px] animate-pulse"></div>

            {/* Dynamic 3D Scene */}
            <div className="relative w-full h-full flex items-center justify-center transform-style-3d animate-float-slow">
              {/* Central Core */}
              <div className="relative w-64 h-64 transform-style-3d group-hover:rotate-y-180 transition-transform duration-[3000ms] ease-in-out">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl shadow-[0_0_50px_rgba(234,88,12,0.5)] border border-white/20 transform-style-3d">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="w-32 h-32 text-white animate-pulse" />
                  </div>

                  {/* Orbital Rings */}
                  <div className="absolute -inset-10 border-2 border-orange-500/30 rounded-full rotate-x-45 animate-spin-slow"></div>
                  <div className="absolute -inset-20 border border-indigo-500/20 rounded-full rotate-y-60 animate-spin-reverse"></div>
                  <div className="absolute -inset-32 border border-white/10 rounded-full rotate-z-12 animate-spin-slow"></div>
                </div>
              </div>

              {/* Floating Tech Nodes (3D Depth) */}
              {[
                { icon: Shield, pos: 'top-0 -left-10', delay: '0s', z: 'translateZ(100px)', color: 'bg-orange-500' },
                { icon: Activity, pos: 'bottom-10 -right-20', delay: '1s', z: 'translateZ(150px)', color: 'bg-emerald-500' },
                { icon: Globe, pos: 'top-20 -right-10', delay: '2s', z: 'translateZ(-50px)', color: 'bg-blue-500' },
                { icon: Cpu, pos: '-bottom-20 left-20', delay: '1.5s', z: 'translateZ(80px)', color: 'bg-indigo-500' },
              ].map((node, i) => (
                <div
                  key={i}
                  style={{ transform: node.z }}
                  className={`absolute ${node.pos} glass p-6 rounded-[2rem] border border-white/10 shadow-2xl animate-float transition-all duration-1000 select-none pointer-events-none`}
                >
                  <div className={`w-12 h-12 ${node.color}/20 rounded-2xl flex items-center justify-center mb-3`}>
                    <node.icon className={`w-6 h-6 ${node.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="h-1.5 w-12 bg-neutral-800 rounded-full overflow-hidden">
                    <div className={`h-full ${node.color} w-3/4 animate-pulse`}></div>
                  </div>
                </div>
              ))}

              {/* Particle Field */}
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full animate-ping-slow opacity-20"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    transform: `translateZ(${Math.random() * 200 - 100}px)`
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="statistik" className="pt-0 pb-12 sm:py-16 lg:py-16 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-12">
            {stats.map((s, i) => (
              <div key={i} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-indigo-600 rounded-[2rem] blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
                <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 p-5 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2rem] text-center space-y-4 hover:border-orange-500/20 transition-all duration-500">
                  <div className={`w-14 h-14 mx-auto rounded-2xl bg-white/5 flex items-center justify-center ${s.color} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                    <s.icon className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter">
                      <CounterEnd value={s.value} />
                    </h4>
                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-neutral-600">{s.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features (Services) */}
      <section id="fitur" className="pt-10 pb-4 sm:py-16 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-12 sm:mb-16">
            <p className="text-orange-500 font-black uppercase tracking-[0.4em] text-[10px]">Layanan Terpadu</p>
            <h2 className="text-3xl lg:text-5xl font-black tracking-tight">Menghubungkan Seluruh <span className="text-neutral-500">Komponen Pesantren</span></h2>
            <p className="text-neutral-500 max-w-2xl mx-auto font-medium">Satu platform digital yang dirancang khusus untuk memenuhi kebutuhan pengurus, pengajar, orang tua, dan santri.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {portals.map((p, i) => (
              <div key={i} className="group bg-[#0a0a0a] border border-neutral-900 rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-10 hover:border-white/10 transition-all hover:bg-neutral-900/50 flex flex-col items-start translate-y-0 lg:hover:-translate-y-4 duration-500">
                <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${p.color} flex items-center justify-center text-white mb-8 shadow-2xl group-hover:scale-110 transition-transform`}>
                  <p.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black mb-4">{p.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-8 font-medium">{p.desc}</p>
                <div className="space-y-3 mt-auto w-full">
                  {p.features.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Hafalan & Achievement (Visual Section) */}
      <section id="portal" className="pt-4 pb-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-xl border border-white/10 rounded-[2.5rem] sm:rounded-[4rem] p-8 lg:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-20 opacity-[0.03] rotate-12">
            <Sparkles className="w-64 h-64 text-orange-500" />
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black tracking-tighter leading-none">
                Pantau <br />
                <span className="text-orange-500">Capaian Hafalan</span> <br />
                Secara Presisi
              </h2>
              <p className="text-neutral-500 font-medium leading-relaxed">
                Tidak hanya Al-Qur'an, sistem kami mendukung klasifikasi berbagai program hafalan seperti Tahlil, Do'a harian, dan Kitab Kuning dengan pelacakan persentase rill.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-orange-500">
                    <Cpu className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-white leading-tight">Smart Calculation</p>
                    <p className="text-[11px] font-black uppercase text-neutral-500 tracking-widest">Estimasi penyelesaian otomatis</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-blue-500">
                    <Globe className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-white leading-tight">Orang Tua Terintegrasi</p>
                    <p className="text-[11px] font-black uppercase text-neutral-500 tracking-widest">Laporan harian dikirim real-time</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative space-y-4 max-w-sm mx-auto lg:max-w-none">
              {/* Mock UI Elements for "3D effect" visual */}
              <div className="bg-[#111] border border-white/10 p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl -rotate-1 sm:-rotate-2 transform lg:hover:rotate-0 transition-transform duration-700">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500"></div>
                    <p className="text-xs font-black">Zaidan Ahmad - Grade 8</p>
                  </div>
                  <span className="text-[8px] font-black bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full uppercase">Program Tahlil</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase text-neutral-500">
                    <span>Progres Halaqah</span>
                    <span className="text-white">65%</span>
                  </div>
                  <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 w-[65%] rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="bg-[#111] border border-white/10 p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl translate-x-4 sm:translate-x-8 lg:translate-x-12 rotate-2 sm:rotate-3 lg:hover:rotate-0 transition-transform duration-700">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500"></div>
                    <p className="text-xs font-black">Sarah Amira - Grade 9</p>
                  </div>
                  <span className="text-[8px] font-black bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full uppercase">Hafalan Juz 30</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase text-neutral-500">
                    <span>Progres Juz</span>
                    <span className="text-white">88%</span>
                  </div>
                  <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-[88%] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"></div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
            {/* Branding Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-black uppercase tracking-tighter">Smart <span className="text-orange-500">P</span></span>
              </div>
              <p className="text-neutral-500 text-sm leading-relaxed max-w-xs font-medium">
                Solusi ekosistem digital terpadu untuk transformasi pesantren yang lebih modern, transparan, dan akuntabel.
              </p>
              <div className="flex gap-4">
                {[Globe, Shield, Activity].map((Icon, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500 hover:text-orange-500 hover:bg-white/10 transition-all cursor-pointer">
                    <Icon className="w-4 h-4" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">Navigasi</h4>
              <ul className="space-y-4">
                {['Program', 'Statistik', 'Layanan', 'Masuk Portal'].map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase()}`} className="text-neutral-500 hover:text-orange-500 text-sm font-medium transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">Bantuan</h4>
              <ul className="space-y-4">
                {['Tentang Kami', 'Hubungi Kami', 'Kebijakan Privasi', 'Pusat Bantuan'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-neutral-500 hover:text-orange-500 text-sm font-medium transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">Kontak Kami</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 mt-1">
                    <Zap className="w-4 h-4" />
                  </div>
                  <p className="text-neutral-500 text-sm leading-relaxed font-medium">
                    VF8Q+FH3, Hargomulyo, Kec. Sekampung <br />
                    Kab. Lampung Timur, Lampung 34382
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Activity className="w-4 h-4" />
                  </div>
                  <p className="text-neutral-500 text-sm font-medium">pondoksekampung@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
              <p className="text-neutral-600 text-[10px] font-bold uppercase tracking-widest leading-none">
                &copy; 2026 Smart Pesantren Ecosystem
              </p>
              <div className="hidden md:block h-4 w-[1px] bg-white/5"></div>
              <p className="text-neutral-800 text-[10px] font-bold uppercase tracking-widest leading-none">
                Managed by IT Pesantren Central
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-neutral-500">
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                v2.4.0 Stable
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
