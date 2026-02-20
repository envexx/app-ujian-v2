"use client";


import { fetchApi } from '@/lib/fetch-api';
import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Send, Pencil, Trash2, Loader2, Bell, Info, AlertTriangle, Wrench, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

import { superadminFetcher, superadminFetch } from '../_lib/fetcher';

const TIPE_OPTIONS = [
  { value: "info", label: "Info", icon: Info, color: "text-blue-500" },
  { value: "warning", label: "Warning", icon: AlertTriangle, color: "text-yellow-500" },
  { value: "update", label: "Update", icon: Bell, color: "text-green-500" },
  { value: "maintenance", label: "Maintenance", icon: Wrench, color: "text-orange-500" },
  { value: "promo", label: "Promo", icon: Megaphone, color: "text-purple-500" },
];

const PRIORITY_OPTIONS = ["low", "normal", "high", "urgent"];
const ROLE_OPTIONS = ["ALL", "ADMIN", "GURU", "SISWA"];

const emptyForm = {
  judul: "", pesan: "", tipe: "info", targetRole: ["ALL"] as string[],
  priority: "normal", expiresAt: "",
};

export default function NotificationsPage() {
  const { data, mutate, isLoading } = useSWR("/api/superadmin/notifications", superadminFetcher);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);

  const notifications = data?.data || [];

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setShowDialog(true);
  };

  const openEdit = (n: any) => {
    setEditId(n.id);
    setForm({
      judul: n.judul, pesan: n.pesan, tipe: n.tipe,
      targetRole: n.targetRole || ["ALL"], priority: n.priority || "normal",
      expiresAt: n.expiresAt ? new Date(n.expiresAt).toISOString().slice(0, 16) : "",
    });
    setShowDialog(true);
  };

  const handleSave = async (publish = false) => {
    if (!form.judul || !form.pesan) { toast.error("Judul dan pesan harus diisi"); return; }
    setSaving(true);
    try {
      const method = editId ? "PUT" : "POST";
      const body = editId
        ? { id: editId, ...form, publish }
        : { ...form, publish };

      const res = await fetchApi("/api/superadmin/notifications", {
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
    } catch { toast.error("Gagal menyimpan notifikasi"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus notifikasi ini?")) return;
    try {
      const res = await fetchApi(`/api/superadmin/notifications?id=${id}`, {
        method: "DELETE", credentials: "include",
      });
      const result = await res.json();
      if (result.success) { toast.success(result.message); mutate(); }
      else toast.error(result.error);
    } catch { toast.error("Gagal menghapus"); }
  };

  const toggleRole = (role: string) => {
    const current = form.targetRole || [];
    if (role === "ALL") {
      setForm({ ...form, targetRole: ["ALL"] });
    } else {
      const filtered = current.filter((r: string) => r !== "ALL");
      if (filtered.includes(role)) {
        setForm({ ...form, targetRole: filtered.filter((r: string) => r !== role) });
      } else {
        setForm({ ...form, targetRole: [...filtered, role] });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifikasi Platform</h1>
        <Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" /> Buat Notifikasi
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 animate-pulse">
              <CardContent className="p-4"><div className="h-16" /></CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
          <CardContent className="p-8 text-center text-gray-400 dark:text-slate-400">
            Belum ada notifikasi. Klik tombol di atas untuk membuat notifikasi baru.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n: any) => {
            const tipeConfig = TIPE_OPTIONS.find((t) => t.value === n.tipe) || TIPE_OPTIONS[0];
            const TipeIcon = tipeConfig.icon;
            return (
              <Card key={n.id} className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn("mt-0.5 shrink-0", tipeConfig.color)}>
                        <TipeIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-gray-900 dark:text-white">{n.judul}</h3>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-medium",
                            n.isPublished
                              ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                              : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400"
                          )}>
                            {n.isPublished ? "Published" : "Draft"}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 capitalize">
                            {n.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.pesan}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 dark:text-slate-500">
                          <span>Target: {(n.targetRole || []).join(", ")}</span>
                          <span>·</span>
                          <span>{n._count?.reads || 0} dibaca</span>
                          {n.publishedAt && (
                            <>
                              <span>·</span>
                              <span>{new Date(n.publishedAt).toLocaleDateString("id-ID")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white" onClick={() => openEdit(n)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400" onClick={() => handleDelete(n.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Notifikasi" : "Buat Notifikasi Baru"}</DialogTitle>
            <DialogDescription>Kirim notifikasi ke guru, admin, atau siswa di seluruh platform</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Judul</Label>
              <Input placeholder="Judul notifikasi" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Pesan</Label>
              <Textarea placeholder="Isi pesan notifikasi..." value={form.pesan} onChange={(e) => setForm({ ...form, pesan: e.target.value })} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipe</Label>
                <Select value={form.tipe} onValueChange={(v) => setForm({ ...form, tipe: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prioritas</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Target Role</Label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      (form.targetRole || []).includes(role)
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Kadaluarsa (opsional)</Label>
              <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleSave(false)} disabled={saving} variant="outline" className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Simpan Draft
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Publish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
