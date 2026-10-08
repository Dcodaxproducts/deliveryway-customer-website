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
  observe = (target: Element) => { this.observed.push(target); };
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
  delete (globalThis as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver;
});

describe("ItemsListing mounted progressive loading", () => {
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
      (observer) => observer.rootMargin === "400px 0px",
    );
    expect(loadingObserver).toBeDefined();
    const laterSections = Array.from(container.querySelectorAll<HTMLElement>("[data-category-id]")).slice(1);
    loadingObserver?.intersect(laterSections);
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
