"use client";

export const CART_CHANGED_EVENT = "deliveryway:cart-changed";

export type CartChangedDetail = {
  itemCount?: number;
  itemCountDelta?: number;
  mutationStatus?: "pending" | "committed" | "rolled-back";
  refreshCart?: boolean;
  cartData?: unknown;
};

export const shouldFetchCartAfterChange = (detail?: CartChangedDetail) =>
  detail?.cartData === undefined &&
  (typeof detail?.itemCount !== "number" || detail.refreshCart === true);

export const dispatchCartChanged = (detail?: CartChangedDetail) => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT, { detail }));
};
