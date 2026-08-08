"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { CategorySidebar } from "./CategorySidebar";
import { ItemsListing } from "./Items";
import { MobileCategoryTabs } from "./MobileCategoryNavigation";
import { CustomerDealsSection } from "@/components/pages/Home/components/CustomerDealsSection";
import useItems from "@/hooks/useItems";
import useMenu from "@/hooks/useMenu";
import { useAuth } from "@/hooks/useAuth";
import { useAddDealToCart } from "@/hooks/useCart";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useCustomerDeals } from "@/hooks/useCustomerDeals";
import { useDomainContext } from "@/hooks/useDomainContext";
import { useHome } from "@/hooks/useHome";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import { resolveCustomerCurrency } from "@/lib/money";
import { setItemsMenuViewMode } from "@/lib/view-preferences";
import type {
  ApiMeta,
  ItemsCategory,
  MenuItem,
} from "@/components/pages/Items/types";
import { resolveHasNext } from "@/components/pages/Items/utils/restaurant-card-utils";
import { resolveCategoryNavigation } from "@/components/pages/Items/utils/category-scroll";
import type { CustomerDeal } from "@/types/customer-deals";

type MenuViewMode = "multiple" | "onePage";
type ItemsContentSource = "category" | "menu";

type ItemsMenu = {
  id?: string | number | null;
  name?: string | null;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: string | number | null;
  items?: Array<{
    id?: string | number | null;
    sortOrder?: string | number | null;
    menuItem?: MenuItem | null;
  }>;
};

type ItemsSectionForListing = Omit<ItemsCategory, "items"> & {
  items?: ItemsMenu["items"];
};

const CATEGORY_PAGE_LIMIT = 20;
const PUBLIC_CATEGORIES_REQUEST_ATTEMPTS = 3;
const MOBILE_ITEMS_QUERY = "(max-width: 1023px)";

type ItemsLayoutProps = {
  categoryId?: string;
};

const subscribeToMobileItemsViewport = (onStoreChange: () => void) => {
  const mediaQuery = window.matchMedia(MOBILE_ITEMS_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
};

const getMobileItemsViewportSnapshot = () =>
  window.matchMedia(MOBILE_ITEMS_QUERY).matches;

const getMobileItemsViewportServerSnapshot = () => false;

const isFailedPublicCategoriesResponse = (response: {
  success?: boolean;
  error?: unknown;
}) => response.success === false || Boolean(response.error);

export function ItemsLayout({ categoryId }: ItemsLayoutProps) {
  const isMobileItemsViewport = useSyncExternalStore(
    subscribeToMobileItemsViewport,
    getMobileItemsViewportSnapshot,
    getMobileItemsViewportServerSnapshot,
  );
  const { token, restaurantId: authRestaurantId, user } = useAuth();
  const { context: domainContext } = useDomainContext();
  const { locale } = useAppLocale();
  const { fetchMenuCategoriesPage } = useItems(null);
  const { fetchSignatureMenus } = useMenu(token);

  const [categories, setCategories] = useState<ItemsCategory[]>([]);
  const [menus, setMenus] = useState<ItemsMenu[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingMoreCategories, setLoadingMoreCategories] = useState(false);
  const [loadingMenus, setLoadingMenus] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreCategories, setHasMoreCategories] = useState(false);
  const [contentSource, setContentSource] =
    useState<ItemsContentSource>("category");
  const [activeOnePageCategoryId, setActiveOnePageCategoryId] = useState("");
  const [activeOnePageMenuId, setActiveOnePageMenuId] = useState("");
  const [activeMenuId, setActiveMenuId] = useState("");
  const [scrollTarget, setScrollTarget] = useState<{
    id: string;
    nonce: number;
  } | null>(null);

  const [viewMode, setViewMode] = useState<MenuViewMode>(() => {
    return resolveCategoryNavigation(categoryId).viewMode;
  });

  const requestInFlightRef = useRef(false);
  const latestCategoryRequestRef = useRef(0);

  const restaurantId = useMemo(() => {
    return resolveHomeRestaurantId(user, authRestaurantId, domainContext);
  }, [authRestaurantId, domainContext, user]);
  const branchId = useMemo(
    () => resolveHomeBranchId(user, domainContext),
    [domainContext, user],
  );
  const homeQuery = useHome(
    restaurantId,
    branchId,
    Boolean(restaurantId && branchId),
  );
  const currency = resolveCustomerCurrency({
    configCurrency: homeQuery.data?.data.config?.currency,
    restaurant: homeQuery.data?.data.restaurant,
  });
  const dealsRestaurantId = contentSource === "menu" ? restaurantId : "";
  const dealsQuery = useCustomerDeals({
    restaurantId: dealsRestaurantId,
    branchId,
    locale,
    limit: 20,
  });
  const addDealMutation = useAddDealToCart(branchId);
  const handleAddDeal = useCallback(
    (deal: CustomerDeal, selectedMenuItemIds?: string[]) => {
      addDealMutation.mutate({ deal, selectedMenuItemIds });
    },
    [addDealMutation],
  );

  useEffect(() => {
    setItemsMenuViewMode(viewMode);
  }, [viewMode]);

  useEffect(() => {
    const categoryNavigation = resolveCategoryNavigation(categoryId);

    if (isMobileItemsViewport) {
      setContentSource("category");
      setViewMode("onePage");
    }

    if (!categoryNavigation.activeCategoryId) {
      return;
    }

    setContentSource("category");
    setViewMode(categoryNavigation.viewMode);
    setActiveOnePageCategoryId(categoryNavigation.activeCategoryId);
    setScrollTarget({
      id: categoryNavigation.activeCategoryId,
      nonce: Date.now(),
    });
  }, [categoryId, isMobileItemsViewport]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const normalizedMenus = useMemo(() => {
    const deduped = new Map<string, ItemsMenu>();

    menus.forEach((menu) => {
      const id = String(menu?.id || "");
      if (!id || menu?.isActive === false) return;

      deduped.set(id, {
        ...menu,
        id,
        items: Array.isArray(menu?.items) ? menu.items : [],
      });
    });

    return Array.from(deduped.values()).sort((a, b) => {
      return Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0);
    });
  }, [menus]);

  const filteredMenus = useMemo(() => {
    const term = debouncedSearch.toLowerCase();

    if (!term) return normalizedMenus;

    return normalizedMenus.filter((menu) => {
      return String(menu?.name || "")
        .toLowerCase()
        .includes(term);
    });
  }, [normalizedMenus, debouncedSearch]);

  const activeSections = contentSource === "menu" ? filteredMenus : categories;
  const listingSections = useMemo<ItemsSectionForListing[]>(() => {
    if (contentSource === "menu") return filteredMenus;

    return categories.map((category) => ({
      ...category,
      items: undefined,
    }));
  }, [contentSource, filteredMenus, categories]);
  const loadingSections =
    contentSource === "menu" ? loadingMenus : loadingCategories;
  const loadingMoreSections =
    contentSource === "menu" ? false : loadingMoreCategories;
  const hasMoreSections = contentSource === "menu" ? false : hasMoreCategories;

  const fetchCategories = async ({
    page = 1,
    searchValue = "",
    append = false,
    background = false,
  }: {
    page?: number;
    searchValue?: string;
    append?: boolean;
    background?: boolean;
  }) => {
    if (!restaurantId) return;
    if (append && requestInFlightRef.current) return;

    const requestId = latestCategoryRequestRef.current + 1;
    latestCategoryRequestRef.current = requestId;

    try {
      requestInFlightRef.current = true;

      if (!background) {
        if (append) {
          setLoadingMoreCategories(true);
        } else {
          setLoadingCategories(true);
        }
      }

      let pageResult: Awaited<
        ReturnType<typeof fetchMenuCategoriesPage>
      > | null = null;

      for (
        let attempt = 1;
        attempt <= PUBLIC_CATEGORIES_REQUEST_ATTEMPTS;
        attempt += 1
      ) {
        pageResult = await fetchMenuCategoriesPage({
          restaurantId: String(restaurantId),
          page,
          limit: CATEGORY_PAGE_LIMIT,
          search: searchValue,
        });

        if (!isFailedPublicCategoriesResponse(pageResult.response)) break;

        if (attempt < PUBLIC_CATEGORIES_REQUEST_ATTEMPTS) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, attempt * 250);
          });
        }
      }

      if (
        !pageResult ||
        isFailedPublicCategoriesResponse(pageResult.response)
      ) {
        throw new Error("Public menu categories request failed");
      }

      if (requestId !== latestCategoryRequestRef.current) return;

      const { categories: fetchedCategories, meta } = pageResult;

      setCategories((prev) => {
        if (!append) return fetchedCategories;

        const existingIds = new Set(prev.map((item) => String(item.id)));

        const newItems = fetchedCategories.filter((item) => {
          return item?.id && !existingIds.has(String(item.id));
        });

        return [...prev, ...newItems];
      });

      const nextTotalLoaded = append
        ? categories.length + fetchedCategories.length
        : fetchedCategories.length;

      setCurrentPage(Number((meta as ApiMeta)?.page ?? page));
      setHasMoreCategories(
        resolveHasNext({
          meta,
          page,
          limit: CATEGORY_PAGE_LIMIT,
          receivedCount: fetchedCategories.length,
          totalLoaded: nextTotalLoaded,
        }),
      );
    } catch (err) {
      if (requestId !== latestCategoryRequestRef.current) return;

      if (!append) {
        setCategories([]);
      }

      setHasMoreCategories(false);
    } finally {
      if (requestId === latestCategoryRequestRef.current) {
        requestInFlightRef.current = false;
        setLoadingCategories(false);
        if (!background) setLoadingMoreCategories(false);
      }
    }
  };

  const fetchMenus = async () => {
    if (!token || !restaurantId) return;

    try {
      setLoadingMenus(true);

      const { menus: fetchedMenus } = await fetchSignatureMenus({
        restaurantId: String(restaurantId),
      });

      setMenus(fetchedMenus as ItemsMenu[]);
    } catch {
      setMenus([]);
    } finally {
      setLoadingMenus(false);
    }
  };

  useEffect(() => {
    if (!restaurantId) return;

    fetchCategories({
      page: 1,
      searchValue: debouncedSearch,
      append: false,
    });
  }, [restaurantId, debouncedSearch]);

  useEffect(() => {
    if (!hasMoreCategories || requestInFlightRef.current) return;

    const timer = window.setTimeout(() => {
      void fetchCategories({
        page: currentPage + 1,
        searchValue: debouncedSearch,
        append: true,
        background: true,
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [currentPage, debouncedSearch, hasMoreCategories]);

  useEffect(() => {
    if (!token || !restaurantId) return;

    fetchMenus();
  }, [token, restaurantId]);

  useEffect(() => {
    if (!categories.length) {
      setActiveOnePageCategoryId("");
      return;
    }

    const activeStillExists = categories.some(
      (category) => String(category.id) === String(activeOnePageCategoryId),
    );

    if (!activeOnePageCategoryId || !activeStillExists) {
      setActiveOnePageCategoryId(String(categories[0].id));
    }
  }, [categories, activeOnePageCategoryId]);

  useEffect(() => {
    if (!filteredMenus.length) {
      setActiveOnePageMenuId("");
      setActiveMenuId("");
      return;
    }

    const firstMenuId = String(filteredMenus[0].id || "");
    const activeMenuStillExists = filteredMenus.some(
      (menu) => String(menu.id) === String(activeMenuId),
    );
    const activeOnePageStillExists = filteredMenus.some(
      (menu) => String(menu.id) === String(activeOnePageMenuId),
    );

    if (!activeMenuId || !activeMenuStillExists) {
      setActiveMenuId(firstMenuId);
    }

    if (!activeOnePageMenuId || !activeOnePageStillExists) {
      setActiveOnePageMenuId(firstMenuId);
    }
  }, [filteredMenus, activeMenuId, activeOnePageMenuId]);

  const handleLoadMoreCategories = async () => {
    if (loadingCategories || loadingMoreCategories || !hasMoreCategories) {
      return;
    }

    await fetchCategories({
      page: currentPage + 1,
      searchValue: debouncedSearch,
      append: true,
    });
  };

  const activeCategoryId = useMemo(() => {
    if (viewMode === "onePage") {
      return activeOnePageCategoryId || String(categories?.[0]?.id || "");
    }

    return String(categoryId || categories?.[0]?.id || "");
  }, [viewMode, activeOnePageCategoryId, categoryId, categories]);

  const activeMenuSectionId = useMemo(() => {
    if (viewMode === "onePage") {
      return activeOnePageMenuId || String(filteredMenus?.[0]?.id || "");
    }

    return activeMenuId || String(filteredMenus?.[0]?.id || "");
  }, [viewMode, activeOnePageMenuId, activeMenuId, filteredMenus]);

  const activeSectionId =
    contentSource === "menu" ? activeMenuSectionId : activeCategoryId;

  const handleViewModeChange = (nextMode: MenuViewMode) => {
    setViewMode(nextMode);

    if (nextMode === "onePage") {
      const id = String(
        contentSource === "menu"
          ? activeMenuSectionId || filteredMenus?.[0]?.id || ""
          : activeCategoryId || categories?.[0]?.id || "",
      );

      if (id) {
        if (contentSource === "menu") {
          setActiveOnePageMenuId(id);
        } else {
          setActiveOnePageCategoryId(id);
        }

        setScrollTarget({
          id,
          nonce: Date.now(),
        });
      }
    }
  };

  const handleContentSourceChange = (nextSource: ItemsContentSource) => {
    setContentSource(nextSource);
    setSearch("");
    setDebouncedSearch("");
    setScrollTarget(null);
  };

  const handleCategorySelect = (id: string) => {
    if (contentSource === "menu") {
      if (viewMode === "onePage") {
        setActiveOnePageMenuId(String(id));
        setScrollTarget({
          id: String(id),
          nonce: Date.now(),
        });
        return;
      }

      setActiveMenuId(String(id));
      return;
    }

    if (viewMode !== "onePage") return;

    setActiveOnePageCategoryId(String(id));
    setScrollTarget({
      id: String(id),
      nonce: Date.now(),
    });
  };

  if (isMobileItemsViewport) {
    return (
      <div className="pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <MobileCategoryTabs
          categories={categories}
          activeCategoryId={activeCategoryId}
          onCategorySelect={(id) => {
            if (id === activeCategoryId) return;

            setActiveOnePageCategoryId(String(id));
            setScrollTarget({
              id: String(id),
              nonce: Date.now(),
            });
          }}
        />
        <main className="px-4 pt-5">
          <ItemsListing
            activeSectionId={activeCategoryId}
            sections={listingSections}
            contentSource="category"
            viewMode="onePage"
            scrollTarget={scrollTarget}
            onActiveCategoryChange={setActiveOnePageCategoryId}
            currency={currency}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="hidden min-w-0 flex-col gap-6 px-4 py-6 md:px-10 lg:flex lg:flex-row lg:items-start">
      {/* SIDEBAR */}
      <aside className="w-full min-w-0 shrink-0 lg:sticky lg:top-24 lg:w-[280px] lg:self-start">
        <CategorySidebar
          activeCategoryId={activeSectionId}
          categories={activeSections}
          loading={loadingSections}
          loadingMore={loadingMoreSections}
          hasMore={hasMoreSections}
          search={search}
          onSearchChange={setSearch}
          onLoadMore={handleLoadMoreCategories}
          viewMode={viewMode}
          contentSource={contentSource}
          showMenuSource={Boolean(token)}
          onContentSourceChange={handleContentSourceChange}
          onViewModeChange={handleViewModeChange}
          onCategorySelect={handleCategorySelect}
        />
      </aside>

      {/* ITEMS */}
      <main className="min-w-0 flex-1">
        {contentSource === "menu" ? (
          <CustomerDealsSection
            deals={dealsQuery.deals}
            isLoading={dealsQuery.isLoading}
            addingDealId={
              addDealMutation.isPending
                ? (addDealMutation.variables?.deal.id ?? null)
                : null
            }
            branchId={branchId}
            onAddDeal={handleAddDeal}
            compact
            currency={currency}
          />
        ) : null}

        <ItemsListing
          activeSectionId={activeSectionId}
          sections={listingSections}
          contentSource={contentSource}
          viewMode={viewMode}
          scrollTarget={scrollTarget}
          onActiveCategoryChange={
            contentSource === "menu"
              ? setActiveOnePageMenuId
              : setActiveOnePageCategoryId
          }
          currency={currency}
        />
      </main>
    </div>
  );
}
