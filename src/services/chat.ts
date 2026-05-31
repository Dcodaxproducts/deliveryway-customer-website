import { createDomainApiService } from "@/services/domain-api";

const chatService = createDomainApiService();

export const getChat = chatService.get;
export const postChat = chatService.post;
export const patchChat = chatService.patch;
export const deleteChat = chatService.del;
