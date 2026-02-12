"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TiptapEditorWithToolbar from "@/components/tiptap/TiptapEditorWithToolbar";
import { MathRenderer } from "@/components/ui/math-renderer";
import { Plus, X, LinkSimple, LinkBreak } from "@phosphor-icons/react";
import type { PencocokanData, PencocokanItem } from "@/types/soal";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";

interface PencocokanFormProps {
  pertanyaan: string;
  poin: number;
  data: PencocokanData;
  onChange: (pertanyaan: string, poin: number, data: PencocokanData) => void;
}

// Color palette for connections
const CONNECTION_COLORS = [
  { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-700", line: "#3b82f6" },
  { bg: "bg-green-100", border: "border-green-400", text: "text-green-700", line: "#22c55e" },
  { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-700", line: "#f97316" },
  { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-700", line: "#a855f7" },
  { bg: "bg-pink-100", border: "border-pink-400", text: "text-pink-700", line: "#ec4899" },
  { bg: "bg-teal-100", border: "border-teal-400", text: "text-teal-700", line: "#14b8a6" },
  { bg: "bg-red-100", border: "border-red-400", text: "text-red-700", line: "#ef4444" },
  { bg: "bg-yellow-100", border: "border-yellow-400", text: "text-yellow-700", line: "#eab308" },
];

function getColorForConnection(index: number) {
  return CONNECTION_COLORS[index % CONNECTION_COLORS.length];
}

export function PencocokanForm({
  pertanyaan,
  poin,
  data,
  onChange,
}: PencocokanFormProps) {
  const [selectedKiri, setSelectedKiri] = useState<string | null>(null);

  const handlePertanyaanChange = (value: string) => {
    onChange(value, poin, data);
  };

  const handlePoinChange = (value: string) => {
    const newPoin = parseInt(value) || 3;
    onChange(pertanyaan, newPoin, data);
  };

  // --- Item Kiri ---
  const handleAddItemKiri = () => {
    const newItem: PencocokanItem = { id: nanoid(), text: "" };
    onChange(pertanyaan, poin, {
      ...data,
      itemKiri: [...data.itemKiri, newItem],
    });
  };

  const handleRemoveItemKiri = (id: string) => {
    const newJawaban = { ...data.jawaban };
    delete newJawaban[id];
    onChange(pertanyaan, poin, {
      ...data,
      itemKiri: data.itemKiri.filter((i) => i.id !== id),
      jawaban: newJawaban,
    });
    if (selectedKiri === id) setSelectedKiri(null);
  };

  const handleItemKiriChange = (id: string, text: string) => {
    onChange(pertanyaan, poin, {
      ...data,
      itemKiri: data.itemKiri.map((i) => (i.id === id ? { ...i, text } : i)),
    });
  };

  // --- Item Kanan ---
  const handleAddItemKanan = () => {
    const newItem: PencocokanItem = { id: nanoid(), text: "" };
    onChange(pertanyaan, poin, {
      ...data,
      itemKanan: [...data.itemKanan, newItem],
    });
  };

  const handleRemoveItemKanan = (id: string) => {
    // Remove any jawaban that points to this kanan item
    const newJawaban: Record<string, string> = {};
    for (const [kiriId, kananId] of Object.entries(data.jawaban)) {
      if (kananId !== id) newJawaban[kiriId] = kananId;
    }
    onChange(pertanyaan, poin, {
      ...data,
      itemKanan: data.itemKanan.filter((i) => i.id !== id),
      jawaban: newJawaban,
    });
  };

  const handleItemKananChange = (id: string, text: string) => {
    onChange(pertanyaan, poin, {
      ...data,
      itemKanan: data.itemKanan.map((i) => (i.id === id ? { ...i, text } : i)),
    });
  };

  // --- Connection logic ---
  const handleKiriClick = (kiriId: string) => {
    if (selectedKiri === kiriId) {
      setSelectedKiri(null);
    } else {
      setSelectedKiri(kiriId);
    }
  };

  const handleKananClick = (kananId: string) => {
    if (selectedKiri) {
      // Create connection
      const newJawaban = { ...data.jawaban, [selectedKiri]: kananId };
      onChange(pertanyaan, poin, { ...data, jawaban: newJawaban });
      setSelectedKiri(null);
    }
  };

  const handleRemoveConnection = (kiriId: string) => {
    const newJawaban = { ...data.jawaban };
    delete newJawaban[kiriId];
    onChange(pertanyaan, poin, { ...data, jawaban: newJawaban });
  };

  // Build connection index for coloring
  const connectionEntries = Object.entries(data.jawaban);
  const kiriColorMap: Record<string, number> = {};
  const kananColorMap: Record<string, number> = {};
  connectionEntries.forEach(([kiriId, kananId], idx) => {
    kiriColorMap[kiriId] = idx;
    kananColorMap[kananId] = idx;
  });

  const connectedKananIds = new Set(Object.values(data.jawaban));

  return (
    <div className="space-y-4">
      {/* Pertanyaan */}
      <div className="space-y-2">
        <Label>Pertanyaan / Instruksi *</Label>
        <TiptapEditorWithToolbar
          content={pertanyaan}
          onChange={handlePertanyaanChange}
          placeholder="Tulis instruksi pencocokan di sini... Contoh: Cocokkan gambar dengan pasangannya"
        />
      </div>

      {/* Two columns: Kiri & Kanan */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Item Pencocokan *</Label>
          <p className="text-xs text-muted-foreground">
            Klik item kiri lalu klik item kanan untuk menghubungkan
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Kolom Kiri */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-700">Kolom Kiri</span>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItemKiri}>
                <Plus className="w-3 h-3 mr-1" weight="bold" />
                Tambah
              </Button>
            </div>
            {data.itemKiri.map((item, index) => {
              const isConnected = item.id in data.jawaban;
              const isSelected = selectedKiri === item.id;
              const colorIdx = kiriColorMap[item.id];
              const color = isConnected ? getColorForConnection(colorIdx) : null;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg border-2 transition-all overflow-hidden",
                    isSelected && "border-blue-500 bg-blue-50 ring-2 ring-blue-200",
                    isConnected && !isSelected && `${color?.bg} ${color?.border}`,
                    !isConnected && !isSelected && "border-gray-200 bg-white"
                  )}
                >
                  <div
                    className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer"
                    onClick={() => handleKiriClick(item.id)}
                  >
                    <span className="text-xs font-bold text-gray-400 flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span className="flex-1 text-xs text-muted-foreground">
                      {isSelected ? "Dipilih — klik item kanan →" : isConnected ? "Terhubung" : "Klik untuk hubungkan"}
                    </span>
                    {isConnected && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveConnection(item.id);
                        }}
                        title="Hapus koneksi"
                      >
                        <LinkBreak className="w-3.5 h-3.5 text-red-500" weight="bold" />
                      </Button>
                    )}
                    {data.itemKiri.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveItemKiri(item.id);
                        }}
                      >
                        <X className="w-3.5 h-3.5 text-red-600" weight="bold" />
                      </Button>
                    )}
                  </div>
                  <div className="px-2 pb-2" onClick={(e) => e.stopPropagation()}>
                    <TiptapEditorWithToolbar
                      content={item.text}
                      onChange={(html) => handleItemKiriChange(item.id, html)}
                      placeholder={`Item kiri ${index + 1}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kolom Kanan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-green-700">Kolom Kanan</span>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItemKanan}>
                <Plus className="w-3 h-3 mr-1" weight="bold" />
                Tambah
              </Button>
            </div>
            {data.itemKanan.map((item, index) => {
              const isConnected = connectedKananIds.has(item.id);
              const colorIdx = kananColorMap[item.id];
              const color = isConnected ? getColorForConnection(colorIdx) : null;
              const isTargetable = selectedKiri !== null;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg border-2 transition-all overflow-hidden",
                    isConnected && `${color?.bg} ${color?.border}`,
                    !isConnected && isTargetable && "border-dashed border-green-300 hover:border-green-500 hover:bg-green-50",
                    !isConnected && !isTargetable && "border-gray-200 bg-white"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5",
                      isTargetable && !isConnected && "cursor-pointer"
                    )}
                    onClick={() => isTargetable && handleKananClick(item.id)}
                  >
                    <span className="text-xs font-bold text-gray-400 flex-shrink-0">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="flex-1 text-xs text-muted-foreground">
                      {isConnected ? "Terhubung" : isTargetable ? "← Klik untuk hubungkan" : ""}
                    </span>
                    {data.itemKanan.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveItemKanan(item.id);
                        }}
                      >
                        <X className="w-3.5 h-3.5 text-red-600" weight="bold" />
                      </Button>
                    )}
                  </div>
                  <div className="px-2 pb-2" onClick={(e) => e.stopPropagation()}>
                    <TiptapEditorWithToolbar
                      content={item.text}
                      onChange={(html) => handleItemKananChange(item.id, html)}
                      placeholder={`Item kanan ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Connection summary */}
      {connectionEntries.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Kunci Jawaban ({connectionEntries.length} koneksi)</Label>
          <div className="space-y-1.5">
            {connectionEntries.map(([kiriId, kananId], idx) => {
              const kiriItem = data.itemKiri.find((i) => i.id === kiriId);
              const kananItem = data.itemKanan.find((i) => i.id === kananId);
              const color = getColorForConnection(idx);
              if (!kiriItem || !kananItem) return null;

              return (
                <div
                  key={kiriId}
                  className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm", color.bg)}
                >
                  <LinkSimple className={cn("w-4 h-4 flex-shrink-0", color.text)} weight="bold" />
                  <div className={cn("font-medium flex-1 min-w-0", color.text)}>
                    <MathRenderer content={kiriItem.text || "(kosong)"} className="text-sm line-clamp-1" />
                  </div>
                  <span className="text-gray-400 flex-shrink-0">→</span>
                  <div className={cn("font-medium flex-1 min-w-0", color.text)}>
                    <MathRenderer content={kananItem.text || "(kosong)"} className="text-sm line-clamp-1" />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-auto flex-shrink-0"
                    onClick={() => handleRemoveConnection(kiriId)}
                  >
                    <X className="w-3 h-3 text-red-500" weight="bold" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Poin */}
      <div className="flex items-center justify-end gap-2">
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
  );
}
