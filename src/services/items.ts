import { createDomainApiService } from "@/services/domain-api";
import { normalizeApiArray, normalizeApiMeta } from "@/components/pages/Items/utils/restaurant-card-utils";
import type { ApiMeta, ItemsCategory, MenuItem } from "@/components/pages/Items/types";

const itemsService = createDomainApiService();

export const getItems = itemsService.get;
export const postItems = itemsService.post;
export const patchItems = itemsService.patch;
export const deleteItems = itemsService.del;

export const fetchMenuItems = async (endpoint: string, token?: string | null) => {
  const response = await getItems(endpoint, token);

  return {
    response,
    items: normalizeApiArray<MenuItem>(response),
  };
};

export const fetchMenuItemsPage = async ({
  restaurantId,
  branchId,
  categoryId,
  page,
  limit,
  locale,
  search,
  sort = "sortOrder:ASC",
  token,
}: {
  restaurantId: string;
  branchId?: string | number | null;
  categoryId?: string;
  page: number;
  limit: number;
  locale?: string | null;
  search?: string | null;
  sort?: string | null;
  token?: string | null;
}) => {
  const params = new URLSearchParams({
    restaurantId,
    page: String(page),
    limit: String(limit),
  });

  if (branchId) {
    params.set("branchId", String(branchId));
  }

  if (locale) {
    params.set("locale", locale);
  }

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  if (sort) {
    params.set("sort", sort);
  }

  const cuisinePath = categoryId
    ? `/customer-app/cuisines/${encodeURIComponent(categoryId)}/items`
    : "/customer-app/cuisines/items";
  const response = await getItems(`${cuisinePath}?${params.toString()}`, token);

  return {
    response,
    items: normalizeApiArray<MenuItem>(response),
    meta: normalizeApiMeta(response),
  };
};

export const fetchMenuItemDetailsByIds = async ({
  itemIds,
  itemSearchTermsById = {},
  branchId,
  token,
}: {
  itemIds: string[];
  itemSearchTermsById?: Record<string, string[]>;
  branchId?: string | number | null;
  token?: string | null;
}) => {
  const uniqueIds = Array.from(
    new Set(itemIds.map((id) => id.trim()).filter(Boolean))
  );

  const responses = await Promise.all(
    uniqueIds.map(async (itemId) => {
      const searchTerms = Array.from(
        new Set(
          [itemId, ...(itemSearchTermsById[itemId] ?? [])]
            .map((term) => term.trim())
            .filter(Boolean)
        )
      );
      let matchedItem: MenuItem | null = null;

      for (const searchTerm of searchTerms) {
        const params = new URLSearchParams({ search: searchTerm });

        if (branchId) {
          params.set("branchId", String(branchId));
        }

        const response = await getItems(
          `/v1/menu/items?${params.toString()}`,
          token
        );
        const items = normalizeApiArray<MenuItem>(response);
        const normalizedSearchTerm = searchTerm.toLowerCase();

        matchedItem =
          items.find((item) => String(item?.id || "") === itemId) ||
          items.find((item) => String(item?.slug || "").toLowerCase() === normalizedSearchTerm) ||
          items.find((item) => String(item?.name || "").toLowerCase() === normalizedSearchTerm) ||
          null;

        if (matchedItem) {
          break;
        }
      }

      return [itemId, matchedItem] as const;
    })
  );

  return Object.fromEntries(
    responses.filter((entry): entry is readonly [string, MenuItem] => entry[1] !== null)
  );
};

export const fetchSplitPizzaMenuItems = async ({
  restaurantId,
  branchId,
  search,
  page,
  token,
}: {
  restaurantId?: string | number | null;
  branchId?: string | number | null;
  search: string;
  page: number;
  token?: string | null;
}): Promise<{ data: MenuItem[]; meta?: ApiMeta }> => {
  const queryParams = new URLSearchParams();

  queryParams.set("page", String(page));
  queryParams.set("supportsSplitPizza", "true");

  if (restaurantId) {
    queryParams.set("restaurantId", String(restaurantId));
  }

  if (branchId) {
    queryParams.set("branchId", String(branchId));
  }

  const resolvedSearch = search?.trim();

  if (resolvedSearch) {
    queryParams.set("search", resolvedSearch);
  }

  const response = await getItems(`/v1/menu/items?${queryParams.toString()}`, token);

  return {
    data: normalizeApiArray<MenuItem>(response).filter((menuItem) => Boolean(menuItem?.id)),
    meta: normalizeApiMeta(response),
  };
};

export const fetchMenuCategoriesPage = async ({
  restaurantId,
  branchId,
  page,
  limit,
  locale,
  search,
  sort = "sortOrder:ASC",
  token,
}: {
  restaurantId: string;
  branchId?: string | number | null;
  page: number;
  limit: number;
  locale?: string | null;
  search?: string;
  sort?: string | null;
  token?: string | null;
}) => {
  const params = new URLSearchParams({
    restaurantId,
    page: String(page),
    limit: String(limit),
  });

  if (branchId) {
    params.set("branchId", String(branchId));
  }

  if (locale) {
    params.set("locale", locale);
  }

  if (search) {
    params.set("search", search);
  }

  if (sort) {
    params.set("sort", sort);
  }

  const response = await getItems(`/customer-app/cuisines?${params.toString()}`, token);

  return {
    response,
    categories: normalizeApiArray<ItemsCategory>(response),
    meta: normalizeApiMeta(response),
  };
};
