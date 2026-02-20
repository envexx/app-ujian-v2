"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import TiptapEditorWithToolbar from "@/components/tiptap/TiptapEditorWithToolbar";
import type { BenarSalahData } from "@/types/soal";

interface BenarSalahFormProps {
  pertanyaan: string;
  poin: number;
  data: BenarSalahData;
  onChange: (pertanyaan: string, poin: number, data: BenarSalahData) => void;
}

export function BenarSalahForm({
  pertanyaan,
  poin,
  data,
  onChange,
}: BenarSalahFormProps) {
  const handlePertanyaanChange = (value: string) => {
    onChange(value, poin, data);
  };

  const handlePoinChange = (value: string) => {
    const newPoin = parseInt(value) || 1;
    onChange(pertanyaan, newPoin, data);
  };

  const handleKunciJawabanChange = (value: string) => {
    onChange(pertanyaan, poin, { kunciJawaban: value === "true" });
  };

  return (
    <div className="space-y-4">
      {/* Pertanyaan */}
      <div className="space-y-2">
        <Label>Pertanyaan / Pernyataan *</Label>
        <TiptapEditorWithToolbar
          content={pertanyaan}
          onChange={handlePertanyaanChange}
          placeholder="Tulis pernyataan di sini..."
        />
      </div>

      {/* Kunci Jawaban & Poin */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Label>Kunci Jawaban *</Label>
          <RadioGroup
            value={data.kunciJawaban.toString()}
            onValueChange={handleKunciJawabanChange}
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="benar" />
                <Label htmlFor="benar" className="cursor-pointer font-normal">
                  Benar
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="salah" />
                <Label htmlFor="salah" className="cursor-pointer font-normal">
                  Salah
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>
        <div className="flex items-center gap-2">
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
            className="w-20"
            placeholder="Poin"
          />
        </div>
      </div>
    </div>
  );
}
