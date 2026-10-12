"use client";

import type { OptimisticCartItem } from "@/lib/optimistic-cart";

export const CART_CHANGED_EVENT = "deliveryway:cart-changed";

export type CartChangedDetail = {
  itemCount?: number;
  itemCountDelta?: number;
  mutationStatus?: "pending" | "committed" | "rolled-back";
  refreshCart?: boolean;
  cartData?: unknown;
  optimisticItem?: OptimisticCartItem;
  optimisticItemId?: string;
  mutationSequence?: number;
};

export const shouldFetchCartAfterChange = (detail?: CartChangedDetail) =>
  detail?.cartData === undefined &&
  (typeof detail?.itemCount !== "number" || detail.refreshCart === true);

export const shouldCancelCartFetchAfterChange = (detail?: CartChangedDetail) =>
  detail?.mutationStatus === "pending" || detail?.cartData !== undefined;

export const shouldAutoOpenCartAfterChange = (
  detail: CartChangedDetail | undefined,
  isMobileViewport: boolean,
) =>
  !isMobileViewport &&
  detail?.mutationStatus === "pending" &&
  Boolean(detail.optimisticItem);

export const isMobileCartViewport = () => {
  if (typeof window === "undefined") return false;

  return typeof window.matchMedia === "function"
    ? window.matchMedia("(max-width: 1023px)").matches
    : window.innerWidth < 1024;
};

export const dispatchCartChanged = (detail?: CartChangedDetail) => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT, { detail }));
};
