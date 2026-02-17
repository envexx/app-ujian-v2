"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import { Bell, X, CheckCheck, Info, AlertTriangle, Wrench, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json());

const TIPE_ICONS: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  update: Bell,
  maintenance: Wrench,
  promo: Megaphone,
};

const TIPE_COLORS: Record<string, string> = {
  info: "text-blue-500",
  warning: "text-yellow-500",
  update: "text-green-500",
  maintenance: "text-orange-500",
  promo: "text-purple-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  normal: "border-l-transparent",
  low: "border-l-transparent",
};

export function NotificationBell() {
  const { data, mutate } = useSWR("/api/notifications", fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  });
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  // Calculate panel position relative to button
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPanelPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, []);

  // Refresh data when panel opens
  useEffect(() => {
    if (open) {
      mutate();
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }
  }, [open, mutate, updatePosition]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const markAsRead = async (notificationId: string) => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ notificationId }),
    });
    mutate();
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ markAllRead: true }),
    });
    mutate();
  };

  const panel = open
    ? createPortal(
        <div
          ref={panelRef}
          style={{ position: "fixed", top: panelPos.top, right: panelPos.right, zIndex: 9999 }}
          className="w-80 sm:w-96 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Notifikasi</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Tandai semua
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400 dark:text-slate-500">
                Tidak ada notifikasi
              </div>
            ) : (
              notifications.map((n: any) => {
                const Icon = TIPE_ICONS[n.tipe] || Info;
                const iconColor = TIPE_COLORS[n.tipe] || "text-gray-500";
                const priorityBorder = PRIORITY_COLORS[n.priority] || "";
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "px-4 py-3 border-b border-gray-50 dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-l-2",
                      priorityBorder,
                      !n.isRead && "bg-purple-50/50 dark:bg-purple-900/10"
                    )}
                    onClick={() => !n.isRead && markAsRead(n.id)}
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", iconColor)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={cn("text-sm font-medium truncate", n.isRead ? "text-gray-500 dark:text-slate-400" : "text-gray-900 dark:text-white")}>
                            {n.judul}
                          </p>
                          {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-slate-500 line-clamp-2 mt-0.5">{n.pesan}</p>
                        {n.publishedAt && (
                          <p className="text-[10px] text-gray-300 dark:text-slate-600 mt-1">
                            {new Date(n.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-500 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {panel}
    </div>
  );
}
