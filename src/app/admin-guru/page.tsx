"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, GraduationCap, QrCode } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { toast } from "sonner";

export default function AdminGuruLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [deviceDetected, setDeviceDetected] = useState<{ type: string; platform: string } | null>(null);
  const { login } = useAuth(false);

  useEffect(() => {
    // Fetch school info
    console.log('Fetching school info from frontend...');
    fetch('/api/school/info')
      .then(res => {
        console.log('Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('School info received:', data);
        if (data.success && data.data) {
          setSchoolInfo(data.data);
          console.log('School info set:', data.data);
        }
      })
      .catch(err => console.error('Error fetching school info:', err));
  }, []);

  // Polling untuk check device detection
  useEffect(() => {
    if (!showQRDialog || !sessionId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/login/scan-status?sessionId=${sessionId}`);
        const data = await response.json();
        
        if (data.success && data.detected) {
          setDeviceDetected(data.device);
          clearInterval(interval);
          toast.success(`Device terdeteksi: ${data.device.platform === 'android' ? 'Android' : 'App'}`);
        }
      } catch (error) {
        console.error('Error checking scan status:', error);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [showQRDialog, sessionId]);

  const handleSiswaQRClick = async () => {
    try {
      // Generate QR code yang mengarah ke root (/) untuk login siswa
      const qrData = `${window.location.origin}/`;
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      setQrCodeDataUrl(qrDataUrl);
      setShowQRDialog(true);
      
      // Auto download QR code
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `QR-Login-Siswa-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('QR Code berhasil diunduh');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Gagal membuat QR code');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0221CD] p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {schoolInfo?.logo ? (
              <div className="relative w-20 h-20">
                <Image
                  src={schoolInfo.logo}
                  alt={schoolInfo.nama || 'School Logo'}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="relative w-20 h-20">
                <Image
                  src="/icon/logo-no-bg-png-blue.png"
                  alt="E-Learning Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {schoolInfo?.nama || 'E-Learning System'}
          </CardTitle>
          <CardDescription>
            Masuk dengan Email dan Password Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full text-white"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>

            <div className="text-center mt-2">
              <a
                href="/admin-guru/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Lupa Password?
              </a>
            </div>

            <div className="text-center mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Siswa?{" "}
                <a 
                  href="/" 
                  className="text-primary hover:underline font-semibold"
                >
                  Login dengan NISN
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Login Siswa</DialogTitle>
            <DialogDescription>
              Scan QR code ini untuk membuka halaman login siswa dengan NISN
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {qrCodeDataUrl && (
              <div className="p-4 bg-white rounded-lg shadow-md">
                <img src={qrCodeDataUrl} alt="QR Code Login Siswa" className="w-64 h-64" />
              </div>
            )}
            <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">
                📱 Cara Menggunakan:
              </p>
              <ol className="text-xs text-blue-600 space-y-1 ml-4 list-decimal">
                <li>Scan QR code dengan kamera HP</li>
                <li>Akan terbuka halaman Login Siswa</li>
                <li>Masukkan NISN untuk login</li>
              </ol>
            </div>
            <div className="w-full p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-600 text-center">
                ✓ QR Code sudah otomatis terunduh
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
