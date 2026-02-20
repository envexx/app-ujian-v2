"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcherWithAuth } from "@/lib/swr-config";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { 
  Exam, 
  CheckCircle, 
  Clock, 
  Trophy,
  Play,
  House,
  BookOpen,
  FunnelSimple,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SiswaUjianPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const [filterTab, setFilterTab] = useState<"all" | "selesai" | "belum">("all");
  const { data, error, isLoading } = useSWR('/api/siswa/ujian', fetcherWithAuth);
  const { data: dashboardData } = useSWR('/api/siswa/ujian/dashboard', fetcherWithAuth);

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
        <p className="text-red-600">Gagal memuat data ujian</p>
      </div>
    );
  }

  const siswa = dashboardData?.data?.siswa || {};
  const allUjian = data?.data?.ujian || [];
  
  const ujian = allUjian.filter((u: any) => {
    if (filterTab === "selesai") return !!u.submission;
    if (filterTab === "belum") return !u.submission;
    return true;
  });

  const stats = {
    total: allUjian.length,
    selesai: allUjian.filter((u: any) => u.submission).length,
    belum: allUjian.filter((u: any) => !u.submission).length,
  };

  const iconBgColors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100'];
  const iconColors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600'];

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

        {/* Stats Row */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Exam className="w-4 h-4 text-purple-500" weight="fill" />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" weight="fill" />
              <span className="text-xs text-gray-500">Selesai</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.selesai}</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-orange-500" weight="fill" />
              <span className="text-xs text-gray-500">Belum</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.belum}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              filterTab === "all" 
                ? "bg-orange-500 text-white" 
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Semua ({stats.total})
          </button>
          <button
            onClick={() => setFilterTab("belum")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              filterTab === "belum" 
                ? "bg-orange-500 text-white" 
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Belum ({stats.belum})
          </button>
          <button
            onClick={() => setFilterTab("selesai")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              filterTab === "selesai" 
                ? "bg-orange-500 text-white" 
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Selesai ({stats.selesai})
          </button>
        </div>

        {/* Ujian List */}
        {ujian.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" weight="duotone" />
            <p className="text-gray-500">Tidak ada ujian</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ujian.map((u: any, index: number) => {
              const hasSubmission = !!u.submission;
              const canStart = u.canStart;

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
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(u.startUjian), "dd MMM yyyy, HH:mm", { locale: id })}
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
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <House className="w-6 h-6" weight="duotone" />
            <span className="text-xs">Home</span>
          </button>
          <button 
            onClick={() => router.push('/siswa/ujian')}
            className="flex flex-col items-center gap-1 text-orange-500"
          >
            <Exam className="w-6 h-6" weight="fill" />
            <span className="text-xs font-medium">Ujian</span>
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
