"use client";

import { useState, useEffect, useRef } from "react";
import { fetchApi } from "@/lib/fetch-api";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Printer } from "@phosphor-icons/react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { TIPE_SOAL_LABELS } from "@/types/soal";
import type { PilihanGandaData, EssayData, IsianSingkatData, PencocokanData, BenarSalahData } from "@/types/soal";

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Render soal content for print - plain text version
 */
function PrintSoalContent({ soal, showKey }: { soal: any; showKey: boolean }) {
  const data = soal.data;

  switch (soal.tipe) {
    case 'PILIHAN_GANDA': {
      const pgData = data as PilihanGandaData;
      return (
        <div className="print-options">
          {pgData.opsi?.map((opsi) => {
            const isAnswer = pgData.kunciJawaban === opsi.label;
            return (
              <div
                key={opsi.label}
                className={`print-option ${showKey && isAnswer ? 'print-option-correct' : ''}`}
              >
                <span className="print-option-label">{opsi.label}.</span>
                <span dangerouslySetInnerHTML={{ __html: opsi.text || '' }} />
                {showKey && isAnswer && <span className="print-correct-mark">✓</span>}
              </div>
            );
          })}
        </div>
      );
    }

    case 'ESSAY': {
      const essayData = data as EssayData;
      return (
        <div>
          <div className="print-answer-lines">
            <div className="print-line" />
            <div className="print-line" />
            <div className="print-line" />
            <div className="print-line" />
          </div>
          {showKey && essayData.kunciJawaban && (
            <div className="print-answer-key">
              <strong>Kunci Jawaban:</strong>
              <span dangerouslySetInnerHTML={{ __html: essayData.kunciJawaban }} />
            </div>
          )}
        </div>
      );
    }

    case 'ISIAN_SINGKAT': {
      const isianData = data as IsianSingkatData;
      return (
        <div>
          <div className="print-short-answer">
            Jawaban: _______________________________________________
          </div>
          {showKey && (
            <div className="print-answer-key">
              <strong>Kunci Jawaban:</strong>{' '}
              {isianData.kunciJawaban?.join(' / ')}
              {isianData.caseSensitive ? ' (Case Sensitive)' : ''}
            </div>
          )}
        </div>
      );
    }

    case 'BENAR_SALAH': {
      const bsData = data as BenarSalahData;
      return (
        <div>
          <div className="print-bs-options">
            <span className={`print-bs-option ${showKey && bsData.kunciJawaban === true ? 'print-option-correct' : ''}`}>
              ○ Benar {showKey && bsData.kunciJawaban === true && <span className="print-correct-mark">✓</span>}
            </span>
            <span className={`print-bs-option ${showKey && bsData.kunciJawaban === false ? 'print-option-correct' : ''}`}>
              ○ Salah {showKey && bsData.kunciJawaban === false && <span className="print-correct-mark">✓</span>}
            </span>
          </div>
        </div>
      );
    }

    case 'PENCOCOKAN': {
      const pencocokanData = data as PencocokanData;
      const jawabanEntries = Object.entries(pencocokanData.jawaban || {});
      return (
        <div>
          <div className="print-matching">
            <div className="print-matching-col">
              <div className="print-matching-header">Pernyataan</div>
              {pencocokanData.itemKiri?.map((item, idx) => (
                <div key={item.id} className="print-matching-item">
                  <span className="print-matching-num">{idx + 1}.</span>
                  <span dangerouslySetInnerHTML={{ __html: item.text || '' }} />
                </div>
              ))}
            </div>
            <div className="print-matching-col">
              <div className="print-matching-header">Pasangan</div>
              {pencocokanData.itemKanan?.map((item, idx) => (
                <div key={item.id} className="print-matching-item">
                  <span className="print-matching-num">{String.fromCharCode(65 + idx)}.</span>
                  <span dangerouslySetInnerHTML={{ __html: item.text || '' }} />
                </div>
              ))}
            </div>
          </div>
          {showKey && jawabanEntries.length > 0 && (
            <div className="print-answer-key">
              <strong>Kunci Jawaban:</strong>{' '}
              {jawabanEntries.map(([kiriId, kananId]) => {
                const kiriIdx = pencocokanData.itemKiri?.findIndex(i => i.id === kiriId) ?? -1;
                const kananIdx = pencocokanData.itemKanan?.findIndex(i => i.id === kananId) ?? -1;
                return `${kiriIdx + 1}→${String.fromCharCode(65 + kananIdx)}`;
              }).join(', ')}
            </div>
          )}
        </div>
      );
    }

    default:
      return <p>Tipe soal tidak dikenali</p>;
  }
}

export default function PrintUjianPage() {
  const router = useRouter();
  const params = useParams();
  const { isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [ujianData, setUjianData] = useState<any>(null);
  const [showKey, setShowKey] = useState(true);
  const [includeHeader, setIncludeHeader] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params.id) {
      fetchApi(`/api/guru/ujian/${params.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUjianData(data.data);
          }
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (!ujianData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">Ujian tidak ditemukan</p>
      </div>
    );
  }

  const ujian = ujianData.ujian;
  const soalList = ujianData.soal || [];
  const totalPoin = soalList.reduce((sum: number, s: any) => sum + (s.poin || 0), 0);
  const durationMinutes = Math.round((new Date(ujian.endUjian).getTime() - new Date(ujian.startUjian).getTime()) / 60000);

  // Group soal by type
  const soalByType: Record<string, any[]> = {};
  soalList.forEach((s: any) => {
    if (!soalByType[s.tipe]) soalByType[s.tipe] = [];
    soalByType[s.tipe].push(s);
  });

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything except print area */
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }

          /* Page setup */
          @page {
            size: A4;
            margin: 15mm 15mm 20mm 15mm;
          }

          body {
            font-size: 11pt;
            line-height: 1.5;
            color: #000;
            background: #fff;
          }

          /* Header */
          .print-header {
            text-align: center;
            border-bottom: 3px double #000;
            padding-bottom: 12pt;
            margin-bottom: 16pt;
          }
          .print-header h1 {
            font-size: 16pt;
            font-weight: bold;
            margin: 0 0 4pt 0;
            text-transform: uppercase;
            letter-spacing: 1pt;
          }
          .print-header .print-subtitle {
            font-size: 10pt;
            color: #333;
          }

          /* Info table */
          .print-info {
            width: 100%;
            margin-bottom: 16pt;
            border-collapse: collapse;
          }
          .print-info td {
            padding: 2pt 8pt 2pt 0;
            font-size: 10pt;
            vertical-align: top;
          }
          .print-info td:first-child {
            font-weight: bold;
            width: 120pt;
            white-space: nowrap;
          }

          /* Student info box */
          .print-student-box {
            border: 1pt solid #000;
            padding: 8pt 12pt;
            margin-bottom: 16pt;
            display: flex;
            gap: 24pt;
          }
          .print-student-box .field {
            flex: 1;
          }
          .print-student-box .field-label {
            font-size: 9pt;
            font-weight: bold;
            margin-bottom: 2pt;
          }
          .print-student-box .field-line {
            border-bottom: 1pt solid #000;
            height: 20pt;
          }

          /* Instructions */
          .print-instructions {
            font-size: 9pt;
            border: 1pt solid #999;
            padding: 8pt 12pt;
            margin-bottom: 16pt;
            background: #f9f9f9;
          }
          .print-instructions h3 {
            font-size: 10pt;
            font-weight: bold;
            margin: 0 0 4pt 0;
          }
          .print-instructions ul {
            margin: 0;
            padding-left: 16pt;
          }
          .print-instructions li {
            margin-bottom: 2pt;
          }

          /* Section header */
          .print-section-header {
            font-size: 12pt;
            font-weight: bold;
            margin: 16pt 0 8pt 0;
            padding: 4pt 8pt;
            background: #eee;
            border-left: 3pt solid #333;
          }

          /* Soal */
          .print-soal {
            margin-bottom: 14pt;
            page-break-inside: avoid;
          }
          .print-soal-header {
            display: flex;
            align-items: baseline;
            gap: 6pt;
            margin-bottom: 4pt;
          }
          .print-soal-num {
            font-weight: bold;
            font-size: 11pt;
            min-width: 24pt;
          }
          .print-soal-poin {
            font-size: 8pt;
            color: #666;
            margin-left: auto;
          }
          .print-soal-question {
            margin-left: 24pt;
            margin-bottom: 6pt;
            font-size: 11pt;
          }
          .print-soal-content {
            margin-left: 24pt;
          }

          /* Options (PG) */
          .print-options {
            display: flex;
            flex-direction: column;
            gap: 3pt;
          }
          .print-option {
            display: flex;
            align-items: baseline;
            gap: 6pt;
            padding: 2pt 4pt;
            font-size: 10.5pt;
          }
          .print-option-label {
            font-weight: bold;
            min-width: 16pt;
          }
          .print-option-correct {
            background: #e8f5e9;
            border: 0.5pt solid #4caf50;
            border-radius: 2pt;
          }
          .print-correct-mark {
            font-weight: bold;
            color: #2e7d32;
            margin-left: 4pt;
          }

          /* Benar/Salah */
          .print-bs-options {
            display: flex;
            gap: 24pt;
          }
          .print-bs-option {
            padding: 2pt 8pt;
            font-size: 10.5pt;
          }

          /* Answer lines (Essay) */
          .print-answer-lines {
            margin-top: 4pt;
          }
          .print-line {
            border-bottom: 0.5pt solid #999;
            height: 24pt;
          }

          /* Short answer */
          .print-short-answer {
            font-size: 10.5pt;
            margin-top: 4pt;
          }

          /* Answer key box */
          .print-answer-key {
            margin-top: 6pt;
            padding: 4pt 8pt;
            background: #e8f5e9;
            border: 0.5pt solid #4caf50;
            border-radius: 2pt;
            font-size: 9.5pt;
          }

          /* Matching */
          .print-matching {
            display: flex;
            gap: 16pt;
            margin-top: 4pt;
          }
          .print-matching-col {
            flex: 1;
          }
          .print-matching-header {
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            margin-bottom: 4pt;
            padding-bottom: 2pt;
            border-bottom: 0.5pt solid #999;
          }
          .print-matching-item {
            display: flex;
            align-items: baseline;
            gap: 4pt;
            padding: 2pt 0;
            font-size: 10pt;
          }
          .print-matching-num {
            font-weight: bold;
            min-width: 16pt;
          }

          /* Footer */
          .print-footer {
            margin-top: 24pt;
            padding-top: 8pt;
            border-top: 1pt solid #ccc;
            font-size: 8pt;
            color: #999;
            text-align: center;
          }
        }

        /* Screen preview styles */
        @media screen {
          .print-area {
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #000;
          }
          .print-header {
            text-align: center;
            border-bottom: 3px double #000;
            padding-bottom: 12pt;
            margin-bottom: 16pt;
          }
          .print-header h1 {
            font-size: 16pt;
            font-weight: bold;
            margin: 0 0 4pt 0;
            text-transform: uppercase;
            letter-spacing: 1pt;
          }
          .print-header .print-subtitle {
            font-size: 10pt;
            color: #333;
          }
          .print-info {
            width: 100%;
            margin-bottom: 16pt;
            border-collapse: collapse;
          }
          .print-info td {
            padding: 2pt 8pt 2pt 0;
            font-size: 10pt;
            vertical-align: top;
          }
          .print-info td:first-child {
            font-weight: bold;
            width: 120pt;
            white-space: nowrap;
          }
          .print-student-box {
            border: 1pt solid #000;
            padding: 8pt 12pt;
            margin-bottom: 16pt;
            display: flex;
            gap: 24pt;
          }
          .print-student-box .field {
            flex: 1;
          }
          .print-student-box .field-label {
            font-size: 9pt;
            font-weight: bold;
            margin-bottom: 2pt;
          }
          .print-student-box .field-line {
            border-bottom: 1pt solid #000;
            height: 20pt;
          }
          .print-instructions {
            font-size: 9pt;
            border: 1pt solid #999;
            padding: 8pt 12pt;
            margin-bottom: 16pt;
            background: #f9f9f9;
          }
          .print-instructions h3 {
            font-size: 10pt;
            font-weight: bold;
            margin: 0 0 4pt 0;
          }
          .print-instructions ul {
            margin: 0;
            padding-left: 16pt;
          }
          .print-instructions li {
            margin-bottom: 2pt;
          }
          .print-section-header {
            font-size: 12pt;
            font-weight: bold;
            margin: 16pt 0 8pt 0;
            padding: 4pt 8pt;
            background: #eee;
            border-left: 3pt solid #333;
          }
          .print-soal {
            margin-bottom: 14pt;
          }
          .print-soal-header {
            display: flex;
            align-items: baseline;
            gap: 6pt;
            margin-bottom: 4pt;
          }
          .print-soal-num {
            font-weight: bold;
            font-size: 11pt;
            min-width: 24pt;
          }
          .print-soal-poin {
            font-size: 8pt;
            color: #666;
            margin-left: auto;
          }
          .print-soal-question {
            margin-left: 24pt;
            margin-bottom: 6pt;
            font-size: 11pt;
          }
          .print-soal-content {
            margin-left: 24pt;
          }
          .print-options {
            display: flex;
            flex-direction: column;
            gap: 3pt;
          }
          .print-option {
            display: flex;
            align-items: baseline;
            gap: 6pt;
            padding: 2pt 4pt;
            font-size: 10.5pt;
          }
          .print-option-label {
            font-weight: bold;
            min-width: 16pt;
          }
          .print-option-correct {
            background: #e8f5e9;
            border: 0.5pt solid #4caf50;
            border-radius: 2pt;
          }
          .print-correct-mark {
            font-weight: bold;
            color: #2e7d32;
            margin-left: 4pt;
          }
          .print-bs-options {
            display: flex;
            gap: 24pt;
          }
          .print-bs-option {
            padding: 2pt 8pt;
            font-size: 10.5pt;
          }
          .print-answer-lines {
            margin-top: 4pt;
          }
          .print-line {
            border-bottom: 0.5pt solid #999;
            height: 24pt;
          }
          .print-short-answer {
            font-size: 10.5pt;
            margin-top: 4pt;
          }
          .print-answer-key {
            margin-top: 6pt;
            padding: 4pt 8pt;
            background: #e8f5e9;
            border: 0.5pt solid #4caf50;
            border-radius: 2pt;
            font-size: 9.5pt;
          }
          .print-matching {
            display: flex;
            gap: 16pt;
            margin-top: 4pt;
          }
          .print-matching-col {
            flex: 1;
          }
          .print-matching-header {
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            margin-bottom: 4pt;
            padding-bottom: 2pt;
            border-bottom: 0.5pt solid #999;
          }
          .print-matching-item {
            display: flex;
            align-items: baseline;
            gap: 4pt;
            padding: 2pt 0;
            font-size: 10pt;
          }
          .print-matching-num {
            font-weight: bold;
            min-width: 16pt;
          }
          .print-footer {
            margin-top: 24pt;
            padding-top: 8pt;
            border-top: 1pt solid #ccc;
            font-size: 8pt;
            color: #999;
            text-align: center;
          }
        }
      `}</style>

      {/* Toolbar - hidden when printing */}
      <div className="no-print sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/guru/ujian/${params.id}`)}
            >
              <ArrowLeft className="w-5 h-5" weight="bold" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Print Soal Ujian</h1>
              <p className="text-xs text-muted-foreground">{ujian.judul}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showKey}
                onChange={(e) => setShowKey(e.target.checked)}
                className="rounded"
              />
              Kunci Jawaban
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={includeHeader}
                onChange={(e) => setIncludeHeader(e.target.checked)}
                className="rounded"
              />
              Header & Info
            </label>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" weight="bold" />
              Print / PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Print Area */}
      <div className="print-area" ref={printRef}>
        {/* Header */}
        {includeHeader && (
          <>
            <div className="print-header">
              <h1>{ujian.judul}</h1>
              <div className="print-subtitle">
                {typeof ujian.mapel === 'object' ? ujian.mapel?.nama : ujian.mapel} — {ujian.kelas?.join(', ')}
              </div>
            </div>

            {/* Exam info table */}
            <table className="print-info">
              <tbody>
                <tr>
                  <td>Mata Pelajaran</td>
                  <td>: {typeof ujian.mapel === 'object' ? ujian.mapel?.nama : ujian.mapel}</td>
                  <td>Jumlah Soal</td>
                  <td>: {soalList.length} soal</td>
                </tr>
                <tr>
                  <td>Kelas</td>
                  <td>: {ujian.kelas?.join(', ')}</td>
                  <td>Total Poin</td>
                  <td>: {totalPoin}</td>
                </tr>
                <tr>
                  <td>Tanggal</td>
                  <td>: {format(new Date(ujian.startUjian), "dd MMMM yyyy", { locale: localeId })}</td>
                  <td>Waktu</td>
                  <td>: {durationMinutes} menit</td>
                </tr>
                <tr>
                  <td>Jam</td>
                  <td>: {format(new Date(ujian.startUjian), "HH:mm")} - {format(new Date(ujian.endUjian), "HH:mm")}</td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            {/* Student info box */}
            <div className="print-student-box">
              <div className="field">
                <div className="field-label">Nama Siswa</div>
                <div className="field-line" />
              </div>
              <div className="field">
                <div className="field-label">NIS / NISN</div>
                <div className="field-line" />
              </div>
              <div className="field">
                <div className="field-label">Kelas</div>
                <div className="field-line" />
              </div>
            </div>

            {/* Instructions */}
            <div className="print-instructions">
              <h3>Petunjuk Pengerjaan:</h3>
              <ul>
                <li>Tuliskan nama, NIS/NISN, dan kelas pada kolom yang tersedia.</li>
                <li>Kerjakan semua soal dengan teliti.</li>
                <li>Perhatikan poin setiap soal untuk mengatur waktu pengerjaan.</li>
                <li>Periksa kembali jawaban sebelum dikumpulkan.</li>
              </ul>
            </div>
          </>
        )}

        {/* Soal grouped by type */}
        {Object.entries(soalByType).map(([tipe, soals]) => {
          const typeLabel = TIPE_SOAL_LABELS[tipe as keyof typeof TIPE_SOAL_LABELS] || tipe;
          const typeCount = soals.length;
          return (
            <div key={tipe}>
              <div className="print-section-header">
                {typeLabel} ({typeCount} soal)
              </div>
              {soals.map((soal: any) => (
                <div key={soal.id} className="print-soal">
                  <div className="print-soal-header">
                    <span className="print-soal-num">{soal.urutan || soal.nomor}.</span>
                    <span className="print-soal-poin">({soal.poin} poin)</span>
                  </div>
                  <div
                    className="print-soal-question"
                    dangerouslySetInnerHTML={{ __html: soal.pertanyaan || '' }}
                  />
                  <div className="print-soal-content">
                    <PrintSoalContent soal={soal} showKey={showKey} />
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {/* Footer */}
        <div className="print-footer">
          Dicetak pada {format(new Date(), "dd MMMM yyyy, HH:mm", { locale: localeId })} — {ujian.judul}
        </div>
      </div>
    </>
  );
}
