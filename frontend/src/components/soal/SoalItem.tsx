"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DotsSixVertical, CaretDown, CaretUp, Trash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { TipeSoal } from "@/types/soal";
import { TIPE_SOAL_LABELS } from "@/types/soal";

interface SoalItemProps {
  id: string;
  index: number;
  tipe: TipeSoal;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onDelete: () => void;
  canDelete?: boolean;
  children: React.ReactNode;
}

export function SoalItem({
  id,
  index,
  tipe,
  isCollapsed,
  onToggleCollapse,
  onDelete,
  canDelete = true,
  children,
}: SoalItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getTipeBadgeColor = (tipe: TipeSoal) => {
    switch (tipe) {
      case 'PILIHAN_GANDA':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ESSAY':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ISIAN_SINGKAT':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PENCOCOKAN':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'BENAR_SALAH':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        className={cn(
          "p-4 border rounded-lg space-y-4 bg-white",
          isDragging && "shadow-lg ring-2 ring-blue-500"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {/* Drag Handle */}
            <button
              type="button"
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors"
              {...attributes}
              {...listeners}
            >
              <DotsSixVertical className="w-5 h-5 text-gray-400" weight="bold" />
            </button>

            {/* Nomor & Badge Tipe */}
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">Soal {index + 1}</h4>
              <Badge
                variant="outline"
                className={cn("text-xs font-medium", getTipeBadgeColor(tipe))}
              >
                {TIPE_SOAL_LABELS[tipe]}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Collapse/Expand Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <CaretDown className="w-4 h-4" weight="bold" />
              ) : (
                <CaretUp className="w-4 h-4" weight="bold" />
              )}
            </Button>

            {/* Delete Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={!canDelete}
              className="h-8 w-8 p-0 hover:bg-red-50"
            >
              <Trash
                className={cn(
                  "w-4 h-4",
                  canDelete ? "text-red-600" : "text-gray-300"
                )}
                weight="duotone"
              />
            </Button>
          </div>
        </div>

        {/* Content (Collapsible) */}
        {!isCollapsed && <div className="pt-2">{children}</div>}
      </div>
    </div>
  );
}
