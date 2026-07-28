"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useAuthContext } from "@/components/providers/auth-provider";
import {
  buildFixedDealCartItemsInput,
  buildSelectedFlexibleDealCartItemsInput,
  isFixedItemDeal,
} from "@/components/pages/Home/utils/customer-deal-cart";
import { queryKeys } from "@/config/query-keys";
import { useDomainApi, type DomainApiHook } from "@/hooks/useDomainApi";
import { useDomainContext } from "@/hooks/useDomainContext";
import { dispatchCartChanged } from "@/lib/cart-events";
import { getApiErrorMessage } from "@/lib/errors";
import { runWithGuestSessionRecovery } from "@/lib/guest-session";
import {
  addCustomerCartItem,
  addCustomerCartDealItems,
  addGroupOrderItem,
  clearCustomerCart,
  deleteCustomerCartItem,
  deleteCustomerCartDeal,
  deleteCart,
  fetchCustomerCart,
  fetchCustomerCartForOrderType,
  fetchCustomerCartItem,
  fetchGroupOrders,
  getCustomerCartItemCount,
  getCart,
  patchCart,
  postCart,
  quoteCustomerCart,
  updateCustomerCart,
  updateCustomerCartOrderType,
  updateCustomerCartItem,
  updateCustomerCartItemQuantity,
  updateCustomerCartDealQuantity,
  type CartUpdatePayload,
} from "@/services/cart";
import type { ApiResult } from "@/services/http";
import type { CartItemRecord } from "@/components/pages/Items/components/signature-selection/types";
import type { ApiRecord } from "@/components/pages/Items/types";
import type { CustomerDeal, CustomerDealMenuItem } from "@/types/customer-deals";
import type { AddCartItemPayload, CartQuote } from "@/types/cart";

type CartMutationPayload = AddCartItemPayload | Record<string, unknown>;

export type AddDealToCartInput = {
  deal: CustomerDeal;
  selectedMenuItemIds?: string[];
  eligibleMenuItems?: CustomerDealMenuItem[];
  cartItemPayloads?: AddCartItemPayload[];
};

const service = {
  get: getCart,
  post: postCart,
  patch: patchCart,
  del: deleteCart,
};

const getOptimisticCartQuantity = (payload: CartMutationPayload) => {
  const quantity = Number(payload.quantity);

  return Number.isFinite(quantity) && quantity > 0
    ? Math.max(1, Math.floor(quantity))
    : 1;
};

export type CartApi = DomainApiHook & {
  ensureCustomerSession: () => Promise<{ customerId: string; token: string }>;
  fetchCustomerCart: (args: { customerId: string }) => Promise<{ response: ApiResult; items: CartItemRecord[]; quote: CartQuote | null }>;
  fetchCustomerCartForOrderType: (args: {
    customerId: string;
    orderType: "DELIVERY" | "TAKEAWAY";
  }) => Promise<{
    response: ApiResult;
    items: CartItemRecord[];
    quote: CartQuote | null;
  }>;
  fetchCustomerCartItem: (args: { customerId: string; cartItemId: string }) => Promise<ApiRecord | null>;
  addCustomerCartItem: (args: { customerId: string; payload: CartMutationPayload }) => Promise<ApiResult>;
  quoteCustomerCart: (args: { customerId: string; payload?: Record<string, unknown> }) => Promise<ApiResult>;
  updateCustomerCart: (args: { customerId: string; payload: CartUpdatePayload }) => Promise<ApiResult>;
  updateCustomerCartOrderType: (args: { customerId: string; orderType: "DELIVERY" | "TAKEAWAY" }) => Promise<ApiResult>;
  updateCustomerCartItem: (args: { cartItemId: string; payload: CartMutationPayload }) => Promise<ApiResult>;
  clearCustomerCart: (args: { customerId: string }) => Promise<ApiResult>;
  updateCustomerCartItemQuantity: (args: { customerId: string; cartItemId: string; quantity: number }) => Promise<ApiResult>;
  updateCustomerCartDealQuantity: (args: { customerId: string; dealTargetId: string; quantity: number }) => Promise<ApiResult>;
  deleteCustomerCartItem: (args: { customerId: string; cartItemId: string }) => Promise<ApiResult>;
  deleteCustomerCartDeal: (args: { customerId: string; dealTargetId: string }) => Promise<ApiResult>;
  fetchGroupOrders: () => Promise<{ response: ApiResult; groupOrders: ApiRecord[] }>;
  addGroupOrderItem: (args: { groupOrderId: string; payload: CartMutationPayload }) => Promise<ApiResult>;
};

export const useCart = (token: string | null): CartApi => {
  const { user, ensureGuestSession, renewGuestSession } = useAuthContext();
  const { context: domainContext } = useDomainContext();
  const api = useDomainApi(token, { service, requestKey: queryKeys.cart.request });
  const resolveRestaurantId = useCallback(() => {
    const restaurantId = user?.restaurantId ?? domainContext?.restaurantId;

    if (!restaurantId) {
      throw new Error("Restaurant context is unavailable");
    }

    return restaurantId;
  }, [domainContext?.restaurantId, user?.restaurantId]);
  const resolveCustomerSession = useCallback(
    async (customerId?: string) => {
      if (customerId && token) {
        return { customerId, token, isGuest: user?.isGuest === true };
      }

      const session = await ensureGuestSession(resolveRestaurantId());

      return {
        customerId: session.user.id,
        token: session.accessToken,
        isGuest: session.user.isGuest === true,
      };
    },
    [
      ensureGuestSession,
      resolveRestaurantId,
      token,
      user?.isGuest,
    ],
  );
  const ensureCustomerSession = useCallback(
    () => resolveCustomerSession(user?.id),
    [resolveCustomerSession, user?.id],
  );

  const fetchCart = useCallback(
    ({ customerId }: { customerId: string }) => fetchCustomerCart({ customerId, token }),
    [token]
  );
  const fetchCartForOrderType = useCallback(
    ({
      customerId,
      orderType,
    }: {
      customerId: string;
      orderType: "DELIVERY" | "TAKEAWAY";
    }) =>
      fetchCustomerCartForOrderType({
        customerId,
        orderType,
        token,
      }),
    [token],
  );

  const fetchCartItem = useCallback(
    ({ customerId, cartItemId }: { customerId: string; cartItemId: string }) =>
      fetchCustomerCartItem({ customerId, cartItemId, token }),
    [token]
  );

  const addCartItem = useCallback(
    async ({ customerId, payload }: { customerId: string; payload: CartMutationPayload }) => {
      const optimisticQuantity = getOptimisticCartQuantity(payload);
      dispatchCartChanged({
        itemCountDelta: optimisticQuantity,
        mutationStatus: "pending",
      });

      try {
        const session = await resolveCustomerSession(customerId);
        const response = await runWithGuestSessionRecovery({
          session,
          request: (activeSession) =>
            addCustomerCartItem({
              customerId: activeSession.customerId,
              payload,
              token: activeSession.token,
            }),
          renewSession: async () => {
            const renewedSession = await renewGuestSession(resolveRestaurantId());

            return {
              customerId: renewedSession.user.id,
              token: renewedSession.accessToken,
              isGuest: true,
            };
          },
        });

        if (response && !response.error && response.success !== false) {
          dispatchCartChanged({
            itemCount: getCustomerCartItemCount(response.data),
            mutationStatus: "committed",
            refreshCart: true,
          });
        } else {
          dispatchCartChanged({
            itemCountDelta: -optimisticQuantity,
            mutationStatus: "rolled-back",
          });
        }

        return response;
      } catch (error) {
        dispatchCartChanged({
          itemCountDelta: -optimisticQuantity,
          mutationStatus: "rolled-back",
        });
        throw error;
      }
    },
    [renewGuestSession, resolveCustomerSession, resolveRestaurantId]
  );

  const refreshCartQuote = useCallback(
    async ({ customerId, payload }: { customerId: string; payload?: Record<string, unknown> }) => {
      const session = await resolveCustomerSession(customerId);
      return quoteCustomerCart({
        customerId: session.customerId,
        payload,
        token: session.token,
      });
    },
    [resolveCustomerSession]
  );

  const updateCart = useCallback(
    ({ customerId, payload }: { customerId: string; payload: CartUpdatePayload }) =>
      updateCustomerCart({ customerId, payload, token }),
    [token]
  );

  const updateCartOrderType = useCallback(
    ({ customerId, orderType }: { customerId: string; orderType: "DELIVERY" | "TAKEAWAY" }) =>
      updateCustomerCartOrderType({ customerId, orderType, token }),
    [token]
  );

  const updateCartItem = useCallback(
    async ({ cartItemId, payload }: { cartItemId: string; payload: CartMutationPayload }) => {
      const response = await updateCustomerCartItem({ cartItemId, payload, token });

      if (response && !response.error && response.success !== false) {
        dispatchCartChanged({
          itemCount: getCustomerCartItemCount(response.data),
          refreshCart: true,
        });
      }

      return response;
    },
    [token]
  );

  const clearCart = useCallback(
    async ({ customerId }: { customerId: string }) => {
      const session = await resolveCustomerSession(customerId);
      const response = await clearCustomerCart({
        customerId: session.customerId,
        token: session.token,
      });

      if (response && !response.error && response.success !== false) {
        dispatchCartChanged({ itemCount: 0 });
      }

      return response;
    },
    [resolveCustomerSession]
  );

  const updateCartItemQuantity = useCallback(
    async ({ customerId, cartItemId, quantity }: { customerId: string; cartItemId: string; quantity: number }) => {
      const response = await updateCustomerCartItemQuantity({ customerId, cartItemId, quantity, token });

      if (response && !response.error && response.success !== false) {
        dispatchCartChanged({
          itemCount: getCustomerCartItemCount(response.data),
        });
      }

      return response;
    },
    [token]
  );

  const updateCartDealQuantity = useCallback(
    async ({ customerId, dealTargetId, quantity }: { customerId: string; dealTargetId: string; quantity: number }) => {
      const response = await updateCustomerCartDealQuantity({ customerId, dealTargetId, quantity, token });

      if (response && !response.error && response.success !== false) {
        dispatchCartChanged({
          itemCount: getCustomerCartItemCount(response.data),
        });
      }

      return response;
    },
    [token]
  );

  const deleteCartItem = useCallback(
    async ({ customerId, cartItemId }: { customerId: string; cartItemId: string }) => {
      const response = await deleteCustomerCartItem({ customerId, cartItemId, token });

      if (response && !response.error && response.success !== false) {
        dispatchCartChanged({
          itemCount: getCustomerCartItemCount(response.data),
        });
      }

      return response;
    },
    [token]
  );

  const deleteCartDeal = useCallback(
    async ({ customerId, dealTargetId }: { customerId: string; dealTargetId: string }) => {
      const response = await deleteCustomerCartDeal({ customerId, dealTargetId, token });

      if (response && !response.error && response.success !== false) {
        dispatchCartChanged({
          itemCount: getCustomerCartItemCount(response.data),
        });
      }

      return response;
    },
    [token]
  );

  const fetchGroups = useCallback(async () => {
    const session = await resolveCustomerSession(user?.id);
    return fetchGroupOrders(session.token);
  }, [resolveCustomerSession, user?.id]);

  const addGroupItem = useCallback(
    async ({ groupOrderId, payload }: { groupOrderId: string; payload: CartMutationPayload }) => {
      const session = await resolveCustomerSession(user?.id);
      return addGroupOrderItem({
        groupOrderId,
        payload,
        token: session.token,
      });
    },
    [resolveCustomerSession, user?.id]
  );

  return useMemo(
    () => ({
      ...api,
      ensureCustomerSession,
      fetchCustomerCart: fetchCart,
      fetchCustomerCartForOrderType: fetchCartForOrderType,
      fetchCustomerCartItem: fetchCartItem,
      addCustomerCartItem: addCartItem,
      quoteCustomerCart: refreshCartQuote,
      updateCustomerCart: updateCart,
      updateCustomerCartOrderType: updateCartOrderType,
      updateCustomerCartItem: updateCartItem,
      clearCustomerCart: clearCart,
      updateCustomerCartItemQuantity: updateCartItemQuantity,
      updateCustomerCartDealQuantity: updateCartDealQuantity,
      deleteCustomerCartItem: deleteCartItem,
      deleteCustomerCartDeal: deleteCartDeal,
      fetchGroupOrders: fetchGroups,
      addGroupOrderItem: addGroupItem,
    }),
    [addCartItem, addGroupItem, api, clearCart, deleteCartDeal, deleteCartItem, ensureCustomerSession, fetchCart, fetchCartForOrderType, fetchCartItem, fetchGroups, refreshCartQuote, updateCart, updateCartDealQuantity, updateCartItem, updateCartItemQuantity, updateCartOrderType]
  );
};

export const useAddDealToCart = (branchId?: string | null) => {
  const t = useTranslations("cart");
  const { token, user } = useAuthContext();
  const queryClient = useQueryClient();
  const {
    ensureCustomerSession,
  } = useCart(token);
  const customerId = user?.id ?? "";

  return useMutation({
    mutationFn: async ({ deal, selectedMenuItemIds = [], eligibleMenuItems, cartItemPayloads }: AddDealToCartInput) => {
      const session = customerId
        ? { customerId, token }
        : await ensureCustomerSession();

      if (!branchId) {
        throw new Error(t("selectBranchFirst"));
      }

      if (isFixedItemDeal(deal) && deal.scopeMenuItems.length < 1) {
        throw new Error(t("dealNoItems"));
      }

      if (!cartItemPayloads?.length && deal.dealSelectionMode === "FLEXIBLE_ITEMS" && selectedMenuItemIds.length < 1) {
        throw new Error(t("dealNoItems"));
      }

      const payloads = cartItemPayloads?.length
        ? cartItemPayloads
        : deal.dealSelectionMode === "FLEXIBLE_ITEMS"
          ? buildSelectedFlexibleDealCartItemsInput(deal, branchId, selectedMenuItemIds, eligibleMenuItems)
          : buildFixedDealCartItemsInput(deal, branchId);
      const requiredQuantity = Number(deal.dealRequiredQuantity);
      const minimumEligibleItems = Number.isFinite(requiredQuantity) && requiredQuantity > 0
        ? Math.floor(requiredQuantity)
        : 1;

      if (payloads.length < 1) {
        throw new Error(t("dealNoItems"));
      }

      if (!cartItemPayloads?.length && deal.dealSelectionMode === "FLEXIBLE_ITEMS" && payloads.length < minimumEligibleItems) {
        throw new Error(t("dealNoItems"));
      }

      const response = await addCustomerCartDealItems({
        customerId: session.customerId,
        payloads,
        token: session.token,
      });

      if (!response || response.error || response.success === false) {
        throw new Error(getApiErrorMessage(response, t("failedAddDealItem")));
      }

      return response;
    },
    onSuccess: async (response) => {
      dispatchCartChanged({
        itemCount: getCustomerCartItemCount(response.data),
        refreshCart: true,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.current }),
        queryClient.invalidateQueries({ queryKey: queryKeys.checkout.all }),
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) => queryKey[0] === "cart" || queryKey[0] === "checkout",
        }),
      ]);
      toast.success(t("dealItemsAdded"));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t("failedAddDeal")));
    },
  });
};
