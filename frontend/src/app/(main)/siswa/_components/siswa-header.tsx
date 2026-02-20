"use client";

import { useRouter, usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { toast } from "sonner";
import useSWR from "swr";
import { useSekolahInfo } from "@/hooks/useSWR";
import { fetcherWithAuth } from "@/lib/swr-config";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function SiswaHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useSWR('/api/siswa/ujian/dashboard', fetcherWithAuth);
  const { data: schoolInfoData } = useSekolahInfo();
  const schoolInfo = (schoolInfoData as any)?.data;

  const siswa = data?.data?.siswa || {};
  const nama = siswa.nama || 'Siswa';
  const email = siswa.email || '-';
  const initials = nama
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("authToken");
    
    toast.success("Berhasil keluar");
    router.push("/");
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white p-1 border">
          {schoolInfo?.logo ? (
            <Image
              src={schoolInfo.logo}
              alt={schoolInfo.nama || 'School Logo'}
              fill
              className="object-contain"
              priority
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
        <div className="hidden sm:block">
          <h2 className="font-semibold text-sm">Portal Siswa</h2>
          <p className="text-xs text-muted-foreground">{schoolInfo?.nama || 'E-Learning System'}</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={siswa.foto || "/avatars/siswa.png"} alt={nama} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-r from-[#0221CD] to-[#0221CD]/80 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{nama}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {siswa.nisn || email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
