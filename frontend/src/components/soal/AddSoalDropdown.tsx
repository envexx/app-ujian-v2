"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ListChecks, Article, TextT, ArrowsLeftRight, CheckCircle } from "@phosphor-icons/react";
import type { TipeSoal } from "@/types/soal";

interface AddSoalDropdownProps {
  onAddSoal: (tipe: TipeSoal) => void;
}

export function AddSoalDropdown({ onAddSoal }: AddSoalDropdownProps) {
  const soalTypes: Array<{ tipe: TipeSoal; label: string; icon: React.ReactNode; description: string }> = [
    {
      tipe: 'PILIHAN_GANDA',
      label: 'Pilihan Ganda',
      icon: <ListChecks className="w-4 h-4" weight="duotone" />,
      description: 'Soal dengan 4 pilihan jawaban (A, B, C, D)',
    },
    {
      tipe: 'ESSAY',
      label: 'Essay',
      icon: <Article className="w-4 h-4" weight="duotone" />,
      description: 'Soal dengan jawaban panjang/uraian',
    },
    {
      tipe: 'ISIAN_SINGKAT',
      label: 'Isian Singkat',
      icon: <TextT className="w-4 h-4" weight="duotone" />,
      description: 'Soal dengan jawaban singkat',
    },
    {
      tipe: 'PENCOCOKAN',
      label: 'Pencocokan',
      icon: <ArrowsLeftRight className="w-4 h-4" weight="duotone" />,
      description: 'Soal mencocokkan pasangan item',
    },
    {
      tipe: 'BENAR_SALAH',
      label: 'Benar/Salah',
      icon: <CheckCircle className="w-4 h-4" weight="duotone" />,
      description: 'Soal dengan jawaban benar atau salah',
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" weight="bold" />
          Tambah Soal
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {soalTypes.map((type) => (
          <DropdownMenuItem
            key={type.tipe}
            onClick={() => onAddSoal(type.tipe)}
            className="cursor-pointer"
          >
            <div className="flex items-start gap-3 py-1">
              <div className="mt-0.5">{type.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-muted-foreground">
                  {type.description}
                </div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
