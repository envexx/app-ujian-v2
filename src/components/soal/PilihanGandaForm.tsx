"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TiptapEditorWithToolbar from "@/components/tiptap/TiptapEditorWithToolbar";
import type { PilihanGandaData } from "@/types/soal";

interface PilihanGandaFormProps {
  pertanyaan: string;
  poin: number;
  data: PilihanGandaData;
  onChange: (pertanyaan: string, poin: number, data: PilihanGandaData) => void;
}

export function PilihanGandaForm({
  pertanyaan,
  poin,
  data,
  onChange,
}: PilihanGandaFormProps) {
  const handlePertanyaanChange = (value: string) => {
    onChange(value, poin, data);
  };

  const handlePoinChange = (value: string) => {
    const newPoin = parseInt(value) || 1;
    onChange(pertanyaan, newPoin, data);
  };

  const handleOpsiChange = (label: string, text: string) => {
    const newOpsi = data.opsi.map((opsi) =>
      opsi.label === label ? { ...opsi, text } : opsi
    );
    onChange(pertanyaan, poin, { ...data, opsi: newOpsi });
  };

  const handleKunciJawabanChange = (value: string) => {
    onChange(pertanyaan, poin, { ...data, kunciJawaban: value });
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

      {/* Opsi Jawaban - Grid 2x2 */}
      <div className="space-y-3">
        <Label>Pilihan Jawaban *</Label>
        <div className="grid grid-cols-2 gap-3">
          {data.opsi.map((opsi) => (
            <div key={opsi.label} className="flex items-start gap-2">
              <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center bg-gray-100 rounded font-semibold text-sm">
                {opsi.label}
              </div>
              <div className="flex-1">
                <TiptapEditorWithToolbar
                  content={opsi.text}
                  onChange={(value) => handleOpsiChange(opsi.label, value)}
                  placeholder={`Opsi ${opsi.label}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kunci Jawaban & Poin */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Kunci Jawaban *</Label>
          <Select value={data.kunciJawaban} onValueChange={handleKunciJawabanChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih kunci jawaban" />
            </SelectTrigger>
            <SelectContent>
              {data.opsi.map((opsi) => (
                <SelectItem key={opsi.label} value={opsi.label}>
                  {opsi.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Poin</Label>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min="1"
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
