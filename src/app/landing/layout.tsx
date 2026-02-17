import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ujian Online Sekolah | Platform CBT & Presensi Online - nilai.online",
  description:
    "Platform ujian online (CBT) dan presensi online terbaik untuk sekolah SD, SMP, SMA, dan SMK di Indonesia. Buat ujian online otomatis dengan auto-grading, bank soal, analitik nilai real-time, dan presensi digital. Mulai gratis!",
  keywords: [
    "ujian online",
    "ujian online sekolah",
    "CBT online",
    "computer based test",
    "ujian online gratis",
    "aplikasi ujian online",
    "platform ujian online",
    "presensi online",
    "presensi online sekolah",
    "absensi online",
    "absensi digital sekolah",
    "e-learning sekolah",
    "ujian online SMP",
    "ujian online SMA",
    "ujian online SMK",
    "ujian online SD",
    "kuis online sekolah",
    "ulangan online",
    "PTS online",
    "PAS online",
    "ujian semester online",
    "bank soal online",
    "auto grading",
    "nilai online",
    "rapor digital",
    "manajemen sekolah",
    "LMS sekolah Indonesia",
  ],
  openGraph: {
    title: "Ujian Online & Presensi Online Sekolah | nilai.online",
    description:
      "Buat ujian online sekolah dengan mudah. Platform CBT lengkap dengan auto-grading, bank soal, presensi digital, dan analitik nilai. Gratis untuk dicoba!",
    url: "https://app.nilai.online",
    siteName: "nilai.online",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ujian Online Sekolah | Platform CBT & Presensi Online - nilai.online",
    description:
      "Platform ujian online (CBT) dan presensi online terbaik untuk sekolah di Indonesia. Auto-grading, bank soal, analitik real-time. Mulai gratis!",
  },
  alternates: {
    canonical: "https://app.nilai.online",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
