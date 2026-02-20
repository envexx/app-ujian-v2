export default function UjianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout ini hanya untuk route grouping
  // Fullscreen akan dihandle oleh page component saat ujian dimulai
  return <>{children}</>;
}

