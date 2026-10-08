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

export const dispatchCartChanged = (detail?: CartChangedDetail) => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT, { detail }));
};
