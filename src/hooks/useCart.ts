"use client";

import { useCallback, useMemo } from "react";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi, type DomainApiHook } from "@/hooks/useDomainApi";
import {
  addCustomerCartItem,
  addGroupOrderItem,
  clearCustomerCart,
  deleteCart,
  fetchCustomerCartItem,
  fetchGroupOrders,
  getCart,
  patchCart,
  postCart,
  updateCustomerCartItem,
} from "@/services/cart";
import type { ApiResult } from "@/services/http";
import type { ApiRecord, CartPayload } from "@/components/pages/Items/types";

const service = {
  get: getCart,
  post: postCart,
  patch: patchCart,
  del: deleteCart,
};

export type CartApi = DomainApiHook & {
  fetchCustomerCartItem: (args: { customerId: string; cartItemId: string }) => Promise<ApiRecord | null>;
  addCustomerCartItem: (args: { customerId: string; payload: CartPayload & Record<string, unknown> }) => Promise<ApiResult>;
  updateCustomerCartItem: (args: { cartItemId: string; payload: CartPayload & Record<string, unknown> }) => Promise<ApiResult>;
  clearCustomerCart: (args: { customerId: string }) => Promise<ApiResult>;
  fetchGroupOrders: () => Promise<{ response: ApiResult; groupOrders: ApiRecord[] }>;
  addGroupOrderItem: (args: { groupOrderId: string; payload: CartPayload & Record<string, unknown> }) => Promise<ApiResult>;
};

export const useCart = (token: string | null): CartApi => {
  const api = useDomainApi(token, { service, requestKey: queryKeys.cart.request });

  const fetchCartItem = useCallback(
    ({ customerId, cartItemId }: { customerId: string; cartItemId: string }) =>
      fetchCustomerCartItem({ customerId, cartItemId, token }),
    [token]
  );

  const addCartItem = useCallback(
    ({ customerId, payload }: { customerId: string; payload: CartPayload & Record<string, unknown> }) =>
      addCustomerCartItem({ customerId, payload, token }),
    [token]
  );

  const updateCartItem = useCallback(
    ({ cartItemId, payload }: { cartItemId: string; payload: CartPayload & Record<string, unknown> }) =>
      updateCustomerCartItem({ cartItemId, payload, token }),
    [token]
  );

  const clearCart = useCallback(
    ({ customerId }: { customerId: string }) => clearCustomerCart({ customerId, token }),
    [token]
  );

  const fetchGroups = useCallback(() => fetchGroupOrders(token), [token]);

  const addGroupItem = useCallback(
    ({ groupOrderId, payload }: { groupOrderId: string; payload: CartPayload & Record<string, unknown> }) =>
      addGroupOrderItem({ groupOrderId, payload, token }),
    [token]
  );

  return useMemo(
    () => ({
      ...api,
      fetchCustomerCartItem: fetchCartItem,
      addCustomerCartItem: addCartItem,
      updateCustomerCartItem: updateCartItem,
      clearCustomerCart: clearCart,
      fetchGroupOrders: fetchGroups,
      addGroupOrderItem: addGroupItem,
    }),
    [addCartItem, addGroupItem, api, clearCart, fetchCartItem, fetchGroups, updateCartItem]
  );
};

export default useCart;
