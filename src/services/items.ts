import { createDomainApiService } from "@/services/domain-api";

const itemsService = createDomainApiService();

export const getItems = itemsService.get;
export const postItems = itemsService.post;
export const patchItems = itemsService.patch;
export const deleteItems = itemsService.del;
