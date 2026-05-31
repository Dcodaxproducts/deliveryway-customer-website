"use client";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import { deleteMenu, getMenu, patchMenu, postMenu } from "@/services/menu";

const service = {
  get: getMenu,
  post: postMenu,
  patch: patchMenu,
  del: deleteMenu,
};

export const useMenu = (token: string | null) =>
  useDomainApi(token, { service, requestKey: queryKeys.menu.request });

export default useMenu;
