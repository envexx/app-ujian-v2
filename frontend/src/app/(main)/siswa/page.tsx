"use client";

import useSWR from "swr";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { fetcherWithAuth } from "@/lib/swr-config";
import { 
  Exam, 
  CheckCircle,
  Clock,
  Trophy,
  Play,
  House,
  BookOpen,
  Sparkle,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SiswaDashboardPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { data: dashboardData, error: dashboardError, isLoading: dashboardLoading } = useSWR('/api/siswa/ujian/dashboard', fetcherWithAuth);
  const { data: ujianData, error: ujianError, isLoading: ujianLoading } = useSWR('/api/siswa/ujian', fetcherWithAuth);

  if (authLoading || dashboardLoading || ujianLoading) {
    return (
      <div className="min-h-screen bg-[#E8F4F8] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (dashboardError || ujianError) {
    return (
      <div className="min-h-screen bg-[#E8F4F8] flex items-center justify-center">
        <p className="text-red-600">Gagal memuat data dashboard</p>
      </div>
    );
  }

  const siswa = dashboardData?.data?.siswa || {};
  const stats = dashboardData?.data?.stats || {};
  const allUjian = ujianData?.data?.ujian || [];
  
  const now = new Date();
  const upcomingUjian = allUjian.filter((u: any) => {
    const examStartTime = new Date(u.startUjian);
    return !u.submission && examStartTime >= now;
  });

  const rataRataNilai = stats.rataRataNilai || 0;
  const jumlahUjianMendatang = upcomingUjian.length;
  const totalUjianSelesai = allUjian.filter((u: any) => u.submission).length;

  return (
    <div className="min-h-screen bg-[#E8F4F8]">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-500 text-sm">Hello,</p>
            <h1 className="text-2xl font-bold text-gray-900">{siswa.nama || 'Siswa'}</h1>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
            <Image
              src="/avatars/siswa.png"
              alt="Avatar"
              width={48}
              height={48}
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-[#C5E8DC] to-[#B8E5D5] rounded-3xl p-5 mb-6 relative overflow-hidden">
          <div className="relative z-10 max-w-[60%]">
            <h2 className="text-gray-800 text-xl font-bold mb-2">Apa yang ingin kamu pelajari hari ini?</h2>
            <button 
              onClick={() => router.push('/siswa/ujian')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              Mulai Ujian
            </button>
          </div>
          
          {/* Decorative illustration placeholder */}
          <div className="absolute right-2 bottom-0 w-32 h-32 flex items-end justify-center">
            <div className="w-24 h-24 bg-white/30 rounded-full flex items-center justify-center">
              <Sparkle className="w-12 h-12 text-green-600" weight="duotone" />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-orange-500" weight="fill" />
              <span className="text-xs text-gray-500">Rata-rata</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{rataRataNilai}</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" weight="fill" />
              <span className="text-xs text-gray-500">Mendatang</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{jumlahUjianMendatang}</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" weight="fill" />
              <span className="text-xs text-gray-500">Selesai</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalUjianSelesai}</p>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Ujian Terbaru</h3>
          <button 
            onClick={() => router.push('/siswa/ujian')}
            className="text-sm text-orange-500 font-medium"
          >
            Lihat Semua
          </button>
        </div>

        {/* Ujian List */}
        {allUjian.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" weight="duotone" />
            <p className="text-gray-500">Belum ada ujian tersedia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allUjian.slice(0, 5).map((u: any, index: number) => {
              const hasSubmission = !!u.submission;
              const canStart = u.canStart;
              const examStatus = u.examStatus;
              
              const iconBgColors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100'];
              const iconColors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600'];

              return (
                <div 
                  key={u.id}
                  onClick={() => router.push(hasSubmission ? `/siswa/ujian/${u.id}/hasil` : `/siswa/ujian/${u.id}`)}
                  className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBgColors[index % 4]}`}>
                    <Exam className={`w-7 h-7 ${iconColors[index % 4]}`} weight="duotone" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{u.judul}</h4>
                    <p className="text-xs text-gray-500">
                      {u.mapel} • {Math.round((new Date(u.endUjian).getTime() - new Date(u.startUjian).getTime()) / 60000)} menit
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasSubmission ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-green-600">{u.submission.nilai ?? '-'}</span>
                        <CheckCircle className="w-5 h-5 text-green-500" weight="fill" />
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        canStart ? 'bg-orange-500' : 'bg-gray-200'
                      }`}>
                        <Play className={`w-5 h-5 ${canStart ? 'text-white' : 'text-gray-400'}`} weight="fill" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 safe-area-pb">
        <div className="max-w-lg mx-auto flex justify-around">
          <button 
            onClick={() => router.push('/siswa')}
            className="flex flex-col items-center gap-1 text-orange-500"
          >
            <House className="w-6 h-6" weight="fill" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button 
            onClick={() => router.push('/siswa/ujian')}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Exam className="w-6 h-6" weight="duotone" />
            <span className="text-xs">Ujian</span>
          </button>
          <button 
            onClick={() => router.push('/siswa/raport')}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Trophy className="w-6 h-6" weight="duotone" />
            <span className="text-xs">Raport</span>
          </button>
        </div>
      </div>
    </div>
  );
}
