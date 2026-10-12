"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import { CHAT_BASE_URL } from "@/lib/axios";
import {
  BoundedEventIdSet,
  isRealtimeEnabled,
  withoutEventId,
} from "@/lib/realtime";
import type {
  ChatInboxSummary,
  ChatMessageCreatedEvent,
  ChatThread,
  ChatThreadReadEvent,
} from "@/services/chat";

export const CHAT_FALLBACK_POLL_INTERVAL_MS = 10_000;

export type ChatRealtimeCommandResult = {
  handled: boolean;
  data?: unknown;
};

type ChatRealtimeEvent =
  | { type: "thread"; payload: ChatThread & { eventId?: string } }
  | { type: "message"; payload: ChatMessageCreatedEvent & { eventId?: string } }
  | { type: "read"; payload: ChatThreadReadEvent & { eventId?: string } }
  | { type: "summary"; payload: ChatInboxSummary & { eventId?: string } };

type UseChatRealtimeOptions = {
  token: string | null;
  activeThreadId: string | null;
  onResync: () => Promise<unknown> | unknown;
  onThread: (thread: ChatThread) => void;
  onMessage: (event: ChatMessageCreatedEvent) => void;
  onRead: (event: ChatThreadReadEvent) => void;
  onSummary: (summary: ChatInboxSummary) => void;
  realtimeEnabled?: boolean;
};

export const useChatRealtime = ({
  token,
  activeThreadId,
  onResync,
  onThread,
  onMessage,
  onRead,
  onSummary,
  realtimeEnabled = isRealtimeEnabled(),
}: UseChatRealtimeOptions) => {
  const socketRef = useRef<Socket | null>(null);
  const retryResyncRef = useRef<(() => Promise<unknown>) | null>(null);
  const activeThreadIdRef = useRef(activeThreadId);
  const callbacksRef = useRef({ onResync, onThread, onMessage, onRead, onSummary });
  const [socketHealthy, setSocketHealthy] = useState(false);

  useEffect(() => {
    callbacksRef.current = { onResync, onThread, onMessage, onRead, onSummary };
  }, [onMessage, onRead, onResync, onSummary, onThread]);

  useEffect(() => {
    const socket = socketRef.current;
    const previousThreadId = activeThreadIdRef.current;
    activeThreadIdRef.current = activeThreadId;

    if (!socket?.connected || previousThreadId === activeThreadId) return;
    if (previousThreadId) {
      socket.emit("chat.thread.leave", { threadId: previousThreadId });
    }
    if (activeThreadId) {
      socket.emit("chat.thread.join", { threadId: activeThreadId });
    }
  }, [activeThreadId]);

  useEffect(() => {
    if (!token || !realtimeEnabled) {
      socketRef.current = null;
      setSocketHealthy(false);
      return;
    }

    const socket: Socket = io(CHAT_BASE_URL, {
      auth: { token },
      autoConnect: false,
      transports: ["websocket"],
      withCredentials: true,
    });
    const seen = new BoundedEventIdSet();
    const buffered: ChatRealtimeEvent[] = [];
    let buffering = true;
    let disposed = false;
    let connectionCycle = 0;
    socketRef.current = socket;

    const applyEvent = (event: ChatRealtimeEvent) => {
      if (event.type === "thread") {
        callbacksRef.current.onThread(withoutEventId(event.payload));
      } else if (event.type === "message") {
        callbacksRef.current.onMessage(withoutEventId(event.payload));
      } else if (event.type === "read") {
        callbacksRef.current.onRead(withoutEventId(event.payload));
      } else {
        callbacksRef.current.onSummary(withoutEventId(event.payload));
      }
    };

    const receive = (event: ChatRealtimeEvent) => {
      const eventId = event.payload.eventId;
      if (!seen.accept("chat", eventId)) return;
      if (buffering) {
        buffered.push(event);
        return;
      }
      applyEvent(event);
    };

    const resyncAndActivate = async () => {
      if (!socket.connected) return callbacksRef.current.onResync();
      const cycle = ++connectionCycle;
      buffering = true;
      buffered.length = 0;
      setSocketHealthy(false);

      try {
        await callbacksRef.current.onResync();
      } catch {
        // The disconnected-only HTTP fallback continues until a resync succeeds.
        if (!disposed && cycle === connectionCycle) setSocketHealthy(false);
        return;
      }

      if (disposed || cycle !== connectionCycle || !socket.connected) return;

      socket.emit("chat.inbox.subscribe");
      if (activeThreadIdRef.current) {
        socket.emit("chat.thread.join", { threadId: activeThreadIdRef.current });
      }
      const pending = buffered.splice(0);
      buffering = false;
      pending.forEach(applyEvent);
      setSocketHealthy(true);
    };

    const handleConnect = () => {
      void resyncAndActivate();
    };
    retryResyncRef.current = resyncAndActivate;

    const handleDisconnect = () => {
      connectionCycle += 1;
      buffering = true;
      buffered.length = 0;
      if (!disposed) setSocketHealthy(false);
    };

    const threadCreated = (payload: ChatThread & { eventId?: string }) =>
      receive({ type: "thread", payload });
    const threadUpdated = (payload: ChatThread & { eventId?: string }) =>
      receive({ type: "thread", payload });
    const messageCreated = (payload: ChatMessageCreatedEvent & { eventId?: string }) =>
      receive({ type: "message", payload });
    const threadRead = (payload: ChatThreadReadEvent & { eventId?: string }) =>
      receive({ type: "read", payload });
    const inboxSummary = (payload: ChatInboxSummary & { eventId?: string }) =>
      receive({ type: "summary", payload });

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleDisconnect);
    socket.on("chat.thread.created", threadCreated);
    socket.on("chat.thread.updated", threadUpdated);
    socket.on("chat.message.created", messageCreated);
    socket.on("chat.thread.read", threadRead);
    socket.on("chat.inbox.summary", inboxSummary);
    socket.connect();

    return () => {
      disposed = true;
      connectionCycle += 1;
      const activeId = activeThreadIdRef.current;
      if (socket.connected && activeId) {
        socket.emit("chat.thread.leave", { threadId: activeId });
      }
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleDisconnect);
      socket.off("chat.thread.created", threadCreated);
      socket.off("chat.thread.updated", threadUpdated);
      socket.off("chat.message.created", messageCreated);
      socket.off("chat.thread.read", threadRead);
      socket.off("chat.inbox.summary", inboxSummary);
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      if (retryResyncRef.current === resyncAndActivate) {
        retryResyncRef.current = null;
      }
    };
  }, [realtimeEnabled, token]);

  useVisibilityPolling({
    enabled: Boolean(token && !socketHealthy),
    immediate: !realtimeEnabled,
    intervalMs: CHAT_FALLBACK_POLL_INTERVAL_MS,
    poll: () => retryResyncRef.current?.() ?? callbacksRef.current.onResync(),
  });

  const command = useCallback(async (
    event: "chat.thread.create" | "chat.message.send" | "chat.thread.markRead",
    payload: Record<string, unknown>,
  ): Promise<ChatRealtimeCommandResult> => {
    const socket = socketRef.current;
    if (!socketHealthy || !socket?.connected) return { handled: false };

    try {
      const data = await socket.timeout(5_000).emitWithAck(event, payload);
      if (
        data &&
        typeof data === "object" &&
        (data as { success?: unknown }).success === false
      ) {
        return { handled: false };
      }
      return { handled: true, data };
    } catch {
      return { handled: false };
    }
  }, [socketHealthy]);

  return { socketHealthy, command };
};
