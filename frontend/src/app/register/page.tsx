"use client";


import { fetchApi } from '@/lib/fetch-api';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  School,
  UserPlus,
  Shield,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface TierInfo {
  id: string;
  nama: string;
  label: string;
  harga: number;
  maxSiswa: number;
  maxGuru: number;
  maxKelas: number;
  maxMapel: number;
  maxUjian: number;
  maxStorage: number;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [freeTier, setFreeTier] = useState<TierInfo | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  // Form data
  const [formData, setFormData] = useState({
    namaSekolah: "",
    npsn: "",
    jenjang: "",
    alamat: "",
    kota: "",
    provinsi: "",
    noTelp: "",
    emailSekolah: "",
    namaAdmin: "",
    emailAdmin: "",
    passwordAdmin: "",
    confirmPassword: "",
  });

  // Fetch free tier info
  useEffect(() => {
    fetchApi("/api/public/tiers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const trial = data.data.find(
            (t: TierInfo) => t.nama === "trial" || t.harga === 0
          );
          if (trial) {
            setFreeTier(trial);
          } else if (data.data.length > 0) {
            setFreeTier(data.data[0]);
          }
        }
      })
      .catch((err) => console.error("Error fetching tiers:", err));
  }, []);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.namaSekolah.trim()) {
      toast.error("Nama sekolah wajib diisi");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.namaAdmin.trim()) {
      toast.error("Nama admin wajib diisi");
      return false;
    }
    if (!formData.emailAdmin.trim()) {
      toast.error("Email admin wajib diisi");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailAdmin)) {
      toast.error("Format email tidak valid");
      return false;
    }
    if (formData.passwordAdmin.length < 6) {
      toast.error("Password minimal 6 karakter");
      return false;
    }
    if (formData.passwordAdmin !== formData.confirmPassword) {
      toast.error("Password dan konfirmasi password tidak cocok");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      const response = await fetchApi("/api/public/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaSekolah: formData.namaSekolah.trim(),
          npsn: formData.npsn.trim() || undefined,
          alamat: formData.alamat.trim() || undefined,
          kota: formData.kota.trim() || undefined,
          provinsi: formData.provinsi.trim() || undefined,
          jenjang: formData.jenjang || undefined,
          noTelp: formData.noTelp.trim() || undefined,
          emailSekolah: formData.emailSekolah.trim() || undefined,
          namaAdmin: formData.namaAdmin.trim(),
          emailAdmin: formData.emailAdmin.trim(),
          passwordAdmin: formData.passwordAdmin,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResultData(data.data);
        setIsSuccess(true);
        toast.success(data.message);
      } else {
        toast.error(data.error || "Gagal mendaftarkan sekolah");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen
  if (isSuccess && resultData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">
              Registrasi Berhasil!
            </CardTitle>
            <CardDescription className="text-base">
              Sekolah Anda telah berhasil didaftarkan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Sekolah</span>
                <span className="text-sm font-medium">{resultData.schoolName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email Admin</span>
                <span className="text-sm font-medium">{resultData.adminEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Paket</span>
                <span className="text-sm font-medium text-green-700">
                  {resultData.tier.label}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Batas Paket {resultData.tier.label}:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                <span>Maks. Siswa: {resultData.tier.maxSiswa}</span>
                <span>Maks. Guru: {resultData.tier.maxGuru}</span>
                <span>Maks. Kelas: {resultData.tier.maxKelas}</span>
                <span>Maks. Mapel: {resultData.tier.maxMapel}</span>
                <span>Maks. Ujian: {resultData.tier.maxUjian}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Langkah selanjutnya:</strong> Login dengan email dan password
                yang Anda daftarkan untuk mulai mengelola sekolah Anda.
              </p>
            </div>

            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-gradient-to-r from-[#1488cc] to-[#2b32b2] hover:opacity-90 text-white"
              size="lg"
            >
              Login Sekarang
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ddeeff] via-[#aaccff] to-[#88aaff] p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <GraduationCap className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Daftar Sekolah Baru</CardTitle>
          <CardDescription>
            {step === 1
              ? "Langkah 1/2 — Informasi Sekolah"
              : "Langkah 2/2 — Akun Administrator"}
          </CardDescription>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <School className="w-4 h-4" />
            </div>
            <div
              className={`w-12 h-0.5 ${step >= 2 ? "bg-primary" : "bg-muted"}`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <UserPlus className="w-4 h-4" />
            </div>
          </div>

          {/* Free tier badge */}
          {freeTier && (
            <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full mt-2">
              <Shield className="w-3 h-3" />
              Paket {freeTier.label} — Gratis
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {/* ========== STEP 1: School Info ========== */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="namaSekolah">
                    Nama Sekolah <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="namaSekolah"
                    placeholder="Contoh: SMP Negeri 1 Jakarta"
                    value={formData.namaSekolah}
                    onChange={(e) => updateField("namaSekolah", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="npsn">NPSN</Label>
                    <Input
                      id="npsn"
                      placeholder="8 digit"
                      value={formData.npsn}
                      onChange={(e) => updateField("npsn", e.target.value)}
                      maxLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jenjang">Jenjang</Label>
                    <Select
                      value={formData.jenjang}
                      onValueChange={(v) => updateField("jenjang", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenjang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SD">SD</SelectItem>
                        <SelectItem value="SMP">SMP</SelectItem>
                        <SelectItem value="SMA">SMA</SelectItem>
                        <SelectItem value="SMK">SMK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alamat">Alamat</Label>
                  <Input
                    id="alamat"
                    placeholder="Alamat lengkap sekolah"
                    value={formData.alamat}
                    onChange={(e) => updateField("alamat", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kota">Kota/Kabupaten</Label>
                    <Input
                      id="kota"
                      placeholder="Contoh: Jakarta Selatan"
                      value={formData.kota}
                      onChange={(e) => updateField("kota", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provinsi">Provinsi</Label>
                    <Input
                      id="provinsi"
                      placeholder="Contoh: DKI Jakarta"
                      value={formData.provinsi}
                      onChange={(e) => updateField("provinsi", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="noTelp">No. Telepon</Label>
                    <Input
                      id="noTelp"
                      placeholder="021-xxxxxxx"
                      value={formData.noTelp}
                      onChange={(e) => updateField("noTelp", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailSekolah">Email Sekolah</Label>
                    <Input
                      id="emailSekolah"
                      type="email"
                      placeholder="info@sekolah.sch.id"
                      value={formData.emailSekolah}
                      onChange={(e) => updateField("emailSekolah", e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-gradient-to-r from-[#1488cc] to-[#2b32b2] hover:opacity-90 text-white">
                  Lanjutkan
                </Button>
              </div>
            )}

            {/* ========== STEP 2: Admin Account ========== */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="namaAdmin">
                    Nama Administrator <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="namaAdmin"
                    placeholder="Nama lengkap admin sekolah"
                    value={formData.namaAdmin}
                    onChange={(e) => updateField("namaAdmin", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailAdmin">
                    Email Admin <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="emailAdmin"
                    type="email"
                    placeholder="admin@email.com"
                    value={formData.emailAdmin}
                    onChange={(e) => updateField("emailAdmin", e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Email ini akan digunakan untuk login sebagai admin sekolah
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordAdmin">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="passwordAdmin"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      value={formData.passwordAdmin}
                      onChange={(e) => updateField("passwordAdmin", e.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Ulangi password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Tier info box */}
                {freeTier && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-blue-800 mb-1.5">
                      Paket {freeTier.label} (Gratis):
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-xs text-blue-700">
                      <span>Maks. {freeTier.maxSiswa} Siswa</span>
                      <span>Maks. {freeTier.maxGuru} Guru</span>
                      <span>Maks. {freeTier.maxKelas} Kelas</span>
                      <span>Maks. {freeTier.maxMapel} Mapel</span>
                      <span>Maks. {freeTier.maxUjian} Ujian</span>
                      <span>Storage: {freeTier.maxStorage} MB</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-[#1488cc] to-[#2b32b2] hover:opacity-90 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mendaftar...
                      </>
                    ) : (
                      "Daftar Sekarang"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Footer links */}
            <div className="text-center mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <a
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Login di sini
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
