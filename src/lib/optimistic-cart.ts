import type { CartItemRecord } from "@/components/pages/Items/components/signature-selection/types";
import { normalizeCustomerCartData } from "@/services/cart";

export const OPTIMISTIC_CART_ITEM_FLAG = "__optimisticPending";

export type OptimisticCartItem = CartItemRecord & {
  id: string;
  __optimisticPending: true;
};

type OptimisticMenuItemInput = {
  id?: string | number;
  name?: unknown;
  unitPrice?: unknown;
  price?: unknown;
  basePrice?: unknown;
};

type OptimisticVariationInput = {
  id?: string | number;
  name?: string;
  displayText?: string | null;
  price?: unknown;
  pickupPrice?: unknown;
};

type OptimisticCartPayloadInput = {
  menuItemId?: string | number;
  restaurantMenuId?: string | number;
  variationId?: string | number | null;
  quantity: string | number;
  note?: unknown;
  branchId?: string | null;
};

const createTemporaryCartItemId = () =>
  `optimistic-${
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }`;

export const createOptimisticCartItem = ({
  menuItem,
  payload,
  selectedVariation,
  optimisticItemId = createTemporaryCartItemId(),
}: {
  menuItem: OptimisticMenuItemInput;
  payload: OptimisticCartPayloadInput;
  selectedVariation?: OptimisticVariationInput | null;
  optimisticItemId?: string;
}): OptimisticCartItem => {
  const quantity = Math.max(1, Math.floor(Number(payload.quantity) || 1));
  const unitPrice = Number(
    selectedVariation?.price ??
      menuItem.unitPrice ??
      menuItem.price ??
      menuItem.basePrice ??
      0,
  );

  return {
    id: optimisticItemId,
    menuItemId: payload.menuItemId ?? menuItem.id,
    restaurantMenuId: payload.restaurantMenuId,
    variationId: payload.variationId,
    quantity,
    unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
    note: payload.note,
    selectedVariation: selectedVariation ?? undefined,
    menuItem: {
      ...menuItem,
      selectedVariation: selectedVariation ?? undefined,
    },
    [OPTIMISTIC_CART_ITEM_FLAG]: true,
  } as OptimisticCartItem;
};

export const isPendingCartItem = (item: unknown): item is OptimisticCartItem =>
  Boolean(
    item &&
      typeof item === "object" &&
      (item as Record<string, unknown>)[OPTIMISTIC_CART_ITEM_FLAG] === true,
  );

export const hasPendingCartItems = (cartData: unknown) =>
  normalizeCustomerCartData(cartData).items.some(isPendingCartItem);

export const addPendingCartItem = (
  cartData: unknown,
  optimisticItem: OptimisticCartItem,
) => {
  const cart = normalizeCustomerCartData(cartData);

  return {
    ...cart,
    items: [
      ...cart.items.filter((item) => String(item.id) !== optimisticItem.id),
      optimisticItem,
    ],
  };
};

export const removePendingCartItem = (
  cartData: unknown,
  optimisticItemId: string,
) => {
  const cart = normalizeCustomerCartData(cartData);

  return {
    ...cart,
    items: cart.items.filter((item) => String(item.id) !== optimisticItemId),
  };
};

export const reconcileCartSnapshot = (
  authoritativeCartData: unknown,
  pendingItems: Iterable<OptimisticCartItem>,
) => {
  let snapshot = normalizeCustomerCartData(authoritativeCartData);

  for (const pendingItem of pendingItems) {
    snapshot = addPendingCartItem(snapshot, pendingItem);
  }

  return snapshot;
};
