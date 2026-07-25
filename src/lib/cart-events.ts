"use client";

export const CART_CHANGED_EVENT = "deliveryway:cart-changed";

export type CartChangedDetail = {
  itemCount?: number;
  itemCountDelta?: number;
  mutationStatus?: "pending" | "committed" | "rolled-back";
};

export const dispatchCartChanged = (detail?: CartChangedDetail) => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT, { detail }));
};
