"use client";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import { deleteItems, getItems, patchItems, postItems } from "@/services/items";

const service = {
  get: getItems,
  post: postItems,
  patch: patchItems,
  del: deleteItems,
};

export const useItems = (token: string | null) =>
  useDomainApi(token, { service, requestKey: queryKeys.items.request });

export default useItems;
