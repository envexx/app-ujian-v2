import { SidebarProvider } from "@/components/ui/sidebar";
import { GuruSidebar } from "./_components/guru-sidebar";
import { GuruHeader } from "./_components/guru-header";
import { AIChatBubble } from "@/components/ai-chatbot/chat-bubble";

export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <GuruSidebar />
      <main className="flex flex-1 flex-col w-full min-w-0 overflow-x-hidden">
        <GuruHeader />
        <div className="flex-1 p-4 md:p-6 w-full">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
      <AIChatBubble />
    </SidebarProvider>
  );
}
