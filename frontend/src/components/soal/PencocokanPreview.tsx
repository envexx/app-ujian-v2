"use client";

import React, { useRef, useEffect, useState } from "react";
import { MathRenderer } from "@/components/ui/math-renderer";
import { CheckCircle, ArrowsLeftRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { PencocokanData } from "@/types/soal";

// Color palette for matching lines
const MATCH_COLORS = [
  { stroke: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },   // blue
  { stroke: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },   // amber
  { stroke: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },   // violet
  { stroke: '#10b981', bg: 'rgba(16,185,129,0.08)' },   // emerald
  { stroke: '#ef4444', bg: 'rgba(239,68,68,0.08)' },    // red
  { stroke: '#ec4899', bg: 'rgba(236,72,153,0.08)' },   // pink
  { stroke: '#06b6d4', bg: 'rgba(6,182,212,0.08)' },    // cyan
  { stroke: '#f97316', bg: 'rgba(249,115,22,0.08)' },   // orange
];

interface PencocokanPreviewProps {
  data: PencocokanData;
  showKey?: boolean;
  soalId?: string;
}

export function PencocokanPreview({ data, showKey = false, soalId = 'preview' }: PencocokanPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const kiriRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const kananRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; color: string; kiriId: string }[]>([]);

  const jawabanEntries = Object.entries(data.jawaban || {});

  // Assign a stable color index per kiri item
  const kiriColorMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    data.itemKiri?.forEach((item, idx) => {
      map[item.id] = idx % MATCH_COLORS.length;
    });
    return map;
  }, [data.itemKiri]);

  // Find which kanan is connected to which kiri
  const kananToKiri: Record<string, string> = {};
  jawabanEntries.forEach(([kId, knId]) => {
    kananToKiri[knId as string] = kId;
  });

  // Recalculate lines whenever mapping changes
  useEffect(() => {
    const calcLines = () => {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const newLines: typeof lines = [];

      jawabanEntries.forEach(([kiriId, kananId]) => {
        const kiriEl = kiriRefs.current[kiriId];
        const kananEl = kananRefs.current[kananId as string];
        if (kiriEl && kananEl) {
          const kiriRect = kiriEl.getBoundingClientRect();
          const kananRect = kananEl.getBoundingClientRect();
          newLines.push({
            x1: kiriRect.right - containerRect.left,
            y1: kiriRect.top + kiriRect.height / 2 - containerRect.top,
            x2: kananRect.left - containerRect.left,
            y2: kananRect.top + kananRect.height / 2 - containerRect.top,
            color: MATCH_COLORS[kiriColorMap[kiriId] || 0].stroke,
            kiriId,
          });
        }
      });
      setLines(newLines);
    };

    // Small delay to let DOM settle
    const timer = setTimeout(calcLines, 50);
    window.addEventListener('resize', calcLines);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calcLines);
    };
  }, [data.jawaban, kiriColorMap, jawabanEntries]);

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="relative">
        {/* SVG overlay for connecting lines */}
        {showKey && lines.length > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <defs>
              {lines.map((line, i) => (
                <linearGradient key={`grad-${i}`} id={`previewMatchGrad-${soalId}-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={line.color} stopOpacity="0.9" />
                  <stop offset="50%" stopColor={line.color} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={line.color} stopOpacity="0.9" />
                </linearGradient>
              ))}
            </defs>
            {lines.map((line, i) => {
              const dx = line.x2 - line.x1;
              const cp1x = line.x1 + dx * 0.4;
              const cp2x = line.x1 + dx * 0.6;
              return (
                <g key={i}>
                  {/* Glow effect */}
                  <path
                    d={`M ${line.x1} ${line.y1} C ${cp1x} ${line.y1}, ${cp2x} ${line.y2}, ${line.x2} ${line.y2}`}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="6"
                    strokeOpacity="0.15"
                    strokeLinecap="round"
                  />
                  {/* Main line */}
                  <path
                    d={`M ${line.x1} ${line.y1} C ${cp1x} ${line.y1}, ${cp2x} ${line.y2}, ${line.x2} ${line.y2}`}
                    fill="none"
                    stroke={`url(#previewMatchGrad-${soalId}-${i})`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Start dot */}
                  <circle cx={line.x1} cy={line.y1} r="4" fill={line.color} fillOpacity="0.8" />
                  {/* End dot */}
                  <circle cx={line.x2} cy={line.y2} r="4" fill={line.color} fillOpacity="0.8" />
                </g>
              );
            })}
          </svg>
        )}

        <div className="grid grid-cols-[1fr_auto_1fr] gap-0">
          {/* Left column */}
          <div className="space-y-2 pr-4">
            <p className="text-xs font-semibold text-blue-700 mb-2">Pernyataan</p>
            {data.itemKiri?.map((item, idx) => {
              const isConnected = !!data.jawaban[item.id];
              const colorIdx = kiriColorMap[item.id] || 0;
              return (
                <div
                  key={item.id}
                  ref={(el) => { kiriRefs.current[item.id] = el; }}
                  className={cn(
                    "p-3 rounded-lg border-2 text-sm transition-all relative z-[2]",
                    showKey && isConnected
                      ? "bg-white"
                      : "border-blue-200 bg-blue-50"
                  )}
                  style={showKey && isConnected ? {
                    borderColor: MATCH_COLORS[colorIdx].stroke,
                    backgroundColor: MATCH_COLORS[colorIdx].bg,
                  } : undefined}
                >
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <MathRenderer content={item.text || ""} className="text-sm text-gray-900" />
                  </div>
                  {showKey && isConnected && (
                    <span
                      className="ml-8 text-xs font-medium"
                      style={{ color: MATCH_COLORS[colorIdx].stroke }}
                    >
                      → {String.fromCharCode(65 + (data.itemKanan?.findIndex(k => k.id === data.jawaban[item.id]) ?? 0))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Center spacer for lines */}
          <div className="w-12" />

          {/* Right column */}
          <div className="space-y-2 pl-4">
            <p className="text-xs font-semibold text-orange-700 mb-2">Pasangan</p>
            {data.itemKanan?.map((item, idx) => {
              const connectedKiriId = kananToKiri[item.id];
              const colorIdx = connectedKiriId ? (kiriColorMap[connectedKiriId] || 0) : 0;
              return (
                <div
                  key={item.id}
                  ref={(el) => { kananRefs.current[item.id] = el; }}
                  className={cn(
                    "p-3 rounded-lg border-2 text-sm transition-all relative z-[2]",
                    showKey && connectedKiriId
                      ? "bg-white"
                      : "border-orange-200 bg-orange-50"
                  )}
                  style={showKey && connectedKiriId ? {
                    borderColor: MATCH_COLORS[colorIdx].stroke,
                    backgroundColor: MATCH_COLORS[colorIdx].bg,
                  } : undefined}
                >
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-200 text-orange-800 flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <MathRenderer content={item.text || ""} className="text-sm text-gray-900" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Answer key summary (text version) */}
      {showKey && jawabanEntries.length > 0 && (
        <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" weight="fill" />
            <p className="text-xs font-semibold text-green-700">Kunci Jawaban (Pasangan Benar)</p>
          </div>
          <div className="space-y-1.5">
            {jawabanEntries.map(([kiriId, kananId]) => {
              const kiriItem = data.itemKiri?.find(i => i.id === kiriId);
              const kananItem = data.itemKanan?.find(i => i.id === kananId);
              const kiriIdx = data.itemKiri?.findIndex(i => i.id === kiriId) ?? -1;
              const kananIdx = data.itemKanan?.findIndex(i => i.id === kananId) ?? -1;
              if (!kiriItem || !kananItem) return null;
              return (
                <div key={kiriId} className="flex items-center gap-2 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">
                    {kiriIdx + 1}
                  </span>
                  <ArrowsLeftRight className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-200 text-orange-800 flex items-center justify-center text-xs font-bold">
                    {String.fromCharCode(65 + kananIdx)}
                  </span>
                  <span className="text-green-800 text-xs truncate">
                    {kiriItem.text?.replace(/<[^>]*>/g, '').slice(0, 30)} → {kananItem.text?.replace(/<[^>]*>/g, '').slice(0, 30)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {jawabanEntries.length === 0 && data.itemKiri?.length > 0 && (
        <p className="text-sm text-muted-foreground italic">Belum ada koneksi jawaban yang ditentukan</p>
      )}
    </div>
  );
}
