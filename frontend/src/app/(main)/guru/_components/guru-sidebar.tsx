"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
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
  Calendar,
  ClipboardList,
  BookOpen,
  Settings,
  GraduationCap,
  FileText,
  ClipboardCheck,
  Construction,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSekolahInfoWithRefresh } from "@/hooks/useSWR";

const menuItems = [
  {
    title: "Dashboard",
    items: [
      {
        title: "Dashboard",
        url: "/guru",
        icon: LayoutDashboard,
        disabled: false,
      },
    ],
  },
  {
    title: "Pembelajaran",
    items: [
      {
        title: "Ujian",
        url: "/guru/ujian",
        icon: FileText,
        disabled: false,
      },
      {
        title: "Nilai",
        url: "/guru/nilai",
        icon: ClipboardList,
        disabled: false,
      },
      {
        title: "Bank Soal",
        url: "/guru/bank-soal",
        icon: BookOpen,
        disabled: false,
      },
    ],
  },
];

export function GuruSidebar() {
  const pathname = usePathname();
  const { data: schoolInfoData, refresh } = useSekolahInfoWithRefresh();
  const schoolInfo = (schoolInfoData as any)?.data;

  // Force refresh on mount to ensure latest data
  useEffect(() => {
    refresh();
  }, [refresh]);

  const isActive = (url: string) => {
    if (url === "/guru") {
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
                unoptimized // Disable Next.js optimization for better loading
              />
            ) : (
              <Image
                src="/icon/logo-no-bg-png-blue.png"
                alt="E-Learning Logo"
                fill
                className="object-contain"
                priority
              />
            )}
          </div>
          <div>
            <h2 className="font-semibold">Portal Guru</h2>
            <p className="text-xs text-muted-foreground">
              {schoolInfo?.nama || 'E-Learning System'}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((section, idx) => (
          <SidebarGroup key={idx}>
            {section.title && <SidebarGroupLabel>{section.title}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  // Skip disabled items (commented out routes)
                  if (item.disabled) {
                    return null;
                  }
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <a href={item.url} className={cn(
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                          isActive(item.url) && "!bg-[#165DFB] !text-white !font-medium [&>svg]:!text-white hover:!bg-[#165DFB]/90 data-[active=true]:!bg-[#165DFB] data-[active=true]:!text-white"
                        )}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/guru/settings")}>
              <a href="/guru/settings" className={cn(
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                isActive("/guru/settings") && "!bg-[#165DFB] !text-white !font-medium [&>svg]:!text-white hover:!bg-[#165DFB]/90 data-[active=true]:!bg-[#165DFB] data-[active=true]:!text-white"
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
