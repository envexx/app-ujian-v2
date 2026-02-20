"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Exam,
  FileText,
  CheckCircle,
  Clock,
  Play,
  Eye,
  Plus,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { fetcherWithAuth } from "@/lib/swr-config";

interface UjianItem {
  id: string;
  judul: string;
  mapel: string;
  status: string;
  totalSoal: number;
  totalSubmissions: number;
  startUjian: string;
  endUjian: string;
}

export default function GuruDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { data, error, isLoading } = useSWR('/api/guru/ujian', fetcherWithAuth, {
    refreshInterval: 30000,
  });

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Gagal memuat data dashboard</p>
      </div>
    );
  }

  const ujianList: UjianItem[] = data?.data?.ujian || [];
  const ujianAktif = ujianList.filter((u) => u.status === 'aktif');
  const ujianDraft = ujianList.filter((u) => u.status === 'draft');
  const ujianSelesai = ujianList.filter((u) => u.status === 'selesai');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aktif':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aktif</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Draft</Badge>;
      case 'selesai':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Selesai</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-[#0221CD] to-[#0221CD]/80 border-0 shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Exam className="w-8 h-8 text-white" weight="duotone" />
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Dashboard Guru</h1>
              </div>
              <p className="text-blue-50 text-base md:text-lg">Selamat datang, {user?.profile?.nama || 'Guru'}</p>
            </div>
            <Link href="/guru/ujian/create">
              <Button className="bg-white text-[#0221CD] hover:bg-blue-50">
                <Plus className="w-4 h-4 mr-2" />
                Buat Ujian Baru
              </Button>
            </Link>
          </div>

          {/* Statistics */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FileText className="w-5 h-5 text-white" weight="duotone" />
                </div>
                <p className="text-blue-100 text-sm font-medium">Total Ujian</p>
              </div>
              <p className="text-white text-3xl font-bold">{ujianList.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Play className="w-5 h-5 text-white" weight="duotone" />
                </div>
                <p className="text-blue-100 text-sm font-medium">Ujian Aktif</p>
              </div>
              <p className="text-white text-3xl font-bold">{ujianAktif.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Clock className="w-5 h-5 text-white" weight="duotone" />
                </div>
                <p className="text-blue-100 text-sm font-medium">Draft</p>
              </div>
              <p className="text-white text-3xl font-bold">{ujianDraft.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-white" weight="duotone" />
                </div>
                <p className="text-blue-100 text-sm font-medium">Selesai</p>
              </div>
              <p className="text-white text-3xl font-bold">{ujianSelesai.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ujian Aktif */}
      <Card className="border shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Play className="w-5 h-5 text-green-600" weight="duotone" />
              Ujian Sedang Berlangsung
            </CardTitle>
            <Link href="/guru/ujian">
              <Button variant="outline" size="sm">Lihat Semua</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ujianAktif.length > 0 ? (
              ujianAktif.slice(0, 5).map((ujian) => (
                <Link key={ujian.id} href={`/guru/ujian/${ujian.id}`}>
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all cursor-pointer">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{ujian.judul}</p>
                      <p className="text-sm text-gray-600">{ujian.mapel} • {ujian.totalSoal} soal</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{ujian.totalSubmissions} pengumpulan</span>
                      {getStatusBadge(ujian.status)}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="w-12 h-12 mx-auto mb-2 opacity-50" weight="duotone" />
                <p>Tidak ada ujian yang sedang berlangsung</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ujian Draft */}
      <Card className="border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-yellow-600" weight="duotone" />
            Draft Ujian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ujianDraft.length > 0 ? (
              ujianDraft.slice(0, 5).map((ujian) => (
                <Link key={ujian.id} href={`/guru/ujian/${ujian.id}`}>
                  <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-all cursor-pointer">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{ujian.judul}</p>
                      <p className="text-sm text-gray-600">{ujian.mapel} • {ujian.totalSoal} soal</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(ujian.status)}
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" weight="duotone" />
                <p>Tidak ada draft ujian</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
