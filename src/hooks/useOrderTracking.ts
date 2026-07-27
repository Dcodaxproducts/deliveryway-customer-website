"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

import { API_BASE_URL } from "@/lib/axios";
import { getOrderTrackingSocketUrl } from "@/lib/order-tracking";

type UseOrderTrackingOptions = {
  orderId: string | null;
  token: string | null;
  onUpdate: () => void;
};

export const useOrderTracking = ({
  orderId,
  token,
  onUpdate,
}: UseOrderTrackingOptions) => {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!orderId || !token) return;

    const socket: Socket = io(getOrderTrackingSocketUrl(API_BASE_URL), {
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    const subscription = { orderId };
    const refreshOrder = () => onUpdateRef.current();

    socket.on("connect", () => {
      socket.emit("order.tracking.subscribe", subscription);
    });
    socket.on("order.tracking.snapshot", refreshOrder);
    socket.on("order.tracking.updated", refreshOrder);

    return () => {
      if (socket.connected) {
        socket.emit("order.tracking.unsubscribe", subscription);
      }
      socket.disconnect();
    };
  }, [orderId, token]);
};
