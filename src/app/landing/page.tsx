"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ClipboardList, BarChart3, Shield, Sparkles, ArrowRight, Check,
  ChevronRight, Menu, X, Brain, Star, Quote, Globe,
  UserCheck, Timer, FileText, MessageCircle, Loader2, Play, ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const WA_NUMBER = "6281234567890";
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Halo, saya tertarik dengan platform ujian online nilai.online. Mohon info lebih lanjut.")}`;

const NAV_LINKS = [
  { label: "Fitur", href: "#fitur" },
  { label: "Harga", href: "#harga" },
  { label: "Testimonial", href: "#testimonial" },
  { label: "FAQ", href: "#faq" },
];

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Ujian Online (CBT)",
    desc: "Buat ujian online dengan berbagai tipe soal: pilihan ganda, essay, isian singkat, benar/salah, dan pencocokan. Dilengkapi auto-grading otomatis dan timer ujian.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: UserCheck,
    title: "Kehadiran Online",
    desc: "Butuh presensi digital? Gunakan platform kehadiran.online — sistem absensi online terintegrasi untuk siswa dan guru.",
    color: "from-emerald-500 to-teal-600",
    link: "https://kehadiran.online/",
  },
  {
    icon: Brain,
    title: "AI Generate Soal",
    desc: "Asisten AI yang bisa membuat soal ujian otomatis. Cukup deskripsikan materi, soal langsung jadi lengkap dengan kunci jawaban.",
    color: "from-purple-500 to-pink-600",
  },
  {
    icon: BarChart3,
    title: "Analitik Nilai Real-time",
    desc: "Dashboard analitik untuk memantau hasil ujian, statistik nilai per siswa, per kelas, dan per mata pelajaran secara real-time.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: FileText,
    title: "Bank Soal & Export PDF",
    desc: "Simpan dan kelola bank soal untuk digunakan kembali. Export hasil ujian dan rapor ke format PDF dengan mudah.",
    color: "from-cyan-500 to-blue-600",
  },
  {
    icon: Shield,
    title: "Multi-Tenant & Aman",
    desc: "Setiap sekolah memiliki data terpisah dan terisolasi. Keamanan data terjamin. Cocok untuk SD, SMP, SMA, dan SMK.",
    color: "from-rose-500 to-pink-600",
  },
];

const TESTIMONIALS = [
  {
    name: "Budi Santoso, S.Pd.",
    role: "Kepala Sekolah, SMPN 1 Surabaya",
    text: "Ujian online di nilai.online mengubah cara kami mengelola PTS dan PAS. Proses yang dulu memakan waktu berhari-hari kini selesai dalam hitungan jam. Koreksi otomatis sangat membantu!",
    avatar: "BS",
  },
  {
    name: "Siti Rahayu, M.Pd.",
    role: "Guru Matematika, SMAN 3 Bandung",
    text: "Fitur AI generate soal sangat membantu saya membuat soal ujian online. Tinggal deskripsikan materi, soal langsung jadi! Sangat praktis dan efisien.",
    avatar: "SR",
  },
  {
    name: "Ahmad Fauzi",
    role: "Admin IT, SMK Telkom Jakarta",
    text: "Setup ujian online-nya sangat mudah dan cepat. Dalam sehari semua guru dan siswa sudah bisa menggunakan platform ini untuk ujian.",
    avatar: "AF",
  },
];

const FAQS = [
  {
    q: "Apakah platform ujian online ini bisa dicoba gratis?",
    a: "Ya! Kami menyediakan paket Trial gratis selama 14 hari dengan akses ke semua fitur dasar ujian online. Tidak perlu kartu kredit.",
  },
  {
    q: "Tipe soal apa saja yang didukung untuk ujian online?",
    a: "Kami mendukung pilihan ganda, essay, isian singkat, benar/salah, dan pencocokan. Semua tipe soal dilengkapi auto-grading kecuali essay yang perlu koreksi manual.",
  },
  {
    q: "Bagaimana cara mendaftar dan membuat akun sekolah?",
    a: "Anda bisa langsung daftar gratis melalui halaman registrasi di website kami — akun admin sekolah langsung aktif dengan paket Trial. Untuk paket premium, hubungi tim kami via WhatsApp.",
  },
  {
    q: "Apakah bisa digunakan untuk PTS, PAS, dan ujian semester?",
    a: "Tentu! Platform kami dirancang untuk semua jenis ujian: ulangan harian, kuis, PTS, PAS, ujian semester, hingga ujian sekolah. Dilengkapi timer dan pengacakan soal.",
  },
  {
    q: "Bagaimana dengan sistem presensi/kehadiran?",
    a: "Untuk presensi online, kami menyediakan platform terpisah di kehadiran.online yang terintegrasi dengan sistem kami. Kunjungi kehadiran.online untuk info lebih lanjut.",
  },
  {
    q: "Apakah bisa upgrade atau downgrade paket?",
    a: "Tentu! Anda bisa mengubah paket kapan saja. Hubungi tim kami via WhatsApp untuk proses perubahan paket.",
  },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 lg:h-[72px]">
        <Link href="/landing" className="flex items-center gap-2.5">
          <div className="relative w-8 h-8">
            <Image src="/icon/logo-no-bg-png-blue.png" alt="Ujian Online nilai.online" fill className="object-contain" priority />
          </div>
          <span className={cn("text-lg font-bold tracking-tight transition-colors", scrolled ? "text-gray-900" : "text-white")}>
            nilai<span className="text-[#3b82f6]">.online</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-[#0221CD]",
                scrolled ? "text-gray-600" : "text-white/80 hover:text-white"
              )}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className={cn(
              "text-sm font-medium px-4 py-2 rounded-lg transition-colors",
              scrolled ? "text-gray-700 hover:text-[#0221CD]" : "text-white/90 hover:text-white"
            )}
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg bg-white text-[#0221CD] hover:bg-blue-50 transition-colors shadow-lg shadow-white/25"
          >
            Daftar Gratis
          </Link>
        </div>

        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? (
            <X className={cn("w-5 h-5", scrolled ? "text-gray-900" : "text-white")} />
          ) : (
            <Menu className={cn("w-5 h-5", scrolled ? "text-gray-900" : "text-white")} />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
              <Link href="/login" className="block w-full text-center px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
                Masuk
              </Link>
              <Link href="/register" className="block w-full text-center px-4 py-2.5 text-sm font-medium text-white bg-[#0221CD] rounded-lg hover:bg-[#0221CD]/90">
                Daftar Gratis
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden transition-colors hover:border-gray-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-gray-900 pr-4">{q}</span>
        <ChevronRight className={cn("w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200", open && "rotate-90")} />
      </button>
      <div className={cn("overflow-hidden transition-all duration-300", open ? "max-h-40 pb-4" : "max-h-0")}>
        <p className="px-5 text-sm text-gray-500 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

interface LandingMediaItem {
  id: string;
  tipe: string;
  judul: string;
  url: string;
  aspectRatio: string;
  urutan: number;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/
  );
  return match ? match[1] : null;
}

interface TierFromDB {
  id: string;
  nama: string;
  label: string;
  harga: number;
  maxSiswa: number;
  maxGuru: number;
  maxKelas: number;
  maxMapel: number;
  maxUjian: number;
  maxStorage: number;
  fipitur: Record<string, boolean> | null;
  urutan: number;
}

function formatRupiah(amount: number): string {
  if (amount === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatStorage(mb: number): string {
  if (mb >= 1000) return `${(mb / 1000).toFixed(0)} GB`;
  return `${mb} MB`;
}

function formatLimit(value: number): string {
  if (value >= 99999) return "Unlimited";
  return new Intl.NumberFormat("id-ID").format(value);
}

const FEATURE_LABEL_MAP: Record<string, string> = {
  ujianOnline: "Ujian Online (CBT)",
  bankSoal: "Bank Soal",
  autoGrading: "Auto-Grading",
  exportPdf: "Export PDF",
  bulkImport: "Bulk Import Data",
  aiChatbot: "AI Generate Soal",
  dashboardAnalitik: "Dashboard Analitik",
  prioritySupport: "Priority Support",
  customBranding: "Custom Branding",
  apiAccess: "API Access",
};

function getTierFeatures(tier: TierFromDB): string[] {
  if (!tier.fipitur) return ["Ujian Online (CBT)"];
  return Object.entries(tier.fipitur)
    .filter(([, v]) => v)
    .map(([k]) => FEATURE_LABEL_MAP[k] || k);
}

function getWaLinkForTier(tierLabel: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Halo, saya tertarik dengan paket ${tierLabel} untuk ujian online di nilai.online. Mohon info pembayaran dan pembuatan akun.`)}`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const [tiers, setTiers] = useState<TierFromDB[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [media, setMedia] = useState<LandingMediaItem[]>([]);

  useEffect(() => {
    fetch("/api/public/tiers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setTiers(data.data);
        }
      })
      .catch((err) => console.error("Error fetching tiers:", err))
      .finally(() => setLoadingTiers(false));

    fetch("/api/public/landing-media")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setMedia(data.data);
        }
      })
      .catch((err) => console.error("Error fetching media:", err));
  }, []);

  const previewImages = media.filter((m) => m.tipe === "image");
  const previewVideos = media.filter((m) => m.tipe === "video");

  // Determine "popular" tier (basic or urutan=2)
  const popularTierNama = "basic";

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <Navbar />

      {/* ==================== HERO ==================== */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0221CD] via-[#0a3ad8] to-[#1e40af]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMi0ydi0ySDI2djJoOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-medium mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              Platform Ujian Online #1 di Indonesia
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
              Ujian Online
              <br />
              <span className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                Mudah & Cepat
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
              Platform ujian online (CBT) lengkap untuk sekolah SD, SMP, SMA, dan SMK. Auto-grading, AI generate soal, analitik nilai real-time.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-[#0221CD] font-semibold text-sm hover:bg-blue-50 transition-colors shadow-xl shadow-white/20"
              >
                Daftar Gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1fb855] transition-colors shadow-xl shadow-green-500/20"
              >
                <MessageCircle className="w-4 h-4" />
                Hubungi via WhatsApp
              </a>
              <a
                href="#fitur"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold text-sm border border-white/20 hover:bg-white/20 transition-colors"
              >
                Lihat Fitur
              </a>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
              {[
                { value: "500+", label: "Sekolah" },
                { value: "50rb+", label: "Ujian Dibuat" },
                { value: "99.9%", label: "Uptime" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-white">{s.value}</p>
                  <p className="text-xs sm:text-sm text-blue-200/70 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section id="fitur" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-[#0221CD] tracking-wide uppercase mb-3">Fitur Unggulan</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Platform Ujian Online Lengkap untuk Sekolah
            </h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Semua yang dibutuhkan sekolah untuk ujian online dan manajemen nilai — dalam satu platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Wrapper = (f as any).link ? "a" : "div";
              const linkProps = (f as any).link ? { href: (f as any).link, target: "_blank", rel: "noopener noreferrer" } : {};
              return (
                <Wrapper
                  key={f.title}
                  {...linkProps}
                  className="group relative p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-xl hover:shadow-gray-100/50 hover:border-gray-200 transition-all duration-300"
                >
                  <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4", f.color)}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  {(f as any).link && (
                    <p className="text-xs text-[#0221CD] font-medium mt-3 group-hover:underline">Kunjungi kehadiran.online →</p>
                  )}
                </Wrapper>
              );
            })}
          </div>

          {/* Feature CTA */}
          <div className="text-center mt-12">
            <p className="text-sm text-gray-500 mb-4">Tertarik dengan fitur kami? Hubungi tim kami untuk demo dan pembuatan akun.</p>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1fb855] transition-colors shadow-lg shadow-green-500/20"
            >
              <MessageCircle className="w-4 h-4" />
              Tanya via WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ==================== PREVIEW GALLERY ==================== */}
      {previewImages.length > 0 && (
        <section className="py-20 lg:py-28 bg-gray-50/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm font-semibold text-[#0221CD] tracking-wide uppercase mb-3">Preview Platform</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Lihat Tampilan Ujian Online Kami
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Berikut tampilan platform ujian online yang akan Anda gunakan.
              </p>
            </div>

            <div className={cn(
              "grid gap-6",
              previewImages.length === 1 ? "grid-cols-1 max-w-3xl mx-auto" :
              previewImages.length === 2 ? "grid-cols-1 md:grid-cols-2" :
              "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}>
              {previewImages.map((img) => {
                const aspectClass = img.aspectRatio === "9:16" ? "aspect-[9/16]" : img.aspectRatio === "1:1" ? "aspect-square" : "aspect-video";
                return (
                  <div key={img.id} className="group">
                    <div className={cn(
                      "relative rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white",
                      aspectClass,
                      img.aspectRatio === "9:16" && "max-w-[280px] mx-auto"
                    )}>
                      <Image
                        src={img.url}
                        alt={img.judul}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                    </div>
                    {img.judul && (
                      <p className="text-sm text-gray-500 text-center mt-3 font-medium">{img.judul}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="py-20 lg:py-28 bg-gray-50/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-[#0221CD] tracking-wide uppercase mb-3">Cara Memulai</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              3 Langkah Mudah untuk Ujian Online
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Daftar Sekolah", desc: "Daftar gratis langsung di website atau hubungi kami via WhatsApp untuk paket premium. Akun admin sekolah langsung aktif." },
              { step: "02", title: "Setup Sekolah", desc: "Import data guru, siswa, dan kelas. Bisa manual atau bulk import via Excel. Selesai dalam hitungan menit." },
              { step: "03", title: "Mulai Ujian Online", desc: "Buat ujian online dan pantau hasil nilai siswa secara real-time dari dashboard." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#0221CD] text-white text-xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== VIDEO TUTORIAL ==================== */}
      {previewVideos.length > 0 && (
        <section className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm font-semibold text-[#0221CD] tracking-wide uppercase mb-3">Video Tutorial</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Lihat Demo & Tutorial Ujian Online
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Tonton video tutorial cara menggunakan platform ujian online kami.
              </p>
            </div>

            <div className={cn(
              "grid gap-6",
              previewVideos.length === 1 ? "grid-cols-1 max-w-3xl mx-auto" :
              previewVideos.length === 2 ? "grid-cols-1 md:grid-cols-2" :
              "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}>
              {previewVideos.map((vid) => {
                const videoId = getYouTubeId(vid.url);
                const aspectClass = vid.aspectRatio === "9:16" ? "aspect-[9/16]" : vid.aspectRatio === "1:1" ? "aspect-square" : "aspect-video";
                if (!videoId) return null;
                return (
                  <div key={vid.id} className="group">
                    <div className={cn(
                      "relative rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-black",
                      aspectClass,
                      vid.aspectRatio === "9:16" && "max-w-[280px] mx-auto"
                    )}>
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={vid.judul}
                      />
                    </div>
                    {vid.judul && (
                      <p className="text-sm text-gray-500 text-center mt-3 font-medium">{vid.judul}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ==================== PRICING (from DB) ==================== */}
      <section id="harga" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-[#0221CD] tracking-wide uppercase mb-3">Harga Paket Tahunan</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Paket Ujian Online untuk Setiap Sekolah
            </h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Pilih paket sesuai kebutuhan sekolah Anda. Semua harga berlaku per tahun. Hubungi kami via WhatsApp untuk pembayaran dan pembuatan akun.
            </p>
          </div>

          {loadingTiers ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#0221CD]" />
              <span className="ml-3 text-gray-500">Memuat data paket...</span>
            </div>
          ) : tiers.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">Paket belum tersedia. Hubungi kami untuk info lebih lanjut.</p>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1fb855] transition-colors">
                <MessageCircle className="w-4 h-4" />
                Hubungi Kami
              </a>
            </div>
          ) : (
            <>
              <div className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-6",
                tiers.length >= 4 ? "lg:grid-cols-4" : tiers.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"
              )}>
                {tiers.map((tier) => {
                  const isPopular = tier.nama === popularTierNama;
                  const yearlyPrice = tier.harga * 12;
                  const features = getTierFeatures(tier);

                  return (
                    <div
                      key={tier.id}
                      className={cn(
                        "relative flex flex-col rounded-2xl border bg-white p-6 transition-all duration-300 hover:shadow-xl",
                        isPopular
                          ? "border-[#0221CD] shadow-lg shadow-blue-500/10 ring-1 ring-[#0221CD]"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {isPopular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0221CD] text-white text-[11px] font-semibold shadow-lg">
                            <Star className="w-3 h-3" /> Populer
                          </span>
                        </div>
                      )}

                      <div className="mb-5">
                        <h3 className="text-lg font-semibold text-gray-900">{tier.label}</h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {tier.nama === "trial" ? "Coba gratis selama 14 hari" : `Paket ${tier.label} untuk sekolah`}
                        </p>
                      </div>

                      <div className="mb-6">
                        {tier.harga === 0 ? (
                          <>
                            <span className="text-3xl font-extrabold text-gray-900">Gratis</span>
                            <span className="text-sm text-gray-400 ml-1">14 hari</span>
                          </>
                        ) : (
                          <>
                            <span className="text-3xl font-extrabold text-gray-900">{formatRupiah(yearlyPrice)}</span>
                            <span className="text-sm text-gray-400 ml-1">/tahun</span>
                            <p className="text-xs text-gray-400 mt-1">({formatRupiah(tier.harga)}/bulan)</p>
                          </>
                        )}
                      </div>

                      <div className="space-y-2 mb-6 pb-6 border-b border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0221CD]/60" />
                          {formatLimit(tier.maxSiswa)} Siswa
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0221CD]/60" />
                          {formatLimit(tier.maxGuru)} Guru
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0221CD]/60" />
                          {formatLimit(tier.maxKelas)} Kelas
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0221CD]/60" />
                          {formatLimit(tier.maxUjian)} Ujian
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0221CD]/60" />
                          {formatStorage(tier.maxStorage)} Storage
                        </div>
                      </div>

                      <div className="space-y-2 mb-8 flex-1">
                        {features.map((f) => (
                          <div key={f} className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            {f}
                          </div>
                        ))}
                      </div>

                      {tier.harga === 0 ? (
                        <Link
                          href="/register"
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold bg-[#0221CD] text-white hover:bg-[#0221CD]/90 transition-colors shadow-lg shadow-blue-500/20"
                        >
                          <UserCheck className="w-4 h-4" />
                          Daftar Gratis Sekarang
                        </Link>
                      ) : (
                        <a
                          href={getWaLinkForTier(tier.label)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors",
                            isPopular
                              ? "bg-[#25D366] text-white hover:bg-[#1fb855] shadow-lg shadow-green-500/20"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          )}
                        >
                          <MessageCircle className="w-4 h-4" />
                          Pilih {tier.label}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-xs text-gray-400 mt-8">
                Semua harga sudah termasuk setup akun dan support. Hubungi kami untuk paket custom.{" "}
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="text-[#0221CD] hover:underline font-medium">
                  Chat WhatsApp
                </a>
              </p>
            </>
          )}
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <section id="testimonial" className="py-20 lg:py-28 bg-gray-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-[#0221CD] tracking-wide uppercase mb-3">Testimonial</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Dipercaya Sekolah untuk Ujian Online
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="relative p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-lg transition-shadow duration-300"
              >
                <Quote className="w-8 h-8 text-[#0221CD]/10 mb-4" />
                <p className="text-sm text-gray-600 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0221CD] to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-[#0221CD] tracking-wide uppercase mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Pertanyaan Umum Ujian Online
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((f) => (
              <FAQItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="py-20 lg:py-28 bg-gray-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0221CD] via-[#0a3ad8] to-[#1e40af]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative px-8 py-16 sm:px-16 sm:py-20 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Siap Mulai Ujian Online di Sekolah Anda?
              </h2>
              <p className="mt-4 text-blue-100/80 max-w-xl mx-auto">
                Hubungi kami sekarang via WhatsApp untuk konsultasi gratis, pilih paket, dan langsung mulai ujian online di sekolah Anda.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1fb855] transition-colors shadow-xl"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat WhatsApp Sekarang
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a
                  href="#harga"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold text-sm border border-white/20 hover:bg-white/20 transition-colors"
                >
                  Lihat Paket Harga
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/landing" className="flex items-center gap-2.5 mb-4">
                <div className="relative w-7 h-7">
                  <Image src="/icon/logo-no-bg-png-blue.png" alt="Ujian Online nilai.online" fill className="object-contain" />
                </div>
                <span className="text-lg font-bold tracking-tight text-gray-900">
                  nilai<span className="text-[#3b82f6]">.online</span>
                </span>
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed">
                Platform ujian online (CBT) untuk sekolah SD, SMP, SMA, dan SMK di Indonesia.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Produk</h4>
              <ul className="space-y-2">
                {[
                  { label: "Ujian Online", href: "#fitur" },
                  { label: "Kehadiran Online", href: "https://kehadiran.online/" },
                  { label: "Harga", href: "#harga" },
                  { label: "FAQ", href: "#faq" },
                ].map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Kontak</h4>
              <ul className="space-y-2">
                <li>
                  <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">WhatsApp</a>
                </li>
                <li>
                  <a href="mailto:info@nilai.online" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Email</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Legal</h4>
              <ul className="space-y-2">
                {["Kebijakan Privasi", "Syarat & Ketentuan"].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} nilai.online — Platform Ujian Online Sekolah Indonesia
            </p>
            <div className="flex items-center gap-4">
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#25D366] transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="#" className="text-gray-300 hover:text-gray-500 transition-colors">
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ==================== JSON-LD Structured Data ==================== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "nilai.online",
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web",
            description: "Platform ujian online (CBT) untuk sekolah SD, SMP, SMA, dan SMK di Indonesia. Dilengkapi auto-grading, AI generate soal, dan analitik nilai real-time.",
            url: "https://app.nilai.online",
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "IDR",
              lowPrice: "0",
              highPrice: "18000000",
              offerCount: tiers.length || 5,
            },
            featureList: [
              "Ujian Online (CBT)",
              "Bank Soal",
              "Auto-Grading",
              "AI Generate Soal",
              "Bank Soal",
              "Analitik Nilai Real-time",
              "Export PDF",
              "Multi-Tenant",
            ],
          }),
        }}
      />
    </div>
  );
}
