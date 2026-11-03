// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useHomeCategories } from "./useHomeCategories";

const getHomeCategoriesMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/home", () => ({
  getHomeCategories: getHomeCategoriesMock,
  getHomePromotions: vi.fn(),
  getPromotionalItems: vi.fn(),
}));

describe("useHomeCategories first visit", () => {
  beforeEach(() => {
    getHomeCategoriesMock.mockReset();
  });

  it("retries a transient initial request and renders categories without a refresh", async () => {
    getHomeCategoriesMock
      .mockRejectedValueOnce(new Error("temporary first-load failure"))
      .mockResolvedValueOnce([{ id: "pizza", name: "Pizza" }]);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: 1, retryDelay: 0 },
      },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useHomeCategories("restaurant-1", "de", true),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: "pizza", name: "Pizza" }]);
    expect(getHomeCategoriesMock).toHaveBeenCalledTimes(2);
  });
});
