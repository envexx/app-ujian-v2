import { SiswaHeader } from "./_components/siswa-header";

export default function SiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiswaHeader />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
