"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent, PointerEvent as ReactPointerEvent } from "react";

type DragState = {
  pointerId: number | null;
  startX: number;
  startScrollLeft: number;
  didDrag: boolean;
  isDragging: boolean;
};

export function useHorizontalDragScroll<T extends HTMLElement>() {
  const railRef = useRef<T | null>(null);
  const dragStateRef = useRef<DragState>({
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
    didDrag: false,
    isDragging: false,
  });

  const cleanupWindowListenersRef = useRef<() => void>(() => {});

  const handlePointerMove = useCallback((event: Pick<PointerEvent, "clientX" | "pointerId" | "preventDefault">) => {
    const rail = railRef.current;
    const dragState = dragStateRef.current;

    if (!rail || dragState.pointerId !== event.pointerId) return;

    const dragDistance = event.clientX - dragState.startX;

    if (Math.abs(dragDistance) <= 4 && !dragState.isDragging) return;

    if (!dragState.isDragging) {
      dragState.isDragging = true;
      dragState.didDrag = true;

      if (!rail.hasPointerCapture(event.pointerId)) {
        rail.setPointerCapture(event.pointerId);
      }
    }

    event.preventDefault();
    rail.scrollLeft = dragState.startScrollLeft - dragDistance;
  }, []);

  const handlePointerEnd = useCallback((event: Pick<PointerEvent, "pointerId">) => {
    const rail = railRef.current;
    const dragState = dragStateRef.current;

    if (!rail || dragState.pointerId !== event.pointerId) return;

    if (rail.hasPointerCapture(event.pointerId)) {
      rail.releasePointerCapture(event.pointerId);
    }

    dragState.pointerId = null;
    dragState.isDragging = false;
    cleanupWindowListenersRef.current();
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<T>) => {
    const rail = railRef.current;

    if (!rail || event.button !== 0) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: rail.scrollLeft,
      didDrag: false,
      isDragging: false,
    };

    cleanupWindowListenersRef.current();

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);

    cleanupWindowListenersRef.current = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
      cleanupWindowListenersRef.current = () => {};
    };
  };

  useEffect(() => () => cleanupWindowListenersRef.current(), []);

  const handleClickCapture = (event: MouseEvent<T>) => {
    if (!dragStateRef.current.didDrag) return;

    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current.didDrag = false;
  };

  return {
    railRef,
    dragScrollHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerEnd,
      onPointerCancel: handlePointerEnd,
      onClickCapture: handleClickCapture,
    },
  };
}
