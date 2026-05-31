import { createDomainApiService } from "@/services/domain-api";
import { normalizeApiList } from "@/components/pages/Items/utils/product-normalizers";
import type { MenuItem } from "@/components/pages/Items/types";

const itemsService = createDomainApiService();

export const getItems = itemsService.get;
export const postItems = itemsService.post;
export const patchItems = itemsService.patch;
export const deleteItems = itemsService.del;

export const fetchMenuItems = async (endpoint: string, token?: string | null) => {
  const response = await getItems(endpoint, token);

  return {
    response,
    items: normalizeApiList<MenuItem>(response),
  };
};
