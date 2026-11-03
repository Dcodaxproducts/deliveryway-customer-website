// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  auth: { restaurantId: "restaurant-1", token: "token-1" as string | null, user: { id: "user-1", restaurantId: "restaurant-1", branchId: "branch-1" } },
  domain: { context: { restaurantId: "restaurant-1", branchId: "branch-1" } },
  fetchMenuItemsPage: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => testState.auth }));
vi.mock("@/hooks/useDomainContext", () => ({ useDomainContext: () => testState.domain }));
vi.mock("@/hooks/useItems", () => ({ default: () => ({ fetchMenuItemsPage: testState.fetchMenuItemsPage }) }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string, values?: { count?: number }) => key === "itemCount" ? String(values?.count ?? 0) : key }));
vi.mock("lucide-react", () => ({ Loader2: () => <span>loading</span> }));
vi.mock("./RestaurantCard", () => ({ RestaurantCard: ({ item }: { item: { name?: string } }) => <article>{item.name}</article> }));

import { ItemsListing } from "./Items";

const sections = Array.from({ length: 18 }, (_, index) => ({ id: `category-${index + 1}`, name: `Category ${index + 1}` }));
const makePage = (categoryId: string, page: number) => {
  const total = categoryId === "category-1" ? 82 : 1;
  const firstIndex = (page - 1) * 50;
  const count = Math.max(0, Math.min(50, total - firstIndex));
  const items = Array.from({ length: count }, (_, index) => ({ id: `${categoryId}-item-${firstIndex + index + 1}`, name: `${categoryId} item ${firstIndex + index + 1}`, isActive: true }));
  const meta = { page, total, totalPages: Math.ceil(total / 50) };
  return { response: { success: true, data: items, meta }, items, meta };
};
const flush = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0));

class TestIntersectionObserver implements IntersectionObserver {
  static instances: TestIntersectionObserver[] = [];
  static eagerIntersectionCount = 0;
  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  private readonly callback: IntersectionObserverCallback;
  observed: Element[] = [];
  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    this.callback = callback;
    this.rootMargin = options.rootMargin ?? "0px";
    this.thresholds = Array.isArray(options.threshold)
      ? options.threshold
      : [options.threshold ?? 0];
    TestIntersectionObserver.instances.push(this);
  }
  disconnect = vi.fn();
  observe = (target: Element) => {
    this.observed.push(target);
    if (
      this.rootMargin === "160px 0px" &&
      this.observed.length === TestIntersectionObserver.eagerIntersectionCount
    ) {
      this.intersect(this.observed);
    }
  };
  unobserve = vi.fn();
  takeRecords = () => [];
  intersect(targets: Element[]) {
    this.callback(targets.map((target) => ({ target, isIntersecting: true, intersectionRatio: 1, boundingClientRect: target.getBoundingClientRect(), intersectionRect: target.getBoundingClientRect(), rootBounds: null, time: Date.now() }) as IntersectionObserverEntry), this);
  }
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
beforeEach(() => {
  testState.auth.restaurantId = "restaurant-1";
  testState.auth.token = "token-1";
  testState.auth.user = { id: "user-1", restaurantId: "restaurant-1", branchId: "branch-1" };
  testState.domain.context = { restaurantId: "restaurant-1", branchId: "branch-1" };
  testState.fetchMenuItemsPage.mockReset();
  TestIntersectionObserver.instances = [];
  TestIntersectionObserver.eagerIntersectionCount = 0;
  delete (globalThis as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver;
});

describe("ItemsListing mounted progressive loading", () => {
  it("loads the next visible category when the observer fires during initial request startup", async () => {
    globalThis.IntersectionObserver = TestIntersectionObserver;
    TestIntersectionObserver.eagerIntersectionCount = 2;
    const pending: Array<{ categoryId: string; resolve: (value: ReturnType<typeof makePage>) => void }> = [];
    testState.fetchMenuItemsPage.mockImplementation(
      ({ categoryId }: { categoryId: string }) =>
        new Promise((resolve) => {
          pending.push({
            categoryId,
            resolve: (value) => resolve(value),
          });
        }),
    );

    render(
      <ItemsListing
        sections={sections.slice(0, 2)}
        contentSource="category"
        viewMode="onePage"
      />,
    );

    await waitFor(() => expect(pending).toHaveLength(2));
    expect(pending.map((request) => request.categoryId)).toEqual([
      "category-1",
      "category-2",
    ]);

    pending.forEach((request) => request.resolve(makePage(request.categoryId, 1)));
    expect(await screen.findByText("category-2 item 1")).toBeTruthy();
  });

  it("starts one bounded request, observer-loads later categories, and paginates all 82 items", async () => {
    globalThis.IntersectionObserver = TestIntersectionObserver;
    let activeRequests = 0;
    let maxConcurrency = 0;
    testState.fetchMenuItemsPage.mockImplementation(async ({ categoryId, page }: { categoryId: string; page: number }) => {
      activeRequests += 1; maxConcurrency = Math.max(maxConcurrency, activeRequests); await flush(); activeRequests -= 1; return makePage(categoryId, page);
    });
    const { container } = render(<ItemsListing sections={sections} contentSource="category" viewMode="onePage" />);
    await waitFor(() => expect(testState.fetchMenuItemsPage).toHaveBeenCalledTimes(1));
    expect(testState.fetchMenuItemsPage).toHaveBeenLastCalledWith(expect.objectContaining({ categoryId: "category-1", page: 1, limit: 50 }));
    expect(maxConcurrency).toBe(1);
    await screen.findByText("category-1 item 50");
    const loadingObserver = TestIntersectionObserver.instances.find(
      (observer) => observer.rootMargin === "160px 0px",
    );
    expect(loadingObserver).toBeDefined();
    const laterSections = Array.from(container.querySelectorAll<HTMLElement>("[data-category-id]")).slice(1);
    for (const section of laterSections) {
      loadingObserver?.intersect([section]);
      await waitFor(() =>
        expect(testState.fetchMenuItemsPage).toHaveBeenCalledWith(
          expect.objectContaining({
            categoryId: section.dataset.categoryId,
            page: 1,
          }),
        ),
      );
    }
    await waitFor(() => expect(testState.fetchMenuItemsPage).toHaveBeenCalledTimes(18));
    expect(maxConcurrency).toBe(1);
    expect(await screen.findByText("category-18 item 1")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "loadMoreItems" }));
    expect(await screen.findByText("category-1 item 82")).toBeTruthy();
    expect(screen.getAllByRole("article")).toHaveLength(99);
  });

  it("keeps all categories reachable without IntersectionObserver and never eagerly loads them", async () => {
    testState.fetchMenuItemsPage.mockImplementation(async ({ categoryId, page }: { categoryId: string; page: number }) => makePage(categoryId, page));
    render(<ItemsListing sections={sections} contentSource="category" viewMode="onePage" />);
    await waitFor(() => expect(testState.fetchMenuItemsPage).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("category-1 item 50")).toBeTruthy();
    expect(testState.fetchMenuItemsPage).toHaveBeenCalledTimes(1);
    for (let index = 2; index <= 18; index += 1) {
      fireEvent.click(screen.getByTestId(`load-category-category-${index}`));
      await screen.findByText(`category-${index} item 1`);
    }
    expect(testState.fetchMenuItemsPage).toHaveBeenCalledTimes(18);
    expect(await screen.findByText("Category 18")).toBeTruthy();
  });

  it("loads only the requested deep link in one-page mode", async () => {
    globalThis.IntersectionObserver = TestIntersectionObserver;
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    testState.fetchMenuItemsPage.mockImplementation(
      async ({ categoryId, page }: { categoryId: string; page: number }) =>
        makePage(categoryId, page),
    );

    render(
      <ItemsListing
        sections={sections}
        contentSource="category"
        viewMode="onePage"
        scrollTarget={{ id: "category-18", nonce: 1 }}
      />,
    );

    await waitFor(() => expect(testState.fetchMenuItemsPage).toHaveBeenCalledTimes(1));
    expect(testState.fetchMenuItemsPage).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: "category-18", page: 1 }),
    );
    expect(await screen.findByText("category-18 item 1")).toBeTruthy();
  });

  it("makes rapid Pizza to Hamburger to rolls to Pizza navigation latest-wins", async () => {
    globalThis.IntersectionObserver = TestIntersectionObserver;
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    const pending: Array<{
      categoryId: string;
      signal?: AbortSignal;
      resolve: (value: ReturnType<typeof makePage>) => void;
    }> = [];
    testState.fetchMenuItemsPage.mockImplementation(
      ({ categoryId, signal }: { categoryId: string; signal?: AbortSignal }) =>
        new Promise((resolve) => {
          pending.push({
            categoryId,
            signal,
            resolve: (value) => resolve(value),
          });
        }),
    );
    const rapidSections = [
      { id: "pizza", name: "Pizza", itemCount: 82 },
      { id: "hamburger", name: "Hamburger", itemCount: 14 },
      { id: "rolls", name: "Pizzabrötchen", itemCount: 10 },
    ];
    const { rerender } = render(
      <ItemsListing
        activeSectionId="pizza"
        sections={rapidSections}
        contentSource="category"
        viewMode="onePage"
        scrollTarget={{ id: "pizza", nonce: 1 }}
      />,
    );
    await waitFor(() => expect(pending).toHaveLength(1));
    expect(screen.getByTestId("category-skeleton-pizza").children).toHaveLength(50);

    for (const [id, nonce] of [
      ["hamburger", 2],
      ["rolls", 3],
      ["pizza", 4],
    ] as const) {
      rerender(
        <ItemsListing
          activeSectionId={id}
          sections={rapidSections}
          contentSource="category"
          viewMode="onePage"
          scrollTarget={{ id, nonce }}
        />,
      );
      await waitFor(() => expect(pending).toHaveLength(nonce));
    }

    expect(
      pending.slice(0, 3).every((request) => request.signal?.aborted),
    ).toBe(true);
    expect(pending[3].categoryId).toBe("pizza");
    expect(pending[3].signal?.aborted).toBe(false);
    pending[3].resolve(makePage("pizza", 1));

    expect(await screen.findByText("pizza item 1")).toBeTruthy();
    await waitFor(() =>
      expect(scrollIntoView).toHaveBeenLastCalledWith({
        behavior: "auto",
        block: "start",
      }),
    );
    expect(screen.queryByText("hamburger item 1")).toBeNull();
    expect(screen.queryByText("rolls item 1")).toBeNull();
  });

  it("loads only the active category in multiple mode", async () => {
    testState.fetchMenuItemsPage.mockImplementation(
      async ({ categoryId, page }: { categoryId: string; page: number }) =>
        makePage(categoryId, page),
    );

    render(
      <ItemsListing
        activeSectionId="category-7"
        sections={sections}
        contentSource="category"
        viewMode="multiple"
      />,
    );

    expect(await screen.findByText("category-7 item 1")).toBeTruthy();
    expect(testState.fetchMenuItemsPage).toHaveBeenCalledTimes(1);
    expect(testState.fetchMenuItemsPage).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: "category-7", page: 1 }),
    );
  });

  it("preserves loaded category items when add-to-cart creates a guest session", async () => {
    testState.auth.token = null;
    testState.auth.user = {
      id: "",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
    };
    testState.fetchMenuItemsPage.mockImplementation(
      async ({ categoryId, page }: { categoryId: string; page: number }) =>
        makePage(categoryId, page),
    );

    const props = {
      sections: sections.slice(0, 1),
      contentSource: "category" as const,
      viewMode: "onePage" as const,
    };
    const { rerender } = render(<ItemsListing {...props} />);

    expect(await screen.findByText("category-1 item 1")).toBeTruthy();
    expect(testState.fetchMenuItemsPage).toHaveBeenCalledTimes(1);

    testState.auth.token = "guest-token";
    testState.auth.user = {
      id: "guest-user",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
    };
    rerender(<ItemsListing {...props} />);
    await flush();

    expect(screen.getByText("category-1 item 1")).toBeTruthy();
    expect(screen.queryByTestId("category-skeleton-category-1")).toBeNull();
    expect(testState.fetchMenuItemsPage).toHaveBeenCalledTimes(1);
  });

  it("shows geometry-preserving cards instead of a false empty state while loading", () => {
    render(
      <ItemsListing
        sections={[]}
        contentSource="category"
        viewMode="onePage"
        loading
      />,
    );

    expect(screen.getAllByTestId("item-card-skeleton")).toHaveLength(6);
    expect(screen.queryByText("noCategories")).toBeNull();
  });

  it("renders a distinct category error with retry before the empty state", () => {
    const retry = vi.fn();
    render(
      <ItemsListing
        sections={[]}
        contentSource="category"
        viewMode="onePage"
        sectionLoadFailed
        onRetrySections={retry}
      />,
    );

    expect(screen.getByText("loadCategoriesFailed")).toBeTruthy();
    expect(screen.queryByText("noCategories")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "retryCategories" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("aborts a stale storefront context and never commits its late response", async () => {
    let resolveStale: ((value: ReturnType<typeof makePage>) => void) | undefined;
    let staleSignal: AbortSignal | undefined;
    testState.fetchMenuItemsPage.mockImplementation(({ categoryId, page, signal }: { categoryId: string; page: number; signal?: AbortSignal }) => {
      if (testState.auth.token === "token-1") { staleSignal = signal; return new Promise((resolve) => { resolveStale = resolve; }); }
      const fresh = [{ id: "fresh-item", name: "Fresh storefront item", isActive: true }];
      return Promise.resolve({ response: { success: true, data: fresh, meta: { page: 1, total: 1, totalPages: 1 } }, items: fresh, meta: { page: 1, total: 1, totalPages: 1 } });
    });
    const { rerender } = render(<ItemsListing sections={sections.slice(0, 1)} contentSource="category" viewMode="onePage" />);
    await waitFor(() => expect(testState.fetchMenuItemsPage).toHaveBeenCalledTimes(1));
    testState.auth.token = "token-2";
    testState.auth.user = { ...testState.auth.user, id: "user-2" };
    testState.domain.context = { restaurantId: "restaurant-2", branchId: "branch-2" };
    testState.auth.restaurantId = "restaurant-2";
    rerender(<ItemsListing sections={sections.slice(0, 1)} contentSource="category" viewMode="onePage" />);
    await waitFor(() => expect(staleSignal?.aborted).toBe(true));
    await waitFor(() => expect(testState.fetchMenuItemsPage).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Fresh storefront item")).toBeTruthy();
    const stale = [{ id: "stale-item", name: "Stale storefront item", isActive: true }];
    resolveStale?.({ response: { success: true, data: stale, meta: { page: 1, total: 1, totalPages: 1 } }, items: stale, meta: { page: 1, total: 1, totalPages: 1 } });
    await flush();
    expect(screen.queryByText("Stale storefront item")).toBeNull();
    expect(screen.getByText("Fresh storefront item")).toBeTruthy();
  });
});
