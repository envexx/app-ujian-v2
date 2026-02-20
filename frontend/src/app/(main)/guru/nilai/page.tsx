"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { fetcherWithAuth } from "@/lib/swr-config";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Exam,
  ChartBar,
  Users,
  CheckCircle,
  Eye,
  ArrowRight,
} from "@phosphor-icons/react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface UjianNilai {
  id: string;
  judul: string;
  mapel_nama?: string;
  mapel?: { nama: string } | string;
  status: string;
  soal_count?: number;
  submission_count?: number;
  startUjian: string;
  endUjian: string;
  kelas?: string[];
}

export default function NilaiGuruPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data, error, isLoading } = useSWR('/api/guru/ujian', fetcherWithAuth);

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Gagal memuat data</p>
      </div>
    );
  }

  // Show all ujian (including draft)
  const ujianList: UjianNilai[] = data?.data?.ujian || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aktif':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aktif</Badge>;
      case 'selesai':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Selesai</Badge>;
      case 'draft':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMapelName = (ujian: UjianNilai) => {
    if (ujian.mapel_nama) return ujian.mapel_nama;
    if (typeof ujian.mapel === 'object' && ujian.mapel?.nama) return ujian.mapel.nama;
    if (typeof ujian.mapel === 'string') return ujian.mapel;
    return '-';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Penilaian Ujian</h1>
          <p className="text-sm md:text-base text-muted-foreground">Kelola nilai siswa untuk setiap ujian</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Exam className="w-5 h-5 text-blue-600" weight="duotone" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Ujian</p>
                <p className="text-2xl font-bold">{ujianList.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" weight="duotone" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aktif</p>
                <p className="text-2xl font-bold">{ujianList.filter(u => u.status === 'aktif').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Exam className="w-5 h-5 text-orange-600" weight="duotone" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold">{ujianList.filter(u => u.status === 'draft').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" weight="duotone" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pengumpulan</p>
                <p className="text-2xl font-bold">{ujianList.reduce((sum, u) => sum + (u.submission_count || 0), 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ujian Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ChartBar className="w-5 h-5 text-[#165DFB]" weight="duotone" />
            Daftar Ujian
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ujianList.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Judul Ujian</TableHead>
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead className="text-center">Soal</TableHead>
                    <TableHead className="text-center">Pengumpulan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ujianList.map((ujian, idx) => (
                    <TableRow key={ujian.id}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{ujian.judul}</TableCell>
                      <TableCell>{getMapelName(ujian)}</TableCell>
                      <TableCell>{ujian.kelas?.join(', ') || '-'}</TableCell>
                      <TableCell className="text-center">{ujian.soal_count || 0}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-blue-600">{ujian.submission_count || 0}</span>
                      </TableCell>
                      <TableCell>
                        {ujian.startUjian ? format(new Date(ujian.startUjian), "dd MMM yyyy", { locale: localeId }) : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(ujian.status)}</TableCell>
                      <TableCell className="text-center">
                        <Link href={`/guru/ujian/${ujian.id}/nilai`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="w-4 h-4" weight="duotone" />
                            Lihat
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Exam className="w-16 h-16 mx-auto mb-4 opacity-30" weight="duotone" />
              <p className="text-lg font-medium">Belum ada ujian</p>
              <p className="text-sm mt-1">Buat ujian terlebih dahulu untuk mulai menilai</p>
              <Link href="/guru/ujian/create">
                <Button className="mt-4">
                  Buat Ujian Baru
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
