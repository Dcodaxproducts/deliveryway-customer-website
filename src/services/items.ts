import { createDomainApiService } from "@/services/domain-api";
import {
  normalizeApiArray,
  normalizeApiMeta,
} from "@/components/pages/Items/utils/restaurant-card-utils";
import type {
  ApiMeta,
  ItemsCategory,
  MenuItem,
} from "@/components/pages/Items/types";

const itemsService = createDomainApiService();
const MENU_ITEM_DETAILS_CACHE_TTL_MS = 60_000;
const MENU_ITEM_DETAILS_CACHE_MAX_ENTRIES = 100;

type MenuItemDetailsResult = {
  response: Awaited<ReturnType<typeof getItems>>;
  item: MenuItem | null;
};

const menuItemDetailsCache = new Map<
  string,
  { expiresAt: number; result: MenuItemDetailsResult }
>();
const menuItemDetailsRequests = new Map<
  string,
  Promise<MenuItemDetailsResult>
>();

export const getItems = itemsService.get;
export const postItems = itemsService.post;
export const patchItems = itemsService.patch;
export const deleteItems = itemsService.del;

export const clearMenuItemDetailsCache = () => {
  menuItemDetailsCache.clear();
  menuItemDetailsRequests.clear();
};

export const fetchMenuItems = async (
  endpoint: string,
  token?: string | null,
) => {
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
  token,
}: {
  restaurantId: string;
  branchId?: string | number | null;
  categoryId?: string;
  page: number;
  limit: number;
  token?: string | null;
}) => {
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const params = new URLSearchParams({
    restaurantId,
    page: String(page),
    limit: String(safeLimit),
    sortBy: "createdAt",
    sortOrder: "ASC",
  });

  if (categoryId) {
    params.set("categoryId", categoryId);
  }

  if (branchId) {
    params.set("branchId", String(branchId));
  }

  const response = await getItems(
    `/customer-app/items?${params.toString()}`,
    token,
  );

  return {
    response,
    items: normalizeApiArray<MenuItem>(response),
    meta: normalizeApiMeta(response),
  };
};

export const fetchMenuItemDetails = async ({
  restaurantId,
  branchId,
  identifier,
  token,
}: {
  restaurantId: string;
  branchId?: string | number | null;
  identifier: string;
  token?: string | null;
}) => {
  const params = new URLSearchParams({ restaurantId });

  if (branchId) {
    params.set("branchId", String(branchId));
  }

  const endpoint = `/customer-app/items/${encodeURIComponent(identifier)}?${params.toString()}`;
  const cacheKey = `${token ?? "guest"}:${endpoint}`;
  const cached = menuItemDetailsCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }
  menuItemDetailsCache.delete(cacheKey);

  const pendingRequest = menuItemDetailsRequests.get(cacheKey);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = (async (): Promise<MenuItemDetailsResult> => {
    const response = await getItems(endpoint, token);
    const item =
      typeof response.data === "object" &&
      response.data !== null &&
      !Array.isArray(response.data)
        ? (response.data as MenuItem)
        : null;
    const result = { response, item };

    if (item) {
      if (
        menuItemDetailsCache.size >= MENU_ITEM_DETAILS_CACHE_MAX_ENTRIES
      ) {
        const oldestKey = menuItemDetailsCache.keys().next().value;
        if (oldestKey) menuItemDetailsCache.delete(oldestKey);
      }
      menuItemDetailsCache.set(cacheKey, {
        expiresAt: Date.now() + MENU_ITEM_DETAILS_CACHE_TTL_MS,
        result,
      });
    }

    return result;
  })();

  menuItemDetailsRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    menuItemDetailsRequests.delete(cacheKey);
  }
};

export const fetchMenuItemDetailsByIds = async ({
  itemIds,
  itemSearchTermsById = {},
  restaurantId,
  branchId,
  token,
}: {
  itemIds: string[];
  itemSearchTermsById?: Record<string, string[]>;
  restaurantId?: string | number | null;
  branchId?: string | number | null;
  token?: string | null;
}) => {
  const uniqueIds = Array.from(
    new Set(itemIds.map((id) => id.trim()).filter(Boolean)),
  );

  const responses = await Promise.all(
    uniqueIds.map(async (itemId) => {
      const searchTerms = Array.from(
        new Set(
          [itemId, ...(itemSearchTermsById[itemId] ?? [])]
            .map((term) => term.trim())
            .filter(Boolean),
        ),
      );
      const fetchDetails = async (identifier: string) => {
        const params = new URLSearchParams();

        if (restaurantId) {
          params.set("restaurantId", String(restaurantId));
        }
        if (branchId) {
          params.set("branchId", String(branchId));
        }

        const query = params.toString();
        const response = await getItems(
          `/customer-app/items/${encodeURIComponent(identifier)}${query ? `?${query}` : ""}`,
          token,
        );
        const item =
          typeof response.data === "object" &&
          response.data !== null &&
          !Array.isArray(response.data)
            ? (response.data as MenuItem)
            : null;

        return item?.id ? item : null;
      };
      let matchedItem = await fetchDetails(itemId);

      for (const searchTerm of searchTerms.slice(1)) {
        if (matchedItem) break;

        const params = new URLSearchParams({ search: searchTerm });

        if (restaurantId) {
          params.set("restaurantId", String(restaurantId));
        }
        if (branchId) {
          params.set("branchId", String(branchId));
        }

        const response = await getItems(
          `/customer-app/items?${params.toString()}`,
          token,
        );
        const items = normalizeApiArray<MenuItem>(response);
        const normalizedSearchTerm = searchTerm.toLowerCase();
        const summary =
          items.find(
            (item) => String(item?.id || "") === itemId,
          ) ||
          items.find(
            (item) =>
              String(item?.slug || "").toLowerCase() === normalizedSearchTerm,
          ) ||
          items.find(
            (item) =>
              String(item?.name || "").toLowerCase() === normalizedSearchTerm,
          );

        if (summary) {
          matchedItem = await fetchDetails(
            String(summary.slug || summary.id || itemId),
          );
        }
      }

      return [itemId, matchedItem] as const;
    }),
  );

  return Object.fromEntries(
    responses.filter(
      (entry): entry is readonly [string, MenuItem] => entry[1] !== null,
    ),
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

  const response = await getItems(
    `/customer-app/items?${queryParams.toString()}`,
    token,
  );

  return {
    data: normalizeApiArray<MenuItem>(response).filter((menuItem) =>
      Boolean(menuItem?.id),
    ),
    meta: normalizeApiMeta(response),
  };
};

export const fetchMenuCategoriesPage = async ({
  restaurantId,
  page,
  limit,
  search,
  token,
}: {
  restaurantId: string;
  page: number;
  limit: number;
  search?: string;
  token?: string | null;
}) => {
  const params = new URLSearchParams({
    restaurantId,
    page: String(page),
    limit: String(limit),
    sortBy: "createdAt",
    sortOrder: "ASC",
  });

  if (search) {
    params.set("search", search);
  }

  const response = await getItems(
    `/customer-app/categories?${params.toString()}`,
    token,
  );

  return {
    response,
    categories: normalizeApiArray<ItemsCategory>(response),
    meta: normalizeApiMeta(response),
  };
};
