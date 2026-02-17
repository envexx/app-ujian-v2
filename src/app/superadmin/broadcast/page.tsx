"use client";

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
import { Plus, Send, Loader2, Mail, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json());

const STATUS_MAP: Record<string, { label: string; icon: any; color: string }> = {
  draft: { label: "Draft", icon: Clock, color: "text-gray-500" },
  sending: { label: "Mengirim", icon: Loader2, color: "text-yellow-500" },
  sent: { label: "Terkirim", icon: CheckCircle, color: "text-green-500" },
  failed: { label: "Gagal", icon: XCircle, color: "text-red-500" },
};

export default function BroadcastPage() {
  const { data, mutate, isLoading } = useSWR("/api/superadmin/broadcast", fetcher);
  const { data: tiersData } = useSWR("/api/superadmin/tiers", fetcher);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    subject: "", bodyHtml: "", targetType: "all_schools", targetFilter: null as any,
  });
  const [saving, setSaving] = useState(false);

  const broadcasts = data?.data || [];
  const tiers = tiersData?.data || [];

  const handleSend = async (sendNow: boolean) => {
    if (!form.subject || !form.bodyHtml) { toast.error("Subject dan body harus diisi"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, sendNow }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message);
        mutate();
        setShowDialog(false);
        setForm({ subject: "", bodyHtml: "", targetType: "all_schools", targetFilter: null });
      } else {
        toast.error(result.error);
      }
    } catch { toast.error("Gagal mengirim broadcast"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Broadcast Email</h1>
        <Button onClick={() => setShowDialog(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" /> Buat Broadcast
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
      ) : broadcasts.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
          <CardContent className="p-8 text-center text-gray-400 dark:text-slate-400">
            Belum ada broadcast email. Klik tombol di atas untuk membuat broadcast baru.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b: any) => {
            const statusInfo = STATUS_MAP[b.status] || STATUS_MAP.draft;
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={b.id} className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Mail className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">{b.subject}</h3>
                          <span className={cn("flex items-center gap-1 text-xs shrink-0", statusInfo.color)}>
                            <StatusIcon className={cn("w-3 h-3", b.status === "sending" && "animate-spin")} />
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">{b.body?.replace(/<[^>]*>/g, "").slice(0, 120)}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 dark:text-slate-500">
                          <span>Target: {b.targetType}</span>
                          {b.sentCount > 0 && <><span>·</span><span>{b.sentCount} terkirim</span></>}
                          {b.failedCount > 0 && <><span>·</span><span className="text-red-400">{b.failedCount} gagal</span></>}
                          <span>·</span>
                          <span>{new Date(b.createdAt).toLocaleDateString("id-ID")}</span>
                        </div>
                      </div>
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
            <DialogTitle>Buat Broadcast Email</DialogTitle>
            <DialogDescription>Kirim email ke sekolah-sekolah terdaftar untuk campaign, info fitur baru, atau pengumuman</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input placeholder="Subject email" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Target</Label>
              <Select value={form.targetType} onValueChange={(v) => setForm({ ...form, targetType: v, targetFilter: null })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_schools">Semua Sekolah</SelectItem>
                  <SelectItem value="by_tier">Berdasarkan Tier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.targetType === "by_tier" && (
              <div className="space-y-1.5">
                <Label>Pilih Tier</Label>
                <div className="flex flex-wrap gap-2">
                  {tiers.map((t: any) => {
                    const selected = form.targetFilter?.tierIds?.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          const current = form.targetFilter?.tierIds || [];
                          const next = selected ? current.filter((id: string) => id !== t.id) : [...current, t.id];
                          setForm({ ...form, targetFilter: { tierIds: next } });
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                          selected
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        )}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Body (HTML)</Label>
              <Textarea
                placeholder="<h2>Halo!</h2><p>Isi email broadcast...</p>"
                value={form.bodyHtml}
                onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleSend(false)} disabled={saving} variant="outline" className="flex-1">
                Simpan Draft
              </Button>
              <Button onClick={() => handleSend(true)} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Kirim Sekarang
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
