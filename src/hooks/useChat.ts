"use client";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import { deleteChat, getChat, patchChat, postChat } from "@/services/chat";

const service = {
  get: getChat,
  post: postChat,
  patch: patchChat,
  del: deleteChat,
};

export const useChat = (token: string | null) =>
  useDomainApi(token, { service, requestKey: queryKeys.chat.request });

export default useChat;
