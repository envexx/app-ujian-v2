"use client";

import { usePathname } from "next/navigation";
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
import { useSekolahInfoWithFallback } from "@/hooks/useSWR";

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
        title: "Jadwal Mengajar",
        url: "/guru/jadwal",
        icon: Calendar,
        disabled: true,
        badge: "Dalam Pengembangan",
      },
      {
        title: "Penilaian Siswa",
        url: "/guru/nilai",
        icon: ClipboardList,
        disabled: true,
        badge: "Dalam Pengembangan",
      },
      {
        title: "Materi Pembelajaran",
        url: "/guru/materi",
        icon: BookOpen,
        disabled: true,
        badge: "Dalam Pengembangan",
      },
      {
        title: "Tugas",
        url: "/guru/tugas",
        icon: ClipboardCheck,
        disabled: false,
      },
      {
        title: "Ujian",
        url: "/guru/ujian",
        icon: FileText,
        disabled: false,
      },
    ],
  },
];

export function GuruSidebar() {
  const pathname = usePathname();
  const { data: schoolInfoData } = useSekolahInfoWithFallback();
  const schoolInfo = schoolInfoData as any;

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
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-gray-400" />
              </div>
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
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.disabled ? (
                      <SidebarMenuButton 
                        disabled 
                        className="opacity-50 cursor-not-allowed"
                        title={item.badge}
                      >
                        <Construction className="w-4 h-4" />
                        <span>{item.title}</span>
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                          Dev
                        </span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <a href={item.url} className={cn(
                          "hover:bg-accent hover:text-accent-foreground transition-colors",
                          isActive(item.url) && "bg-gradient-to-r from-[#1488cc] to-[#2b32b2] !text-white font-medium [&>svg]:!text-white hover:opacity-90"
                        )}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    )}
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
            <SidebarMenuButton asChild isActive={isActive("/guru/settings")}>
              <a href="/guru/settings" className={cn(
                "hover:bg-accent hover:text-accent-foreground transition-colors",
                isActive("/guru/settings") && "bg-gradient-to-r from-[#1488cc] to-[#2b32b2] !text-white font-medium [&>svg]:!text-white hover:opacity-90"
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
