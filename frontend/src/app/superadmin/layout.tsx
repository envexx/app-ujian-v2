"use client";


import { fetchApi } from '@/lib/fetch-api';
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import useSWR from "swr";
import { Shield, School, BarChart3, LogOut, Menu, Settings, Bell, Mail, Layers, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SuperAdminThemeProvider } from "./_components/theme-provider";
import { ThemeToggle } from "./_components/theme-toggle";

import { superadminFetcher, superadminFetch, clearSuperadminToken } from './_lib/fetcher';

const NAV_ITEMS = [
  { href: "/superadmin", label: "Dashboard", icon: BarChart3 },
  { href: "/superadmin/schools", label: "Kelola Sekolah", icon: School },
  { href: "/superadmin/tiers", label: "Kelola Tier", icon: Layers },
  { href: "/superadmin/notifications", label: "Notifikasi", icon: Bell },
  { href: "/superadmin/broadcast", label: "Broadcast Email", icon: Mail },
  { href: "/superadmin/landing-media", label: "Landing Media", icon: ImageIcon },
  { href: "/superadmin/settings", label: "Pengaturan", icon: Settings },
];

function SuperAdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Skip auth check on login page
  const isLoginPage = pathname === "/superadmin/login";

  const { data, error, isLoading } = useSWR(
    isLoginPage ? null : "/api/superadmin/auth/session",
    superadminFetcher,
    { revalidateOnFocus: true, refreshInterval: 60000 }
  );

  useEffect(() => {
    if (isLoginPage) return;
    if (!isLoading && (!data?.isLoggedIn || error)) {
      router.replace("/superadmin/login");
    }
  }, [data, error, isLoading, isLoginPage, router]);

  // Login page renders without layout
  if (isLoginPage) return <>{children}</>;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  // Not authenticated
  if (!data?.isLoggedIn) return null;

  const handleLogout = async () => {
    try {
      await superadminFetch("/api/superadmin/auth/logout", { method: "POST" });
      clearSuperadminToken();
      toast.success("Logout berhasil");
      router.replace("/superadmin/login");
    } catch {
      toast.error("Gagal logout");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-white flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-slate-800">
          <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-gray-900 dark:text-white">Super Admin</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">{data?.data?.email}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-600/20 dark:text-purple-400"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs text-gray-400 dark:text-slate-500">Theme</span>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
          <span className="text-sm font-medium">Super Admin</span>
          <ThemeToggle />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SuperAdminThemeProvider>
      <SuperAdminLayoutInner>{children}</SuperAdminLayoutInner>
    </SuperAdminThemeProvider>
  );
}
