"use client";

import useSWR from "swr";
import { fetcherWithAuth } from "@/lib/swr-config";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Exam, ChartBar, Play, Clock, BookOpen, House } from "@phosphor-icons/react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SiswaRaportPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { data, error, isLoading } = useSWR('/api/siswa/ujian/raport', fetcherWithAuth);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#E8F4F8] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#E8F4F8] flex items-center justify-center">
        <p className="text-red-600">Gagal memuat data raport</p>
      </div>
    );
  }

  const siswa = data?.data?.siswa || {};
  const raport = data?.data?.raport || [];
  const rataRataKeseluruhan = data?.data?.rataRataKeseluruhan || 0;
  const totalUjianDinilai = data?.data?.totalUjianDinilai || 0;

  const getNilaiColor = (nilai: number) => {
    if (nilai >= 85) return 'text-green-600';
    if (nilai >= 70) return 'text-blue-600';
    if (nilai >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getNilaiBg = (nilai: number) => {
    if (nilai >= 85) return 'bg-green-50 border-green-200';
    if (nilai >= 70) return 'bg-blue-50 border-blue-200';
    if (nilai >= 60) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

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

        {/* Stats Banner */}
        <div className="bg-gradient-to-r from-[#B8E5D5] to-[#A8D8C8] rounded-3xl p-5 mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-gray-800 text-lg font-semibold mb-1">Ringkasan Nilai</h2>
            <p className="text-gray-600 text-sm mb-4">{siswa.kelas} • NISN: {siswa.nisn}</p>
            
            <div className="flex gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-orange-500" weight="fill" />
                  <span className="text-xs text-gray-500">Rata-rata</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{rataRataKeseluruhan}</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Exam className="w-4 h-4 text-green-600" weight="fill" />
                  <span className="text-xs text-gray-500">Total Ujian</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalUjianDinilai}</p>
              </div>
            </div>
          </div>
          
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full" />
          <div className="absolute -right-4 top-16 w-16 h-16 bg-white/10 rounded-full" />
        </div>

        {/* Section Title */}
        <div className="flex items-center gap-2 mb-4">
          <ChartBar className="w-5 h-5 text-gray-700" weight="duotone" />
          <h3 className="text-lg font-semibold text-gray-900">Nilai Per Mapel</h3>
        </div>

        {/* Subject Cards */}
        {raport.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" weight="duotone" />
            <p className="text-gray-500">Belum ada nilai yang tersedia</p>
          </div>
        ) : (
          <div className="space-y-4">
            {raport.map((r: any, mapelIdx: number) => (
              <div key={r.mapel} className="bg-white rounded-3xl p-5 shadow-sm">
                {/* Mapel Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      mapelIdx % 4 === 0 ? 'bg-blue-100' :
                      mapelIdx % 4 === 1 ? 'bg-green-100' :
                      mapelIdx % 4 === 2 ? 'bg-purple-100' : 'bg-orange-100'
                    }`}>
                      <BookOpen className={`w-6 h-6 ${
                        mapelIdx % 4 === 0 ? 'text-blue-600' :
                        mapelIdx % 4 === 1 ? 'text-green-600' :
                        mapelIdx % 4 === 2 ? 'text-purple-600' : 'text-orange-600'
                      }`} weight="duotone" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{r.mapel}</h4>
                      <p className="text-xs text-gray-500">{r.totalUjian} ujian</p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-xl font-bold text-lg ${getNilaiBg(r.rataRata)} ${getNilaiColor(r.rataRata)} border`}>
                    {r.rataRata}
                  </div>
                </div>

                {/* Ujian List */}
                <div className="space-y-2">
                  {r.ujian.map((u: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => router.push(`/siswa/ujian/${u.id}/hasil`)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                          <Exam className="w-5 h-5 text-gray-600" weight="duotone" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{u.judul}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {format(new Date(u.tanggal), "dd MMM yyyy", { locale: id })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-base ${getNilaiColor(u.nilai)}`}>{u.nilai}</span>
                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white" weight="fill" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 safe-area-pb">
        <div className="max-w-lg mx-auto flex justify-around">
          <button 
            onClick={() => router.push('/siswa')}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <House className="w-6 h-6" weight="duotone" />
            <span className="text-xs">Home</span>
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
            className="flex flex-col items-center gap-1 text-orange-500"
          >
            <Trophy className="w-6 h-6" weight="fill" />
            <span className="text-xs font-medium">Raport</span>
          </button>
        </div>
      </div>
    </div>
  );
}
