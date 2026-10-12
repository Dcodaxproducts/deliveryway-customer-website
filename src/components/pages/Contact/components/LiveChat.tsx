"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAuth } from "@/hooks/useAuth";
import useChat from "@/hooks/useChat";
import { useChatRealtime } from "@/hooks/useChatRealtime";
import { isRealtimeEnabled } from "@/lib/realtime";
import type {
  ChatInboxSummary,
  ChatMessage,
  ChatMessageCreatedEvent,
  ChatThread,
  ChatThreadReadEvent,
  CreateChatThreadPayload,
} from "@/services/chat";

const getCommandThread = (value: unknown): ChatThread | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const candidate = record.data && typeof record.data === "object"
    ? record.data as Record<string, unknown>
    : record;
  return typeof candidate.id === "string" ? candidate as ChatThread : null;
};

export default function ChatUI() {
  const t = useTranslations("contact.chat");
  const { token, user } = useAuth();
  const { createChatThread, fetchChatThreads, fetchChatThreadMessages, sendChatMessage } = useChat(token);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const realtimeEnabled = isRealtimeEnabled();

  const [creatingThread, setCreatingThread] = useState(false);
  const [message, setMessage] = useState("");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [threadsLoaded, setThreadsLoaded] = useState(false);

  const chatBodyRef = useRef<HTMLDivElement>(null);
  const activeThreadRef = useRef<ChatThread | null>(null);
  const inboxSummaryRef = useRef<ChatInboxSummary | null>(null);

  useEffect(() => {
    activeThreadRef.current = activeThread;
  }, [activeThread]);

  const upsertThread = useCallback((thread: ChatThread) => {
    setThreads((previous) => {
      const index = previous.findIndex((candidate) => candidate.id === thread.id);
      if (index === -1) return [thread, ...previous];
      return previous.map((candidate) =>
        candidate.id === thread.id ? { ...candidate, ...thread } : candidate,
      );
    });
    setActiveThread((current) =>
      current?.id === thread.id ? { ...current, ...thread } : current,
    );
  }, []);

  const fetchThreads = useCallback(async () => {
    const { response, threads: nextThreads } = await fetchChatThreads();
    if (response?.success) {
      setThreads(nextThreads);
      setThreadsLoaded(true);
      setActiveThread((current) => {
        if (current) {
          return nextThreads.find((thread) => thread.id === current.id) ?? current;
        }
        return !orderId && nextThreads.length > 0 ? nextThreads[0] : null;
      });
    }
  }, [fetchChatThreads, orderId]);

  const fetchMessages = useCallback(async (threadId: string) => {
    const { response, messages: nextMessages } = await fetchChatThreadMessages({ threadId });
    if (response?.success && activeThreadRef.current?.id === threadId) {
      setMessages(nextMessages);
    }
  }, [fetchChatThreadMessages]);

  const resyncChat = useCallback(async () => {
    await fetchThreads();
    const activeId = activeThreadRef.current?.id;
    if (activeId) await fetchMessages(activeId);
  }, [fetchMessages, fetchThreads]);

  const handleRealtimeMessage = useCallback((event: ChatMessageCreatedEvent) => {
    if (event.thread) upsertThread(event.thread);
    if (event.threadId === activeThreadRef.current?.id) {
      setMessages((previous) =>
        previous.some((candidate) => candidate.id === event.message.id)
          ? previous
          : [...previous, event.message],
      );
    }
    setThreads((previous) => previous.map((thread) =>
      thread.id === event.threadId
        ? { ...thread, lastMessagePreview: event.message.body }
        : thread,
    ));
  }, [upsertThread]);

  const handleRealtimeRead = useCallback((event: ChatThreadReadEvent) => {
    if (event.thread) upsertThread(event.thread);
  }, [upsertThread]);

  const handleSummary = useCallback((summary: ChatInboxSummary) => {
    inboxSummaryRef.current = summary;
  }, []);

  const { socketHealthy, command } = useChatRealtime({
    token,
    activeThreadId: activeThread?.id ?? null,
    onResync: resyncChat,
    onThread: upsertThread,
    onMessage: handleRealtimeMessage,
    onRead: handleRealtimeRead,
    onSummary: handleSummary,
    realtimeEnabled,
  });

  const createThread = useCallback(async (payload: CreateChatThreadPayload) => {
    const realtime = await command("chat.thread.create", payload);
    const realtimeThread = realtime.handled ? getCommandThread(realtime.data) : null;
    if (realtimeThread) return realtimeThread;

    const { response, thread } = await createChatThread({ payload });
    return response?.success ? thread : null;
  }, [command, createChatThread]);

  const createGeneralThread = useCallback(async () => {
    if (creatingThread) return;
    setCreatingThread(true);
    try {
      const thread = await createThread({
        message: "Hi, I need support.",
        subject: "General Support",
      });
      if (thread) {
        setThreads([thread]);
        setActiveThread(thread);
      }
    } finally {
      setCreatingThread(false);
    }
  }, [createThread, creatingThread]);

  const ensureOrderThread = useCallback(async (nextOrderId: string) => {
    if (!nextOrderId || creatingThread) return;
    const existing = threads.find((thread) => thread.orderId === nextOrderId);
    if (existing) {
      setActiveThread(existing);
      return;
    }

    setCreatingThread(true);
    try {
      const thread = await createThread({
        message: "Hi, I need help regarding this order.",
        orderId: nextOrderId,
        subject: `Order #${nextOrderId.slice(-6).toUpperCase()}`,
      });
      if (thread) {
        upsertThread(thread);
        setActiveThread(thread);
      }
    } finally {
      setCreatingThread(false);
    }
  }, [createThread, creatingThread, threads, upsertThread]);

  useEffect(() => {
    if (!token || !threadsLoaded) return;
    if (orderId) {
      void ensureOrderThread(orderId);
    } else if (threads.length === 0 && !creatingThread) {
      void createGeneralThread();
    }
  }, [createGeneralThread, creatingThread, ensureOrderThread, orderId, threads.length, threadsLoaded, token]);

  useEffect(() => {
    const threadId = activeThread?.id;
    if (!threadId) {
      setMessages([]);
      return;
    }
    if (socketHealthy) {
      void command("chat.thread.markRead", { threadId });
    } else if (threadsLoaded) {
      void fetchMessages(threadId);
    }
  }, [activeThread?.id, command, fetchMessages, socketHealthy, threadsLoaded]);

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !activeThread) return;

    setSending(true);
    const threadId = activeThread.id;
    try {
      const realtime = await command("chat.message.send", {
        threadId,
        message: trimmedMessage,
      });
      if (!realtime.handled) {
        const response = await sendChatMessage({ threadId, message: trimmedMessage });
        if (response?.success && document.visibilityState === "visible") {
          await Promise.all([fetchMessages(threadId), fetchThreads()]);
        }
      }
      setMessage("");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleSend();
    }
  };

  useEffect(() => {
    const chatBody = chatBodyRef.current;
    if (!chatBody) return;
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-[calc(100dvh-88px)] overflow-hidden bg-[#f7f6f5] text-[13px] text-[#1f1f1f]">
      {/* Sidebar */}
      <aside className="hidden min-h-0 w-[260px] flex-col overflow-hidden bg-[#f3f1ef] px-4 py-5 md:flex">
        <div className="shrink-0">
          <p className="text-[10px] tracking-widest text-gray-400 mb-3">
            {t("userContext")}
          </p>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#f4c7b8] text-[12px] font-semibold">
                {user?.profile?.firstName?.[0] || "U"}
              </div>
              <div>
                <p className="font-medium text-[13px]">
                  {user?.profile?.firstName}
                </p>
                <p className="text-[11px] text-gray-400">
                  {t("premiumMember")}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-[11px]">
              <div>
                <p className="text-gray-400 uppercase text-[9px] tracking-wider">
                  {t("accountSince")}
                </p>
                <p className="text-[12px] mt-[2px]">
                  {user?.profile?.createdAt
                    ? formatDate(user?.profile?.createdAt)
                    : "—"}
                </p>
              </div>

              <div>
                <p className="text-gray-400 uppercase text-[9px] tracking-wider">
                  {t("recentTopic")}
                </p>
                <p className="text-[12px] mt-[2px]">
                  {threads[0]?.subject || t("supportChat")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* THREADS */}
        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          <p className="mb-3 shrink-0 text-[10px] tracking-widest text-gray-400">
            {t("conversations")}
          </p>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => setActiveThread(thread)}
                className={`rounded-lg px-3 py-3 cursor-pointer ${
                  activeThread?.id === thread.id
                    ? "bg-[#e7e5e4]"
                    : "bg-[#ecebea]"
                }`}
              >

                <div className="flex justify-between items-center"><p className="text-[12px] font-medium">
                  {thread.subject}
                </p>
                 {thread.orderId && (
  <span className="text-[9px] px-2 py-[1px] bg-orange-100 text-orange-600 rounded-full">
    {t("orderBadge")}
  </span>
)}</div>
                <p className="text-[10px] text-gray-400 mt-1 truncate">
                  {thread.lastMessagePreview}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex min-h-0 flex-1 flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#f7f6f5] border-b border-gray-200">
         <h2 className="font-medium text-[14px]">
  {activeThread?.orderId
    ? t("orderSupportTitle", { orderId: activeThread.orderId })
    : activeThread?.subject || t("liveChat")}
</h2>

          <span className="text-[10px] px-3 py-[3px] rounded-full bg-[#e9e7e5] text-gray-500">
            {t("encrypted")}
          </span>
        </div>

        {/* CHAT BODY */}
        <div ref={chatBodyRef} className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          <div className="bg-[#2f2f2f] text-white rounded-md px-4 py-3 max-w-[720px]">
            <p className="text-[10px] uppercase tracking-wider opacity-60 mb-1">
              {t("note")}
            </p>
            <p className="text-[12px] leading-relaxed">
              {t("privacyNotice")}
            </p>
          </div>
{creatingThread && (
  <div className="flex items-center gap-3 mt-6">
    <div className="w-8 h-8 rounded-full bg-[#ef5a2a]/20 flex items-center justify-center">
      <Loader2 className="animate-spin text-[#ef5a2a]" size={16} />
    </div>
    <p className="text-[12px] text-gray-500">
      {t("settingUpConversation")}
    </p>
  </div>
)}
          {messages.map((msg) => {
            const isMe = msg.senderType === "CUSTOMER";

            return isMe ? (
              <div key={msg.id} className="mt-6 flex justify-end">
                <div className="max-w-[420px] text-right">
                  <div className="bg-[#ef5a2a] text-white px-4 py-3 rounded-2xl rounded-br-md inline-block">
                    <p className="text-[12px] leading-relaxed">
                      {msg.body}
                    </p>
                  </div>

                  <p className="text-[10px] text-gray-400 mt-1 mr-1">
                    {t("you")} · {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ) : (
              <div key={msg.id} className="mt-6 max-w-[360px]">
                <div className="bg-[#e9e7e5] px-4 py-2 rounded-2xl rounded-bl-md inline-block">
                  <p className="text-[12px]">{msg.body}</p>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 ml-1">
                  {t("support")} · {formatTime(msg.createdAt)}
                </p>
              </div>
            );
          })}
        </div>

        {/* INPUT */}
        <div className="border-t border-gray-200 px-4 py-3 bg-[#f7f6f5] ">
          <div className="flex items-center bg-white rounded-full px-4 py-2 border border-gray-200 focus-within:ring-2 focus-within:ring-[#ef5a2a]/40
                focus-within:border-[#ef5a2a]
                transition-all duration-200">
            <input
              type="text"
              placeholder={t("messagePlaceholder")}
              className="flex-1 bg-transparent outline-none text-[12px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button
              onClick={handleSend}
              disabled={sending}
              className="ml-2 bg-[#ef5a2a] hover:bg-[#e14f20] transition p-2 rounded-full text-white"
            >
              {sending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
