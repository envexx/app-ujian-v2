"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Pencil, Users, GraduationCap, BookOpen, School, ClipboardList, HardDrive, Loader2, Check, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { superadminFetcher, superadminFetch } from '../_lib/fetcher';

const emptyTier = {
  nama: "", label: "", harga: 0, maxSiswa: 50, maxGuru: 5,
  maxKelas: 5, maxMapel: 10, maxUjian: 10, maxStorage: 500, urutan: 0,
  fipitur: {} as Record<string, boolean>,
};

const PRESET_FEATURES = [
  { key: "ujianOnline", label: "Ujian Online (CBT)" },
  { key: "bankSoal", label: "Bank Soal" },
  { key: "autoGrading", label: "Auto-Grading" },
  { key: "exportPdf", label: "Export PDF" },
  { key: "bulkImport", label: "Bulk Import Data" },
  { key: "aiChatbot", label: "AI Generate Soal" },
  { key: "dashboardAnalitik", label: "Dashboard Analitik" },
  { key: "prioritySupport", label: "Priority Support" },
  { key: "customBranding", label: "Custom Branding" },
  { key: "apiAccess", label: "API Access" },
];

export default function TiersPage() {
  const { data, mutate, isLoading } = useSWR("/api/superadmin/tiers", superadminFetcher);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyTier);
  const [saving, setSaving] = useState(false);
  const [newFeatureKey, setNewFeatureKey] = useState("");
  const [newFeatureLabel, setNewFeatureLabel] = useState("");

  const tiers = data?.data || [];

  // Collect all known feature keys from presets + all tiers
  const allFeatureKeys = new Set<string>(PRESET_FEATURES.map(f => f.key));
  tiers.forEach((tier: any) => {
    if (tier.fipitur && typeof tier.fipitur === "object") {
      Object.keys(tier.fipitur).forEach((k: string) => allFeatureKeys.add(k));
    }
  });

  // Build label map: preset labels + custom keys as-is
  const featureLabelMap: Record<string, string> = {};
  PRESET_FEATURES.forEach(f => { featureLabelMap[f.key] = f.label; });
  allFeatureKeys.forEach(k => { if (!featureLabelMap[k]) featureLabelMap[k] = k; });

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyTier, fipitur: {} });
    setShowDialog(true);
  };

  const openEdit = (tier: any) => {
    setEditId(tier.id);
    setForm({
      nama: tier.nama, label: tier.label, harga: tier.harga,
      maxSiswa: tier.maxSiswa, maxGuru: tier.maxGuru, maxKelas: tier.maxKelas,
      maxMapel: tier.maxMapel, maxUjian: tier.maxUjian, maxStorage: tier.maxStorage,
      urutan: tier.urutan,
      fipitur: tier.fipitur || {},
    });
    setShowDialog(true);
  };

  const toggleFeature = (key: string) => {
    const current = form.fipitur || {};
    setForm({ ...form, fipitur: { ...current, [key]: !current[key] } });
  };

  const removeFeature = (key: string) => {
    const current = { ...(form.fipitur || {}) };
    delete current[key];
    setForm({ ...form, fipitur: current });
  };

  const addCustomFeature = () => {
    const key = newFeatureKey.trim().replace(/\s+/g, "");
    if (!key) { toast.error("Key fitur harus diisi"); return; }
    if (form.fipitur?.[key] !== undefined) { toast.error("Fitur sudah ada"); return; }
    setForm({ ...form, fipitur: { ...form.fipitur, [key]: true } });
    if (newFeatureLabel.trim()) {
      featureLabelMap[key] = newFeatureLabel.trim();
    }
    setNewFeatureKey("");
    setNewFeatureLabel("");
  };

  const handleSave = async () => {
    if (!form.nama || !form.label) { toast.error("Nama dan label harus diisi"); return; }
    setSaving(true);
    try {
      const url = "/api/superadmin/tiers";
      const method = editId ? "PUT" : "POST";
      const body = editId ? { id: editId, ...form } : form;

      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message);
        mutate();
        setShowDialog(false);
      } else {
        toast.error(result.error);
      }
    } catch { toast.error("Gagal menyimpan tier"); }
    finally { setSaving(false); }
  };

  const formatRupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const tierColors = ["bg-gray-100 dark:bg-slate-800", "bg-blue-50 dark:bg-blue-900/20", "bg-green-50 dark:bg-green-900/20", "bg-purple-50 dark:bg-purple-900/20", "bg-amber-50 dark:bg-amber-900/20"];

  const getActiveFeatures = (fipitur: Record<string, boolean> | null) => {
    if (!fipitur) return [];
    return Object.entries(fipitur).filter(([, v]) => v).map(([k]) => featureLabelMap[k] || k);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kelola Tier</h1>
        <Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" /> Tambah Tier
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 animate-pulse">
              <CardContent className="p-6"><div className="h-32" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiers.map((tier: any, idx: number) => (
            <Card key={tier.id} className={cn("border-gray-200 dark:border-slate-800 relative overflow-hidden", tierColors[idx % tierColors.length])}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-gray-900 dark:text-white">{tier.label}</CardTitle>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white" onClick={() => openEdit(tier)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {tier.harga === 0 ? "Gratis" : formatRupiah(tier.harga)}
                  {tier.harga > 0 && <span className="text-xs font-normal text-gray-400 dark:text-slate-500">/bulan</span>}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                    <span>{tier.maxSiswa >= 99999 ? "∞" : tier.maxSiswa} Siswa</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300">
                    <Users className="w-3.5 h-3.5 text-green-500" />
                    <span>{tier.maxGuru >= 99999 ? "∞" : tier.maxGuru} Guru</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300">
                    <School className="w-3.5 h-3.5 text-purple-500" />
                    <span>{tier.maxKelas >= 99999 ? "∞" : tier.maxKelas} Kelas</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300">
                    <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                    <span>{tier.maxMapel >= 99999 ? "∞" : tier.maxMapel} Mapel</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300">
                    <ClipboardList className="w-3.5 h-3.5 text-red-500" />
                    <span>{tier.maxUjian >= 99999 ? "∞" : tier.maxUjian} Ujian</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{tier.maxStorage >= 100000 ? "∞" : `${tier.maxStorage} MB`}</span>
                  </div>
                </div>

                {/* Feature list */}
                {getActiveFeatures(tier.fipitur).length > 0 && (
                  <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Fitur:</p>
                    <div className="flex flex-wrap gap-1">
                      {getActiveFeatures(tier.fipitur).map((f) => (
                        <span key={f} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <Check className="w-3 h-3" />{f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {tier._count?.schools || 0} sekolah menggunakan tier ini
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Tier" : "Tambah Tier Baru"}</DialogTitle>
            <DialogDescription>Atur batas, harga, dan fitur untuk tier ini</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nama (slug)</Label>
                <Input placeholder="basic" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} disabled={!!editId} />
              </div>
              <div className="space-y-1.5">
                <Label>Label (display)</Label>
                <Input placeholder="Basic" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Harga / bulan (IDR)</Label>
                <Input type="number" value={form.harga} onChange={(e) => setForm({ ...form, harga: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label>Urutan</Label>
                <Input type="number" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Max Siswa</Label>
                <Input type="number" value={form.maxSiswa} onChange={(e) => setForm({ ...form, maxSiswa: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Guru</Label>
                <Input type="number" value={form.maxGuru} onChange={(e) => setForm({ ...form, maxGuru: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Kelas</Label>
                <Input type="number" value={form.maxKelas} onChange={(e) => setForm({ ...form, maxKelas: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Max Mapel</Label>
                <Input type="number" value={form.maxMapel} onChange={(e) => setForm({ ...form, maxMapel: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Ujian</Label>
                <Input type="number" value={form.maxUjian} onChange={(e) => setForm({ ...form, maxUjian: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label>Storage (MB)</Label>
                <Input type="number" value={form.maxStorage} onChange={(e) => setForm({ ...form, maxStorage: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <Separator />

            {/* Dynamic Features */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Fitur Tier</Label>
              <p className="text-xs text-muted-foreground">Klik untuk mengaktifkan/menonaktifkan fitur. Gunakan tombol hapus untuk menghapus fitur dari tier ini.</p>

              <div className="space-y-1.5">
                {PRESET_FEATURES.map((pf) => {
                  const isActive = form.fipitur?.[pf.key] === true;
                  return (
                    <div key={pf.key} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50">
                      <button
                        type="button"
                        onClick={() => toggleFeature(pf.key)}
                        className="flex items-center gap-2 text-sm flex-1 text-left"
                      >
                        <div className={cn(
                          "w-5 h-5 rounded flex items-center justify-center border transition-colors",
                          isActive ? "bg-green-500 border-green-500 text-white" : "border-gray-300 dark:border-slate-600"
                        )}>
                          {isActive && <Check className="w-3 h-3" />}
                        </div>
                        <span className={cn(isActive ? "text-foreground" : "text-muted-foreground")}>{pf.label}</span>
                      </button>
                    </div>
                  );
                })}

                {/* Custom features (non-preset) */}
                {Object.keys(form.fipitur || {}).filter(k => !PRESET_FEATURES.some(pf => pf.key === k)).map((key) => {
                  const isActive = form.fipitur[key] === true;
                  return (
                    <div key={key} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50">
                      <button
                        type="button"
                        onClick={() => toggleFeature(key)}
                        className="flex items-center gap-2 text-sm flex-1 text-left"
                      >
                        <div className={cn(
                          "w-5 h-5 rounded flex items-center justify-center border transition-colors",
                          isActive ? "bg-green-500 border-green-500 text-white" : "border-gray-300 dark:border-slate-600"
                        )}>
                          {isActive && <Check className="w-3 h-3" />}
                        </div>
                        <span className={cn(isActive ? "text-foreground" : "text-muted-foreground")}>{featureLabelMap[key] || key}</span>
                        <span className="text-xs text-muted-foreground ml-1">(custom)</span>
                      </button>
                      <button type="button" onClick={() => removeFeature(key)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add custom feature */}
              <div className="flex items-end gap-2 pt-1">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Key</Label>
                  <Input
                    placeholder="namaFitur"
                    value={newFeatureKey}
                    onChange={(e) => setNewFeatureKey(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Label (opsional)</Label>
                  <Input
                    placeholder="Nama Fitur"
                    value={newFeatureLabel}
                    onChange={(e) => setNewFeatureLabel(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addCustomFeature} className="h-8">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editId ? "Update Tier" : "Buat Tier"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
