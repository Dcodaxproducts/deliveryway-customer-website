"use client";

import { useCallback, useMemo } from "react";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi, type DomainApiHook } from "@/hooks/useDomainApi";
import { deleteItems, fetchMenuItems, getItems, patchItems, postItems } from "@/services/items";
import type { ApiResult } from "@/services/http";
import type { MenuItem } from "@/components/pages/Items/types";

const service = {
  get: getItems,
  post: postItems,
  patch: patchItems,
  del: deleteItems,
};

export type ItemsApi = DomainApiHook & {
  fetchMenuItems: (endpoint: string) => Promise<{ response: ApiResult; items: MenuItem[] }>;
};

export const useItems = (token: string | null): ItemsApi => {
  const api = useDomainApi(token, { service, requestKey: queryKeys.items.request });

  const fetchMenuItemList = useCallback(
    (endpoint: string) => fetchMenuItems(endpoint, token),
    [token]
  );

  return useMemo(
    () => ({
      ...api,
      fetchMenuItems: fetchMenuItemList,
    }),
    [api, fetchMenuItemList]
  );
};

export default useItems;
