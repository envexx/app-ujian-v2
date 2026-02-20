"use client";


import { fetchApi } from '@/lib/fetch-api';
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Calendar, Lock, Eye, EyeOff, Camera, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSekolahInfo } from "@/hooks/useSWR";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ProfilePhotoCropper } from "@/components/profile-photo-cropper";

export default function AdminSettingsPage() {
  const { user, mutate: mutateAuth } = useAuth();
  const { data: sekolahData, isLoading: isLoadingSekolah, mutate: mutateSekolah } = useSekolahInfo();
  const sekolah = (sekolahData as any)?.data;

  // Tahun Ajaran form
  const [tahunAjaran, setTahunAjaran] = useState("");
  const [semester, setSemester] = useState("Ganjil");
  const [isSavingTA, setIsSavingTA] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  // Profile photo cropper
  const [cropperOpen, setCropperOpen] = useState(false);

  // Load tahun ajaran from sekolah data
  React.useEffect(() => {
    if (sekolah) {
      setTahunAjaran(sekolah.tahunAjaran || "");
      setSemester(sekolah.semester || "Ganjil");
    }
  }, [sekolah]);

  const adminEmail = user?.email || "-";
  const adminRole = user?.role || "ADMIN";
  const adminPhoto = user?.profile?.foto || null;
  const adminInitial = adminEmail.charAt(0).toUpperCase();

  const handleCroppedPhoto = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("file", blob, "profile.jpg");

    const res = await fetchApi("/api/auth/profile-photo", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const data = await res.json();
    if (data.success) {
      toast.success("Foto profil berhasil diupload");
      mutateAuth();
    } else {
      toast.error(data.error || "Gagal mengupload foto");
    }
  };

  const handleSaveTahunAjaran = async () => {
    if (!tahunAjaran) {
      toast.error("Tahun ajaran harus diisi");
      return;
    }

    setIsSavingTA(true);
    try {
      const method = sekolah?.id ? "PUT" : "POST";
      const payload = sekolah?.id
        ? { id: sekolah.id, tahunAjaran, semester }
        : { tahunAjaran, semester, namaSekolah: sekolah?.namaSekolah || "Sekolah", alamat: sekolah?.alamat || "-", noTelp: sekolah?.noTelp || "-", email: sekolah?.email || "-", namaKepsek: sekolah?.namaKepsek || "-", nipKepsek: sekolah?.nipKepsek || "-" };

      const res = await fetchApi("/api/sekolah-info", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Tahun ajaran berhasil disimpan");
        mutateSekolah();
      } else {
        toast.error(data.error || "Gagal menyimpan");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSavingTA(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Semua field password harus diisi");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Password baru tidak cocok");
      return;
    }

    setIsChangingPw(true);
    try {
      const res = await fetchApi("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Password berhasil diubah");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Gagal mengubah password");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsChangingPw(false);
    }
  };

  if (isLoadingSekolah) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Pengaturan</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Kelola informasi akun dan pengaturan sistem
        </p>
      </div>

      {/* Informasi Admin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informasi Admin
          </CardTitle>
          <CardDescription>
            Detail akun administrator yang sedang login
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Photo */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="w-20 h-20">
                <AvatarImage src={adminPhoto || undefined} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-[#0221CD] to-[#0221CD]/80 text-white text-xl">
                  {adminInitial}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setCropperOpen(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
            <div>
              <p className="font-medium">{adminEmail}</p>
              <p className="text-sm text-muted-foreground">{adminRole}</p>
              <button
                onClick={() => setCropperOpen(true)}
                className="text-xs text-primary hover:underline mt-1"
              >
                Ganti Foto Profil
              </button>
            </div>
          </div>

          <ProfilePhotoCropper
            open={cropperOpen}
            onOpenChange={setCropperOpen}
            onCropped={handleCroppedPhoto}
          />

          <Separator />

          {/* Email & Role Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input value={adminEmail} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                Role
              </Label>
              <Input value="Administrator" disabled className="bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tahun Ajaran */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Tahun Ajaran
          </CardTitle>
          <CardDescription>
            Pengaturan tahun ajaran dan semester aktif
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tahunAjaran">Tahun Ajaran *</Label>
              <Input
                id="tahunAjaran"
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                placeholder="2024/2025"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester *</Label>
              <select
                id="semester"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                required
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveTahunAjaran} disabled={isSavingTA}>
              <Save className="w-4 h-4 mr-2" />
              {isSavingTA ? "Menyimpan..." : "Simpan Tahun Ajaran"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ubah Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Ubah Password
          </CardTitle>
          <CardDescription>
            Ganti password akun Anda tanpa konfirmasi email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Password Saat Ini</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan password saat ini"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">Password tidak cocok</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isChangingPw || !currentPassword || !newPassword || newPassword !== confirmPassword}
              >
                {isChangingPw ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mengubah...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Ubah Password
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
