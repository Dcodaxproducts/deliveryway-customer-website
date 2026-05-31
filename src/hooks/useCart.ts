"use client";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import { deleteCart, getCart, patchCart, postCart } from "@/services/cart";

const service = {
  get: getCart,
  post: postCart,
  patch: patchCart,
  del: deleteCart,
};

export const useCart = (token: string | null) =>
  useDomainApi(token, { service, requestKey: queryKeys.cart.request });

export default useCart;
