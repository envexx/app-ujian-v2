"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  X,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  intent?: string;
  examDraft?: any;
  generatedSoal?: any[];
  needsConfirmation?: boolean;
  confirmationType?: string;
  actionResult?: any;
}

// ============================================
// MARKDOWN RENDERER (simple)
// ============================================

function renderMarkdown(text: string) {
  if (!text) return "";
  let html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, text, url) => {
      if (url.startsWith('/') || url.startsWith('#')) {
        return `<a data-internal-href="${url}" class="text-blue-600 dark:text-blue-400 underline hover:no-underline cursor-pointer">${text}</a>`;
      }
      return `<a href="${url}" class="text-blue-600 dark:text-blue-400 underline hover:no-underline" target="_blank" rel="noopener noreferrer">${text}</a>`;
    })
    .replace(/^- (.+)$/gm, '<li class="ml-3 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-3 list-decimal">$1. $2</li>')
    .replace(/\n/g, "<br/>");
  return html;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// ============================================
// CHAT BUBBLE COMPONENT
// ============================================

export function AIChatBubble() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastExamDraft, setLastExamDraft] = useState<any>(null);
  const [lastGeneratedSoal, setLastGeneratedSoal] = useState<any[]>([]);
  const [lastUjianId, setLastUjianId] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
  }, []);

  // Handle internal link clicks (navigasi tanpa buka tab baru)
  const handleMessageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a[data-internal-href]") as HTMLElement | null;
      if (link) {
        e.preventDefault();
        const href = link.getAttribute("data-internal-href");
        if (href) {
          router.push(href);
        }
      }
    },
    [router]
  );

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Halo! Saya asisten AI untuk membantu Anda mengelola ujian dan soal.\n\n**Yang bisa saya lakukan:**\n- Membuat ujian baru\n- Generate soal multi-tipe\n- Menambahkan soal ke ujian\n\nApa yang bisa saya bantu?",
          timestamp: new Date(),
          intent: "HELP",
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMessage]
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch("/api/guru/ai-chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory, currentUjianId: lastUjianId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Gagal mendapatkan respons AI");
      }

      const aiData = result.data;

      if (aiData.examDraft) setLastExamDraft(aiData.examDraft);
      if (aiData.generatedSoal) setLastGeneratedSoal(aiData.generatedSoal);
      if (aiData.actionResult?.ujianId) setLastUjianId(aiData.actionResult.ujianId);

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: aiData.message,
        timestamp: new Date(),
        intent: aiData.intent,
        examDraft: aiData.examDraft,
        generatedSoal: aiData.generatedSoal,
        needsConfirmation: aiData.needsConfirmation,
        confirmationType: aiData.confirmationType,
        actionResult: aiData.actionResult,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Maaf, terjadi kesalahan: ${error.message || "Silakan coba lagi."}`,
        timestamp: new Date(),
        intent: "GENERAL_CHAT",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async (type: string, msgSoal?: any[]) => {
    if (isLoading) return;
    setIsLoading(true);

    // Use soal from the specific message if available, otherwise fallback to state
    const soalToAdd = msgSoal && msgSoal.length > 0 ? msgSoal : lastGeneratedSoal;

    try {
      let actionPayload: any = {};

      if (type === "CREATE_EXAM" && lastExamDraft) {
        actionPayload = {
          messages: [],
          action: "CONFIRM_CREATE_EXAM",
          actionData: { examDraft: lastExamDraft },
        };
      } else if (type === "CREATE_EXAM_WITH_QUESTIONS" && lastExamDraft) {
        actionPayload = {
          messages: [],
          action: "CONFIRM_CREATE_EXAM_WITH_QUESTIONS",
          actionData: {
            examDraft: lastExamDraft,
            soalList: soalToAdd,
          },
        };
      } else if (type === "ADD_QUESTIONS") {
        if (soalToAdd.length === 0) {
          throw new Error("Tidak ada soal yang di-generate. Silakan minta AI generate soal terlebih dahulu.");
        }

        actionPayload = {
          messages: [],
          action: "CONFIRM_ADD_QUESTIONS",
          actionData: {
            ujianId: lastUjianId || null,
            soalList: soalToAdd,
          },
        };
      } else {
        throw new Error("Aksi tidak dikenali.");
      }

      const confirmLabels: Record<string, string> = {
        CREATE_EXAM: "Ya, buatkan ujian tersebut",
        CREATE_EXAM_WITH_QUESTIONS: "Ya, buatkan ujian + soal",
        ADD_QUESTIONS: "Ya, tambahkan soal tersebut",
      };

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: confirmLabels[type] || "Ya, lanjutkan",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const response = await fetch("/api/guru/ai-chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actionPayload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      const aiData = result.data;
      if (aiData.actionResult?.ujianId) setLastUjianId(aiData.actionResult.ujianId);

      // Auto-refresh halaman setelah aksi berhasil (buat ujian/tambah soal)
      if (aiData.actionResult?.success) {
        router.refresh();
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: aiData.message,
        timestamp: new Date(),
        intent: aiData.intent,
        actionResult: aiData.actionResult,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Gagal mengeksekusi: ${error.message || "Silakan coba lagi."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setLastExamDraft(null);
    setLastGeneratedSoal([]);
    setLastUjianId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const todayLabel = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* ========== Floating Bubble Button (hidden when open) ========== */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center justify-center",
            "w-14 h-14 rounded-full shadow-lg transition-all duration-300 ease-out",
            "hover:scale-105 active:scale-95 hover:shadow-xl",
            "bg-blue-600 text-white"
          )}
          aria-label="Buka AI Chat"
        >
          <Bot className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
        </button>
      )}

      {/* ========== Chat Panel ========== */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50",
            "w-[380px] max-w-[calc(100vw-2rem)] h-[calc(100vh-6rem)] max-h-[700px]",
            "bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl",
            "flex flex-col overflow-hidden",
            "border border-zinc-200 dark:border-zinc-800",
            "animate-in slide-in-from-bottom-4 fade-in duration-200"
          )}
        >
          {/* ---- Header ---- */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-zinc-900" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  AI Asisten
                </h3>
                <p className="text-[11px] text-green-600 dark:text-green-400 font-medium">
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={clearChat}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Reset percakapan"
              >
                <RotateCcw className="w-4 h-4 text-zinc-400" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Minimize"
              >
                <Minus className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>

          {/* ---- Date Divider ---- */}
          <div className="flex items-center justify-center py-2.5 bg-zinc-50/50 dark:bg-zinc-900/50">
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
              {todayLabel}
            </span>
          </div>

          {/* ---- Messages ---- */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            onClick={handleMessageClick}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-zinc-50/30 dark:bg-zinc-950/30"
          >
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-1">
                {/* Message bubble */}
                <div
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] px-3.5 py-2.5 text-[13px] leading-relaxed",
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-2xl rounded-br-sm"
                        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-2xl rounded-bl-sm border border-zinc-100 dark:border-zinc-700/50 shadow-sm"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div
                        className="[&>br]:my-0.5 [&_li]:my-0.5 [&_strong]:font-semibold [&_strong]:text-zinc-900 dark:[&_strong]:text-zinc-100 [&_a]:text-blue-600 dark:[&_a]:text-blue-400"
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(msg.content),
                        }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div
                  className={cn(
                    "px-1",
                    msg.role === "user" ? "text-right" : "text-left"
                  )}
                >
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>

                {/* Confirmation Buttons (quick reply style) */}
                {msg.needsConfirmation && msg.confirmationType && (
                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      onClick={() => handleConfirmAction(msg.confirmationType!, msg.generatedSoal)}
                      disabled={isLoading}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {msg.confirmationType === "CREATE_EXAM"
                        ? "Ya, Buat Ujian!"
                        : msg.confirmationType === "CREATE_EXAM_WITH_QUESTIONS"
                        ? "Ya, Buat Ujian + Soal!"
                        : "Ya, Tambahkan!"}
                    </button>
                    <button
                      onClick={() => sendMessage("Tidak, batalkan")}
                      disabled={isLoading}
                      className="px-4 py-1.5 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    >
                      Tidak
                    </button>
                  </div>
                )}

                {/* Action Result Badge */}
                {msg.actionResult && (
                  <div
                    className={cn(
                      "flex items-center gap-1.5 mt-1 ml-1",
                      msg.actionResult.success
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-500 dark:text-red-400"
                    )}
                  >
                    {msg.actionResult.success ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    <span className="text-[11px] font-medium">
                      {msg.actionResult.success
                        ? "Berhasil dieksekusi"
                        : "Gagal dieksekusi"}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom */}
          {showScrollDown && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-[120px] left-1/2 -translate-x-1/2 p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full shadow-md hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          )}


          {/* ---- Input Area ---- */}
          <div className="px-3 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik pesan..."
                rows={1}
                className={cn(
                  "flex-1 min-h-[40px] max-h-[120px] py-2.5 px-4 rounded-2xl resize-none",
                  "bg-zinc-100 dark:bg-zinc-800",
                  "text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white dark:focus:bg-zinc-700",
                  "border border-transparent focus:border-blue-300 dark:focus:border-blue-700",
                  "transition-all leading-snug"
                )}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 120) + "px";
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-all flex-shrink-0 mb-0.5",
                  "disabled:opacity-30 disabled:cursor-not-allowed",
                  input.trim() && !isLoading
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400"
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
