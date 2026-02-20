"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MathRenderer } from "@/components/ui/math-renderer";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, PencilSimple, ListChecks, Article, TextT, ArrowsLeftRight, CheckCircle, Eye, EyeSlash, Clock, Exam, Printer, Export } from "@phosphor-icons/react";
import { Calendar as CalendarIcon } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { fetcherWithAuth } from "@/lib/swr-config";
import { TIPE_SOAL_LABELS } from "@/types/soal";
import { PencocokanPreview } from "@/components/soal/PencocokanPreview";
import type { PilihanGandaData, EssayData, IsianSingkatData, PencocokanData, BenarSalahData } from "@/types/soal";


const TIPE_ICON: Record<string, React.ReactNode> = {
  PILIHAN_GANDA: <ListChecks className="w-4 h-4" weight="duotone" />,
  ESSAY: <Article className="w-4 h-4" weight="duotone" />,
  ISIAN_SINGKAT: <TextT className="w-4 h-4" weight="duotone" />,
  PENCOCOKAN: <ArrowsLeftRight className="w-4 h-4" weight="duotone" />,
  BENAR_SALAH: <CheckCircle className="w-4 h-4" weight="duotone" />,
};

/**
 * Student-style soal preview with optional answer key overlay.
 * This renders each soal type exactly as students will see it during the exam,
 * with a green overlay showing the correct answer when showKey is true.
 */
function SoalStudentPreview({ soal, showKey }: { soal: any; showKey: boolean }) {
  const data = soal.data;

  switch (soal.tipe) {
    case 'PILIHAN_GANDA': {
      const pgData = data as PilihanGandaData;
      return (
        <div className="space-y-2">
          {pgData.opsi?.map((opsi) => {
            const isAnswer = pgData.kunciJawaban === opsi.label;
            return (
              <div
                key={opsi.label}
                className={cn(
                  "flex items-start gap-3 p-3 sm:p-4 border rounded-lg transition-colors",
                  showKey && isAnswer
                    ? "bg-green-50 border-green-400 ring-2 ring-green-200"
                    : "bg-white border-gray-200 hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center",
                  showKey && isAnswer
                    ? "border-green-500 bg-green-500"
                    : "border-gray-300"
                )}>
                  {showKey && isAnswer && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <span className={cn(
                    "font-semibold text-sm",
                    showKey && isAnswer ? "text-green-700" : "text-gray-700"
                  )}>{opsi.label}.</span>
                  <MathRenderer content={opsi.text || ""} className={cn(
                    "text-sm",
                    showKey && isAnswer ? "text-green-900" : "text-gray-700"
                  )} />
                </div>
                {showKey && isAnswer && (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" weight="fill" />
                )}
              </div>
            );
          })}
        </div>
      );
    }

    case 'ESSAY': {
      const essayData = data as EssayData;
      return (
        <div className="space-y-3">
          {/* Student view: textarea placeholder */}
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50/50">
            <p className="text-sm text-muted-foreground italic">Siswa akan menulis jawaban di sini...</p>
            <div className="mt-2 h-20 bg-white border border-gray-200 rounded-md" />
          </div>
          {/* Answer key overlay */}
          {showKey && essayData.kunciJawaban && (
            <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle className="w-4 h-4 text-green-600" weight="fill" />
                <p className="text-xs font-semibold text-green-700">Kunci Jawaban</p>
              </div>
              <MathRenderer content={essayData.kunciJawaban} className="text-sm text-green-900" />
            </div>
          )}
        </div>
      );
    }

    case 'ISIAN_SINGKAT': {
      const isianData = data as IsianSingkatData;
      return (
        <div className="space-y-3">
          {/* Student view: input field */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-10 bg-white border border-gray-300 rounded-md px-3 flex items-center">
              <span className="text-sm text-muted-foreground italic">Ketik jawaban singkat...</span>
            </div>
          </div>
          {/* Answer key overlay */}
          {showKey && (
            <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle className="w-4 h-4 text-green-600" weight="fill" />
                <p className="text-xs font-semibold text-green-700">
                  Jawaban yang Diterima {isianData.caseSensitive ? "(Case Sensitive)" : "(Case Insensitive)"}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {isianData.kunciJawaban?.map((jawaban, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                    {jawaban || "(kosong)"}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    case 'BENAR_SALAH': {
      const bsData = data as BenarSalahData;
      return (
        <div className="space-y-3">
          {/* Student view: two buttons */}
          <div className="flex gap-3">
            <div className={cn(
              "flex-1 p-4 rounded-lg border-2 text-center font-semibold transition-colors cursor-default",
              showKey && bsData.kunciJawaban === true
                ? "bg-green-50 border-green-400 text-green-700 ring-2 ring-green-200"
                : "bg-white border-gray-200 text-gray-700 hover:bg-muted/50"
            )}>
              <div className="flex items-center justify-center gap-2">
                {showKey && bsData.kunciJawaban === true && (
                  <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
                )}
                <span>Benar</span>
              </div>
            </div>
            <div className={cn(
              "flex-1 p-4 rounded-lg border-2 text-center font-semibold transition-colors cursor-default",
              showKey && bsData.kunciJawaban === false
                ? "bg-green-50 border-green-400 text-green-700 ring-2 ring-green-200"
                : "bg-white border-gray-200 text-gray-700 hover:bg-muted/50"
            )}>
              <div className="flex items-center justify-center gap-2">
                {showKey && bsData.kunciJawaban === false && (
                  <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
                )}
                <span>Salah</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'PENCOCOKAN': {
      const pencocokanData = data as PencocokanData;
      return <PencocokanPreview data={pencocokanData} showKey={showKey} soalId={soal.id} />;
    }

    default:
      return <p className="text-sm text-muted-foreground">Tipe soal tidak dikenali</p>;
  }
}

export default function UjianDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isLoading: authLoading } = useAuth();
  const [showAnswerKey, setShowAnswerKey] = useState(true);

  const { data, error, isLoading } = useSWR(
    params.id ? `/api/guru/ujian/${params.id}` : null,
    fetcherWithAuth
  );

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Gagal memuat data ujian</p>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Ujian tidak ditemukan</p>
      </div>
    );
  }

  const ujian = data.data.ujian;
  const soalList = data.data.soal || [];
  const totalPoin = soalList.reduce((sum: number, s: any) => sum + (s.poin || 0), 0);
  const durationMinutes = Math.round((new Date(ujian.endUjian).getTime() - new Date(ujian.startUjian).getTime()) / 60000);

  // Count soal by type
  const soalByType: Record<string, number> = {};
  soalList.forEach((s: any) => {
    soalByType[s.tipe] = (soalByType[s.tipe] || 0) + 1;
  });

  const handleExportToBankSoal = async () => {
    if (soalList.length === 0) {
      toast.error("Tidak ada soal untuk di-export");
      return;
    }

    if (!confirm(`Export ${soalList.length} soal ke Bank Soal?`)) return;

    try {
      const res = await fetchApi('/api/guru/bank-soal/export-from-ujian', {
        method: 'POST',
        body: JSON.stringify({ 
          ujianId: params.id,
          deleteFromUjian: false,
          tags: [ujian.judul],
        }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error || "Gagal export soal");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/guru/ujian")}
          >
            <ArrowLeft className="w-5 h-5" weight="bold" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{ujian.judul}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
              <Badge variant="outline" className="text-xs">{typeof ujian.mapel === 'object' ? ujian.mapel?.nama : ujian.mapel}</Badge>
              <span>{ujian.kelas.join(", ")}</span>
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                ujian.status === "aktif" && "bg-green-100 text-green-700",
                ujian.status === "draft" && "bg-orange-100 text-orange-700",
                ujian.status === "selesai" && "bg-gray-100 text-gray-700"
              )}>
                {ujian.status === "aktif" ? "Aktif" : ujian.status === "draft" ? "Draft" : "Selesai"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 ml-14 sm:ml-0 flex-wrap">
          <Button variant="outline" onClick={handleExportToBankSoal}>
            <Export className="w-4 h-4 mr-2" weight="duotone" />
            Export ke Bank Soal
          </Button>
          <Button variant="outline" onClick={() => router.push(`/guru/ujian/${params.id}/print`)}>
            <Printer className="w-4 h-4 mr-2" weight="duotone" />
            Print
          </Button>
          <Button variant="outline" onClick={() => router.push(`/guru/ujian/${params.id}/nilai`)}>
            <Exam className="w-4 h-4 mr-2" weight="duotone" />
            Nilai
          </Button>
          <Button onClick={() => router.push(`/guru/ujian/${params.id}/edit`)}>
            <PencilSimple className="w-4 h-4 mr-2" weight="bold" />
            Edit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-blue-100">Jadwal</p>
                <p className="text-lg md:text-2xl font-bold text-white mt-1">
                  {format(new Date(ujian.startUjian), "dd MMM", { locale: id })}
                </p>
                <p className="text-xs text-blue-100 mt-1">
                  {format(new Date(ujian.startUjian), "HH:mm", { locale: id })} - {format(new Date(ujian.endUjian), "HH:mm", { locale: id })}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-white/20 rounded-lg hidden md:block">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-green-100">Durasi</p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1">{durationMinutes}</p>
                <p className="text-xs text-green-100 mt-1">menit</p>
              </div>
              <div className="p-2 md:p-3 bg-white/20 rounded-lg hidden md:block">
                <Clock className="w-6 h-6 text-white" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-orange-100">Total Soal</p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1">{soalList.length}</p>
                <p className="text-xs text-orange-100 mt-1 hidden md:block">
                  {Object.entries(soalByType).map(([tipe, count]) => (
                    `${count} ${TIPE_SOAL_LABELS[tipe as keyof typeof TIPE_SOAL_LABELS] || tipe}`
                  )).join(" • ")}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-white/20 rounded-lg hidden md:block">
                <ListChecks className="w-6 h-6 text-white" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-purple-100">Total Poin</p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1">{totalPoin}</p>
                <p className="text-xs text-purple-100 mt-1">
                  ~{soalList.length > 0 ? Math.round(totalPoin / soalList.length) : 0} poin/soal
                </p>
              </div>
              <div className="p-2 md:p-3 bg-white/20 rounded-lg hidden md:block">
                <Exam className="w-6 h-6 text-white" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {ujian.deskripsi && (
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Deskripsi Ujian</p>
            <MathRenderer content={ujian.deskripsi} className="text-sm leading-relaxed" />
          </CardContent>
        </Card>
      )}

      {/* Soal Preview - Student Style */}
      {soalList.length > 0 ? (
        <Card className="border shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-gray-700" weight="duotone" />
                <CardTitle className="text-gray-900">Preview Soal</CardTitle>
                <Badge variant="secondary" className="text-xs">{soalList.length} soal</Badge>
              </div>
              <Button
                variant={showAnswerKey ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className="gap-1.5"
              >
                {showAnswerKey ? (
                  <>
                    <EyeSlash className="w-4 h-4" weight="duotone" />
                    Sembunyikan Kunci
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" weight="duotone" />
                    Tampilkan Kunci
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tampilan ini sama persis dengan yang dilihat siswa saat ujian
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {soalList.map((soal: any, index: number) => (
              <div key={soal.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Question header */}
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm">
                      {soal.urutan || index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                          {TIPE_ICON[soal.tipe]}
                          {TIPE_SOAL_LABELS[soal.tipe as keyof typeof TIPE_SOAL_LABELS] || soal.tipe}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {soal.poin || 0} poin
                        </Badge>
                      </div>
                      <MathRenderer content={soal.pertanyaan || "(Belum ada pertanyaan)"} className="text-sm sm:text-base text-gray-900" />
                    </div>
                  </div>
                  {/* Answer area - student style */}
                  <div className="ml-12">
                    <SoalStudentPreview soal={soal} showKey={showAnswerKey} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="border shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ListChecks className="w-16 h-16 text-muted-foreground mb-4" weight="duotone" />
            <h3 className="text-lg font-semibold mb-2">Belum ada soal</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tambahkan soal melalui halaman edit ujian
            </p>
            <Button onClick={() => router.push(`/guru/ujian/${params.id}/edit`)}>
              <PencilSimple className="w-4 h-4 mr-2" weight="bold" />
              Edit & Tambah Soal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
