// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const socketMocks = vi.hoisted(() => {
  type Handler = (...args: unknown[]) => void;
  class FakeSocket {
    connected = false;
    handlers = new Map<string, Set<Handler>>();
    emitted: Array<[string, ...unknown[]]> = [];
    sequence: string[] = [];
    ackResult: unknown = { ok: true };
    disconnect = vi.fn(() => {
      this.connected = false;
      return this;
    });
    emitWithAck = vi.fn(async (event: string, payload: unknown) => {
      this.emitted.push([event, payload]);
      return this.ackResult;
    });

    on(event: string, handler: Handler) {
      this.sequence.push(`on:${event}`);
      const handlers = this.handlers.get(event) ?? new Set<Handler>();
      handlers.add(handler);
      this.handlers.set(event, handlers);
      return this;
    }

    off(event: string, handler: Handler) {
      this.handlers.get(event)?.delete(handler);
      return this;
    }

    emit(event: string, ...args: unknown[]) {
      this.emitted.push([event, ...args]);
      return this;
    }

    connect() {
      this.sequence.push("connect-call");
      return this;
    }

    timeout() {
      return this;
    }

    serverEmit(event: string, ...args: unknown[]) {
      if (event === "connect") this.connected = true;
      if (event === "disconnect" || event === "connect_error") this.connected = false;
      this.handlers.get(event)?.forEach((handler) => handler(...args));
    }

    listenerCount() {
      return [...this.handlers.values()].reduce((total, handlers) => total + handlers.size, 0);
    }
  }

  return { FakeSocket, sockets: [] as FakeSocket[] };
});

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => {
    const socket = new socketMocks.FakeSocket();
    socketMocks.sockets.push(socket);
    return socket;
  }),
}));

import {
  CHAT_FALLBACK_POLL_INTERVAL_MS,
  useChatRealtime,
} from "./useChatRealtime";

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
};

const callbacks = (onResync: () => Promise<unknown> | unknown = vi.fn().mockResolvedValue(undefined)) => ({
  onResync,
  onThread: vi.fn(),
  onMessage: vi.fn(),
  onRead: vi.fn(),
  onSummary: vi.fn(),
});

const flush = async () => {
  await act(async () => { await Promise.resolve(); });
};

describe("useChatRealtime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    socketMocks.sockets.length = 0;
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("registers every chat listener before connect and applies buffered events after one resync", async () => {
    const sync = deferred();
    const handlers = callbacks(vi.fn(() => sync.promise));
    renderHook(() => useChatRealtime({
      token: "jwt",
      activeThreadId: "thread-1",
      ...handlers,
    }));
    const socket = socketMocks.sockets[0];

    for (const event of [
      "chat.thread.created",
      "chat.thread.updated",
      "chat.message.created",
      "chat.thread.read",
      "chat.inbox.summary",
    ]) {
      expect(socket.sequence.indexOf(`on:${event}`))
        .toBeLessThan(socket.sequence.indexOf("connect-call"));
    }

    act(() => socket.serverEmit("connect"));
    act(() => {
      socket.serverEmit("chat.thread.updated", { id: "thread-1", subject: "Now", eventId: "e-1" });
      socket.serverEmit("chat.message.created", {
        threadId: "thread-1",
        message: { id: "message-1", body: "instant", createdAt: "2026-10-13T00:00:00Z" },
        eventId: "e-2",
      });
      socket.serverEmit("chat.message.created", {
        threadId: "thread-1",
        message: { id: "message-1", body: "instant", createdAt: "2026-10-13T00:00:00Z" },
        eventId: "e-2",
      });
      socket.serverEmit("chat.thread.read", { threadId: "thread-1", eventId: "e-3" });
      socket.serverEmit("chat.inbox.summary", {
        scope: "customer", total: 1, open: 1, inProgress: 0, resolved: 0, unread: 0,
      });
    });
    expect(handlers.onThread).not.toHaveBeenCalled();

    sync.resolve();
    await flush();
    expect(handlers.onResync).toHaveBeenCalledTimes(1);
    expect(socket.emitted).toContainEqual(["chat.inbox.subscribe"]);
    expect(socket.emitted).toContainEqual(["chat.thread.join", { threadId: "thread-1" }]);
    expect(handlers.onThread).toHaveBeenCalledWith({ id: "thread-1", subject: "Now" });
    expect(handlers.onMessage).toHaveBeenCalledTimes(1);
    expect(handlers.onRead).toHaveBeenCalledTimes(1);
    expect(handlers.onSummary).toHaveBeenCalledTimes(1);

    act(() => socket.serverEmit("chat.message.created", {
      threadId: "thread-1",
      message: { id: "message-2", body: "now", createdAt: "2026-10-13T00:00:01Z" },
      eventId: "e-4",
    }));
    expect(handlers.onMessage).toHaveBeenCalledTimes(2);
  });

  it("accepts out-of-order exact ids, rejects only duplicates, and drops stale reconnect buffers", async () => {
    const first = deferred();
    const second = deferred();
    const onResync = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const handlers = callbacks(onResync);
    renderHook(() => useChatRealtime({ token: "jwt", activeThreadId: null, ...handlers }));
    const socket = socketMocks.sockets[0];

    act(() => socket.serverEmit("connect"));
    act(() => socket.serverEmit("chat.thread.updated", { id: "stale", eventId: "100" }));
    act(() => socket.serverEmit("disconnect"));
    act(() => socket.serverEmit("connect"));
    act(() => {
      socket.serverEmit("chat.thread.updated", { id: "two", eventId: "2" });
      socket.serverEmit("chat.thread.updated", { id: "one", eventId: "1" });
      socket.serverEmit("chat.thread.updated", { id: "two", eventId: "2" });
    });

    first.resolve();
    await flush();
    expect(handlers.onThread).not.toHaveBeenCalled();
    second.resolve();
    await flush();
    expect(handlers.onThread).toHaveBeenCalledTimes(2);
    expect(handlers.onThread).toHaveBeenNthCalledWith(1, { id: "two" });
    expect(handlers.onThread).toHaveBeenNthCalledWith(2, { id: "one" });
  });

  it("runs one visibility-aware fallback only while disconnected", async () => {
    const handlers = callbacks();
    renderHook(() => useChatRealtime({ token: "jwt", activeThreadId: null, ...handlers }));
    const socket = socketMocks.sockets[0];

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CHAT_FALLBACK_POLL_INTERVAL_MS);
    });
    expect(handlers.onResync).toHaveBeenCalledTimes(1);

    act(() => socket.serverEmit("connect"));
    await flush();
    expect(handlers.onResync).toHaveBeenCalledTimes(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(CHAT_FALLBACK_POLL_INTERVAL_MS * 2);
    });
    expect(handlers.onResync).toHaveBeenCalledTimes(2);

    act(() => socket.serverEmit("disconnect"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(CHAT_FALLBACK_POLL_INTERVAL_MS);
    });
    expect(handlers.onResync).toHaveBeenCalledTimes(3);
  });

  it("uses socket commands while healthy and falls back when disabled", async () => {
    const handlers = callbacks();
    const { result } = renderHook(() => useChatRealtime({
      token: "jwt", activeThreadId: "thread-1", ...handlers,
    }));
    const socket = socketMocks.sockets[0];
    socket.ackResult = { id: "message-1" };
    act(() => socket.serverEmit("connect"));
    await flush();

    let response: Awaited<ReturnType<typeof result.current.command>> | undefined;
    await act(async () => {
      response = await result.current.command("chat.message.send", {
        threadId: "thread-1", message: "hello",
      });
    });
    expect(response).toEqual({ handled: true, data: { id: "message-1" } });
    expect(socket.emitWithAck).toHaveBeenCalledWith(
      "chat.message.send",
      { threadId: "thread-1", message: "hello" },
    );
  });

  it("does not reconnect on callback rerenders and cleans up all resources", async () => {
    const first = callbacks();
    const { rerender, unmount } = renderHook(
      ({ handlers }) => useChatRealtime({
        token: "jwt", activeThreadId: "thread-1", ...handlers,
      }),
      { initialProps: { handlers: first } },
    );
    const socket = socketMocks.sockets[0];
    act(() => socket.serverEmit("connect"));
    await flush();

    rerender({ handlers: callbacks() });
    expect(socketMocks.sockets).toHaveLength(1);
    unmount();

    expect(socket.emitted).toContainEqual(["chat.thread.leave", { threadId: "thread-1" }]);
    expect(socket.listenerCount()).toBe(0);
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(CHAT_FALLBACK_POLL_INTERVAL_MS * 2);
    });
  });

  it("keeps Socket.IO off and polls immediately when rollback flag is disabled", async () => {
    const handlers = callbacks();
    renderHook(() => useChatRealtime({
      token: "jwt",
      activeThreadId: null,
      realtimeEnabled: false,
      ...handlers,
    }));
    expect(socketMocks.sockets).toHaveLength(0);
    expect(handlers.onResync).toHaveBeenCalledTimes(1);
  });
});
