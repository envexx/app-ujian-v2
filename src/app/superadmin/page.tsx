"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { School, Users, GraduationCap, BookOpen, ClipboardList, Building2 } from "lucide-react";

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json());

export default function SuperAdminDashboard() {
  const { data, isLoading } = useSWR("/api/superadmin/stats", fetcher, {
    refreshInterval: 30000,
  });

  const stats = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 animate-pulse">
              <CardContent className="p-6"><div className="h-16" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Sekolah",
      value: stats?.schools?.total || 0,
      subtitle: `${stats?.schools?.active || 0} aktif, ${stats?.schools?.inactive || 0} nonaktif`,
      icon: Building2,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-500/10",
    },
    {
      title: "Total User",
      value: stats?.users?.total || 0,
      subtitle: "Semua role",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-500/10",
    },
    {
      title: "Total Guru",
      value: stats?.users?.guru || 0,
      subtitle: "Seluruh sekolah",
      icon: School,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-500/10",
    },
    {
      title: "Total Siswa",
      value: stats?.users?.siswa || 0,
      subtitle: "Seluruh sekolah",
      icon: GraduationCap,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-100 dark:bg-yellow-500/10",
    },
    {
      title: "Total Ujian",
      value: stats?.content?.ujian || 0,
      subtitle: "Seluruh sekolah",
      icon: ClipboardList,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-500/10",
    },
    {
      title: "Total Tugas",
      value: stats?.content?.tugas || 0,
      subtitle: "Seluruh sekolah",
      icon: BookOpen,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-100 dark:bg-cyan-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{card.title}</p>
                  <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{card.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{card.subtitle}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tier Breakdown */}
      {stats?.tierBreakdown && (
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-gray-900 dark:text-white">Tier Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(stats.tierBreakdown as Record<string, number>).map(([tier, count]) => (
                <div key={tier} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg">
                  <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{tier}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Schools */}
      {stats?.recentSchools && stats.recentSchools.length > 0 && (
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-gray-900 dark:text-white">Sekolah Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentSchools.map((school: any) => (
                <div
                  key={school.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{school.nama}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {school.kota || "-"} &middot; {school.jenjang || "-"} &middot;{" "}
                      <span className={school.isActive ? "text-green-400" : "text-red-400"}>
                        {school.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-500 dark:text-slate-400">
                    <p>{school._count?.guru || 0} guru</p>
                    <p>{school._count?.siswa || 0} siswa</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
