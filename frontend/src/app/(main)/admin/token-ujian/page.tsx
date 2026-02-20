"use client";


import { fetchApi } from '@/lib/fetch-api';
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, RefreshCw, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TokenHistory {
  id: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  accessedBy: string[];
}

export default function TokenUjianPage() {
  const [isUjianActive, setIsUjianActive] = useState(false);
  const [currentToken, setCurrentToken] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutes in seconds
  const [tokenHistory, setTokenHistory] = useState<TokenHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<Date | null>(null);

  // Fetch current token status from database
  const fetchTokenStatus = useCallback(async () => {
    try {
      const response = await fetchApi('/api/admin/ujian-access');
      const result = await response.json();

      if (result.success && result.data) {
        const { isActive, currentToken: token, tokenExpiresAt: expiresAt } = result.data;
        
        setIsUjianActive(isActive);
        
        if (isActive && token && expiresAt) {
          setCurrentToken(token);
          setTokenExpiresAt(new Date(expiresAt));
          
          // Calculate time remaining
          const now = new Date();
          const expires = new Date(expiresAt);
          const remaining = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000));
          setTimeRemaining(remaining);
        } else {
          setCurrentToken("");
          setTokenExpiresAt(null);
          setTimeRemaining(1800); // 30 minutes in seconds
        }
      }
    } catch (error) {
      console.error('Error fetching token status:', error);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchTokenStatus();
  }, [fetchTokenStatus]);

  // Generate new token via API
  const generateNewToken = async () => {
    setIsLoading(true);
    try {
      const response = await fetchApi('/api/admin/ujian-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Auto-generated token' }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const { token, expiresAt } = result.data;
        setCurrentToken(token);
        setTokenExpiresAt(new Date(expiresAt));
        // Calculate time remaining from expiresAt
        const now = new Date();
        const expires = new Date(expiresAt);
        const remaining = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000));
        setTimeRemaining(remaining);
        
        // Add to history
        const newHistory: TokenHistory = {
          id: Date.now().toString(),
          token,
          createdAt: new Date(),
          expiresAt: new Date(expiresAt),
          accessedBy: [],
        };
        setTokenHistory(prev => [newHistory, ...prev].slice(0, 10));
        
        toast.success("Token baru berhasil dibuat!");
      } else {
        toast.error(result.error || "Gagal membuat token");
      }
    } catch (error) {
      console.error('Error generating token:', error);
      toast.error("Gagal membuat token");
    } finally {
      setIsLoading(false);
    }
  };

  // Deactivate token via API
  const deactivateToken = async () => {
    setIsLoading(true);
    try {
      const response = await fetchApi('/api/admin/ujian-access', {
        method: 'PUT',
      });

      const result = await response.json();

      if (result.success) {
        setCurrentToken("");
        setTokenExpiresAt(null);
        setTimeRemaining(1800); // 30 minutes in seconds
        toast.info("Token dinonaktifkan");
      } else {
        toast.error(result.error || "Gagal menonaktifkan token");
      }
    } catch (error) {
      console.error('Error deactivating token:', error);
      toast.error("Gagal menonaktifkan token");
    } finally {
      setIsLoading(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!isUjianActive || !tokenExpiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((tokenExpiresAt.getTime() - now.getTime()) / 1000));
      
      setTimeRemaining(remaining);

      // Auto-generate new token when expired
      if (remaining === 0) {
        generateNewToken();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isUjianActive, tokenExpiresAt]);

  const handleCopyToken = () => {
    navigator.clipboard.writeText(currentToken);
    toast.success("Token berhasil disalin!");
  };

  const handleToggleUjian = async (checked: boolean) => {
    if (checked) {
      await generateNewToken();
      setIsUjianActive(true);
      toast.success("Sistem ujian diaktifkan");
    } else {
      await deactivateToken();
      setIsUjianActive(false);
    }
  };

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Token Ujian</h1>
        <p className="text-muted-foreground">Kelola akses ujian dengan token yang aktif selama 30 menit</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kontrol Sistem Ujian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="ujian-toggle" className="text-base font-semibold">
                Status Sistem Ujian
              </Label>
              <p className="text-sm text-muted-foreground">
                {isUjianActive ? "Siswa dapat mengakses ujian dengan token" : "Sistem ujian nonaktif"}
              </p>
            </div>
            <Switch
              id="ujian-toggle"
              checked={isUjianActive}
              onCheckedChange={handleToggleUjian}
              disabled={isLoading}
            />
          </div>

          {isUjianActive && (
            <div className="space-y-4">
              <div className="p-8 border-2 border-dashed rounded-lg bg-gradient-to-br from-[#0221CD]/10 to-[#0221CD]/20 dark:from-[#0221CD]/20 dark:to-[#0221CD]/30">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Token akan diperbarui dalam {formatTime(timeRemaining)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Token Saat Ini</Label>
                    <div className="text-6xl font-bold tracking-widest text-white font-mono p-6 bg-gradient-to-r from-[#0221CD] to-[#0221CD]/80 rounded-lg">
                      {isLoading ? (
                        <Loader2 className="w-12 h-12 mx-auto animate-spin" />
                      ) : (
                        currentToken || "------"
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center gap-2">
                    <Button onClick={handleCopyToken} variant="outline" disabled={!currentToken || isLoading}>
                      <Copy className="w-4 h-4 mr-2" />
                      Salin Token
                    </Button>
                    <Button onClick={generateNewToken} variant="outline" disabled={isLoading}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh Token
                    </Button>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#0221CD] to-[#0221CD]/80 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(timeRemaining / 1800) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Siswa Aktif</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{tokenHistory.length}</p>
                      <p className="text-sm text-muted-foreground">Token Dibuat</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Total Akses</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {tokenHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Token</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Kadaluarsa</TableHead>
                  <TableHead>Diakses Oleh</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokenHistory.map((history) => {
                  const isExpired = new Date() > history.expiresAt;
                  const isCurrent = history.token === currentToken;
                  
                  return (
                    <TableRow key={history.id}>
                      <TableCell className="font-mono font-bold">{history.token}</TableCell>
                      <TableCell>{formatDate(history.createdAt)}</TableCell>
                      <TableCell>{formatDate(history.expiresAt)}</TableCell>
                      <TableCell>
                        {history.accessedBy.length > 0 
                          ? `${history.accessedBy.length} siswa` 
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          isCurrent 
                            ? "bg-green-100 text-green-700" 
                            : isExpired 
                            ? "bg-gray-100 text-gray-700" 
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {isCurrent ? "Aktif" : isExpired ? "Kadaluarsa" : "Menunggu"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Log Akses Ujian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Belum ada siswa yang mengakses ujian</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
