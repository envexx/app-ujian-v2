"use client";


import { fetchApi } from '@/lib/fetch-api';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useMapel } from "@/hooks/useSWR";
import { LoadingSpinner, ErrorState } from "@/components/ui/loading-spinner";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";

export default function MapelPage() {
  const { data: mapelData, isLoading, mutate } = useMapel();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMapel, setEditingMapel] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; mapel: any | null }>({
    open: false,
    mapel: null,
  });
  const [formData, setFormData] = useState({
    nama: "",
    kode: "",
    jenis: "wajib",
    jamPerMinggu: 4,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const mapel = (mapelData as any)?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingMapel ? 'PUT' : 'POST';
      const payload = editingMapel ? { id: editingMapel.id, ...formData } : formData;
      
      const response = await fetchApi('/api/mapel', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingMapel ? "Mata pelajaran berhasil diperbarui" : "Mata pelajaran berhasil ditambahkan");
        mutate();
        setIsDialogOpen(false);
        resetForm();
      } else {
        toast.error("Gagal menyimpan data mata pelajaran");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleEdit = (m: any) => {
    setEditingMapel(m);
    setFormData({
      nama: m.nama || "",
      kode: m.kode || "",
      jenis: m.jenis || "wajib",
      jamPerMinggu: m.jamPerMinggu || 4,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteModal.mapel) return;
    
    try {
      const response = await fetchApi(`/api/mapel?id=${deleteModal.mapel.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Mata pelajaran berhasil dihapus");
        mutate();
        setDeleteModal({ open: false, mapel: null });
      } else {
        toast.error("Gagal menghapus mata pelajaran");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const openDeleteModal = (mapel: any) => {
    setDeleteModal({ open: true, mapel });
  };

  const resetForm = () => {
    setFormData({
      nama: "",
      kode: "",
      jenis: "wajib",
      jamPerMinggu: 4,
    });
    setEditingMapel(null);
  };

  const filteredMapel = mapel.filter((m: any) =>
    m.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.kode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mata Pelajaran</h1>
          <p className="text-muted-foreground">Kelola mata pelajaran sekolah</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Mata Pelajaran
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Mata Pelajaran</CardTitle>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari mata pelajaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Mata Pelajaran</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Jam/Minggu</TableHead>
                <TableHead>Jumlah Guru</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMapel.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Tidak ada data mata pelajaran
                  </TableCell>
                </TableRow>
              ) : (
                filteredMapel.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono">{m.kode}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        {m.nama}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{m.jenis}</span>
                    </TableCell>
                    <TableCell>{m.jamPerMinggu} jam</TableCell>
                    <TableCell>{m._count?.guru || 0} guru</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteModal(m)}>
                          <Trash2 className="h-4 w-4" />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMapel ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}</DialogTitle>
            <DialogDescription>
              {editingMapel ? "Perbarui data mata pelajaran" : "Tambahkan mata pelajaran baru ke sistem"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode Mata Pelajaran *</Label>
              <Input
                id="kode"
                placeholder="Contoh: MAT, BIN, IPA"
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama">Nama Mata Pelajaran *</Label>
              <Input
                id="nama"
                placeholder="Contoh: Matematika, Bahasa Indonesia"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jenis">Jenis *</Label>
                <select
                  id="jenis"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={formData.jenis}
                  onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                  required
                >
                  <option value="wajib">Wajib</option>
                  <option value="pilihan">Pilihan</option>
                  <option value="muatan_lokal">Muatan Lokal</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jamPerMinggu">Jam per Minggu *</Label>
                <Input
                  id="jamPerMinggu"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.jamPerMinggu}
                  onChange={(e) => setFormData({ ...formData, jamPerMinggu: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingMapel ? "Perbarui" : "Tambah"} Mata Pelajaran
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationModal
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ open, mapel: null })}
        onConfirm={handleDelete}
        title="Hapus Mata Pelajaran"
        description="Apakah Anda yakin ingin menghapus mata pelajaran"
        itemName={deleteModal.mapel?.nama}
      />
    </div>
  );
}
