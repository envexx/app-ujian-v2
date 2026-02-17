"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, Eye, EyeOff, Camera, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ProfilePhotoCropper } from "@/components/profile-photo-cropper";

export default function GuruSettingsPage() {
  const { user, mutate: mutateAuth } = useAuth();

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

  const guruName = user?.profile?.nama || "Guru";
  const guruEmail = user?.profile?.email || user?.email || "-";
  const guruPhoto = user?.profile?.foto || null;
  const guruInitials = guruName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleCroppedPhoto = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("file", blob, "profile.jpg");
    const res = await fetch("/api/auth/profile-photo", { method: "POST", body: formData, credentials: "include" });
    const data = await res.json();
    if (data.success) { toast.success("Foto profil berhasil diupload"); mutateAuth(); }
    else { toast.error(data.error || "Gagal mengupload foto"); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error("Semua field password harus diisi"); return; }
    if (newPassword.length < 6) { toast.error("Password baru minimal 6 karakter"); return; }
    if (newPassword !== confirmPassword) { toast.error("Password baru tidak cocok"); return; }

    setIsChangingPw(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Password berhasil diubah"); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
      else { toast.error(data.error || "Gagal mengubah password"); }
    } catch { toast.error("Terjadi kesalahan"); }
    finally { setIsChangingPw(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola profil dan keamanan akun Anda</p>
      </div>

      {/* Profil Guru */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profil Guru
          </CardTitle>
          <CardDescription>Foto profil dan informasi akun Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="w-20 h-20">
                <AvatarImage src={guruPhoto || undefined} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-[#0221CD] to-[#0221CD]/80 text-white text-xl">
                  {guruInitials}
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
              <p className="font-medium">{guruName}</p>
              <p className="text-sm text-muted-foreground">{guruEmail}</p>
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
        </CardContent>
      </Card>

      {/* Ubah Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Ubah Password
          </CardTitle>
          <CardDescription>Ganti password akun Anda tanpa konfirmasi email</CardDescription>
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
                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
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
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
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
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">Password tidak cocok</p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isChangingPw || !currentPassword || !newPassword || newPassword !== confirmPassword}>
                {isChangingPw ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengubah...</>
                ) : (
                  <><Lock className="w-4 h-4 mr-2" />Ubah Password</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
