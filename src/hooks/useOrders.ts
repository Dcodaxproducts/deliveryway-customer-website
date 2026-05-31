"use client";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import { deleteOrders, getOrders, patchOrders, postOrders } from "@/services/orders";

const service = {
  get: getOrders,
  post: postOrders,
  patch: patchOrders,
  del: deleteOrders,
};

export const useOrders = (token: string | null) =>
  useDomainApi(token, { service, requestKey: queryKeys.orders.request });

export default useOrders;
