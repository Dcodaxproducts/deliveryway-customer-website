"use client";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import { deleteNotifications, getNotifications, patchNotifications, postNotifications } from "@/services/notifications";

const service = {
  get: getNotifications,
  post: postNotifications,
  patch: patchNotifications,
  del: deleteNotifications,
};

export const useNotifications = (token: string | null) =>
  useDomainApi(token, { service, requestKey: queryKeys.notifications.request });

export default useNotifications;
