"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Student, Users, BookOpen, ClipboardText } from "@phosphor-icons/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import useSWR from "swr";
import { fetchApi } from "@/lib/fetch-api";

interface DashboardStats {
  totalSiswa: number;
  totalGuru: number;
  totalKelas: number;
  ujianAktif: number;
}

interface Activity {
  type: string;
  message: string;
  timestamp: string;
  color: string;
}

const fetcher = async (url: string) => {
  const res = await fetchApi(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function AdminDashboard() {
  const { data: statsData, isLoading: statsLoading } = useSWR('/api/dashboard/stats', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
  const { data: activitiesData, isLoading: activitiesLoading } = useSWR('/api/dashboard/activities', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const isLoading = statsLoading || activitiesLoading;
  const stats: DashboardStats = statsData?.data || { totalSiswa: 0, totalGuru: 0, totalKelas: 0, ujianAktif: 0 };
  
  // Build activities from recentUjian and recentTugas
  const rawData = activitiesData?.data || {};
  const recentUjian = Array.isArray(rawData.recentUjian) ? rawData.recentUjian : [];
  const recentTugas = Array.isArray(rawData.recentTugas) ? rawData.recentTugas : [];
  
  const activities: Activity[] = [
    ...recentUjian.map((u: any) => ({
      type: 'ujian',
      message: `Ujian "${u.judul}" ${u.status === 'aktif' ? 'sedang berlangsung' : u.status === 'selesai' ? 'telah selesai' : 'dibuat'} oleh ${u.guru?.nama || 'Guru'}`,
      timestamp: u.createdAt,
      color: 'blue',
    })),
    ...recentTugas.map((t: any) => ({
      type: 'tugas',
      message: `Tugas "${t.judul}" dibuat oleh ${t.guru?.nama || 'Guru'}`,
      timestamp: t.createdAt,
      color: 'green',
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

  const statCards = [
    {
      title: "Total Siswa",
      value: stats.totalSiswa,
      icon: Student,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      title: "Total Guru",
      value: stats.totalGuru,
      icon: Users,
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
    },
    {
      title: "Total Kelas",
      value: stats.totalKelas,
      icon: BookOpen,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
    },
    {
      title: "Ujian Aktif",
      value: stats.ujianAktif,
      icon: ClipboardText,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-50",
    },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (

    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        <p className="text-muted-foreground">Selamat datang di panel administrator</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconColor={stat.iconColor}
            iconBg={stat.iconBg}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada aktivitas
                </p>
              ) : (
                activities.map((activity, index) => {
                  const colorMap: Record<string, string> = {
                    blue: 'bg-gradient-to-r from-[#0221CD] to-[#0221CD]/80',
                    green: 'bg-green-600',
                    purple: 'bg-purple-600',
                    orange: 'bg-orange-600',
                  };
                  
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${colorMap[activity.color] || 'bg-gray-600'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { 
                            addSuffix: true, 
                            locale: id 
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <a
                href="/admin/siswa"
                className="group p-3 border rounded-lg hover:bg-accent hover:text-white transition-colors"
              >
                <p className="font-medium text-sm group-hover:text-white">Tambah Siswa</p>
                <p className="text-xs text-muted-foreground group-hover:text-white/80">Daftarkan siswa baru</p>
              </a>
              <a
                href="/admin/kelas"
                className="group p-3 border rounded-lg hover:bg-accent hover:text-white transition-colors"
              >
                <p className="font-medium text-sm group-hover:text-white">Kelola Kelas</p>
                <p className="text-xs text-muted-foreground group-hover:text-white/80">Atur kelas dan siswa</p>
              </a>
              <a
                href="/admin/token-ujian"
                className="group p-3 border rounded-lg hover:bg-accent hover:text-white transition-colors"
              >
                <p className="font-medium text-sm group-hover:text-white">Token Ujian</p>
                <p className="text-xs text-muted-foreground group-hover:text-white/80">Kelola akses ujian</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
