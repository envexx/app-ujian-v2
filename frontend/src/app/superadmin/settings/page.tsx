"use client";


import { fetchApi } from '@/lib/fetch-api';
import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Mail, Send, Save, Loader2 } from "lucide-react";

import { superadminFetcher, superadminFetch } from '../_lib/fetcher';

export default function SettingsPage() {
  const { data, mutate } = useSWR("/api/superadmin/smtp", superadminFetcher);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  // Initialize form from data
  if (data?.data && !form) {
    setForm({
      host: data.data.host || "",
      port: data.data.port || 587,
      secure: data.data.secure || false,
      user: data.data.user || "",
      pass: data.data.pass || "",
      fromName: data.data.fromName || "E-Learning Platform",
      fromEmail: data.data.fromEmail || "",
      isActive: data.data.isActive !== false,
    });
  }

  // Default empty form if no data yet
  const f = form || {
    host: "", port: 587, secure: false, user: "", pass: "",
    fromName: "E-Learning Platform", fromEmail: "", isActive: true,
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchApi("/api/superadmin/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(f),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message);
        mutate();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Gagal menyimpan konfigurasi");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) { toast.error("Masukkan email tujuan"); return; }
    setTesting(true);
    try {
      const res = await fetchApi("/api/superadmin/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to: testEmail }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Gagal mengirim email test");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan</h1>

      <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Mail className="w-5 h-5 text-purple-500" />
            Konfigurasi SMTP
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-slate-400">
            Untuk mengirim email reset password, registrasi, payment info, dan broadcast
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-slate-300">SMTP Host</Label>
              <Input placeholder="smtp.gmail.com" value={f.host} onChange={(e) => setForm({ ...f, host: e.target.value })} className="bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-700" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-slate-300">Port</Label>
              <Input type="number" placeholder="587" value={f.port} onChange={(e) => setForm({ ...f, port: parseInt(e.target.value) || 587 })} className="bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-700" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-slate-300">Username / Email</Label>
              <Input placeholder="email@domain.com" value={f.user} onChange={(e) => setForm({ ...f, user: e.target.value })} className="bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-700" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-slate-300">Password / App Password</Label>
              <Input type="password" placeholder="••••••••" value={f.pass} onChange={(e) => setForm({ ...f, pass: e.target.value })} className="bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-700" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-slate-300">From Name</Label>
              <Input placeholder="E-Learning Platform" value={f.fromName} onChange={(e) => setForm({ ...f, fromName: e.target.value })} className="bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-700" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-slate-300">From Email</Label>
              <Input placeholder="noreply@platform.com" value={f.fromEmail} onChange={(e) => setForm({ ...f, fromEmail: e.target.value })} className="bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-700" />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-gray-700 dark:text-slate-300">SSL/TLS (Port 465)</Label>
              <p className="text-xs text-gray-400 dark:text-slate-500">Aktifkan jika menggunakan port 465</p>
            </div>
            <Switch checked={f.secure} onCheckedChange={(v) => setForm({ ...f, secure: v })} />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-gray-700 dark:text-slate-300">Aktif</Label>
              <p className="text-xs text-gray-400 dark:text-slate-500">Aktifkan/nonaktifkan pengiriman email</p>
            </div>
            <Switch checked={f.isActive} onCheckedChange={(v) => setForm({ ...f, isActive: v })} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Konfigurasi
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base text-gray-900 dark:text-white">Test Email</CardTitle>
          <CardDescription className="text-gray-500 dark:text-slate-400">Kirim email test untuk memverifikasi konfigurasi SMTP</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="test@email.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-700" />
            <Button onClick={handleTest} disabled={testing} variant="outline" className="shrink-0">
              {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Kirim Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
