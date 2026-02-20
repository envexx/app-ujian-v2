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
import { Plus, Pencil, Trash2, Search, BookOpen, Users, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useGuru, useMapel, useKelas } from "@/hooks/useSWR";
import { LoadingSpinner, ErrorState } from "@/components/ui/loading-spinner";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function GuruPage() {
  const [selectedMapel, setSelectedMapel] = useState<string>("all");
  const { data: guruData, isLoading, mutate } = useGuru(selectedMapel);
  const { data: mapelData, isLoading: mapelLoading } = useMapel();
  const { data: kelasData, isLoading: kelasLoading } = useKelas();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; guru: any | null }>({
    open: false,
    guru: null,
  });
  const [formData, setFormData] = useState({
    nipUsername: "",
    nama: "",
    email: "",
    alamat: "",
    jenisKelamin: "L",
    isActive: true,
    mapelIds: [] as string[],
    kelasIds: [] as string[],
  });

  if (isLoading || mapelLoading || kelasLoading) {
    return <LoadingSpinner />;
  }

  const guru = (guruData as any)?.data || [];
  const mapelList = (mapelData as any)?.data || [];
  const kelasList = (kelasData as any)?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingGuru ? 'PUT' : 'POST';
      const payload = editingGuru ? { id: editingGuru.id, ...formData } : formData;
      
      const response = await fetchApi('/api/guru', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingGuru ? "Data guru berhasil diperbarui" : "Guru berhasil ditambahkan");
        mutate();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Gagal menyimpan data guru");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleEdit = (g: any) => {
    setEditingGuru(g);
    setFormData({
      nipUsername: g.nipUsername || "",
      nama: g.nama || "",
      email: g.email || "",
      alamat: g.alamat || "",
      jenisKelamin: g.jenisKelamin || "L",
      isActive: g.isActive !== undefined ? g.isActive : true,
      mapelIds: g.mapel?.map((m: any) => m.mapelId) || [],
      kelasIds: g.kelas?.map((k: any) => k.kelasId) || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteModal.guru) return;
    
    try {
      const response = await fetchApi(`/api/guru?id=${deleteModal.guru.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Guru berhasil dihapus");
        mutate();
        setDeleteModal({ open: false, guru: null });
      } else {
        toast.error("Gagal menghapus guru");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const openDeleteModal = (guru: any) => {
    setDeleteModal({ open: true, guru });
  };

  const resetForm = () => {
    setFormData({
      nipUsername: "",
      nama: "",
      email: "",
      alamat: "",
      jenisKelamin: "L",
      isActive: true,
      mapelIds: [],
      kelasIds: [],
    });
    setEditingGuru(null);
  };

  const toggleMapel = (mapelId: string) => {
    setFormData(prev => ({
      ...prev,
      mapelIds: prev.mapelIds.includes(mapelId)
        ? prev.mapelIds.filter(id => id !== mapelId)
        : [...prev.mapelIds, mapelId]
    }));
  };

  const toggleKelas = (kelasId: string) => {
    setFormData(prev => ({
      ...prev,
      kelasIds: prev.kelasIds.includes(kelasId)
        ? prev.kelasIds.filter(id => id !== kelasId)
        : [...prev.kelasIds, kelasId]
    }));
  };

  const filteredGuru = guru.filter((g: any) =>
    g.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.nipUsername?.includes(searchQuery) ||
    g.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Guru</h1>
          <p className="text-muted-foreground">Kelola data guru sekolah</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Guru
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Guru</CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari guru..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIP/Username</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Jenis Kelamin</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuru.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Tidak ada data guru
                  </TableCell>
                </TableRow>
              ) : (
                filteredGuru.map((g: any) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono">{g.nipUsername}</TableCell>
                    <TableCell className="font-medium">{g.nama}</TableCell>
                    <TableCell>{g.email}</TableCell>
                    <TableCell>{g.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {g.mapel && g.mapel.length > 0 ? (
                          g.mapel.map((m: any) => (
                            <Badge key={m.id} variant="secondary" className="text-xs">
                              <BookOpen className="h-3 w-3 mr-1" />
                              {m.mapel?.nama}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {g.kelas && g.kelas.length > 0 ? (
                          g.kelas.map((k: any) => (
                            <Badge key={k.id} variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {k.kelas?.nama}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {g.isActive ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(g)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteModal(g)}>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGuru ? "Edit Guru" : "Tambah Guru Baru"}</DialogTitle>
            <DialogDescription>
              {editingGuru ? "Perbarui data guru" : "Tambahkan guru baru ke sistem"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nipUsername">NIP / Username *</Label>
                <Input
                  id="nipUsername"
                  placeholder="Contoh: 198501012010011001 atau username_guru"
                  value={formData.nipUsername}
                  onChange={(e) => setFormData({ ...formData, nipUsername: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">Bisa berupa NIP atau username</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap *</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jenisKelamin">Jenis Kelamin *</Label>
                <select
                  id="jenisKelamin"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={formData.jenisKelamin}
                  onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                  required
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Status *</Label>
                <select
                  id="isActive"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={formData.isActive ? "true" : "false"}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "true" })}
                  required
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input
                id="alamat"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Mata Pelajaran yang Diajar *</Label>
                <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                  {mapelList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tidak ada mata pelajaran</p>
                  ) : (
                    mapelList.map((mapel: any) => (
                      <div key={mapel.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`mapel-${mapel.id}`}
                          checked={formData.mapelIds.includes(mapel.id)}
                          onCheckedChange={() => toggleMapel(mapel.id)}
                        />
                        <label
                          htmlFor={`mapel-${mapel.id}`}
                          className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                        >
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          {mapel.nama}
                          <span className="text-xs text-muted-foreground">({mapel.kode})</span>
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {formData.mapelIds.length > 0 && (
                  <p className="text-xs text-primary">
                    {formData.mapelIds.length} mata pelajaran dipilih
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label>Kelas yang Diajar *</Label>
                <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                  {kelasList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tidak ada kelas</p>
                  ) : (
                    kelasList.map((kelas: any) => (
                      <div key={kelas.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`kelas-${kelas.id}`}
                          checked={formData.kelasIds.includes(kelas.id)}
                          onCheckedChange={() => toggleKelas(kelas.id)}
                        />
                        <label
                          htmlFor={`kelas-${kelas.id}`}
                          className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                        >
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {kelas.nama}
                          <span className="text-xs text-muted-foreground">(Tingkat {kelas.tingkat})</span>
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {formData.kelasIds.length > 0 && (
                  <p className="text-xs text-primary">
                    {formData.kelasIds.length} kelas dipilih
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={formData.mapelIds.length === 0 || formData.kelasIds.length === 0}>
                {editingGuru ? "Perbarui" : "Tambah"} Guru
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationModal
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ open, guru: null })}
        onConfirm={handleDelete}
        title="Hapus Guru"
        description="Apakah Anda yakin ingin menghapus guru"
        itemName={deleteModal.guru?.nama}
      />
    </div>
  );
}
