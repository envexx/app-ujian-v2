"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcherWithAuth } from "@/lib/swr-config";
import { fetchApi } from "@/lib/fetch-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Plus, Search, Trash2, FileUp, FileDown, BookOpen, CheckCircle, X, Pencil, Eye } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const TIPE_LABELS: Record<string, string> = {
  PILIHAN_GANDA: "Pilihan Ganda",
  ESSAY: "Essay",
  ISIAN_SINGKAT: "Isian Singkat",
  BENAR_SALAH: "Benar/Salah",
  PENCOCOKAN: "Pencocokan",
};

const TIPE_COLORS: Record<string, string> = {
  PILIHAN_GANDA: "bg-blue-100 text-blue-800",
  ESSAY: "bg-purple-100 text-purple-800",
  ISIAN_SINGKAT: "bg-green-100 text-green-800",
  BENAR_SALAH: "bg-orange-100 text-orange-800",
  PENCOCOKAN: "bg-pink-100 text-pink-800",
};

export default function BankSoalPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMapel, setFilterMapel] = useState<string>("all");
  const [filterTipe, setFilterTipe] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importDialog, setImportDialog] = useState(false);
  const [selectedUjian, setSelectedUjian] = useState<string>("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  const { data: bankSoalData, isLoading, mutate } = useSWR('/api/guru/bank-soal', fetcherWithAuth);
  const { data: statsData } = useSWR('/api/guru/bank-soal/stats', fetcherWithAuth);
  const { data: mapelData } = useSWR('/api/mapel', fetcherWithAuth);
  const { data: ujianData } = useSWR('/api/guru/ujian', fetcherWithAuth);

  if (isLoading) return <LoadingSpinner />;

  const bankSoal = bankSoalData?.data || [];
  const stats = statsData?.data || { total: 0, byTipe: {}, byMapel: [] };
  const mapelList = mapelData?.data || [];
  const ujianList = ujianData?.data?.ujian || [];

  const filteredSoal = bankSoal.filter((s: any) => {
    const matchSearch = !searchQuery || 
      s.pertanyaan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchMapel = filterMapel === "all" || s.mapelId === filterMapel;
    const matchTipe = filterTipe === "all" || s.tipe === filterTipe;
    return matchSearch && matchMapel && matchTipe;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredSoal.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSoal.map((s: any) => s.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const res = await fetchApi(`/api/guru/bank-soal/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Soal berhasil dihapus");
        mutate();
      } else {
        toast.error("Gagal menghapus soal");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setDeleteDialog(false);
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      const res = await fetchApi('/api/guru/bank-soal/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        toast.success(`${selectedIds.length} soal berhasil dihapus`);
        setSelectedIds([]);
        mutate();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menghapus soal");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setBulkDeleteDialog(false);
    }
  };

  const handleImportToUjian = async () => {
    if (!selectedUjian || selectedIds.length === 0) {
      toast.error("Pilih ujian dan soal terlebih dahulu");
      return;
    }

    try {
      const res = await fetchApi('/api/guru/bank-soal/import-to-ujian', {
        method: 'POST',
        body: JSON.stringify({ ujianId: selectedUjian, bankSoalIds: selectedIds }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(data.message);
        setImportDialog(false);
        setSelectedIds([]);
        setSelectedUjian("");
      } else {
        toast.error(data.error || "Gagal import soal");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bank Soal</h1>
          <p className="text-muted-foreground">
            Kelola koleksi soal untuk digunakan di berbagai ujian
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <>
              <Button variant="outline" onClick={() => setImportDialog(true)}>
                <FileUp className="w-4 h-4 mr-2" />
                Import ke Ujian ({selectedIds.length})
              </Button>
              <Button variant="destructive" onClick={() => setBulkDeleteDialog(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus ({selectedIds.length})
              </Button>
            </>
          )}
          <Link href="/guru/bank-soal/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Soal
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Soal</p>
          </CardContent>
        </Card>
        {Object.entries(stats.byTipe || {}).map(([tipe, count]) => (
          <Card key={tipe}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{count as number}</div>
              <p className="text-xs text-muted-foreground">{TIPE_LABELS[tipe] || tipe}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari soal atau tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterMapel} onValueChange={setFilterMapel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Mapel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mapel</SelectItem>
                {mapelList.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>{m.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTipe} onValueChange={setFilterTipe}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                {Object.entries(TIPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Daftar Soal ({filteredSoal.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 pl-4">
                  <Checkbox 
                    checked={selectedIds.length === filteredSoal.length && filteredSoal.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="min-w-[300px]">Pertanyaan</TableHead>
                <TableHead className="w-36">Mapel</TableHead>
                <TableHead className="w-36">Kelas</TableHead>
                <TableHead className="w-32">Tipe</TableHead>
                <TableHead className="w-20 text-center">Poin</TableHead>
                <TableHead className="w-32 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSoal.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-1">Belum ada soal di bank soal</p>
                    <p className="text-sm">Tambah soal baru atau export dari ujian yang sudah ada</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSoal.map((soal: any) => (
                  <TableRow key={soal.id} className="hover:bg-muted/30">
                    <TableCell className="pl-4">
                      <Checkbox 
                        checked={selectedIds.includes(soal.id)}
                        onCheckedChange={() => handleSelect(soal.id)}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1.5">
                        <p className="font-medium text-sm line-clamp-2 leading-relaxed">
                          {stripHtml(soal.pertanyaan)}
                        </p>
                        {soal.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {soal.tags.slice(0, 3).map((tag: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {soal.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{soal.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{soal.mapel || '-'}</span>
                    </TableCell>
                    <TableCell>
                      {soal.kelas?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {soal.kelas.slice(0, 2).map((k: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {k}
                            </Badge>
                          ))}
                          {soal.kelas.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{soal.kelas.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Semua</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${TIPE_COLORS[soal.tipe] || "bg-gray-100"} text-xs`}>
                        {TIPE_LABELS[soal.tipe] || soal.tipe}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{soal.poin}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/guru/bank-soal/${soal.id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Pencil className="w-4 h-4 text-blue-600" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => openDeleteDialog(soal.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Import to Ujian Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Soal ke Ujian</DialogTitle>
            <DialogDescription>
              Pilih ujian untuk menambahkan {selectedIds.length} soal yang dipilih
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedUjian} onValueChange={setSelectedUjian}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Ujian" />
              </SelectTrigger>
              <SelectContent>
                {ujianList.filter((u: any) => u.status === 'draft').map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>{u.judul}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImportDialog(false)}>Batal</Button>
              <Button onClick={handleImportToUjian} disabled={!selectedUjian}>
                <FileUp className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Soal</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus soal ini dari bank soal? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus {selectedIds.length} Soal</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus {selectedIds.length} soal yang dipilih dari bank soal? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setBulkDeleteDialog(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus {selectedIds.length} Soal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
