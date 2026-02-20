"use client";


import { fetchApi } from '@/lib/fetch-api';
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Pencil, Trash2, Plus, Clock } from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";

interface InfoMasuk {
  id: string;
  hari: string;
  jamMasuk: string;
  jamPulang: string;
}

export default function InfoMasukPage() {
  const [infoMasukList, setInfoMasukList] = useState<InfoMasuk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInfo, setEditingInfo] = useState<InfoMasuk | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; info: InfoMasuk | null }>({
    open: false,
    info: null,
  });
  const [formData, setFormData] = useState({
    hari: "",
    jamMasuk: "",
    jamPulang: "",
  });

  const hariList = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  useEffect(() => {
    fetchInfoMasuk();
  }, []);

  const fetchInfoMasuk = async () => {
    setIsLoading(true);
    try {
      const response = await fetchApi("/api/info-masuk");
      const result = await response.json();
      
      if (response.ok) {
        setInfoMasukList(result.data || []);
      } else {
        toast.error("Gagal memuat data info masuk");
      }
    } catch (error) {
      console.error("Error fetching info masuk:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      hari: "",
      jamMasuk: "",
      jamPulang: "",
    });
    setEditingInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi format waktu (HH:mm)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.jamMasuk)) {
      toast.error("Format jam masuk tidak valid. Gunakan format HH:mm (contoh: 07:00)");
      return;
    }
    if (!timeRegex.test(formData.jamPulang)) {
      toast.error("Format jam pulang tidak valid. Gunakan format HH:mm (contoh: 14:00)");
      return;
    }

    try {
      const response = await fetchApi("/api/info-masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || "Info masuk berhasil disimpan");
        fetchInfoMasuk();
        setIsDialogOpen(false);
        resetForm();
      } else {
        toast.error(result.error || "Gagal menyimpan info masuk");
      }
    } catch (error) {
      console.error("Error saving info masuk:", error);
      toast.error("Terjadi kesalahan saat menyimpan");
    }
  };

  const handleEdit = (info: InfoMasuk) => {
    setEditingInfo(info);
    setFormData({
      hari: info.hari,
      jamMasuk: info.jamMasuk,
      jamPulang: info.jamPulang,
    });
    setIsDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingInfo) return;

    // Validasi format waktu
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.jamMasuk)) {
      toast.error("Format jam masuk tidak valid. Gunakan format HH:mm (contoh: 07:00)");
      return;
    }
    if (!timeRegex.test(formData.jamPulang)) {
      toast.error("Format jam pulang tidak valid. Gunakan format HH:mm (contoh: 14:00)");
      return;
    }

    try {
      const response = await fetchApi("/api/info-masuk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingInfo.id,
          ...formData,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || "Info masuk berhasil diperbarui");
        fetchInfoMasuk();
        setIsDialogOpen(false);
        resetForm();
      } else {
        toast.error(result.error || "Gagal memperbarui info masuk");
      }
    } catch (error) {
      console.error("Error updating info masuk:", error);
      toast.error("Terjadi kesalahan saat memperbarui");
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.info) return;

    try {
      const response = await fetchApi(`/api/info-masuk?id=${deleteModal.info.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || "Info masuk berhasil dihapus");
        fetchInfoMasuk();
        setDeleteModal({ open: false, info: null });
      } else {
        toast.error(result.error || "Gagal menghapus info masuk");
      }
    } catch (error) {
      console.error("Error deleting info masuk:", error);
      toast.error("Terjadi kesalahan saat menghapus");
    }
  };

  const handleToggleActive = async (info: InfoMasuk) => {
    // Untuk toggle, kita bisa menghapus data jika ingin "menonaktifkan"
    // Atau bisa menambahkan field isActive di schema
    // Untuk sekarang, kita akan menghapus data jika ingin nonaktifkan
    setDeleteModal({ open: true, info });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Buat map untuk memudahkan pencarian
  const infoMasukMap = new Map(infoMasukList.map((info) => [info.hari, info]));

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Info Masuk & Pulang
          </h1>
          <p className="text-muted-foreground">
            Kelola jadwal jam masuk dan jam pulang untuk setiap hari
          </p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Info Masuk
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Jadwal Masuk & Pulang</CardTitle>
          <CardDescription>
            Atur jam masuk dan jam pulang untuk setiap hari dalam seminggu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hari</TableHead>
                <TableHead>Jam Masuk</TableHead>
                <TableHead>Jam Pulang</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hariList.map((hari) => {
                const info = infoMasukMap.get(hari);
                return (
                  <TableRow key={hari}>
                    <TableCell className="font-medium">{hari}</TableCell>
                    <TableCell>
                      {info ? (
                        <span className="font-mono">{info.jamMasuk}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Belum diatur</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {info ? (
                        <span className="font-mono">{info.jamPulang}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Belum diatur</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {info ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(info)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteModal({ open: true, info })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFormData({
                                hari: hari,
                                jamMasuk: "07:00",
                                jamPulang: "14:00",
                              });
                              setEditingInfo(null);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Tambah
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingInfo ? "Edit Info Masuk & Pulang" : "Tambah Info Masuk & Pulang"}
            </DialogTitle>
            <DialogDescription>
              {editingInfo
                ? "Ubah jadwal jam masuk dan jam pulang"
                : "Tambahkan jadwal jam masuk dan jam pulang untuk hari tertentu"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingInfo ? handleUpdate : handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hari">Hari</Label>
              <select
                id="hari"
                value={formData.hari}
                onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
                disabled={!!editingInfo}
              >
                <option value="">Pilih Hari</option>
                {hariList.map((hari) => (
                  <option key={hari} value={hari}>
                    {hari}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jamMasuk">Jam Masuk</Label>
              <Input
                id="jamMasuk"
                type="text"
                value={formData.jamMasuk}
                onChange={(e) => setFormData({ ...formData, jamMasuk: e.target.value })}
                required
                placeholder="07:00"
                pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
              />
              <p className="text-xs text-muted-foreground">
                Format: HH:mm (contoh: 07:00)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jamPulang">Jam Pulang</Label>
              <Input
                id="jamPulang"
                type="text"
                value={formData.jamPulang}
                onChange={(e) => setFormData({ ...formData, jamPulang: e.target.value })}
                required
                placeholder="14:00"
                pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
              />
              <p className="text-xs text-muted-foreground">
                Format: HH:mm (contoh: 14:00)
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Batal
              </Button>
              <Button type="submit">
                {editingInfo ? "Perbarui" : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ open, info: null })}
        onConfirm={handleDelete}
        title="Hapus Info Masuk & Pulang"
        description={`Apakah Anda yakin ingin menghapus jadwal untuk hari ${deleteModal.info?.hari}?`}
      />
    </div>
  );
}

