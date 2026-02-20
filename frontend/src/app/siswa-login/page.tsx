"use client";


import { fetchApi } from '@/lib/fetch-api';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, User } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function SiswaLoginPage() {
  const [nisn, setNisn] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch school info
    fetchApi('/api/school/info')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setSchoolInfo(data.data);
        }
      })
      .catch(err => console.error('Error fetching school info:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nisn) {
      toast.error("Masukkan NISN Anda");
      return;
    }

    // Validate NISN format (should be numbers only)
    if (!/^\d+$/.test(nisn)) {
      toast.error("NISN harus berupa angka");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchApi('/api/auth/siswa-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nisn }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Login berhasil!");
        // Redirect to siswa dashboard
        router.push('/siswa');
        router.refresh();
      } else {
        toast.error(data.error || "NISN tidak ditemukan");
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Terjadi kesalahan saat login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ddeeff] via-[#aaccff] to-[#88aaff] p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {schoolInfo?.logo ? (
              <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-lg bg-white p-2">
                <Image
                  src={schoolInfo.logo}
                  alt={schoolInfo.nama || 'School Logo'}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <GraduationCap className="w-10 h-10 text-primary-foreground" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {schoolInfo?.nama || 'E-Learning System'}
          </CardTitle>
          <CardDescription>
            Login Siswa - Masuk dengan NISN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nisn">NISN</Label>
              <div className="relative">
                <Input
                  id="nisn"
                  type="text"
                  placeholder="Masukkan NISN Anda"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10"
                  required
                  maxLength={10}
                />
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
              <p className="text-xs text-muted-foreground">
                Masukkan Nomor Induk Siswa Nasional (NISN) Anda
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#1488cc] to-[#2b32b2] hover:opacity-90 transition-opacity text-white"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>

            <div className="text-center mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Bukan siswa?{" "}
                <a 
                  href="/admin-guru" 
                  className="text-primary hover:underline font-medium"
                >
                  Login sebagai Guru/Admin
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
