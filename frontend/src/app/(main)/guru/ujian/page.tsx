"use client";


import { fetchApi } from '@/lib/fetch-api';
import { fetcherWithAuth } from '@/lib/swr-config';
import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, CheckCircle, Exam, CheckCircle as CheckCirclePhosphor, File, XCircle, PencilSimple, MagnifyingGlass, ListChecks, Gear } from "@phosphor-icons/react";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Ujian {
  id: string;
  judul: string;
  deskripsi: string;
  kelas: string | string[];
  mapel: string;
  startUjian: string | Date;
  endUjian: string | Date;
  jumlahSoal: number;
  status: "draft" | "aktif" | "selesai";
  jumlahPeserta?: number;
  sudahMengerjakan?: number;
}


export default function UjianGuruPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedUjian, setSelectedUjian] = useState<{ id: string; judul: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data, error, isLoading, mutate } = useSWR(
    `/api/guru/ujian?status=${filterStatus}`,
    fetcherWithAuth
  );

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Gagal memuat data ujian</p>
      </div>
    );
  }

  const ujian = data?.data?.ujian || [];

  // Filter ujian berdasarkan search query
  const filteredUjian = ujian.filter((u: any) => {
    const query = searchQuery.toLowerCase();
    return (
      u.judul?.toLowerCase().includes(query) ||
      u.mapel?.toLowerCase().includes(query) ||
      (Array.isArray(u.kelas) ? u.kelas.some((k: string) => k.toLowerCase().includes(query)) : u.kelas?.toLowerCase().includes(query))
    );
  });

  const handleDelete = async () => {
    if (!selectedUjian) return;
    
    try {
      const response = await fetchApi(`/api/guru/ujian?id=${selectedUjian.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await mutate();
        toast.success("Ujian berhasil dihapus");
        setShowDeleteModal(false);
        setSelectedUjian(null);
      } else {
        toast.error(result.error || "Gagal menghapus ujian");
      }
    } catch (error) {
      console.error('Error deleting ujian:', error);
      toast.error("Terjadi kesalahan saat menghapus ujian");
    }
  };

  const handlePublish = async () => {
    if (!selectedUjian) return;
    
    try {
      const response = await fetchApi(`/api/guru/ujian/${selectedUjian.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'aktif' }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await mutate();
        toast.success("Ujian berhasil dipublikasikan");
        setShowPublishModal(false);
        setSelectedUjian(null);
      } else {
        toast.error(result.error || "Gagal mempublikasikan ujian");
      }
    } catch (error) {
      console.error('Error publishing ujian:', error);
      toast.error("Terjadi kesalahan saat mempublikasikan ujian");
    }
  };

  const openDeleteModal = (id: string, judul: string) => {
    setSelectedUjian({ id, judul });
    setShowDeleteModal(true);
  };

  const openPublishModal = (id: string, judul: string) => {
    setSelectedUjian({ id, judul });
    setShowPublishModal(true);
  };

  const stats = {
    total: ujian.length,
    aktif: ujian.filter((u: any) => u.status === "aktif").length,
    draft: ujian.filter((u: any) => u.status === "draft").length,
    selesai: ujian.filter((u: any) => u.status === "selesai").length,
  };

  return (
    <div className="space-y-6">
      {/* Header Card with Blue Background */}
      <Card className="bg-gradient-to-br from-[#0221CD] to-[#0221CD]/80 border-0 shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Exam className="w-8 h-8 text-white" weight="duotone" />
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Manajemen Ujian</h1>
              </div>
              <p className="text-blue-50 text-base md:text-lg">Kelola dan pantau ujian untuk siswa Anda</p>
            </div>
            <Button 
              onClick={() => router.push("/guru/ujian/create")} 
              size="lg" 
              className="bg-white text-[#165DFB] hover:bg-blue-50 shadow-md hover:shadow-lg transition-all whitespace-nowrap"
            >
              <Plus className="w-5 h-5 mr-2" weight="bold" />
              Buat Ujian Baru
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Exam className="w-5 h-5 text-white" weight="duotone" />
                </div>
                <p className="text-blue-100 text-sm font-medium">Total Ujian</p>
              </div>
              <p className="text-white text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <CheckCirclePhosphor className="w-5 h-5 text-white" weight="duotone" />
                </div>
                <p className="text-blue-100 text-sm font-medium">Aktif</p>
              </div>
              <p className="text-white text-3xl font-bold">{stats.aktif}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <File className="w-5 h-5 text-white" weight="duotone" />
                </div>
                <p className="text-blue-100 text-sm font-medium">Draft</p>
              </div>
              <p className="text-white text-3xl font-bold">{stats.draft}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <XCircle className="w-5 h-5 text-white" weight="duotone" />
                </div>
                <p className="text-blue-100 text-sm font-medium">Selesai</p>
              </div>
              <p className="text-white text-3xl font-bold">{stats.selesai}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Daftar Ujian</CardTitle>
              <CardDescription className="mt-1">
                {filteredUjian.length} dari {ujian.length} ujian
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari ujian..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[250px]"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="selesai">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUjian.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Exam className="w-16 h-16 text-muted-foreground mb-4" weight="duotone" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || filterStatus !== "all" ? "Tidak ada ujian yang ditemukan" : "Belum ada ujian"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {searchQuery || filterStatus !== "all" 
                  ? "Coba ubah filter atau kata kunci pencarian Anda"
                  : "Mulai dengan membuat ujian baru untuk siswa Anda"}
              </p>
              {!searchQuery && filterStatus === "all" && (
                <Button onClick={() => router.push("/guru/ujian/create")}>
                  <Plus className="w-4 h-4 mr-2" weight="bold" />
                  Buat Ujian Pertama
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredUjian.map((u: any) => (
                <Card 
                  key={u.id} 
                  className="shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group border hover:border-primary/20 overflow-hidden"
                  onClick={() => router.push(`/guru/ujian/${u.id}`)}
                >
                  <CardHeader className="pb-3 space-y-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <CardTitle className="text-base sm:text-lg font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {u.judul}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-0.5 w-fit">
                          {u.mapel}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                            <Gear className="w-4 h-4" weight="duotone" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => router.push(`/guru/ujian/${u.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/guru/ujian/${u.id}/edit`)}>
                            <PencilSimple className="w-4 h-4 mr-2" />
                            Edit Ujian
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/guru/ujian/${u.id}/nilai`)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Lihat Nilai
                          </DropdownMenuItem>
                          {u.status === "draft" && (
                            <DropdownMenuItem onClick={() => openPublishModal(u.id, u.judul)}>
                              <CheckCirclePhosphor className="w-4 h-4 mr-2" />
                              Publikasikan
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => openDeleteModal(u.id, u.judul)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0" onClick={(e) => e.stopPropagation()}>
                    {/* Kelas + Soal count row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                        {Array.isArray(u.kelas) ? (
                          u.kelas.slice(0, 3).map((kelas: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] sm:text-xs px-2 py-0.5">
                              {kelas}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 py-0.5">
                            {u.kelas}
                          </Badge>
                        )}
                        {Array.isArray(u.kelas) && u.kelas.length > 3 && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-0.5">
                            +{u.kelas.length - 3}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
                        <ListChecks className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{u.totalSoal || 0} soal</span>
                      </div>
                    </div>

                    {/* Schedule compact */}
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">
                        {format(new Date(u.startUjian), "dd MMM yyyy HH:mm", { locale: id })}
                        {" — "}
                        {format(new Date(u.endUjian), "dd MMM yyyy HH:mm", { locale: id })}
                      </span>
                      <span className="flex-shrink-0 text-muted-foreground/70">
                        ({Math.round((new Date(u.endUjian).getTime() - new Date(u.startUjian).getTime()) / 60000)}m)
                      </span>
                    </div>

                    {/* Status + Actions */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Badge 
                        variant={
                          u.status === "aktif" ? "default" :
                          u.status === "draft" ? "secondary" :
                          "outline"
                        }
                        className={cn(
                          "text-[10px] sm:text-xs px-2 py-0.5 font-medium",
                          u.status === "aktif" && "bg-green-100 text-green-700 hover:bg-green-100 border-green-200",
                          u.status === "draft" && "bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200",
                          u.status === "selesai" && "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200"
                        )}
                      >
                        {u.status === "aktif" ? "Aktif" : u.status === "draft" ? "Draft" : "Selesai"}
                      </Badge>
                      <div className="flex gap-0.5 sm:gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => router.push(`/guru/ujian/${u.id}`)}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => router.push(`/guru/ujian/${u.id}/edit`)}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                        >
                          <PencilSimple className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Konfirmasi Hapus */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Ujian</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus ujian <span className="font-semibold">{selectedUjian?.judul}</span>?
              <br />
              <br />
              Tindakan ini tidak dapat dibatalkan. Semua data ujian, soal, dan jawaban siswa akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUjian(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Konfirmasi Publish */}
      <AlertDialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Publikasi Ujian</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mempublikasikan ujian <span className="font-semibold">{selectedUjian?.judul}</span>?
              <br />
              <br />
              Setelah dipublikasikan, ujian akan menjadi aktif dan dapat diakses oleh siswa. Pastikan semua soal sudah lengkap dan benar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUjian(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePublish}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Ya, Publikasikan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
