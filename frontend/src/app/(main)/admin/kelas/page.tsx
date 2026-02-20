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
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { useKelas } from "@/hooks/useSWR";
import { LoadingSpinner, ErrorState } from "@/components/ui/loading-spinner";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";

export default function KelasPage() {
  const { data: kelasData, isLoading, mutate } = useKelas();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; kelas: any | null }>({
    open: false,
    kelas: null,
  });
  const [formData, setFormData] = useState({
    nama: "",
    tingkat: "",
    tahunAjaran: "2024/2025",
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const kelas = (kelasData as any)?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingKelas ? 'PUT' : 'POST';
      const payload = editingKelas ? { id: editingKelas.id, ...formData } : formData;
      
      const response = await fetchApi('/api/kelas', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingKelas ? "Kelas berhasil diperbarui" : "Kelas berhasil ditambahkan");
        mutate();
        setIsDialogOpen(false);
        resetForm();
      } else {
        toast.error("Gagal menyimpan data kelas");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleEdit = (k: any) => {
    setEditingKelas(k);
    setFormData({
      nama: k.nama || "",
      tingkat: k.tingkat || "",
      tahunAjaran: k.tahunAjaran || "2024/2025",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteModal.kelas) return;
    
    try {
      const response = await fetchApi(`/api/kelas?id=${deleteModal.kelas.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Kelas berhasil dihapus");
        mutate();
        setDeleteModal({ open: false, kelas: null });
      } else {
        toast.error("Gagal menghapus kelas");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const openDeleteModal = (kelas: any) => {
    setDeleteModal({ open: true, kelas });
  };

  const resetForm = () => {
    setFormData({
      nama: "",
      tingkat: "",
      tahunAjaran: "2024/2025",
    });
    setEditingKelas(null);
  };

  const filteredKelas = kelas.filter((k: any) =>
    k.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.tingkat?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Kelas</h1>
          <p className="text-muted-foreground">Kelola data kelas sekolah</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kelas
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kelas</CardTitle>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kelas..."
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
                <TableHead>Nama Kelas</TableHead>
                <TableHead>Tingkat</TableHead>
                <TableHead>Tahun Ajaran</TableHead>
                <TableHead>Jumlah Siswa</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKelas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Tidak ada data kelas
                  </TableCell>
                </TableRow>
              ) : (
                filteredKelas.map((k: any) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.nama}</TableCell>
                    <TableCell>{k.tingkat}</TableCell>
                    <TableCell>{k.tahunAjaran}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {k._count?.siswa || 0} siswa
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(k)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteModal(k)}>
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
            <DialogTitle>{editingKelas ? "Edit Kelas" : "Tambah Kelas Baru"}</DialogTitle>
            <DialogDescription>
              {editingKelas ? "Perbarui data kelas" : "Tambahkan kelas baru ke sistem"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Kelas *</Label>
              <Input
                id="nama"
                placeholder="Contoh: 7A, 8B, 9C"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tingkat">Tingkat *</Label>
              <Input
                id="tingkat"
                placeholder="Contoh: 7, 8, 9"
                value={formData.tingkat}
                onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tahunAjaran">Tahun Ajaran *</Label>
              <Input
                id="tahunAjaran"
                placeholder="Contoh: 2024/2025"
                value={formData.tahunAjaran}
                onChange={(e) => setFormData({ ...formData, tahunAjaran: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingKelas ? "Perbarui" : "Tambah"} Kelas
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationModal
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ open, kelas: null })}
        onConfirm={handleDelete}
        title="Hapus Kelas"
        description="Apakah Anda yakin ingin menghapus kelas"
        itemName={deleteModal.kelas?.nama}
      />
    </div>
  );
}
