"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import { fetcherWithAuth } from "@/lib/swr-config";
import { fetchApi } from "@/lib/fetch-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { PilihanGandaForm } from "@/components/soal/PilihanGandaForm";
import { EssayForm } from "@/components/soal/EssayForm";
import { IsianSingkatForm } from "@/components/soal/IsianSingkatForm";
import { BenarSalahForm } from "@/components/soal/BenarSalahForm";
import { PencocokanForm } from "@/components/soal/PencocokanForm";

const TIPE_OPTIONS = [
  { value: "PILIHAN_GANDA", label: "Pilihan Ganda" },
  { value: "ESSAY", label: "Essay" },
  { value: "ISIAN_SINGKAT", label: "Isian Singkat" },
  { value: "BENAR_SALAH", label: "Benar/Salah" },
  { value: "PENCOCOKAN", label: "Pencocokan" },
];

export default function EditBankSoalPage() {
  const router = useRouter();
  const params = useParams();
  const soalId = params.id as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    mapelId: "",
    tipe: "PILIHAN_GANDA",
    pertanyaan: "",
    poin: 1,
    kelas: [] as string[],
    tags: [] as string[],
    data: {} as any,
  });
  const [tagInput, setTagInput] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: mapelData, isLoading: mapelLoading } = useSWR('/api/mapel', fetcherWithAuth);
  const { data: bankSoalData, isLoading: soalLoading } = useSWR(`/api/guru/bank-soal`, fetcherWithAuth);
  const { data: kelasData } = useSWR('/api/kelas', fetcherWithAuth);

  const mapelList = mapelData?.data || [];
  const kelasList = kelasData?.data || [];
  
  // Find the specific soal
  const soalList = bankSoalData?.data || [];
  const currentSoal = soalList.find((s: any) => s.id === soalId);

  useEffect(() => {
    if (currentSoal && !isInitialized) {
      setFormData({
        mapelId: currentSoal.mapelId || "",
        tipe: currentSoal.tipe || "PILIHAN_GANDA",
        pertanyaan: currentSoal.pertanyaan || "",
        poin: currentSoal.poin || 1,
        kelas: currentSoal.kelas || [],
        tags: currentSoal.tags || [],
        data: currentSoal.data || {},
      });
      setIsInitialized(true);
    }
  }, [currentSoal, isInitialized]);

  if (mapelLoading || soalLoading) return <LoadingSpinner />;

  if (!currentSoal && !soalLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Soal tidak ditemukan</p>
          <Link href="/guru/bank-soal">
            <Button variant="outline">Kembali ke Bank Soal</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleKelasChange = (kelasNama: string) => {
    setFormData(prev => ({
      ...prev,
      kelas: prev.kelas.includes(kelasNama)
        ? prev.kelas.filter(k => k !== kelasNama)
        : [...prev.kelas, kelasNama],
    }));
  };

  const handleFullChange = (pertanyaan: string, poin: number, data: any) => {
    setFormData(prev => ({ ...prev, pertanyaan, poin, data }));
  };

  const handleSubmit = async () => {
    if (!formData.mapelId) {
      toast.error("Pilih mata pelajaran");
      return;
    }
    if (!formData.pertanyaan.trim()) {
      toast.error("Pertanyaan wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/api/guru/bank-soal/${soalId}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        toast.success("Soal berhasil diperbarui");
        router.push('/guru/bank-soal');
      } else {
        toast.error(result.error || "Gagal memperbarui soal");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDefaultData = (tipe: string) => {
    switch (tipe) {
      case "PILIHAN_GANDA":
        return { opsi: [{ label: "A", text: "" }, { label: "B", text: "" }, { label: "C", text: "" }, { label: "D", text: "" }], kunciJawaban: "" };
      case "ESSAY":
        return { kunciJawaban: "", rubrik: "" };
      case "ISIAN_SINGKAT":
        return { kunciJawaban: [], caseSensitive: false };
      case "BENAR_SALAH":
        return { kunciJawaban: true };
      case "PENCOCOKAN":
        return { itemKiri: [], itemKanan: [], jawaban: {} };
      default:
        return {};
    }
  };

  const renderSoalForm = () => {
    const currentData = formData.data && Object.keys(formData.data).length > 0 
      ? formData.data 
      : getDefaultData(formData.tipe);

    const commonProps = {
      pertanyaan: formData.pertanyaan,
      poin: formData.poin,
      data: currentData,
      onChange: handleFullChange,
    };

    switch (formData.tipe) {
      case "PILIHAN_GANDA":
        return <PilihanGandaForm {...commonProps} />;
      case "ESSAY":
        return <EssayForm {...commonProps} />;
      case "ISIAN_SINGKAT":
        return <IsianSingkatForm {...commonProps} />;
      case "BENAR_SALAH":
        return <BenarSalahForm {...commonProps} />;
      case "PENCOCOKAN":
        return <PencocokanForm {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/guru/bank-soal">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Soal Bank Soal</h1>
          <p className="text-muted-foreground">
            Perbarui soal yang tersimpan di bank soal
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Soal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Mata Pelajaran *</Label>
                  <Select 
                    value={formData.mapelId} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, mapelId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Mapel" />
                    </SelectTrigger>
                    <SelectContent>
                      {mapelList.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>{m.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipe Soal *</Label>
                  <Select 
                    value={formData.tipe} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, tipe: v, data: {} }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Kelas Selection */}
              <div className="space-y-2">
                <Label>Kelas (opsional - kosongkan untuk semua kelas)</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30">
                  {kelasList.map((k: any) => (
                    <Button
                      key={k.id}
                      type="button"
                      variant={formData.kelas.includes(k.nama) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleKelasChange(k.nama)}
                      className="h-7 text-xs"
                    >
                      {k.nama}
                    </Button>
                  ))}
                </div>
                {formData.kelas.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Dipilih: {formData.kelas.join(", ")}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags (opsional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Tambah tag..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Soal Type Specific Form */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Soal</CardTitle>
            </CardHeader>
            <CardContent>
              {renderSoalForm()}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
              <Link href="/guru/bank-soal" className="block">
                <Button variant="outline" className="w-full">
                  Batal
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Perubahan akan langsung tersimpan</p>
              <p>• Soal yang sudah diimport ke ujian tidak akan terpengaruh</p>
              <p>• Pilih kelas jika soal hanya untuk kelas tertentu</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
