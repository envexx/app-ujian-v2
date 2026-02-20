"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TiptapEditorWithToolbar from "@/components/tiptap/TiptapEditorWithToolbar";
import type { EssayData } from "@/types/soal";

interface EssayFormProps {
  pertanyaan: string;
  poin: number;
  data: EssayData;
  onChange: (pertanyaan: string, poin: number, data: EssayData) => void;
}

export function EssayForm({
  pertanyaan,
  poin,
  data,
  onChange,
}: EssayFormProps) {
  const handlePertanyaanChange = (value: string) => {
    onChange(value, poin, data);
  };

  const handlePoinChange = (value: string) => {
    const newPoin = parseInt(value) || 5;
    onChange(pertanyaan, newPoin, data);
  };

  const handleKunciJawabanChange = (value: string) => {
    onChange(pertanyaan, poin, { ...data, kunciJawaban: value });
  };

  const handleMinKataChange = (value: string) => {
    const minKata = parseInt(value) || 0;
    onChange(pertanyaan, poin, { ...data, minKata });
  };

  const handleMaxKataChange = (value: string) => {
    const maxKata = parseInt(value) || 1000;
    onChange(pertanyaan, poin, { ...data, maxKata });
  };

  return (
    <div className="space-y-4">
      {/* Pertanyaan */}
      <div className="space-y-2">
        <Label>Pertanyaan *</Label>
        <TiptapEditorWithToolbar
          content={pertanyaan}
          onChange={handlePertanyaanChange}
          placeholder="Tulis pertanyaan di sini..."
        />
      </div>

      {/* Kunci Jawaban */}
      <div className="space-y-2">
        <Label>Kunci Jawaban / Pedoman Penilaian *</Label>
        <TiptapEditorWithToolbar
          content={data.kunciJawaban}
          onChange={handleKunciJawabanChange}
          placeholder="Tulis kunci jawaban atau pedoman penilaian di sini..."
        />
      </div>

      {/* Batasan Kata & Poin */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Min. Kata</Label>
          <Input
            type="number"
            min="0"
            value={data.minKata || 0}
            onChange={(e) => handleMinKataChange(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label>Max. Kata</Label>
          <Input
            type="number"
            min="0"
            value={data.maxKata || 1000}
            onChange={(e) => handleMaxKataChange(e.target.value)}
            placeholder="1000"
          />
        </div>
        <div className="space-y-2">
          <Label>Poin</Label>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={poin}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              if (value) handlePoinChange(value);
            }}
            placeholder="Masukkan poin"
          />
        </div>
      </div>
    </div>
  );
}
