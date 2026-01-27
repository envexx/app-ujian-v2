"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSekolahInfo } from "@/hooks/useSWR";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  FileText,
  UserCheck,
  CreditCard,
  KeyRound,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/admin",
  },
  {
    title: "Manajemen Data",
    items: [
      { title: "Kelas", icon: Users, url: "/admin/kelas" },
      { title: "Siswa", icon: GraduationCap, url: "/admin/siswa" },
      { title: "Guru", icon: Users, url: "/admin/guru" },
      { title: "Mata Pelajaran", icon: BookOpen, url: "/admin/mapel" },
    ],
  },
  {
    title: "Ujian & Presensi",
    items: [
      { title: "Token Ujian", icon: KeyRound, url: "/admin/token-ujian" },
      { title: "Presensi", icon: UserCheck, url: "/admin/presensi" },
      { title: "Kartu Pelajar", icon: CreditCard, url: "/admin/kartu-pelajar" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: schoolInfoData } = useSekolahInfo();
  const schoolInfo = (schoolInfoData as any)?.data;

  const isActive = (url: string) => {
    if (url === "/admin") {
      return pathname === url;
    }
    return pathname.startsWith(url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white p-1 border">
            {schoolInfo?.logo ? (
              <Image
                src={schoolInfo.logo}
                alt="School Logo"
                fill
                className="object-contain"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">LMS Admin</span>
            <span className="text-xs text-muted-foreground">{schoolInfo?.nama || 'Panel Administrator'}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((section, idx) => (
          <SidebarGroup key={idx}>
            {section.title && <SidebarGroupLabel>{section.title}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items ? (
                  section.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <a href={item.url} className={cn(
                          "hover:bg-accent hover:text-accent-foreground transition-colors",
                          isActive(item.url) && "bg-gradient-to-r from-[#1488cc] to-[#2b32b2] !text-white font-medium [&>svg]:!text-white hover:opacity-90"
                        )}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive(section.url!)}>
                      <a href={section.url} className={cn(
                        "hover:bg-accent hover:text-accent-foreground transition-colors",
                        isActive(section.url!) && "bg-gradient-to-r from-[#1488cc] to-[#2b32b2] !text-white font-medium [&>svg]:!text-white hover:opacity-90"
                      )}>
                        <section.icon className="w-4 h-4" />
                        <span>{section.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/settings")}>
              <a href="/admin/settings" className={cn(
                "hover:bg-accent hover:text-accent-foreground transition-colors",
                isActive("/admin/settings") && "bg-gradient-to-r from-[#1488cc] to-[#2b32b2] !text-white font-medium [&>svg]:!text-white hover:opacity-90"
              )}>
                <Settings className="w-4 h-4" />
                <span>Pengaturan</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
