"use client";


import { fetchApi } from '@/lib/fetch-api';
import { fetcherWithAuth } from '@/lib/swr-config';
import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TiptapEditorWithToolbar } from "@/components/tiptap";
import { TimePickerIndonesia } from "@/components/ui/time-picker-indonesia";
import { ArrowLeft, Shuffle, Eye, EyeClosed } from "@phosphor-icons/react";
import { toast } from "sonner";

interface ExamInfo {
  judul: string;
  deskripsi: string;
  kelas: string[];
  mapelId: string;
  startUjian: Date;
  endUjian: Date;
  shuffleQuestions: boolean;
  showScore: boolean;
}

export default function CreateUjianPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  const [examInfo, setExamInfo] = useState<ExamInfo>({
    judul: "",
    deskripsi: "",
    kelas: [],
    mapelId: "",
    startUjian: new Date(),
    endUjian: new Date(Date.now() + 90 * 60000),
    shuffleQuestions: false,
    showScore: true,
  });

  const { data, error, isLoading } = useSWR('/api/guru/ujian?status=all', fetcherWithAuth);

  const handleKelasToggle = (kelas: string) => {
    setExamInfo(prev => ({
      ...prev,
      kelas: prev.kelas.includes(kelas)
        ? prev.kelas.filter(k => k !== kelas)
        : [...prev.kelas, kelas]
    }));
  };

  const handleCreate = async () => {
    // Validate
    if (!examInfo.judul || examInfo.kelas.length === 0 || !examInfo.mapelId) {
      toast.error("Mohon lengkapi informasi ujian dan pilih minimal 1 kelas");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetchApi('/api/guru/ujian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...examInfo,
          status: "draft",
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Ujian berhasil dibuat. Silakan tambahkan soal.");
        // Redirect ke halaman edit untuk tambah soal
        router.push(`/guru/ujian/${result.data.id}/edit`);
      } else {
        toast.error(result.error || "Gagal membuat ujian");
      }
    } catch (error) {
      console.error('Error creating ujian:', error);
      toast.error("Terjadi kesalahan saat membuat ujian");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Gagal memuat data</p>
      </div>
    );
  }

  const kelasList = data?.data?.kelasList || [];
  const mapelList = data?.data?.mapelList || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/guru/ujian")}
          >
            <ArrowLeft className="w-5 h-5" weight="bold" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Buat Ujian Baru</h1>
            <p className="text-sm text-muted-foreground">
              Isi informasi dasar ujian, lalu tambahkan soal di halaman berikutnya
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/guru/ujian")}
          >
            Batal
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isSaving}
          >
            {isSaving ? "Membuat..." : "Buat Ujian & Tambah Soal"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Ujian</CardTitle>
          <CardDescription>
            Atur detail dan konfigurasi ujian
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="judul">Judul Ujian</Label>
            <Input
              id="judul"
              value={examInfo.judul}
              onChange={(e) => setExamInfo({ ...examInfo, judul: e.target.value })}
              placeholder="Contoh: Ulangan Harian Matematika Bab 3"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <TiptapEditorWithToolbar
              onChange={(html) => setExamInfo({ ...examInfo, deskripsi: html })}
              content={examInfo.deskripsi}
              placeholder="Deskripsi singkat tentang ujian"
            />
          </div>

          <div className="space-y-2">
            <Label>Kelas (Pilih satu atau lebih)</Label>
            <div className="grid grid-cols-3 gap-3 p-4 border rounded-lg">
              {kelasList.map((kelas: any) => (
                <div key={kelas.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`create-kelas-${kelas.id}`}
                    checked={examInfo.kelas.includes(kelas.nama)}
                    onCheckedChange={() => handleKelasToggle(kelas.nama)}
                  />
                  <label
                    htmlFor={`create-kelas-${kelas.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {kelas.nama}
                  </label>
                </div>
              ))}
            </div>
            {examInfo.kelas.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Dipilih: {examInfo.kelas.join(", ")}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mapel">Mata Pelajaran</Label>
              <Select
                value={examInfo.mapelId}
                onValueChange={(value) => setExamInfo({ ...examInfo, mapelId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Mata Pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  {mapelList.map((mapel: any) => (
                    <SelectItem key={mapel.id} value={mapel.id}>
                      {mapel.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startUjian">Waktu Mulai Ujian</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="startDate" className="text-xs text-muted-foreground">Tanggal</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={(() => {
                        const d = new Date(examInfo.startUjian);
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })()}
                      onChange={(e) => {
                        if (e.target.value) {
                          const dateStr = e.target.value;
                          const timeStr = (() => {
                            const d = new Date(examInfo.startUjian);
                            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                          })();
                          const newDate = new Date(`${dateStr}T${timeStr}`);
                          setExamInfo({ ...examInfo, startUjian: newDate });
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <TimePickerIndonesia
                      value={examInfo.startUjian}
                      onChange={(date) => {
                        setExamInfo({ ...examInfo, startUjian: date });
                      }}
                      placeholder="08:00"
                      label="Waktu (24 jam)"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Format waktu: 24 jam (00:00 - 23:59). Contoh: 14:00 untuk jam 2 siang
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endUjian">Waktu Akhir Ujian</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="endDate" className="text-xs text-muted-foreground">Tanggal</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={(() => {
                        const d = new Date(examInfo.endUjian);
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })()}
                      onChange={(e) => {
                        if (e.target.value) {
                          const dateStr = e.target.value;
                          const timeStr = (() => {
                            const d = new Date(examInfo.endUjian);
                            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                          })();
                          const newDate = new Date(`${dateStr}T${timeStr}`);
                          setExamInfo({ ...examInfo, endUjian: newDate });
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <TimePickerIndonesia
                      value={examInfo.endUjian}
                      onChange={(date) => {
                        setExamInfo({ ...examInfo, endUjian: date });
                      }}
                      placeholder="09:00"
                      label="Waktu (24 jam)"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Format waktu: 24 jam (00:00 - 23:59). Durasi akan dihitung otomatis.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Pengaturan Ujian</h3>
            
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <Shuffle className="w-5 h-5 text-purple-600" weight="duotone" />
                </div>
                <div>
                  <Label htmlFor="shuffle" className="font-medium">Acak Urutan Soal</Label>
                  <p className="text-sm text-muted-foreground">
                    Soal akan ditampilkan secara acak untuk setiap siswa
                  </p>
                </div>
              </div>
              <Switch
                id="shuffle"
                checked={examInfo.shuffleQuestions}
                onCheckedChange={(checked) => setExamInfo({ ...examInfo, shuffleQuestions: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  {examInfo.showScore ? (
                    <Eye className="w-5 h-5 text-green-600" weight="duotone" />
                  ) : (
                    <EyeClosed className="w-5 h-5 text-gray-600" weight="duotone" />
                  )}
                </div>
                <div>
                  <Label htmlFor="showScore" className="font-medium">Tampilkan Nilai ke Siswa</Label>
                  <p className="text-sm text-muted-foreground">
                    Siswa dapat melihat nilai setelah menyelesaikan ujian
                  </p>
                </div>
              </div>
              <Switch
                id="showScore"
                checked={examInfo.showScore}
                onCheckedChange={(checked) => setExamInfo({ ...examInfo, showScore: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
