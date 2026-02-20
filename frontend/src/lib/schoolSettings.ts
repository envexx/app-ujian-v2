export interface SchoolSettings {
  schoolName: string;
  schoolLogo: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolWebsite: string;
  principalName: string;
  principalNIP: string;
  academicYear: string;
  semester: string;
}

export const defaultSettings: SchoolSettings = {
  schoolName: "SMP Negeri 1 Jakarta",
  schoolLogo: "/logo-sekolah.png",
  schoolAddress: "Jl. Pendidikan No. 123, Jakarta Pusat, DKI Jakarta 10110",
  schoolPhone: "(021) 1234-5678",
  schoolEmail: "info@smpn1jakarta.sch.id",
  schoolWebsite: "www.smpn1jakarta.sch.id",
  principalName: "Dr. Budi Santoso, M.Pd",
  principalNIP: "196501011990031001",
  academicYear: "2024/2025",
  semester: "Ganjil",
};

export function getSchoolSettings(): SchoolSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  const saved = localStorage.getItem("schoolSettings");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return defaultSettings;
    }
  }
  return defaultSettings;
}

export function saveSchoolSettings(settings: SchoolSettings): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("schoolSettings", JSON.stringify(settings));
  }
}
