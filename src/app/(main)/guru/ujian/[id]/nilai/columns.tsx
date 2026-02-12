"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, CaretUpDown, PencilSimple } from "@phosphor-icons/react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export type NilaiSubmission = {
  id: string | null
  siswaId: string
  siswa: string
  nisn?: string
  submittedAt: string | null
  nilaiAuto: number | null
  nilaiManual: number | null
  nilaiTotal: number | null
  status: 'belum' | 'sudah' | 'perlu_dinilai'
  allGraded: boolean
  jawaban: {
    id: string
    soalId: string
    jawaban: any
    nilai: number | null
    feedback: string | null
    isCorrect: boolean | null
  }[]
}

export const createNilaiColumns = (
  onGradeClick: (submission: NilaiSubmission) => void,
  hasManualSoal: boolean
): ColumnDef<NilaiSubmission>[] => {
  const columns: ColumnDef<NilaiSubmission>[] = [
    {
      accessorKey: "siswa",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0"
          >
            Nama Siswa
            <CaretUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("siswa")}</div>
          {row.original.nisn && (
            <div className="text-xs text-muted-foreground">{row.original.nisn}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: "Tanggal Submit",
      cell: ({ row }) => {
        const date = row.getValue("submittedAt") as string | null
        if (!date) return <span className="text-muted-foreground">-</span>

        try {
          const parsedDate = new Date(date)
          if (isNaN(parsedDate.getTime())) {
            return <span className="text-muted-foreground">-</span>
          }
          return (
            <span className="text-sm">
              {format(parsedDate, "dd MMM yyyy HH:mm", { locale: id })}
            </span>
          )
        } catch (error) {
          return <span className="text-muted-foreground">-</span>
        }
      },
    },
    {
      accessorKey: "nilaiAuto",
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="hover:bg-transparent p-0"
            >
              Otomatis
              <CaretUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const nilai = row.getValue("nilaiAuto") as number | null
        return (
          <div className="text-center font-medium">
            {nilai !== null ? nilai : "-"}
          </div>
        )
      },
    },
  ]

  // Only show manual column if there are essay/manual soal
  if (hasManualSoal) {
    columns.push({
      accessorKey: "nilaiManual",
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="hover:bg-transparent p-0"
            >
              Essay
              <CaretUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const nilai = row.getValue("nilaiManual") as number | null
        return (
          <div className="text-center font-medium">
            {nilai !== null ? nilai : <span className="text-muted-foreground">-</span>}
          </div>
        )
      },
    })
  }

  columns.push(
    {
      accessorKey: "nilaiTotal",
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="hover:bg-transparent p-0"
            >
              Nilai Total
              <CaretUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const nilai = row.getValue("nilaiTotal") as number | null
        return (
          <div className="text-center">
            {nilai !== null ? (
              <span className="font-bold text-lg text-blue-600">{nilai}</span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge
            variant={
              status === "sudah"
                ? "default"
                : status === "perlu_dinilai"
                ? "secondary"
                : "outline"
            }
            className={
              status === "sudah"
                ? "bg-green-100 text-green-700 hover:bg-green-100"
                : status === "perlu_dinilai"
                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                : ""
            }
          >
            {status === "sudah" ? "Selesai" : status === "perlu_dinilai" ? "Perlu Dinilai" : "Belum"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const submission = row.original

        if (submission.status === "belum") {
          return <div className="text-right text-muted-foreground text-sm">-</div>
        }

        return (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onGradeClick(submission)}
              className="gap-1.5"
            >
              {submission.status === "perlu_dinilai" ? (
                <>
                  <PencilSimple className="w-4 h-4" weight="bold" />
                  Nilai
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Detail
                </>
              )}
            </Button>
          </div>
        )
      },
    },
  )

  return columns
}
