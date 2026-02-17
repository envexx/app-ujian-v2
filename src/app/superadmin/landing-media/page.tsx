"use client";

import { useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
  Video,
  Loader2,
  Eye,
  EyeOff,
  GripVertical,
  ExternalLink,
  Upload,
  RectangleHorizontal,
  RectangleVertical,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => r.json());

interface LandingMedia {
  id: string;
  tipe: string;
  judul: string;
  url: string;
  aspectRatio: string;
  urutan: number;
  isActive: boolean;
  createdAt: string;
}

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Landscape)", icon: RectangleHorizontal },
  { value: "9:16", label: "9:16 (Portrait)", icon: RectangleVertical },
  { value: "1:1", label: "1:1 (Kotak)", icon: Square },
];

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/
  );
  return match ? match[1] : null;
}

function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

function AspectRatioPreview({
  url,
  tipe,
  aspectRatio,
  className,
}: {
  url: string;
  tipe: string;
  aspectRatio: string;
  className?: string;
}) {
  const aspectClass =
    aspectRatio === "16:9"
      ? "aspect-video"
      : aspectRatio === "9:16"
      ? "aspect-[9/16]"
      : "aspect-square";

  if (tipe === "video") {
    const videoId = getYouTubeId(url);
    if (!videoId) {
      return (
        <div
          className={cn(
            aspectClass,
            "bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center",
            className
          )}
        >
          <p className="text-xs text-gray-400">URL YouTube tidak valid</p>
        </div>
      );
    }
    return (
      <div className={cn(aspectClass, "rounded-lg overflow-hidden", className)}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        aspectClass,
        "relative rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800",
        className
      )}
    >
      <Image
        src={url}
        alt="Preview"
        fill
        className="object-cover"
        unoptimized
      />
    </div>
  );
}

export default function LandingMediaPage() {
  const { data, mutate, isLoading } = useSWR(
    "/api/superadmin/landing-media",
    fetcher
  );
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewDialog, setPreviewDialog] = useState<LandingMedia | null>(null);

  const [form, setForm] = useState({
    tipe: "image" as string,
    judul: "",
    url: "",
    aspectRatio: "16:9",
    urutan: 0,
  });

  const mediaList: LandingMedia[] = data?.data || [];
  const images = mediaList.filter((m) => m.tipe === "image");
  const videos = mediaList.filter((m) => m.tipe === "video");

  const openCreate = (tipe: "image" | "video") => {
    setEditId(null);
    setForm({ tipe, judul: "", url: "", aspectRatio: "16:9", urutan: 0 });
    setShowDialog(true);
  };

  const openEdit = (media: LandingMedia) => {
    setEditId(media.id);
    setForm({
      tipe: media.tipe,
      judul: media.judul,
      url: media.url,
      aspectRatio: media.aspectRatio,
      urutan: media.urutan,
    });
    setShowDialog(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, GIF)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "landing");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        setForm((prev) => ({ ...prev, url: result.data.url }));
        toast.success("Gambar berhasil diupload");
      } else {
        toast.error(result.error || "Gagal upload gambar");
      }
    } catch {
      toast.error("Gagal upload gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.judul.trim()) {
      toast.error("Judul harus diisi");
      return;
    }
    if (!form.url.trim()) {
      toast.error(form.tipe === "image" ? "Upload gambar terlebih dahulu" : "URL YouTube harus diisi");
      return;
    }
    if (form.tipe === "video" && !getYouTubeId(form.url)) {
      toast.error("URL YouTube tidak valid. Contoh: https://www.youtube.com/watch?v=xxxxx");
      return;
    }

    setSaving(true);
    try {
      const method = editId ? "PUT" : "POST";
      const body = editId ? { id: editId, ...form } : form;

      const res = await fetch("/api/superadmin/landing-media", {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const result = await res.json();

      if (result.success) {
        toast.success(result.message);
        mutate();
        setShowDialog(false);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Gagal menyimpan media");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus media ini?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/superadmin/landing-media?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message);
        mutate();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Gagal menghapus media");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (media: LandingMedia) => {
    try {
      const res = await fetch("/api/superadmin/landing-media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: media.id, isActive: !media.isActive }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(media.isActive ? "Media dinonaktifkan" : "Media diaktifkan");
        mutate();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Gagal mengubah status media");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Landing Page Media
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Kelola gambar preview dan video tutorial untuk landing page
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => openCreate("image")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <ImageIcon className="w-4 h-4 mr-2" /> Tambah Gambar
          </Button>
          <Button
            onClick={() => openCreate("video")}
            variant="outline"
            className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20"
          >
            <Video className="w-4 h-4 mr-2" /> Tambah Video
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Info:</strong> Gambar dan video yang aktif akan ditampilkan
            di landing page. Gunakan aspect ratio yang sesuai:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-blue-600 dark:text-blue-400">
            <li>
              • <strong>16:9 (Landscape)</strong> — Cocok untuk screenshot
              dashboard, demo video
            </li>
            <li>
              • <strong>9:16 (Portrait)</strong> — Cocok untuk tampilan mobile,
              screenshot HP
            </li>
            <li>
              • <strong>1:1 (Kotak)</strong> — Cocok untuk icon, logo, thumbnail
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Preview Images Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-500" />
          Gambar Preview ({images.length})
        </h2>
        {images.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="w-12 h-12 text-gray-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Belum ada gambar preview
              </p>
              <Button
                onClick={() => openCreate("image")}
                variant="outline"
                className="mt-3"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah Gambar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                onPreview={setPreviewDialog}
                deleting={deleting}
              />
            ))}
          </div>
        )}
      </div>

      {/* Videos Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Video className="w-5 h-5 text-purple-500" />
          Video Tutorial / Demo ({videos.length})
        </h2>
        {videos.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="w-12 h-12 text-gray-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Belum ada video tutorial
              </p>
              <Button
                onClick={() => openCreate("video")}
                variant="outline"
                className="mt-3"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah Video
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                onPreview={setPreviewDialog}
                deleting={deleting}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit" : "Tambah"}{" "}
              {form.tipe === "image" ? "Gambar" : "Video"}
            </DialogTitle>
            <DialogDescription>
              {form.tipe === "image"
                ? "Upload gambar preview untuk landing page. Pastikan ukuran dan aspect ratio sesuai."
                : "Tambahkan link YouTube untuk video tutorial atau demo."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Judul */}
            <div className="space-y-2">
              <Label>Judul / Caption</Label>
              <Input
                value={form.judul}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, judul: e.target.value }))
                }
                placeholder={
                  form.tipe === "image"
                    ? "Contoh: Dashboard Analitik Nilai"
                    : "Contoh: Tutorial Membuat Ujian Online"
                }
              />
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <Select
                value={form.aspectRatio}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, aspectRatio: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map((ar) => (
                    <SelectItem key={ar.value} value={ar.value}>
                      <div className="flex items-center gap-2">
                        <ar.icon className="w-4 h-4" />
                        {ar.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                {form.aspectRatio === "16:9" &&
                  "Landscape — cocok untuk screenshot dashboard, video demo"}
                {form.aspectRatio === "9:16" &&
                  "Portrait — cocok untuk screenshot tampilan mobile"}
                {form.aspectRatio === "1:1" &&
                  "Kotak — cocok untuk icon, logo, thumbnail"}
              </p>
            </div>

            {/* URL / Upload */}
            {form.tipe === "image" ? (
              <div className="space-y-2">
                <Label>Gambar</Label>
                <div className="space-y-3">
                  {/* Upload button */}
                  <div className="flex items-center gap-3">
                    <label className="flex-1">
                      <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
                        {uploading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                        ) : (
                          <Upload className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-500 dark:text-slate-400">
                          {uploading
                            ? "Mengupload..."
                            : "Klik untuk upload gambar"}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  {/* Or manual URL */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                    <span className="text-xs text-gray-400">atau</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                  </div>
                  <Input
                    value={form.url}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, url: e.target.value }))
                    }
                    placeholder="Masukkan URL gambar langsung"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>URL YouTube</Label>
                <Input
                  value={form.url}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder="https://www.youtube.com/watch?v=xxxxx"
                />
                <p className="text-xs text-gray-400">
                  Paste link YouTube. Format yang didukung: youtube.com/watch?v=
                  atau youtu.be/
                </p>
              </div>
            )}

            {/* Urutan */}
            <div className="space-y-2">
              <Label>Urutan Tampil</Label>
              <Input
                type="number"
                min={0}
                value={form.urutan}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    urutan: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="0"
              />
              <p className="text-xs text-gray-400">
                Angka lebih kecil tampil lebih dulu
              </p>
            </div>

            {/* Preview */}
            {form.url && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="max-w-xs">
                  <AspectRatioPreview
                    url={form.url}
                    tipe={form.tipe}
                    aspectRatio={form.aspectRatio}
                  />
                </div>
              </div>
            )}

            {/* Save */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || uploading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editId ? "Update" : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewDialog}
        onOpenChange={() => setPreviewDialog(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewDialog?.judul}</DialogTitle>
            <DialogDescription>
              {previewDialog?.tipe === "image" ? "Gambar" : "Video"} •{" "}
              {previewDialog?.aspectRatio}
            </DialogDescription>
          </DialogHeader>
          {previewDialog && (
            <div className="mt-2">
              <AspectRatioPreview
                url={previewDialog.url}
                tipe={previewDialog.tipe}
                aspectRatio={previewDialog.aspectRatio}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Media Card Component                                               */
/* ------------------------------------------------------------------ */

function MediaCard({
  media,
  onEdit,
  onDelete,
  onToggleActive,
  onPreview,
  deleting,
}: {
  media: LandingMedia;
  onEdit: (m: LandingMedia) => void;
  onDelete: (id: string) => void;
  onToggleActive: (m: LandingMedia) => void;
  onPreview: (m: LandingMedia) => void;
  deleting: string | null;
}) {
  const thumbnail =
    media.tipe === "video"
      ? getYouTubeThumbnail(media.url)
      : media.url;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        !media.isActive && "opacity-60"
      )}
    >
      {/* Thumbnail */}
      <button
        onClick={() => onPreview(media)}
        className="w-full relative aspect-video bg-gray-100 dark:bg-slate-800 overflow-hidden group"
      >
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={media.judul}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {media.tipe === "video" ? (
              <Video className="w-10 h-10 text-gray-300 dark:text-slate-600" />
            ) : (
              <ImageIcon className="w-10 h-10 text-gray-300 dark:text-slate-600" />
            )}
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-semibold",
              media.tipe === "video"
                ? "bg-red-500 text-white"
                : "bg-blue-500 text-white"
            )}
          >
            {media.tipe === "video" ? "VIDEO" : "IMAGE"}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-black/50 text-white">
            {media.aspectRatio}
          </span>
        </div>

        {!media.isActive && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-500 text-white">
              NONAKTIF
            </span>
          </div>
        )}

        {/* Play button overlay for videos */}
        {media.tipe === "video" && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[16px] border-l-white border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1" />
            </div>
          </div>
        )}
      </button>

      <CardContent className="p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {media.judul}
        </p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
          Urutan: {media.urutan}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleActive(media)}
            className="h-8 px-2"
            title={media.isActive ? "Nonaktifkan" : "Aktifkan"}
          >
            {media.isActive ? (
              <Eye className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-gray-400" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(media)}
            className="h-8 px-2"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5 text-blue-500" />
          </Button>
          {media.tipe === "video" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(media.url, "_blank")}
              className="h-8 px-2"
              title="Buka di YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </Button>
          )}
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(media.id)}
            disabled={deleting === media.id}
            className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Hapus"
          >
            {deleting === media.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
