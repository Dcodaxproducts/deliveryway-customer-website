import { createDomainApiService } from "@/services/domain-api";

const ordersService = createDomainApiService();

export const getOrders = ordersService.get;
export const postOrders = ordersService.post;
export const patchOrders = ordersService.patch;
export const deleteOrders = ordersService.del;
