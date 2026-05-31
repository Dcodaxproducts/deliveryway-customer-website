import { createDomainApiService } from "@/services/domain-api";

const cartService = createDomainApiService();

export const getCart = cartService.get;
export const postCart = cartService.post;
export const patchCart = cartService.patch;
export const deleteCart = cartService.del;
