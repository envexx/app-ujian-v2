"use client";


import { fetchApi } from '@/lib/fetch-api';
import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Search,
  Plus,
  ToggleLeft,
  ToggleRight,
  Pencil,
  UserPlus,
  Eye,
  Building2,
  Users,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { superadminFetcher, superadminFetch } from '../_lib/fetcher';

interface SchoolFormData {
  nama: string;
  npsn: string;
  alamat: string;
  kota: string;
  provinsi: string;
  noTelp: string;
  email: string;
  website: string;
  jenjang: string;
  tierId: string;
}

const emptyForm: SchoolFormData = {
  nama: "",
  npsn: "",
  alamat: "",
  kota: "",
  provinsi: "",
  noTelp: "",
  email: "",
  website: "",
  jenjang: "",
  tierId: "",
};

interface AdminFormData {
  email: string;
  password: string;
  nama: string;
}

export default function SchoolsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const [formData, setFormData] = useState<SchoolFormData>(emptyForm);
  const [adminForm, setAdminForm] = useState<AdminFormData>({ email: "", password: "", nama: "" });
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryParams = new URLSearchParams({
    search,
    status: statusFilter,
    page: page.toString(),
    limit: "10",
  });

  const { data, isLoading, mutate } = useSWR(
    `/api/superadmin/schools?${queryParams}`,
    superadminFetcher,
    { revalidateOnFocus: false }
  );
  const { data: tiersData } = useSWR("/api/superadmin/tiers", superadminFetcher);

  const schools = data?.data || [];
  const tiers = tiersData?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, totalPages: 1 };

  // ---- CREATE ----
  const handleCreate = async () => {
    if (!formData.nama) {
      toast.error("Nama sekolah harus diisi");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetchApi("/api/superadmin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message);
        setShowCreateDialog(false);
        setFormData(emptyForm);
        mutate();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Gagal membuat sekolah");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- EDIT ----
  const openEdit = (school: any) => {
    setEditingSchoolId(school.id);
    setFormData({
      nama: school.nama || "",
      npsn: school.npsn || "",
      alamat: school.alamat || "",
      kota: school.kota || "",
      provinsi: school.provinsi || "",
      noTelp: school.noTelp || "",
      email: school.email || "",
      website: school.website || "",
      jenjang: school.jenjang || "",
      tierId: school.tierId || "",
    });
    setShowEditDialog(true);
  };

  const handleEdit = async () => {
    if (!editingSchoolId || !formData.nama) return;
    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/api/superadmin/schools/${editingSchoolId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message);
        setShowEditDialog(false);
        setEditingSchoolId(null);
        setFormData(emptyForm);
        mutate();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Gagal mengupdate sekolah");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- TOGGLE ACTIVE ----
  const handleToggle = async (schoolId: string) => {
    try {
      const res = await fetchApi(`/api/superadmin/schools/${schoolId}/toggle`, {
        method: "POST",
        credentials: "include",
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message);
        mutate();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  // ---- GENERATE ADMIN ----
  const openAdminDialog = (school: any) => {
    setSelectedSchool(school);
    setAdminForm({
      email: `admin@${school.nama.toLowerCase().replace(/\s+/g, "")}.sch.id`,
      password: Math.random().toString(36).slice(-10),
      nama: `Admin ${school.nama}`,
    });
    setShowAdminDialog(true);
  };

  const handleGenerateAdmin = async () => {
    if (!selectedSchool || !adminForm.email || !adminForm.password) return;
    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/api/superadmin/schools/${selectedSchool.id}/generate-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminForm),
        credentials: "include",
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message);
        // Show credentials
        toast.info(`Email: ${result.data.email}\nPassword: ${result.data.generatedPassword}`, {
          duration: 15000,
          description: "Simpan kredensial ini! Password tidak bisa dilihat lagi.",
        });
        setShowAdminDialog(false);
        mutate();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Gagal membuat akun admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- VIEW DETAIL ----
  const openDetail = async (schoolId: string) => {
    try {
      const res = await fetchApi(`/api/superadmin/schools/${schoolId}`, { credentials: "include" });
      const result = await res.json();
      if (result.success) {
        setSelectedSchool(result.data);
        setShowDetailDialog(true);
      }
    } catch {
      toast.error("Gagal mengambil detail");
    }
  };

  // ---- FORM COMPONENT ----
  const SchoolForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Nama Sekolah *</Label>
          <Input value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} placeholder="SMP Negeri 1 Jakarta" />
        </div>
        <div className="space-y-1.5">
          <Label>NPSN</Label>
          <Input value={formData.npsn} onChange={(e) => setFormData({ ...formData, npsn: e.target.value })} placeholder="20100001" />
        </div>
        <div className="space-y-1.5">
          <Label>Jenjang</Label>
          <Select value={formData.jenjang} onValueChange={(v) => setFormData({ ...formData, jenjang: v })}>
            <SelectTrigger><SelectValue placeholder="Pilih jenjang" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SD">SD</SelectItem>
              <SelectItem value="SMP">SMP</SelectItem>
              <SelectItem value="SMA">SMA</SelectItem>
              <SelectItem value="SMK">SMK</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Alamat</Label>
          <Input value={formData.alamat} onChange={(e) => setFormData({ ...formData, alamat: e.target.value })} placeholder="Jl. Pendidikan No. 1" />
        </div>
        <div className="space-y-1.5">
          <Label>Kota</Label>
          <Input value={formData.kota} onChange={(e) => setFormData({ ...formData, kota: e.target.value })} placeholder="Jakarta" />
        </div>
        <div className="space-y-1.5">
          <Label>Provinsi</Label>
          <Input value={formData.provinsi} onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })} placeholder="DKI Jakarta" />
        </div>
        <div className="space-y-1.5">
          <Label>No. Telp</Label>
          <Input value={formData.noTelp} onChange={(e) => setFormData({ ...formData, noTelp: e.target.value })} placeholder="021-12345678" />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="info@sekolah.sch.id" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Website</Label>
          <Input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://sekolah.sch.id" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Tier / Paket Langganan</Label>
          <Select value={formData.tierId} onValueChange={(v) => setFormData({ ...formData, tierId: v })}>
            <SelectTrigger><SelectValue placeholder="Pilih tier" /></SelectTrigger>
            <SelectContent>
              {tiers.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label} — Max {t.maxSiswa} siswa, {t.maxGuru} guru
                  {t.harga > 0 ? ` (Rp ${t.harga.toLocaleString("id-ID")}/bln)` : " (Gratis)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={onSubmit} disabled={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700">
        {isSubmitting ? "Menyimpan..." : submitLabel}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kelola Sekolah</h1>
        <Button onClick={() => { setFormData(emptyForm); setShowCreateDialog(true); }} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" /> Tambah Sekolah
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Cari sekolah..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Schools Table */}
      <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400 dark:text-slate-400">Memuat data...</div>
          ) : schools.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-slate-400">Tidak ada sekolah ditemukan</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400">
                    <th className="text-left p-3 font-medium">Sekolah</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">Kota</th>
                    <th className="text-center p-3 font-medium">Guru</th>
                    <th className="text-center p-3 font-medium">Siswa</th>
                    <th className="text-center p-3 font-medium hidden lg:table-cell">Ujian</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map((school: any) => (
                    <tr key={school.id} className="border-b border-gray-100 dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-800/30">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{school.nama}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            {school.jenjang || "-"} {school.npsn ? `· NPSN: ${school.npsn}` : ""}
                          </p>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell text-gray-500 dark:text-slate-400">{school.kota || "-"}</td>
                      <td className="p-3 text-center">{school._count?.guru || 0}</td>
                      <td className="p-3 text-center">{school._count?.siswa || 0}</td>
                      <td className="p-3 text-center hidden lg:table-cell">{school._count?.ujian || 0}</td>
                      <td className="p-3 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          school.isActive ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                        )}>
                          {school.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white" onClick={() => openDetail(school.id)} title="Detail">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white" onClick={() => openEdit(school)} title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400" onClick={() => openAdminDialog(school)} title="Generate Admin">
                            <UserPlus className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={cn("h-8 w-8", school.isActive ? "text-green-400 hover:text-red-400" : "text-red-400 hover:text-green-400")}
                            onClick={() => handleToggle(school.id)}
                            title={school.isActive ? "Nonaktifkan" : "Aktifkan"}
                          >
                            {school.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-800">
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {pagination.total} sekolah &middot; Halaman {pagination.page}/{pagination.totalPages}
              </p>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Sekolah Baru</DialogTitle>
            <DialogDescription>Isi data sekolah untuk mendaftarkan tenant baru</DialogDescription>
          </DialogHeader>
          <SchoolForm onSubmit={handleCreate} submitLabel="Buat Sekolah" />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Sekolah</DialogTitle>
            <DialogDescription>Perbarui data sekolah</DialogDescription>
          </DialogHeader>
          <SchoolForm onSubmit={handleEdit} submitLabel="Simpan Perubahan" />
        </DialogContent>
      </Dialog>

      {/* Generate Admin Dialog */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Akun Admin</DialogTitle>
            <DialogDescription>
              Buat akun admin untuk {selectedSchool?.nama}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email Admin</Label>
              <Input value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
              <p className="text-xs text-gray-500 dark:text-slate-400">Password akan ditampilkan sekali setelah dibuat</p>
            </div>
            <Button onClick={handleGenerateAdmin} disabled={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700">
              {isSubmitting ? "Membuat..." : "Buat Akun Admin"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSchool?.nama}</DialogTitle>
            <DialogDescription>Detail informasi sekolah</DialogDescription>
          </DialogHeader>
          {selectedSchool && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-slate-400 text-xs">NPSN</p>
                  <p className="font-medium">{selectedSchool.npsn || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400 text-xs">Jenjang</p>
                  <p className="font-medium">{selectedSchool.jenjang || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 dark:text-slate-400 text-xs">Alamat</p>
                  <p className="font-medium">{selectedSchool.alamat || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400 text-xs">Kota</p>
                  <p className="font-medium">{selectedSchool.kota || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400 text-xs">Provinsi</p>
                  <p className="font-medium">{selectedSchool.provinsi || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400 text-xs">Email</p>
                  <p className="font-medium">{selectedSchool.email || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400 text-xs">No. Telp</p>
                  <p className="font-medium">{selectedSchool.noTelp || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400 text-xs">Tier</p>
                  <p className="font-medium capitalize">{selectedSchool.tier?.label || "No Tier"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400 text-xs">Status</p>
                  <p className={cn("font-medium", selectedSchool.isActive ? "text-green-400" : "text-red-400")}>
                    {selectedSchool.isActive ? "Aktif" : "Nonaktif"}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Guru", value: selectedSchool._count?.guru || 0, max: selectedSchool.tier?.maxGuru },
                  { label: "Siswa", value: selectedSchool._count?.siswa || 0, max: selectedSchool.tier?.maxSiswa },
                  { label: "Kelas", value: selectedSchool._count?.kelas || 0 },
                  { label: "Ujian", value: selectedSchool._count?.ujian || 0 },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-100 dark:bg-slate-800 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {s.label}
                      {s.max ? ` / ${s.max}` : ""}
                    </p>
                  </div>
                ))}
              </div>

              {/* Admin accounts */}
              {selectedSchool.admins && selectedSchool.admins.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Akun Admin</p>
                  <div className="space-y-1.5">
                    {selectedSchool.admins.map((admin: any) => (
                      <div key={admin.id} className="flex items-center justify-between bg-gray-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm">
                        <span>{admin.email}</span>
                        <span className={cn("text-xs", admin.isActive ? "text-green-400" : "text-red-400")}>
                          {admin.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
