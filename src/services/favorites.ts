import { normalizeApiArray, normalizeApiMeta } from "@/components/pages/Items/utils/restaurant-card-utils";
import type { ApiMeta, MenuItem } from "@/components/pages/Items/types";
import { createDomainApiService } from "@/services/domain-api";
import type { ApiResult } from "@/services/http";

const favoritesService = createDomainApiService();

export const fetchFavoriteItems = async ({
  token,
  customerId,
}: {
  token: string;
  customerId: string;
}): Promise<{ response: ApiResult; items: MenuItem[]; meta: ApiMeta }> => {
  const params = new URLSearchParams({ customerId });
  const response = await favoritesService.get(
    `/v1/customer-app/favorites?${params.toString()}`,
    token,
  );

  return {
    response,
    items: normalizeApiArray<MenuItem>(response),
    meta: normalizeApiMeta(response),
  };
};

export const addFavoriteItem = async ({
  token,
  menuItemId,
}: {
  token: string;
  menuItemId: string;
}) => {
  return favoritesService.post(
    "/v1/customer-app/favorites",
    { menuItemId },
    token,
  );
};

export const removeFavoriteItem = async ({
  token,
  customerId,
  menuItemId,
}: {
  token: string;
  customerId: string;
  menuItemId: string;
}) => {
  const params = new URLSearchParams({ customerId });

  return favoritesService.del(
    `/v1/customer-app/favorites/${encodeURIComponent(menuItemId)}?${params.toString()}`,
    token,
  );
};
