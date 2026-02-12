"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import TiptapEditorWithToolbar from "@/components/tiptap/TiptapEditorWithToolbar";
import { Plus, X } from "@phosphor-icons/react";
import type { IsianSingkatData } from "@/types/soal";

interface IsianSingkatFormProps {
  pertanyaan: string;
  poin: number;
  data: IsianSingkatData;
  onChange: (pertanyaan: string, poin: number, data: IsianSingkatData) => void;
}

export function IsianSingkatForm({
  pertanyaan,
  poin,
  data,
  onChange,
}: IsianSingkatFormProps) {
  const handlePertanyaanChange = (value: string) => {
    onChange(value, poin, data);
  };

  const handlePoinChange = (value: string) => {
    const newPoin = parseInt(value) || 1;
    onChange(pertanyaan, newPoin, data);
  };

  const handleAddJawaban = () => {
    onChange(pertanyaan, poin, {
      ...data,
      kunciJawaban: [...data.kunciJawaban, ""],
    });
  };

  const handleRemoveJawaban = (index: number) => {
    const newKunciJawaban = data.kunciJawaban.filter((_, i) => i !== index);
    onChange(pertanyaan, poin, { ...data, kunciJawaban: newKunciJawaban });
  };

  const handleJawabanChange = (index: number, value: string) => {
    const newKunciJawaban = data.kunciJawaban.map((j, i) =>
      i === index ? value : j
    );
    onChange(pertanyaan, poin, { ...data, kunciJawaban: newKunciJawaban });
  };

  const handleCaseSensitiveChange = (checked: boolean) => {
    onChange(pertanyaan, poin, { ...data, caseSensitive: checked });
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

      {/* Jawaban yang Diterima */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Jawaban yang Diterima *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddJawaban}
          >
            <Plus className="w-4 h-4 mr-1" weight="bold" />
            Tambah Jawaban
          </Button>
        </div>

        {data.kunciJawaban.map((jawaban, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={jawaban}
              onChange={(e) => handleJawabanChange(index, e.target.value)}
              placeholder={`Jawaban ${index + 1}`}
              className="flex-1"
            />
            {data.kunciJawaban.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveJawaban(index)}
              >
                <X className="w-4 h-4 text-red-600" weight="bold" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Case Sensitive & Poin */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="caseSensitive"
            checked={data.caseSensitive}
            onCheckedChange={handleCaseSensitiveChange}
          />
          <Label htmlFor="caseSensitive" className="cursor-pointer">
            Case Sensitive (Huruf besar/kecil harus sama)
          </Label>
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
