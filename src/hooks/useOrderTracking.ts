"use client";

import { useEffect, useRef } from "react";

import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";

export const ORDER_TRACKING_POLL_INTERVAL_MS = 10_000;

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

  useVisibilityPolling({
    enabled: Boolean(orderId && token),
    intervalMs: ORDER_TRACKING_POLL_INTERVAL_MS,
    poll: () => onUpdateRef.current(),
  });
};
