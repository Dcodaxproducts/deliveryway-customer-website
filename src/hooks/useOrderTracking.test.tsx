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
    disconnect = vi.fn(() => {
      this.connected = false;
      this.sequence.push("disconnect");
      return this;
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

import { ORDER_TRACKING_POLL_INTERVAL_MS, useOrderTracking } from "./useOrderTracking";

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
};

const flush = async () => {
  await act(async () => { await Promise.resolve(); });
};

describe("useOrderTracking realtime", () => {
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

  it("registers listeners before connecting and applies socket events instantly", async () => {
    const resync = deferred();
    const onUpdate = vi.fn().mockImplementationOnce(() => resync.promise);
    renderHook(() => useOrderTracking({
      orderId: "order-1",
      token: "jwt",
      onUpdate,
    }));
    const socket = socketMocks.sockets[0];

    expect(socket.sequence.indexOf("on:order.tracking.updated"))
      .toBeLessThan(socket.sequence.indexOf("connect-call"));

    act(() => socket.serverEmit("connect"));
    act(() => socket.serverEmit("order.tracking.updated", {
      id: "order-1",
      status: "CONFIRMED",
      eventId: "evt-1",
    }));
    expect(onUpdate).toHaveBeenCalledTimes(1);

    resync.resolve();
    await flush();
    expect(socket.emitted).toContainEqual([
      "order.tracking.subscribe",
      { orderId: "order-1" },
    ]);
    expect(onUpdate).toHaveBeenLastCalledWith({
      id: "order-1",
      status: "CONFIRMED",
    });

    act(() => socket.serverEmit("order.tracking.snapshot", {
      id: "order-1",
      status: "PREPARING",
      eventId: "evt-2",
    }));
    expect(onUpdate).toHaveBeenLastCalledWith({
      id: "order-1",
      status: "PREPARING",
    });
  });

  it("drops the stale reconnect buffer and applies only the current cycle after resync", async () => {
    const first = deferred();
    const second = deferred();
    const onUpdate = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    renderHook(() => useOrderTracking({ orderId: "order-1", token: "jwt", onUpdate }));
    const socket = socketMocks.sockets[0];

    act(() => socket.serverEmit("connect"));
    act(() => socket.serverEmit("order.tracking.updated", {
      id: "order-1", status: "STALE", eventId: "old",
    }));
    act(() => socket.serverEmit("disconnect"));
    act(() => socket.serverEmit("connect"));
    act(() => socket.serverEmit("order.tracking.updated", {
      id: "order-1", status: "CURRENT", eventId: "new",
    }));

    first.resolve();
    await flush();
    expect(onUpdate).toHaveBeenCalledTimes(2);

    second.resolve();
    await flush();
    expect(onUpdate).toHaveBeenCalledTimes(3);
    expect(onUpdate).toHaveBeenLastCalledWith({ id: "order-1", status: "CURRENT" });
    expect(onUpdate).not.toHaveBeenCalledWith({ id: "order-1", status: "STALE" });
  });

  it("dedupes exact ids while accepting out-of-order ids", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useOrderTracking({ orderId: "order-1", token: "jwt", onUpdate }));
    const socket = socketMocks.sockets[0];
    act(() => socket.serverEmit("connect"));
    await flush();

    act(() => {
      socket.serverEmit("order.tracking.updated", { id: "order-1", status: "A", eventId: "100" });
      socket.serverEmit("order.tracking.updated", { id: "order-1", status: "B", eventId: "2" });
      socket.serverEmit("order.tracking.updated", { id: "order-1", status: "A", eventId: "100" });
    });

    expect(onUpdate).toHaveBeenCalledTimes(3);
    expect(onUpdate).toHaveBeenNthCalledWith(2, { id: "order-1", status: "A" });
    expect(onUpdate).toHaveBeenNthCalledWith(3, { id: "order-1", status: "B" });
  });

  it("polls only while disconnected or not resynced and stops when healthy", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useOrderTracking({ orderId: "order-1", token: "jwt", onUpdate }));
    const socket = socketMocks.sockets[0];

    await act(async () => {
      await vi.advanceTimersByTimeAsync(ORDER_TRACKING_POLL_INTERVAL_MS);
    });
    expect(onUpdate).toHaveBeenCalledTimes(1);

    act(() => socket.serverEmit("connect"));
    await flush();
    expect(onUpdate).toHaveBeenCalledTimes(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ORDER_TRACKING_POLL_INTERVAL_MS * 3);
    });
    expect(onUpdate).toHaveBeenCalledTimes(2);

    act(() => socket.serverEmit("disconnect"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ORDER_TRACKING_POLL_INTERVAL_MS);
    });
    expect(onUpdate).toHaveBeenCalledTimes(3);
  });

  it("unsubscribes, removes listeners, disconnects, and leaves no timer", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const { unmount } = renderHook(() => useOrderTracking({
      orderId: "order-1", token: "jwt", onUpdate,
    }));
    const socket = socketMocks.sockets[0];
    act(() => socket.serverEmit("connect"));
    await flush();

    unmount();
    expect(socket.emitted).toContainEqual([
      "order.tracking.unsubscribe",
      { orderId: "order-1" },
    ]);
    expect(socket.listenerCount()).toBe(0);
    expect(socket.disconnect).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(ORDER_TRACKING_POLL_INTERVAL_MS * 2);
    });
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it("uses polling only when the feature flag is disabled", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useOrderTracking({
      orderId: "order-1", token: "jwt", onUpdate, realtimeEnabled: false,
    }));
    expect(socketMocks.sockets).toHaveLength(0);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ORDER_TRACKING_POLL_INTERVAL_MS);
    });
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });
});
