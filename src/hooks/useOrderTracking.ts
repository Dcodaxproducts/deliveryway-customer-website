"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import { API_BASE_URL } from "@/lib/axios";
import { getOrderTrackingSocketUrl } from "@/lib/order-tracking";
import {
  BoundedEventIdSet,
  isRealtimeEnabled,
  withoutEventId,
} from "@/lib/realtime";

export const ORDER_TRACKING_POLL_INTERVAL_MS = 10_000;

type OrderTrackingEvent = Record<string, unknown> & {
  id?: string;
  eventId?: string;
};

type UseOrderTrackingOptions = {
  orderId: string | null;
  token: string | null;
  onUpdate: (snapshot?: Record<string, unknown>) => Promise<unknown> | unknown;
  realtimeEnabled?: boolean;
};

export const useOrderTracking = ({
  orderId,
  token,
  onUpdate,
  realtimeEnabled = isRealtimeEnabled(),
}: UseOrderTrackingOptions) => {
  const onUpdateRef = useRef(onUpdate);
  const retryResyncRef = useRef<(() => Promise<unknown>) | null>(null);
  const [socketHealthy, setSocketHealthy] = useState(false);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!orderId || !token || !realtimeEnabled) {
      setSocketHealthy(false);
      return;
    }

    const socket: Socket = io(getOrderTrackingSocketUrl(API_BASE_URL), {
      auth: { token },
      autoConnect: false,
      transports: ["websocket"],
      withCredentials: true,
    });
    const subscription = { orderId };
    const seen = new BoundedEventIdSet();
    const buffered: OrderTrackingEvent[] = [];
    let buffering = true;
    let disposed = false;
    let connectionCycle = 0;

    const applyEvent = (payload: OrderTrackingEvent) => {
      if (payload.id && payload.id !== orderId) return;
      void onUpdateRef.current(withoutEventId(payload));
    };

    const handleRealtimeEvent = (payload: OrderTrackingEvent) => {
      if (!payload || typeof payload !== "object") return;
      if (!seen.accept(orderId, payload.eventId)) return;
      if (buffering) {
        buffered.push(payload);
        return;
      }
      applyEvent(payload);
    };

    const resyncAndActivate = async () => {
      if (!socket.connected) return onUpdateRef.current();
      const cycle = ++connectionCycle;
      buffering = true;
      buffered.length = 0;
      setSocketHealthy(false);

      try {
        await onUpdateRef.current();
      } catch {
        return;
      }

      if (disposed || cycle !== connectionCycle || !socket.connected) return;

      socket.emit("order.tracking.subscribe", subscription);
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

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleDisconnect);
    socket.on("order.tracking.snapshot", handleRealtimeEvent);
    socket.on("order.tracking.updated", handleRealtimeEvent);
    socket.connect();

    return () => {
      disposed = true;
      connectionCycle += 1;
      if (socket.connected) {
        socket.emit("order.tracking.unsubscribe", subscription);
      }
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleDisconnect);
      socket.off("order.tracking.snapshot", handleRealtimeEvent);
      socket.off("order.tracking.updated", handleRealtimeEvent);
      socket.disconnect();
      if (retryResyncRef.current === resyncAndActivate) {
        retryResyncRef.current = null;
      }
    };
  }, [orderId, realtimeEnabled, token]);

  useVisibilityPolling({
    enabled: Boolean(orderId && token && !socketHealthy),
    immediate: false,
    intervalMs: ORDER_TRACKING_POLL_INTERVAL_MS,
    poll: () => retryResyncRef.current?.() ?? onUpdateRef.current(),
  });
};
