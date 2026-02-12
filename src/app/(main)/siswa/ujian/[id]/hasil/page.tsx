"use client";

import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MathRenderer } from "@/components/ui/math-renderer";
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Trophy,
  Clock,
  Calendar,
  FileText,
  ChartBar,
  Check,
  X,
  BookOpen,
  GraduationCap,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Gagal memuat hasil ujian');
  return data.data;
};

const TIPE_LABELS: Record<string, string> = {
  PILIHAN_GANDA: 'Pilihan Ganda',
  ESSAY: 'Essay',
  ISIAN_SINGKAT: 'Isian Singkat',
  PENCOCOKAN: 'Pencocokan',
  BENAR_SALAH: 'Benar/Salah',
};

const AUTO_GRADE_TYPES = ['PILIHAN_GANDA', 'ISIAN_SINGKAT', 'BENAR_SALAH', 'PENCOCOKAN'];
const MANUAL_GRADE_TYPES = ['ESSAY'];

export default function SiswaUjianHasilPage() {
  const router = useRouter();
  const params = useParams();

  const { data: resultData, error, isLoading } = useSWR(
    params.id ? `/api/siswa/ujian/${params.id}/hasil` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      onError: () => {
        router.push('/siswa/ujian');
      },
    }
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!resultData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Hasil ujian tidak ditemukan</p>
      </div>
    );
  }

  const { ujian, submission, soal, answers, jawabanDetails } = resultData;
  const allSoal = soal || [];
  const hasScore = submission.nilai !== null;
  const isPending = submission.status === 'pending';
  
  // Calculate statistics per type
  let correctAuto = 0;
  let wrongAuto = 0;
  let unansweredAuto = 0;
  let totalAutoSoal = 0;
  let totalManualSoal = 0;

  allSoal.forEach((s: any) => {
    const detail = jawabanDetails?.[s.id];
    const isManual = MANUAL_GRADE_TYPES.includes(s.tipe);
    
    if (isManual) {
      totalManualSoal++;
    } else {
      totalAutoSoal++;
      if (!detail) {
        unansweredAuto++;
      } else if (detail.isCorrect) {
        correctAuto++;
      } else {
        wrongAuto++;
      }
    }
  });

  const totalSoal = allSoal.length;
  
  // Soal type breakdown
  const soalByType: Record<string, number> = {};
  allSoal.forEach((s: any) => {
    soalByType[s.tipe] = (soalByType[s.tipe] || 0) + 1;
  });
  const soalTypeSummary = Object.entries(soalByType)
    .map(([tipe, count]) => `${count} ${TIPE_LABELS[tipe] || tipe}`)
    .join(' • ');
  
  // Calculate duration
  const startTime = new Date(ujian.startUjian);
  const endTime = new Date(ujian.endUjian);
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  
  // Calculate time spent
  let submittedAt: Date | null = null;
  let startedAt: Date | null = null;
  
  if (submission.submittedAt) {
    const date = new Date(submission.submittedAt);
    if (!isNaN(date.getTime())) submittedAt = date;
  }
  
  if (submission.startedAt) {
    const date = new Date(submission.startedAt);
    if (!isNaN(date.getTime())) startedAt = date;
  }
  
  let timeSpentMinutes: number | null = null;
  if (submittedAt && startedAt) {
    const diff = submittedAt.getTime() - startedAt.getTime();
    if (diff > 0 && diff < 86400000) {
      timeSpentMinutes = Math.round(diff / 60000);
    }
  }
  
  const isValidSubmittedAt = submittedAt !== null;

  // Score percentage
  const scorePercentage = hasScore ? submission.nilai : 0;
  const isPassed = hasScore && submission.nilai >= 75;

  return (
    <div className="space-y-6 sm:space-y-8 pb-8 pt-4 sm:pt-6">
      {/* Header */}
      <div className="flex items-center gap-4 px-2 sm:px-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/siswa/ujian")}
          className="hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" weight="bold" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Hasil Ujian</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">{ujian.judul}</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{ujian.mapel}</p>
        </div>
      </div>

      {/* Score Card - Enhanced */}
      <Card className={cn(
        "rounded-2xl border-0 shadow-xl overflow-hidden mx-2 sm:mx-0",
        hasScore && isPassed 
          ? "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20"
          : hasScore && !isPassed
          ? "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20"
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20"
      )}>
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="text-center space-y-4 sm:space-y-6">
            {hasScore ? (
              <>
                {/* Icon */}
                <div className={cn(
                  "inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full mb-2 sm:mb-4 transition-all",
                  isPassed
                    ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30"
                    : "bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/30"
                )}>
                  {isPassed ? (
                    <Trophy className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" weight="fill" />
                  ) : (
                    <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" weight="fill" />
                  )}
                </div>

                {/* Score */}
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2 uppercase tracking-wide">
                    Nilai Anda
                  </p>
                  <div className="flex items-baseline justify-center gap-1 sm:gap-2">
                    <p className={cn(
                      "text-5xl sm:text-6xl md:text-7xl font-extrabold bg-clip-text text-transparent leading-none",
                      isPassed
                        ? "bg-gradient-to-r from-green-600 to-emerald-600"
                        : "bg-gradient-to-r from-orange-600 to-amber-600"
                    )}>
                      {submission.nilai}
                    </p>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-muted-foreground">
                      /100
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="max-w-md mx-auto">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out",
                        isPassed
                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                          : "bg-gradient-to-r from-orange-500 to-amber-500"
                      )}
                      style={{ width: `${scorePercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {scorePercentage}% dari total nilai
                  </p>
                </div>

                {/* Status Badge */}
                <Badge 
                  variant={isPassed ? "default" : "destructive"}
                  className={cn(
                    "text-xs sm:text-sm px-4 sm:px-6 py-1.5 sm:py-2 font-semibold",
                    isPassed
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-orange-500 hover:bg-orange-600 text-white"
                  )}
                >
                  {isPassed ? (
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" weight="fill" />
                      Lulus
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" weight="fill" />
                      Tidak Lulus
                    </span>
                  )}
                </Badge>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg shadow-orange-500/30 mb-2 sm:mb-4">
                  <Clock className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" weight="fill" />
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Menunggu Penilaian</p>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto px-2">
                    Ujian Anda sedang dikoreksi oleh guru. Nilai akan tersedia setelah koreksi selesai.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 px-2 sm:px-0">
        <Card className="border-2 hover:border-blue-500 transition-colors">
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <div className="text-center space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-1 sm:mb-2">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" weight="duotone" />
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Tanggal</p>
              {isValidSubmittedAt ? (
                <>
                  <p className="font-bold text-sm sm:text-base leading-tight">
                    {format(submittedAt!, "dd MMM yyyy", { locale: id })}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {format(submittedAt!, "HH:mm", { locale: id })} WIB
                  </p>
                </>
              ) : (
                <p className="font-bold text-sm sm:text-base leading-tight text-muted-foreground">-</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-orange-500 transition-colors">
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <div className="text-center space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-1 sm:mb-2">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" weight="duotone" />
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {timeSpentMinutes !== null ? "Waktu Pengerjaan" : "Durasi Ujian"}
              </p>
              <p className="font-bold text-sm sm:text-base leading-tight">
                {timeSpentMinutes !== null && timeSpentMinutes > 0 
                  ? `${timeSpentMinutes} menit` 
                  : `${durationMinutes} menit`}
              </p>
              {timeSpentMinutes !== null && timeSpentMinutes > 0 && (
                <p className="text-[10px] sm:text-xs text-muted-foreground">dari {durationMinutes} menit</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-purple-500 transition-colors">
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <div className="text-center space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-1 sm:mb-2">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" weight="duotone" />
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Soal</p>
              <p className="font-bold text-sm sm:text-base leading-tight">{totalSoal} soal</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{soalTypeSummary}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-green-500 transition-colors">
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <div className="text-center space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-1 sm:mb-2">
                <ChartBar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" weight="duotone" />
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
              <p className="font-bold text-sm sm:text-base leading-tight">
                {isPending ? "Pending" : "Selesai"}
              </p>
              {hasScore && totalAutoSoal > 0 && (
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {correctAuto}/{totalAutoSoal} benar
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-graded Statistics */}
      {hasScore && totalAutoSoal > 0 && (
        <Card className="rounded-2xl border-0 shadow-lg mx-2 sm:mx-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" weight="duotone" />
              Statistik Soal Otomatis
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Pilihan Ganda, Isian Singkat, Benar/Salah, Pencocokan
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center p-3 sm:p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-green-600" weight="fill" />
                <p className="text-xl sm:text-2xl font-bold text-green-600">{correctAuto}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Benar</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800">
                <XCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-red-600" weight="fill" />
                <p className="text-xl sm:text-2xl font-bold text-red-600">{wrongAuto}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Salah</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-900/20 border-2 border-gray-200 dark:border-gray-800">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-gray-600" weight="duotone" />
                <p className="text-xl sm:text-2xl font-bold text-gray-600">{unansweredAuto}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Tidak Dijawab</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Akurasi</span>
                <span className="font-semibold">
                  {totalAutoSoal > 0 ? Math.round((correctAuto / totalAutoSoal) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${totalAutoSoal > 0 ? (correctAuto / totalAutoSoal) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Answers Review - All Types */}
      <Card className="rounded-2xl border-0 shadow-lg mx-2 sm:mx-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" weight="duotone" />
            Review Jawaban
          </CardTitle>
          {hasScore && (
            <p className="text-sm text-muted-foreground">
              {correctAuto} benar dari {totalAutoSoal} soal otomatis
              {totalManualSoal > 0 && ` • ${totalManualSoal} soal manual`}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {allSoal.map((s: any, index: number) => {
            const detail = jawabanDetails?.[s.id];
            const userAnswer = answers?.[s.id];
            const isManual = MANUAL_GRADE_TYPES.includes(s.tipe);
            const isCorrect = detail?.isCorrect === true;
            const isAnswered = !!detail || !!userAnswer;
            const data = s.data || {};

            return (
              <div 
                key={s.id} 
                className={cn(
                  "p-3 sm:p-4 md:p-5 rounded-xl border-2 transition-all hover:shadow-md",
                  isManual
                    ? "bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                    : isCorrect
                    ? "bg-green-50 dark:bg-green-950/10 border-green-200 dark:border-green-800"
                    : isAnswered
                    ? "bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-800"
                    : "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800"
                )}
              >
                <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                  {/* Question Number */}
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full font-bold flex items-center justify-center text-xs sm:text-sm",
                    isManual
                      ? "bg-purple-500 text-white"
                      : isCorrect
                      ? "bg-green-500 text-white"
                      : isAnswered
                      ? "bg-red-500 text-white"
                      : "bg-gray-400 text-white"
                  )}>
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                    {/* Type badge + question */}
                    <div>
                      <Badge variant="outline" className="text-[10px] sm:text-xs mb-2">
                        {TIPE_LABELS[s.tipe] || s.tipe}
                      </Badge>
                      <MathRenderer content={s.pertanyaan || ""} className="font-medium text-sm sm:text-base" />
                    </div>
                    
                    {/* Type-specific answer review */}
                    {s.tipe === 'PILIHAN_GANDA' && (() => {
                      const opsi = data.opsi || [];
                      const kunci = data.kunciJawaban;
                      const jawaban = detail?.jawaban?.jawaban || (typeof userAnswer === 'string' ? userAnswer : userAnswer?.jawaban);
                      return (
                        <div className="space-y-1.5 sm:space-y-2">
                          {opsi.map((o: any) => {
                            const isUserAnswer = jawaban === o.label;
                            const isCorrectAnswer = kunci === o.label;
                            return (
                              <div key={o.label} className={cn(
                                "p-2 sm:p-3 rounded-lg border-2 transition-all",
                                isCorrectAnswer ? 'border-green-500 bg-green-50 dark:bg-green-950/20 shadow-sm'
                                  : isUserAnswer ? 'border-red-500 bg-red-50 dark:bg-red-950/20 shadow-sm'
                                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50'
                              )}>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    <span className={cn(
                                      "font-bold text-xs sm:text-sm w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0",
                                      isCorrectAnswer ? "bg-green-500 text-white"
                                        : isUserAnswer ? "bg-red-500 text-white"
                                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                    )}>{o.label}</span>
                                    <MathRenderer content={o.text || ""} className="flex-1 text-sm sm:text-base" />
                                  </div>
                                  <div className="flex-shrink-0">
                                    {isCorrectAnswer && (
                                      <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white border-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" weight="bold" />
                                        <span className="hidden sm:inline">Benar</span>
                                      </Badge>
                                    )}
                                    {isUserAnswer && !isCorrectAnswer && (
                                      <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-white border-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                                        <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" weight="bold" />
                                        <span className="hidden sm:inline">Jawaban Anda</span>
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {s.tipe === 'BENAR_SALAH' && (() => {
                      const kunci = data.kunciJawaban;
                      const jawaban = detail?.jawaban?.jawaban ?? userAnswer?.jawaban;
                      return (
                        <div className="grid grid-cols-2 gap-2">
                          {[true, false].map((val) => {
                            const isKunci = kunci === val;
                            const isUser = jawaban === val;
                            return (
                              <div key={String(val)} className={cn(
                                "p-3 rounded-lg border-2 text-center font-bold text-sm",
                                isKunci ? "border-green-500 bg-green-50" : isUser ? "border-red-500 bg-red-50" : "border-gray-200"
                              )}>
                                {val ? "Benar" : "Salah"}
                                {isKunci && <Badge className="ml-2 bg-green-500 text-white text-[10px]">Kunci</Badge>}
                                {isUser && !isKunci && <Badge className="ml-2 bg-red-500 text-white text-[10px]">Anda</Badge>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {s.tipe === 'ISIAN_SINGKAT' && (() => {
                      const kunci = data.kunciJawaban;
                      const jawaban = detail?.jawaban?.jawaban || userAnswer?.jawaban || (typeof userAnswer === 'string' ? userAnswer : '');
                      return (
                        <div className="space-y-2">
                          <div className={cn(
                            "p-3 rounded-lg border-2",
                            isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                          )}>
                            <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1">Jawaban Anda:</p>
                            <p className="text-sm font-medium">{jawaban || <span className="italic text-muted-foreground">Tidak dijawab</span>}</p>
                          </div>
                          <div className="p-3 rounded-lg border-2 border-green-500 bg-green-50">
                            <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1">Kunci Jawaban:</p>
                            <p className="text-sm font-medium text-green-700">{kunci}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {s.tipe === 'PENCOCOKAN' && (() => {
                      const itemKiri = data.itemKiri || [];
                      const itemKanan = data.itemKanan || [];
                      const kunci = data.jawaban || {};
                      const jawaban = detail?.jawaban?.jawaban || userAnswer?.jawaban || {};
                      return (
                        <div className="space-y-2">
                          {itemKiri.map((kiri: any, idx: number) => {
                            const correctKananId = kunci[kiri.id];
                            const userKananId = jawaban[kiri.id];
                            const correctKanan = itemKanan.find((k: any) => k.id === correctKananId);
                            const userKanan = itemKanan.find((k: any) => k.id === userKananId);
                            const pairCorrect = correctKananId === userKananId;
                            return (
                              <div key={kiri.id} className={cn(
                                "p-3 rounded-lg border-2",
                                pairCorrect ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"
                              )}>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-bold text-blue-600">{idx + 1}.</span>
                                  <MathRenderer content={kiri.text} className="inline text-sm" />
                                  <span className="text-muted-foreground mx-1">→</span>
                                  {userKanan ? (
                                    <span className={cn("font-medium", pairCorrect ? "text-green-700" : "text-red-700")}>
                                      <MathRenderer content={userKanan.text} className="inline text-sm" />
                                    </span>
                                  ) : (
                                    <span className="italic text-muted-foreground text-xs">Tidak dijawab</span>
                                  )}
                                  {!pairCorrect && correctKanan && (
                                    <span className="text-green-600 text-xs ml-auto">
                                      (Benar: <MathRenderer content={correctKanan.text} className="inline text-xs" />)
                                    </span>
                                  )}
                                  {pairCorrect && <Check className="w-4 h-4 text-green-600 ml-auto" weight="bold" />}
                                </div>
                              </div>
                            );
                          })}
                          {detail?.nilai !== null && detail?.nilai !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              Skor: {Math.round(detail.nilai)}%
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {s.tipe === 'ESSAY' && (() => {
                      // Unwrap jawaban — handle both { jawaban: "text" } and legacy { jawaban: { jawaban: "text" } }
                      let rawJawaban: any = detail?.jawaban?.jawaban || userAnswer?.jawaban || (typeof userAnswer === 'string' ? userAnswer : '');
                      // Recursively unwrap if still an object with .jawaban
                      while (rawJawaban && typeof rawJawaban === 'object' && rawJawaban.jawaban !== undefined) {
                        rawJawaban = rawJawaban.jawaban;
                      }
                      const jawabanStr = typeof rawJawaban === 'string' ? rawJawaban : '';
                      return (
                        <>
                          <div className={cn(
                            "p-3 sm:p-4 rounded-lg border-2",
                            jawabanStr ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                              : "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700"
                          )}>
                            <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1 sm:mb-2 uppercase tracking-wide">
                              Jawaban Anda:
                            </p>
                            {jawabanStr && (jawabanStr.startsWith('http://') || jawabanStr.startsWith('https://')) ? (
                              <div className="space-y-2">
                                <img src={jawabanStr} alt="Jawaban essay" className="max-w-full h-auto rounded-lg border border-gray-300 shadow-sm"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                <a href={jawabanStr} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                  Buka gambar di tab baru
                                </a>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                                {jawabanStr || <span className="text-muted-foreground italic">Tidak dijawab</span>}
                              </p>
                            )}
                          </div>
                          {detail?.nilai !== null && detail?.nilai !== undefined ? (
                            <div className="flex items-center gap-2 text-xs">
                              <Badge className="bg-blue-500 text-white">Nilai: {detail.nilai}/{s.poin}</Badge>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" weight="duotone" />
                              Menunggu penilaian dari guru
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-center pt-4 px-2 sm:px-0">
        <Button
          onClick={() => router.push('/siswa/ujian')}
          size="lg"
          className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold"
          variant="default"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" weight="bold" />
          Kembali ke Daftar Ujian
        </Button>
      </div>
    </div>
  );
}
