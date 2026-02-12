"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { useSiswa, useKelas } from "@/hooks/useSWR";
import { LoadingSpinner, ErrorState } from "@/components/ui/loading-spinner";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";

export default function SiswaPage() {
  const [selectedKelas, setSelectedKelas] = useState<string>("all");
  const { data: siswaData, isLoading: siswaLoading, mutate } = useSiswa(selectedKelas);
  const { data: kelasData, isLoading: kelasLoading } = useKelas();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; siswa: any | null }>({
    open: false,
    siswa: null,
  });
  const [importDialog, setImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [formData, setFormData] = useState({
    nis: "",
    nisn: "",
    nama: "",
    kelasId: "",
    jenisKelamin: "L",
    tanggalLahir: "",
    alamat: "",
    noTelp: "",
    namaWali: "",
    noTelpWali: "",
  });

  if (siswaLoading || kelasLoading) {
    return <LoadingSpinner />;
  }

  const siswa = (siswaData as any)?.data || [];
  const kelasList = (kelasData as any)?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingSiswa ? 'PUT' : 'POST';
      const payload = editingSiswa ? { id: editingSiswa.id, ...formData } : formData;
      
      const response = await fetch('/api/siswa', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toast.success(result.message || (editingSiswa ? "Data siswa berhasil diperbarui" : "Siswa berhasil ditambahkan"));
        mutate();
        setIsDialogOpen(false);
        resetForm();
      } else {
        toast.error(result.error || "Gagal menyimpan data siswa");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleEdit = (s: any) => {
    setEditingSiswa(s);
    setFormData({
      nis: s.nis || "",
      nisn: s.nisn || "",
      nama: s.nama || "",
      kelasId: s.kelasId || "",
      jenisKelamin: s.jenisKelamin || "L",
      tanggalLahir: s.tanggalLahir ? new Date(s.tanggalLahir).toISOString().split('T')[0] : "",
      alamat: s.alamat || "",
      noTelp: s.noTelp || "",
      namaWali: s.namaWali || "",
      noTelpWali: s.noTelpWali || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteModal.siswa) return;
    
    try {
      const response = await fetch(`/api/siswa?id=${deleteModal.siswa.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Siswa berhasil dihapus");
        mutate();
        setDeleteModal({ open: false, siswa: null });
      } else {
        toast.error("Gagal menghapus siswa");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const openDeleteModal = (siswa: any) => {
    setDeleteModal({ open: true, siswa });
  };

  const resetForm = () => {
    setFormData({
      nis: "",
      nisn: "",
      nama: "",
      kelasId: "",
      jenisKelamin: "L",
      tanggalLahir: "",
      alamat: "",
      noTelp: "",
      namaWali: "",
      noTelpWali: "",
    });
    setEditingSiswa(null);
  };

  const filteredSiswa = siswa.filter((s: any) =>
    s.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nis?.includes(searchQuery) ||
    s.nisn?.includes(searchQuery)
  );

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/siswa/template');
      if (!response.ok) {
        toast.error('Gagal mengunduh template');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Template_Import_Siswa.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template berhasil diunduh');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Terjadi kesalahan saat mengunduh template');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Pilih file terlebih dahulu');
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch('/api/admin/siswa/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setImportResults(result.data);
        toast.success(result.message);
        mutate();
        if (result.data.failed === 0) {
          setImportDialog(false);
          setImportFile(null);
        }
      } else {
        toast.error(result.error || 'Gagal mengimport data');
        if (result.data) {
          setImportResults(result.data);
        }
      }
    } catch (error) {
      console.error('Error importing:', error);
      toast.error('Terjadi kesalahan saat import');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Siswa</h1>
          <p className="text-muted-foreground">Kelola data siswa sekolah</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleDownloadTemplate}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setImportDialog(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Siswa
          </Button>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Siswa
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa</CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari siswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedKelas} onValueChange={setSelectedKelas}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {kelasList.map((k: any) => (
                  <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIS</TableHead>
                <TableHead>NISN</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Jenis Kelamin</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSiswa.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Tidak ada data siswa
                  </TableCell>
                </TableRow>
              ) : (
                filteredSiswa.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.nis}</TableCell>
                    <TableCell>{s.nisn}</TableCell>
                    <TableCell className="font-medium">{s.nama}</TableCell>
                    <TableCell>{s.kelas?.nama || '-'}</TableCell>
                    <TableCell>{s.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteModal(s)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSiswa ? "Edit Siswa" : "Tambah Siswa Baru"}</DialogTitle>
            <DialogDescription>
              {editingSiswa ? "Perbarui data siswa" : "Tambahkan siswa baru ke sistem"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nis">NIS *</Label>
                <Input
                  id="nis"
                  value={formData.nis}
                  onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nisn">NISN *</Label>
                <Input
                  id="nisn"
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
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

            <div className="space-y-2">
              <Label htmlFor="kelasId">Kelas *</Label>
              <Select value={formData.kelasId} onValueChange={(value) => setFormData({ ...formData, kelasId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {kelasList.map((k: any) => (
                    <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jenisKelamin">Jenis Kelamin *</Label>
                <Select value={formData.jenisKelamin} onValueChange={(value) => setFormData({ ...formData, jenisKelamin: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                <Input
                  id="tanggalLahir"
                  type="date"
                  value={formData.tanggalLahir}
                  onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="noTelp">No. Telepon</Label>
                <Input
                  id="noTelp"
                  value={formData.noTelp}
                  onChange={(e) => setFormData({ ...formData, noTelp: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="namaWali">Nama Wali</Label>
                <Input
                  id="namaWali"
                  value={formData.namaWali}
                  onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="noTelpWali">No. Telepon Wali</Label>
              <Input
                id="noTelpWali"
                value={formData.noTelpWali}
                onChange={(e) => setFormData({ ...formData, noTelpWali: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingSiswa ? "Perbarui" : "Tambah"} Siswa
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationModal
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ open, siswa: null })}
        onConfirm={handleDelete}
        title="Hapus Siswa"
        description="Apakah Anda yakin ingin menghapus siswa"
        itemName={deleteModal.siswa?.nama}
      />

      {/* Import Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Siswa dari Excel</DialogTitle>
            <DialogDescription>
              Upload file Excel yang berisi data siswa. Pastikan format sesuai dengan template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-file">File Excel (.xlsx atau .xls)</Label>
              <Input
                id="import-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImportFile(file);
                    setImportResults(null);
                  }
                }}
                disabled={isImporting}
              />
              <p className="text-xs text-muted-foreground">
                Format file harus sesuai dengan template. Download template terlebih dahulu jika belum punya.
              </p>
            </div>

            {importResults && (
              <div className="space-y-2 p-4 border rounded-lg">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-600">
                      Berhasil: {importResults.success}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-600">
                      Gagal: {importResults.failed}
                    </p>
                  </div>
                </div>
                {importResults.errors.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    <p className="text-xs font-medium mb-1">Detail Error:</p>
                    <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                      {importResults.errors.slice(0, 10).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {importResults.errors.length > 10 && (
                        <li className="text-muted-foreground">
                          ... dan {importResults.errors.length - 10} error lainnya
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setImportDialog(false);
                  setImportFile(null);
                  setImportResults(null);
                }}
                disabled={isImporting}
              >
                Tutup
              </Button>
              <Button 
                onClick={handleImport}
                disabled={!importFile || isImporting}
              >
                {isImporting ? 'Mengimport...' : 'Import'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
