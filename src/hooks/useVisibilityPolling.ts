"use client";

import { useEffect, useRef } from "react";

type UseVisibilityPollingOptions = {
  enabled: boolean;
  intervalMs: number;
  poll: () => Promise<unknown> | unknown;
};

export const useVisibilityPolling = ({
  enabled,
  intervalMs,
  poll,
}: UseVisibilityPollingOptions) => {
  const pollRef = useRef(poll);

  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let inFlight = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const schedule = () => {
      clearTimer();
      if (cancelled || document.visibilityState !== "visible") return;

      timer = setTimeout(() => {
        void runPoll();
      }, intervalMs);
    };

    const runPoll = async () => {
      if (cancelled || inFlight || document.visibilityState !== "visible") return;

      inFlight = true;
      try {
        await pollRef.current();
      } catch {
        // A transient poll failure is retried on the next bounded interval.
      } finally {
        inFlight = false;
        schedule();
      }
    };

    const handleVisibilityChange = () => {
      clearTimer();
      if (document.visibilityState === "visible") {
        void runPoll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    void runPoll();

    return () => {
      cancelled = true;
      clearTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, intervalMs]);
};
