import { createDomainApiService } from "@/services/domain-api";

const menuService = createDomainApiService();

export const getMenu = menuService.get;
export const postMenu = menuService.post;
export const patchMenu = menuService.patch;
export const deleteMenu = menuService.del;
