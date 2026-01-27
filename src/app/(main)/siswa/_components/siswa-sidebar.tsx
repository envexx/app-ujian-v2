"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSekolahInfo } from "@/hooks/useSWR";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileText,
  Award,
  Settings,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    items: [
      {
        title: "Dashboard",
        url: "/siswa",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Pembelajaran",
    items: [
      {
        title: "Materi",
        url: "/siswa/materi",
        icon: BookOpen,
      },
      {
        title: "Tugas",
        url: "/siswa/tugas",
        icon: ClipboardList,
      },
      {
        title: "Ujian",
        url: "/siswa/ujian",
        icon: FileText,
      },
      {
        title: "Raport",
        url: "/siswa/raport",
        icon: Award,
      },
    ],
  },
];

export function SiswaSidebar() {
  const pathname = usePathname();
  const { data: schoolInfoData } = useSekolahInfo();
  const schoolInfo = (schoolInfoData as any)?.data;

  const isActive = (url: string) => {
    if (url === "/siswa") {
      return pathname === url;
    }
    return pathname.startsWith(url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white p-1 border">
            {schoolInfo?.logo ? (
              <Image
                src={schoolInfo.logo}
                alt={schoolInfo.nama || 'School Logo'}
                fill
                className="object-contain"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <h2 className="font-semibold">Portal Siswa</h2>
            <p className="text-xs text-muted-foreground">{schoolInfo?.nama || 'E-Learning System'}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((section, idx) => (
          <SidebarGroup key={idx}>
            {section.title && <SidebarGroupLabel>{section.title}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
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
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/siswa/settings")}>
              <a href="/siswa/settings" className={cn(
                "hover:bg-accent hover:text-accent-foreground transition-colors",
                isActive("/siswa/settings") && "bg-gradient-to-r from-[#1488cc] to-[#2b32b2] !text-white font-medium [&>svg]:!text-white hover:opacity-90"
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
