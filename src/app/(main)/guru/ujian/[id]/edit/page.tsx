"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import { useRouter, useParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TiptapEditorWithToolbar } from "@/components/tiptap";
import { TimePickerIndonesia } from "@/components/ui/time-picker-indonesia";
import { ArrowLeft, Exam, Shuffle, Eye, EyeClosed } from "@phosphor-icons/react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { nanoid } from 'nanoid';

// Import komponen soal
import { SoalItem } from "@/components/soal/SoalItem";
import { AddSoalDropdown } from "@/components/soal/AddSoalDropdown";
import { PilihanGandaForm } from "@/components/soal/PilihanGandaForm";
import { EssayForm } from "@/components/soal/EssayForm";
import { IsianSingkatForm } from "@/components/soal/IsianSingkatForm";
import { PencocokanForm } from "@/components/soal/PencocokanForm";
import { BenarSalahForm } from "@/components/soal/BenarSalahForm";

// Import types
import type { TipeSoal, Soal, SoalData, PilihanGandaData, EssayData, IsianSingkatData, PencocokanData, BenarSalahData, DEFAULT_POIN } from "@/types/soal";

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

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function EditUjianNewPage() {
  const router = useRouter();
  const params = useParams();
  const { isLoading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState("info");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Exam info state
  const [examInfo, setExamInfo] = useState<ExamInfo>({
    judul: "",
    deskripsi: "",
    kelas: [],
    mapelId: "",
    startUjian: new Date(),
    endUjian: new Date(),
    shuffleQuestions: false,
    showScore: true,
  });

  // Soal state (unified)
  const [soalList, setSoalList] = useState<Soal[]>([]);
  const [collapsedSoal, setCollapsedSoal] = useState<Set<string>>(new Set());

  // Debounce refs for soal updates
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Fetch exam data (includes ujian info)
  const { data: examData, error: examError } = useSWR(
    `/api/guru/ujian/${params.id}`,
    fetcher
  );

  // Fetch soal data (separate endpoint for CRUD operations)
  const { data: soalData, error: soalError, mutate: mutateSoal } = useSWR(
    `/api/guru/ujian/${params.id}/soal`,
    fetcher
  );

  // Fetch kelas & mapel for dropdowns
  const { data: kelasData } = useSWR('/api/kelas', fetcher);
  const { data: mapelData } = useSWR('/api/mapel', fetcher);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load exam data from API response: { data: { ujian: {...}, soal: [...] } }
  useEffect(() => {
    if (examData?.success && examData.data?.ujian) {
      const exam = examData.data.ujian;
      setExamInfo({
        judul: exam.judul || "",
        deskripsi: exam.deskripsi || "",
        kelas: Array.isArray(exam.kelas) ? exam.kelas : [],
        mapelId: exam.mapelId || "",
        startUjian: exam.startUjian ? new Date(exam.startUjian) : new Date(),
        endUjian: exam.endUjian ? new Date(exam.endUjian) : new Date(),
        shuffleQuestions: exam.shuffleQuestions || false,
        showScore: exam.showScore !== false,
      });
      setIsLoadingData(false);
    }
  }, [examData]);

  // Load soal data — skip if there are pending debounced updates (user is typing)
  useEffect(() => {
    if (soalData?.success && soalData.data) {
      const hasPendingUpdates = Object.keys(debounceTimers.current).length > 0;
      if (!hasPendingUpdates) {
        setSoalList(soalData.data);
      }
    }
  }, [soalData]);

  // Handle add soal
  const handleAddSoal = async (tipe: TipeSoal) => {
    const defaultData = getDefaultSoalData(tipe);
    const defaultPoin = getDefaultPoin(tipe);

    try {
      const response = await fetch(`/api/guru/ujian/${params.id}/soal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipe,
          pertanyaan: '',
          poin: defaultPoin,
          data: defaultData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await mutateSoal();
        toast.success('Soal berhasil ditambahkan');
        // Auto scroll to new soal
        setTimeout(() => {
          const element = document.getElementById(`soal-${result.data.id}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      } else {
        toast.error(result.error || 'Gagal menambahkan soal');
      }
    } catch (error) {
      console.error('Error adding soal:', error);
      toast.error('Terjadi kesalahan saat menambahkan soal');
    }
  };

  // Handle update soal — optimistic local update + debounced API call
  const handleUpdateSoal = useCallback((soalId: string, updates: Partial<Soal>) => {
    // 1. Update local state immediately for responsive UI
    setSoalList((prev) =>
      prev.map((s) => (s.id === soalId ? { ...s, ...updates } : s))
    );

    // 2. Debounce the API call (500ms)
    if (debounceTimers.current[soalId]) {
      clearTimeout(debounceTimers.current[soalId]);
    }

    debounceTimers.current[soalId] = setTimeout(async () => {
      try {
        const response = await fetch(`/api/guru/ujian/${params.id}/soal/${soalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        const result = await response.json();

        if (!result.success) {
          toast.error(result.error || 'Gagal mengupdate soal');
          await mutateSoal(); // Revert to server state on error
        }
      } catch (error) {
        console.error('Error updating soal:', error);
        toast.error('Terjadi kesalahan saat mengupdate soal');
        await mutateSoal(); // Revert to server state on error
      }
      delete debounceTimers.current[soalId];
    }, 500);
  }, [params.id, mutateSoal]);

  // Handle delete soal
  const handleDeleteSoal = async (soalId: string) => {
    if (soalList.length <= 1) {
      toast.error('Minimal harus ada 1 soal');
      return;
    }

    try {
      const response = await fetch(`/api/guru/ujian/${params.id}/soal/${soalId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await mutateSoal();
        toast.success('Soal berhasil dihapus');
      } else {
        toast.error(result.error || 'Gagal menghapus soal');
      }
    } catch (error) {
      console.error('Error deleting soal:', error);
      toast.error('Terjadi kesalahan saat menghapus soal');
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = soalList.findIndex((s) => s.id === active.id);
      const newIndex = soalList.findIndex((s) => s.id === over.id);

      const newSoalList = arrayMove(soalList, oldIndex, newIndex);
      setSoalList(newSoalList);

      // Update urutan di server
      try {
        const response = await fetch(`/api/guru/ujian/${params.id}/soal`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            soalIds: newSoalList.map((s) => s.id),
          }),
        });

        const result = await response.json();

        if (!result.success) {
          toast.error('Gagal mengupdate urutan soal');
          await mutateSoal(); // Revert
        }
      } catch (error) {
        console.error('Error reordering soal:', error);
        toast.error('Terjadi kesalahan saat mengupdate urutan');
        await mutateSoal(); // Revert
      }
    }
  };

  // Handle save exam info
  const handleSaveExamInfo = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/guru/ujian/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...examInfo,
          status: 'draft', // Save as draft
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Informasi ujian berhasil disimpan');
      } else {
        toast.error(result.error || 'Gagal menyimpan informasi ujian');
      }
    } catch (error) {
      console.error('Error saving exam info:', error);
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle publish
  const handlePublish = async () => {
    if (!examInfo.judul || !examInfo.mapelId || examInfo.kelas.length === 0) {
      toast.error('Mohon lengkapi informasi ujian');
      setActiveTab('info');
      return;
    }

    if (soalList.length === 0) {
      toast.error('Minimal harus ada 1 soal');
      setActiveTab('soal');
      return;
    }

    const currentTotalPoin = soalList.reduce((sum, soal) => sum + soal.poin, 0);
    if (currentTotalPoin !== 100) {
      toast.error(`Total poin harus 100. Saat ini: ${currentTotalPoin} poin`);
      setActiveTab('soal');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/guru/ujian/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...examInfo,
          status: 'aktif',
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Ujian berhasil dipublikasikan');
        router.push('/guru/ujian');
      } else {
        toast.error(result.error || 'Gagal mempublikasikan ujian');
      }
    } catch (error) {
      console.error('Error publishing exam:', error);
      toast.error('Terjadi kesalahan saat mempublikasikan');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle collapse
  const toggleCollapse = (soalId: string) => {
    setCollapsedSoal((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(soalId)) {
        newSet.delete(soalId);
      } else {
        newSet.add(soalId);
      }
      return newSet;
    });
  };

  // Collapse/Expand all
  const collapseAll = () => {
    setCollapsedSoal(new Set(soalList.map((s) => s.id)));
  };

  const expandAll = () => {
    setCollapsedSoal(new Set());
  };

  // Render soal form based on type
  const renderSoalForm = (soal: Soal) => {
    const handleChange = (pertanyaan: string, poin: number, data: SoalData) => {
      handleUpdateSoal(soal.id, { pertanyaan, poin, data });
    };

    switch (soal.tipe) {
      case 'PILIHAN_GANDA':
        return (
          <PilihanGandaForm
            pertanyaan={soal.pertanyaan}
            poin={soal.poin}
            data={soal.data as PilihanGandaData}
            onChange={handleChange}
          />
        );
      case 'ESSAY':
        return (
          <EssayForm
            pertanyaan={soal.pertanyaan}
            poin={soal.poin}
            data={soal.data as EssayData}
            onChange={handleChange}
          />
        );
      case 'ISIAN_SINGKAT':
        return (
          <IsianSingkatForm
            pertanyaan={soal.pertanyaan}
            poin={soal.poin}
            data={soal.data as IsianSingkatData}
            onChange={handleChange}
          />
        );
      case 'PENCOCOKAN':
        return (
          <PencocokanForm
            pertanyaan={soal.pertanyaan}
            poin={soal.poin}
            data={soal.data as PencocokanData}
            onChange={handleChange}
          />
        );
      case 'BENAR_SALAH':
        return (
          <BenarSalahForm
            pertanyaan={soal.pertanyaan}
            poin={soal.poin}
            data={soal.data as BenarSalahData}
            onChange={handleChange}
          />
        );
      default:
        return <div>Tipe soal tidak dikenali</div>;
    }
  };

  if (authLoading || isLoadingData) {
    return <LoadingSpinner />;
  }

  if (examError || soalError) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Gagal memuat data ujian</p>
      </div>
    );
  }

  const kelasList = kelasData?.data || [];
  const mapelList = mapelData?.data || [];

  // Helper function untuk toggle kelas
  const handleKelasToggle = (kelasNama: string) => {
    setExamInfo(prev => ({
      ...prev,
      kelas: prev.kelas.includes(kelasNama)
        ? prev.kelas.filter(k => k !== kelasNama)
        : [...prev.kelas, kelasNama]
    }));
  };

  // Calculate total soal and poin
  const totalSoal = soalList.length;
  const totalPoin = soalList.reduce((sum, soal) => sum + soal.poin, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/guru/ujian')}
          >
            <ArrowLeft className="w-5 h-5" weight="bold" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Ujian</h1>
            <p className="text-sm text-muted-foreground">
              {examInfo.judul || 'Untitled Exam'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveExamInfo} disabled={isSaving}>
            Simpan Draft
          </Button>
          <Button onClick={handlePublish} disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : 'Publikasikan'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">Informasi Ujian</TabsTrigger>
          <TabsTrigger value="soal">
            Soal ({soalList.length} soal, {totalPoin} poin)
          </TabsTrigger>
        </TabsList>

        {/* Tab: Informasi */}
        <TabsContent value="info" className="space-y-4">
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
                  placeholder="Contoh: Ulangan Harian Matematika Bab 3"
                  value={examInfo.judul}
                  onChange={(e) => setExamInfo({ ...examInfo, judul: e.target.value })}
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
                        id={`exam-kelas-${kelas.id}`}
                        checked={examInfo.kelas.includes(kelas.nama)}
                        onCheckedChange={() => handleKelasToggle(kelas.nama)}
                      />
                      <label
                        htmlFor={`exam-kelas-${kelas.id}`}
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
                          value={examInfo.startUjian ? (() => {
                            const d = new Date(examInfo.startUjian);
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                          })() : ""}
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
                          value={examInfo.endUjian ? (() => {
                            const d = new Date(examInfo.endUjian);
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                          })() : ""}
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

              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Soal</span>
                  <span className="text-lg font-bold">{totalSoal}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Total Poin</span>
                  <span className={cn("text-sm font-semibold", totalPoin === 100 ? "text-green-600" : "text-red-600")}>
                    {totalPoin}/100
                  </span>
                </div>
                {totalPoin !== 100 && (
                  <p className="text-xs text-red-500 mt-1">
                    Total poin harus tepat 100 untuk bisa dipublikasikan
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Soal */}
        <TabsContent value="soal" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Soal</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={collapseAll}>
                    Collapse All
                  </Button>
                  <Button variant="outline" size="sm" onClick={expandAll}>
                    Expand All
                  </Button>
                  <AddSoalDropdown onAddSoal={handleAddSoal} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {soalList.length === 0 ? (
                <div className="text-center py-12">
                  <Exam className="w-16 h-16 mx-auto text-gray-400 mb-4" weight="duotone" />
                  <p className="text-gray-600 mb-4">Belum ada soal</p>
                  <AddSoalDropdown onAddSoal={handleAddSoal} />
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={soalList.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {soalList.map((soal, index) => (
                      <div key={soal.id} id={`soal-${soal.id}`}>
                        <SoalItem
                          id={soal.id}
                          index={index}
                          tipe={soal.tipe}
                          isCollapsed={collapsedSoal.has(soal.id)}
                          onToggleCollapse={() => toggleCollapse(soal.id)}
                          onDelete={() => handleDeleteSoal(soal.id)}
                          canDelete={soalList.length > 1}
                        >
                          {renderSoalForm(soal)}
                        </SoalItem>
                      </div>
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions
function getDefaultSoalData(tipe: TipeSoal): SoalData {
  switch (tipe) {
    case 'PILIHAN_GANDA':
      return {
        opsi: [
          { label: 'A', text: '' },
          { label: 'B', text: '' },
          { label: 'C', text: '' },
          { label: 'D', text: '' },
        ],
        kunciJawaban: 'A',
      } as PilihanGandaData;
    case 'ESSAY':
      return {
        kunciJawaban: '',
        minKata: 0,
        maxKata: 1000,
      } as EssayData;
    case 'ISIAN_SINGKAT':
      return {
        kunciJawaban: [''],
        caseSensitive: false,
      } as IsianSingkatData;
    case 'PENCOCOKAN':
      return {
        itemKiri: [
          { id: nanoid(), text: '' },
          { id: nanoid(), text: '' },
        ],
        itemKanan: [
          { id: nanoid(), text: '' },
          { id: nanoid(), text: '' },
        ],
        jawaban: {},
      } as PencocokanData;
    case 'BENAR_SALAH':
      return {
        kunciJawaban: true,
      } as BenarSalahData;
    default:
      return {} as SoalData;
  }
}

function getDefaultPoin(tipe: TipeSoal): number {
  const defaults = {
    PILIHAN_GANDA: 1,
    ESSAY: 5,
    ISIAN_SINGKAT: 1,
    PENCOCOKAN: 3,
    BENAR_SALAH: 1,
  };
  return defaults[tipe] || 1;
}
