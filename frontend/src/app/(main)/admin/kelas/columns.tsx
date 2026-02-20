"use client";

import { Button } from "@/components/ui/button";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";

export interface Kelas {
  id: string;
  tingkatan: number;
  namaKelas: string;
  kapasitas: number;
  jumlahSiswa: number;
  status: string;
  tahunAjaran: string;
}

export const createColumns = (
  onEdit: (kelas: Kelas) => void,
  onDelete: (id: string) => void
): ColumnDef<Kelas>[] => [
  {
    accessorKey: "tingkatan",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tingkatan
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>Kelas {row.getValue("tingkatan")}</div>,
  },
  {
    accessorKey: "namaKelas",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nama Kelas
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("namaKelas")}</div>,
  },
  {
    accessorKey: "kapasitas",
    header: "Kapasitas",
    cell: ({ row }) => <div>{row.getValue("kapasitas")}</div>,
  },
  {
    accessorKey: "jumlahSiswa",
    header: "Jumlah Siswa",
    cell: ({ row }) => <div>{row.getValue("jumlahSiswa")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            status === "aktif"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "tahunAjaran",
    header: "Tahun Ajaran",
    cell: ({ row }) => <div>{row.getValue("tahunAjaran")}</div>,
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const kelas = row.original;

      return (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(kelas)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(kelas.id)}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      );
    },
  },
];
