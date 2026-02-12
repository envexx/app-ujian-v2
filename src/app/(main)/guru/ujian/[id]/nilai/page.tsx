"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MathRenderer } from "@/components/ui/math-renderer";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTable } from "@/components/ui/data-table";
import { createNilaiColumns, NilaiSubmission } from "./columns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Download,
  ArrowsClockwise,
  CircleNotch,
  ChartBar,
  Users,
  CheckCircle,
  XCircle,
  FileText,
  Star,
  Warning,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// Helper function to strip HTML tags for clean display
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

// Soal type labels
const TIPE_LABELS: Record<string, string> = {
  PILIHAN_GANDA: 'PG',
  ESSAY: 'Essay',
  ISIAN_SINGKAT: 'Isian',
  PENCOCOKAN: 'Cocok',
  BENAR_SALAH: 'B/S',
};

const TIPE_FULL_LABELS: Record<string, string> = {
  PILIHAN_GANDA: 'Pilihan Ganda',
  ESSAY: 'Essay',
  ISIAN_SINGKAT: 'Isian Singkat',
  PENCOCOKAN: 'Pencocokan',
  BENAR_SALAH: 'Benar/Salah',
};

// Recursively unwrap nested { jawaban: ... } to get the actual value
function unwrapJawaban(val: any): any {
  let result = val;
  let depth = 0;
  while (result && typeof result === 'object' && result.jawaban !== undefined && depth < 5) {
    result = result.jawaban;
    depth++;
  }
  return result;
}

// Get short answer display for jawaban table
function getJawabanDisplay(soal: any, jawaban: any): { text: string; isCorrect: boolean | null } {
  if (!jawaban) return { text: '-', isCorrect: null };

  const jawabanData = jawaban.jawaban;
  const isCorrect = jawaban.isCorrect;

  switch (soal.tipe) {
    case 'PILIHAN_GANDA': {
      const selected = unwrapJawaban(jawabanData);
      return { text: typeof selected === 'string' ? selected : JSON.stringify(selected), isCorrect };
    }
    case 'BENAR_SALAH': {
      const val = unwrapJawaban(jawabanData);
      return { text: val === true ? 'Benar' : val === false ? 'Salah' : '-', isCorrect };
    }
    case 'ISIAN_SINGKAT': {
      const val = unwrapJawaban(jawabanData);
      return { text: typeof val === 'string' ? val : '-', isCorrect };
    }
    case 'ESSAY': {
      const val = unwrapJawaban(jawabanData);
      const text = typeof val === 'string' ? stripHtmlTags(val) : '-';
      return { text: text.length > 60 ? text.substring(0, 60) + '...' : text, isCorrect: null };
    }
    case 'PENCOCOKAN': {
      const mapping = unwrapJawaban(jawabanData);
      if (typeof mapping === 'object' && mapping !== null) {
        return { text: `${Object.keys(mapping).length} koneksi`, isCorrect };
      }
      return { text: '-', isCorrect };
    }
    default:
      return { text: '-', isCorrect: null };
  }
}

// Get answer key display for a soal
function getKunciDisplay(soal: any): string {
  const data = soal.data;
  switch (soal.tipe) {
    case 'PILIHAN_GANDA':
      return data?.kunciJawaban || '-';
    case 'BENAR_SALAH':
      return data?.kunciJawaban === true ? 'Benar' : 'Salah';
    case 'ISIAN_SINGKAT':
      return Array.isArray(data?.kunciJawaban) ? data.kunciJawaban.join(', ') : '-';
    case 'ESSAY':
      return data?.kunciJawaban ? stripHtmlTags(data.kunciJawaban).substring(0, 40) + '...' : '-';
    case 'PENCOCOKAN':
      return data?.jawaban ? `${Object.keys(data.jawaban).length} pasangan` : '-';
    default:
      return '-';
  }
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function UjianNilaiPage() {
  const router = useRouter();
  const params = useParams();
  const { isLoading: authLoading } = useAuth();
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [essayGrades, setEssayGrades] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("nilai");
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    params.id ? `/api/guru/ujian/${params.id}/nilai` : null,
    fetcher
  );

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Gagal memuat data nilai ujian</p>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Data tidak ditemukan</p>
      </div>
    );
  }

  const ujian = data.data.ujian;
  const soalList: any[] = data.data.soal || [];
  const submissions: any[] = data.data.submissions || [];

  // Filter essay soal for grading dialog
  const essaySoal = soalList.filter((s: any) => s.tipe === 'ESSAY');

  const handleGrade = (submission: any) => {
    if (submission.status === 'belum') {
      toast.error("Siswa belum mengerjakan ujian");
      return;
    }

    setSelectedSubmission(submission);

    // Initialize essay grades from existing jawaban
    const grades = essaySoal.map((soal: any) => {
      const existingJawaban = submission.jawaban?.find(
        (j: any) => j.soalId === soal.id
      );
      return {
        jawabanId: existingJawaban?.id || null,
        soalId: soal.id,
        nomor: soal.nomor,
        pertanyaan: soal.pertanyaan,
        poin: soal.poin,
        kunciJawaban: soal.data?.kunciJawaban || '',
        jawaban: existingJawaban?.jawaban,
        nilai: existingJawaban?.nilai ?? 0,
        feedback: existingJawaban?.feedback || '',
      };
    });

    setEssayGrades(grades);
    setIsGradingOpen(true);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const XLSX = await import('xlsx');

      const excelData = submissions.map((s: any) => ({
        'Nama Siswa': s.siswa,
        'NISN': s.nisn || '-',
        'Kelas': ujian.kelas?.join(', ') || '-',
        'Mata Pelajaran': ujian.mapel,
        'Tanggal Submit': s.submittedAt ? format(new Date(s.submittedAt), "dd MMM yyyy HH:mm", { locale: localeId }) : '-',
        'Nilai Otomatis': s.nilaiAuto ?? '-',
        'Nilai Essay': s.nilaiManual ?? '-',
        'Nilai Total': s.nilaiTotal ?? '-',
        'Status': s.status === 'sudah' ? 'Selesai' : s.status === 'perlu_dinilai' ? 'Perlu Dinilai' : 'Belum',
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      ws['!cols'] = [
        { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
        { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Nilai Siswa');
      const filename = `Nilai_${ujian.judul.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success('File Excel berhasil diunduh');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Gagal mengekspor ke Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRecalculateScores = async () => {
    setIsRecalculating(true);
    try {
      const response = await fetch(`/api/guru/ujian/${params.id}/nilai/recalculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (result.success) {
        await mutate();
        toast.success(`Berhasil menghitung ulang ${result.updated} nilai`);
      } else {
        toast.error(result.error || "Gagal menghitung ulang nilai");
      }
    } catch (error) {
      console.error('Error recalculating scores:', error);
      toast.error("Terjadi kesalahan saat menghitung ulang nilai");
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleSubmitGrades = async () => {
    if (!selectedSubmission?.id) {
      toast.error("Data submission tidak valid");
      return;
    }

    try {
      const response = await fetch(`/api/guru/ujian/${params.id}/nilai`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          grades: essayGrades.map(g => ({
            jawabanId: g.jawabanId,
            nilai: g.nilai,
            feedback: g.feedback,
          })),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await mutate();
        toast.success("Nilai berhasil disimpan");
        setIsGradingOpen(false);
        setSelectedSubmission(null);
      } else {
        toast.error(result.error || "Gagal menyimpan nilai");
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      toast.error("Terjadi kesalahan saat menyimpan nilai");
    }
  };

  const stats = {
    sudahMengerjakan: submissions.filter((s: any) => s.status !== 'belum').length,
    belumMengerjakan: submissions.filter((s: any) => s.status === 'belum').length,
    perluDinilai: submissions.filter((s: any) => s.status === 'perlu_dinilai').length,
  };

  const handleExportJawaban = () => {
    try {
      const exportData = submissions.map((s: any, idx: number) => {
        const row: any = {
          'No': idx + 1,
          'Nama Siswa': s.siswa,
          'NISN': s.nisn || '-',
        };

        soalList.forEach((soal: any) => {
          const jawaban = s.jawaban?.find((j: any) => j.soalId === soal.id);
          const display = getJawabanDisplay(soal, jawaban);
          row[`${TIPE_LABELS[soal.tipe] || soal.tipe}${soal.nomor}`] = display.text;
        });

        row['Nilai Total'] = s.nilaiTotal ?? '-';
        return row;
      });

      if (exportData.length === 0) {
        toast.error('Tidak ada data untuk diekspor');
        return;
      }

      const headers = Object.keys(exportData[0]);
      const csv = [
        headers.join(','),
        ...exportData.map((row: any) =>
          headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Jawaban_${ujian.judul.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      link.click();
      toast.success('File CSV berhasil diunduh');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Gagal mengekspor ke CSV');
    }
  };

  // Build soal type summary string
  const soalTypeSummary = Object.entries(ujian.soalByType || {})
    .map(([tipe, count]) => `${TIPE_FULL_LABELS[tipe] || tipe}: ${count}`)
    .join(' • ');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/guru/ujian")}
          className="hover:bg-gray-100 flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" weight="bold" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 truncate">{ujian.judul}</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">
            {ujian.kelas.join(", ")} • {ujian.mapel} • {
              ujian.startUjian ? (() => {
                try {
                  const date = new Date(ujian.startUjian);
                  if (!isNaN(date.getTime())) {
                    return format(date, "dd MMMM yyyy", { locale: localeId });
                  }
                  return "-";
                } catch {
                  return "-";
                }
              })() : "-"
            }
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-blue-100">Total Soal</p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1 md:mt-2">{ujian.totalSoal}</p>
                <p className="text-xs text-blue-100 mt-1 hidden md:block">{soalTypeSummary || '-'}</p>
              </div>
              <div className="p-2 md:p-3 bg-white/20 rounded-lg hidden md:block">
                <FileText className="w-6 h-6 text-white" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-green-100">Sudah</p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1 md:mt-2">{stats.sudahMengerjakan}</p>
                <p className="text-xs text-green-100 mt-1">Siswa</p>
              </div>
              <div className="p-2 md:p-3 bg-white/20 rounded-lg hidden md:block">
                <CheckCircle className="w-6 h-6 text-white" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-orange-100">
                  {stats.perluDinilai > 0 ? 'Perlu Dinilai' : 'Belum'}
                </p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1 md:mt-2">
                  {stats.perluDinilai > 0 ? stats.perluDinilai : stats.belumMengerjakan}
                </p>
                <p className="text-xs text-orange-100 mt-1">
                  {stats.perluDinilai > 0 ? 'Submission' : 'Siswa'}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-white/20 rounded-lg hidden md:block">
                {stats.perluDinilai > 0 ? (
                  <Warning className="w-6 h-6 text-white" weight="duotone" />
                ) : (
                  <XCircle className="w-6 h-6 text-white" weight="duotone" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-purple-100">Rata-rata</p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1 md:mt-2">
                  {submissions.filter((s: any) => s.nilaiTotal !== null).length > 0
                    ? Math.round(
                        submissions
                          .filter((s: any) => s.nilaiTotal !== null)
                          .reduce((sum: number, s: any) => sum + s.nilaiTotal, 0) /
                          submissions.filter((s: any) => s.nilaiTotal !== null).length
                      )
                    : '-'}
                </p>
                <p className="text-xs text-purple-100 mt-1 hidden md:block">
                  Total poin: {ujian.totalPoin} • {submissions.filter((s: any) => s.nilaiTotal !== null).length} siswa
                </p>
              </div>
              <div className="p-2 md:p-3 bg-white/20 rounded-lg hidden md:block">
                <ChartBar className="w-6 h-6 text-white" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="nilai">Daftar Nilai</TabsTrigger>
          <TabsTrigger value="jawaban">Jawaban Siswa</TabsTrigger>
        </TabsList>

        <TabsContent value="nilai">
          <Card className="border border-gray-300/30 shadow-lg">
            <CardHeader className="border-b border-gray-300/30">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" weight="duotone" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-lg md:text-xl truncate">Daftar Nilai Siswa</CardTitle>
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{submissions.length} siswa terdaftar</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    disabled={isExporting}
                    className="gap-1 md:gap-2 bg-white hover:bg-gray-50 border-gray-300 text-xs md:text-sm flex-1 md:flex-initial"
                  >
                    {isExporting ? (
                      <>
                        <CircleNotch className="w-4 h-4 animate-spin" />
                        Mengekspor...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export Excel
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRecalculateScores}
                    disabled={isRecalculating}
                    className="gap-1 md:gap-2 bg-white hover:bg-gray-50 border-gray-300 text-xs md:text-sm flex-1 md:flex-initial"
                  >
                    {isRecalculating ? (
                      <>
                        <CircleNotch className="w-4 h-4 animate-spin" />
                        Menghitung ulang...
                      </>
                    ) : (
                      <>
                        <ArrowsClockwise className="w-4 h-4" />
                        Refresh Nilai
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <DataTable
                columns={createNilaiColumns(handleGrade, ujian.hasManualSoal)}
                data={submissions as NilaiSubmission[]}
                searchKey="siswa"
                searchPlaceholder="Cari nama siswa..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jawaban">
          <Card className="border border-gray-300/30 shadow-lg">
            <CardHeader className="border-b border-gray-300/30">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <FileText className="w-4 h-4 md:w-5 md:h-5 text-purple-600" weight="duotone" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-lg md:text-xl truncate">Jawaban Semua Siswa</CardTitle>
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Detail jawaban untuk {submissions.length} siswa</p>
                  </div>
                </div>
                <Button onClick={handleExportJawaban} variant="outline" size="sm" className="gap-1 md:gap-2 bg-white hover:bg-gray-50 border-gray-300 text-xs md:text-sm w-full md:w-auto">
                  <Download className="w-4 h-4" weight="bold" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead className="min-w-[150px]">Nama Siswa</TableHead>
                      {soalList.map((soal: any) => (
                        <TableHead key={soal.id} className="text-center min-w-[80px]">
                          <div className="flex flex-col items-center gap-0.5">
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {TIPE_LABELS[soal.tipe] || soal.tipe}
                            </Badge>
                            <span className="text-xs">#{soal.nomor}</span>
                            <span className="text-[10px] text-muted-foreground">{soal.poin}pt</span>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center min-w-[80px]">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Answer key row */}
                    <TableRow className="bg-yellow-50">
                      <TableCell className="font-semibold text-xs">Kunci</TableCell>
                      <TableCell className="font-semibold text-xs">-</TableCell>
                      {soalList.map((soal: any) => (
                        <TableCell key={soal.id} className="text-center text-xs font-semibold text-green-700">
                          {getKunciDisplay(soal)}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold text-xs">{ujian.totalPoin}pt</TableCell>
                    </TableRow>
                    {/* Student rows */}
                    {submissions.map((s: any, idx: number) => (
                      <TableRow key={s.siswaId}>
                        <TableCell className="text-xs">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{s.siswa}</TableCell>
                        {soalList.map((soal: any) => {
                          const jawaban = s.jawaban?.find((j: any) => j.soalId === soal.id);
                          const display = getJawabanDisplay(soal, jawaban);
                          return (
                            <TableCell
                              key={soal.id}
                              className={`text-center text-xs ${
                                display.isCorrect === true ? 'bg-green-50 text-green-700 font-semibold' :
                                display.isCorrect === false ? 'bg-red-50 text-red-700' : ''
                              }`}
                            >
                              {display.text}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          {s.nilaiTotal !== null ? (
                            <span className="font-bold text-blue-600">{s.nilaiTotal}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Grading Dialog */}
      <Dialog open={isGradingOpen} onOpenChange={setIsGradingOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSubmission?.status === 'perlu_dinilai' ? 'Penilaian' : 'Detail Jawaban'} — {selectedSubmission?.siswa}
            </DialogTitle>
            <DialogDescription>
              {essaySoal.length > 0
                ? `${essaySoal.length} soal essay perlu dinilai manual`
                : 'Semua soal sudah dinilai otomatis'}
            </DialogDescription>
          </DialogHeader>

          {/* Auto-graded summary */}
          {selectedSubmission && (
            <div className="p-3 bg-gray-50 border rounded-lg space-y-2">
              <p className="text-sm font-semibold">Ringkasan Nilai</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Otomatis</p>
                  <p className="text-lg font-bold text-blue-600">{selectedSubmission.nilaiAuto ?? '-'}</p>
                </div>
                {selectedSubmission.nilaiManual !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Essay</p>
                    <p className="text-lg font-bold text-purple-600">{selectedSubmission.nilaiManual ?? '-'}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold text-green-600">{selectedSubmission.nilaiTotal ?? '-'}</p>
                </div>
              </div>
            </div>
          )}

          {/* All soal answers overview */}
          {selectedSubmission && soalList.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Jawaban Per Soal</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {soalList.filter(s => s.tipe !== 'ESSAY').map((soal: any) => {
                  const jawaban = selectedSubmission.jawaban?.find((j: any) => j.soalId === soal.id);
                  const display = getJawabanDisplay(soal, jawaban);
                  return (
                    <div key={soal.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                      display.isCorrect === true ? 'bg-green-50 border-green-200' :
                      display.isCorrect === false ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <Badge variant="outline" className="text-[10px] px-1 py-0 flex-shrink-0">
                        {TIPE_LABELS[soal.tipe]}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex-shrink-0">#{soal.nomor}</span>
                      <span className="flex-1 truncate font-medium">{display.text}</span>
                      {display.isCorrect === true && (
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" weight="fill" />
                      )}
                      {display.isCorrect === false && (
                        <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" weight="fill" />
                      )}
                      <span className="text-xs text-muted-foreground flex-shrink-0">{soal.poin}pt</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Essay grading section */}
          {essayGrades.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" weight="fill" />
                Penilaian Essay
              </p>
              {essayGrades.map((grade, index) => (
                <div key={grade.soalId} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Soal #{grade.nomor}</Badge>
                    <span className="text-xs text-muted-foreground">{grade.poin} poin</span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Pertanyaan:</p>
                    <MathRenderer content={grade.pertanyaan} className="text-sm" />
                  </div>

                  {grade.kunciJawaban && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs font-semibold text-green-700 mb-1">Kunci Jawaban:</p>
                      <MathRenderer content={typeof grade.kunciJawaban === 'string' ? grade.kunciJawaban : ''} className="text-sm text-green-900" />
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Jawaban Siswa:</p>
                    {(() => {
                      const jawabanText = unwrapJawaban(grade.jawaban);
                      if (!jawabanText) return <p className="text-sm text-gray-400 italic">(Tidak ada jawaban)</p>;
                      if (typeof jawabanText === 'string' && (jawabanText.startsWith('http://') || jawabanText.startsWith('https://'))) {
                        return (
                          <div className="space-y-2">
                            <img src={jawabanText} alt="Jawaban" className="max-w-full h-auto rounded-lg border border-blue-300 shadow-sm" style={{ maxHeight: '200px' }} />
                            <a href={jawabanText} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                              Buka di tab baru
                            </a>
                          </div>
                        );
                      }
                      return <MathRenderer content={typeof jawabanText === 'string' ? jawabanText : JSON.stringify(jawabanText)} className="text-sm text-blue-900" />;
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`nilai-${index}`}>Nilai (0-{grade.poin})</Label>
                      <Input
                        id={`nilai-${index}`}
                        type="number"
                        min="0"
                        max={grade.poin}
                        value={grade.nilai}
                        onChange={(e) => {
                          const newGrades = [...essayGrades];
                          const val = parseInt(e.target.value) || 0;
                          newGrades[index].nilai = Math.min(Math.max(val, 0), grade.poin);
                          setEssayGrades(newGrades);
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`feedback-${index}`}>Feedback</Label>
                    <Textarea
                      id={`feedback-${index}`}
                      placeholder="Berikan feedback untuk siswa..."
                      value={grade.feedback}
                      onChange={(e) => {
                        const newGrades = [...essayGrades];
                        newGrades[index].feedback = e.target.value;
                        setEssayGrades(newGrades);
                      }}
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsGradingOpen(false)}>
              {essayGrades.length > 0 ? 'Batal' : 'Tutup'}
            </Button>
            {essayGrades.length > 0 && (
              <Button onClick={handleSubmitGrades}>
                Simpan Nilai
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
