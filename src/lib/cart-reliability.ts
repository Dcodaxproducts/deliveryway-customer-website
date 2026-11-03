import type { ApiResult } from "@/services/http";
import type { CartQuote } from "@/types/cart";

export type CartMutationToken = symbol;

export const shouldShowFloatingCart = (
  hasCartItems: boolean,
  loadState: "idle" | "loading" | "ready" | "error",
) => hasCartItems || loadState === "error";

export const createCartMutationCoordinator = () => {
  let activeToken: CartMutationToken | null = null;

  return {
    start: (): CartMutationToken | null => {
      if (activeToken) return null;

      activeToken = Symbol("cart-mutation");
      return activeToken;
    },
    finish: (token: CartMutationToken) => {
      if (activeToken !== token) return false;

      activeToken = null;
      return true;
    },
  };
};

export type DeliveryQuoteResult =
  | { status: "not-applicable"; quote: null }
  | { status: "success"; quote: CartQuote }
  | { status: "error"; quote: null };

export const resolveDeliveryQuoteResult = (
  applicable: boolean,
  response: ApiResult | null,
  normalizeQuote: (value: unknown) => CartQuote | null,
): DeliveryQuoteResult => {
  if (!applicable) return { status: "not-applicable", quote: null };

  if (!response || response.error || response.success === false) {
    return { status: "error", quote: null };
  }

  const quote = normalizeQuote(response.data);
  return quote
    ? { status: "success", quote }
    : { status: "error", quote: null };
};
