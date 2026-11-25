// @vitest-environment jsdom

import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCustomerCuisineItems } from "./useCuisines";
import { fetchCustomerCuisineItems } from "@/services/cuisines";

vi.mock("@/services/cuisines", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/services/cuisines")>();
  return { ...original, fetchCustomerCuisineItems: vi.fn() };
});

const fetchItemsMock = vi.mocked(fetchCustomerCuisineItems);

describe("useCustomerCuisineItems", () => {
  beforeEach(() => fetchItemsMock.mockReset());

  it("refetches a bounded detail request instead of reusing stale warm data", async () => {
    fetchItemsMock.mockResolvedValue({
      response: { data: {} } as never,
      cuisine: { id: "first-created", name: "First cuisine" },
      items: [{ id: "item-1" } as never],
      meta: {},
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const params = {
      cuisineId: "first-created",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      locale: "de",
      limit: 48,
    };

    const cold = renderHook(() => useCustomerCuisineItems(params), { wrapper });
    await waitFor(() => expect(cold.result.current.isSuccess).toBe(true));
    cold.unmount();

    const warm = renderHook(() => useCustomerCuisineItems(params), { wrapper });
    await waitFor(() => expect(warm.result.current.isSuccess).toBe(true));

    expect(fetchItemsMock).toHaveBeenCalledTimes(2);
    expect(fetchItemsMock).toHaveBeenCalledWith(expect.objectContaining({ limit: 48 }));
    warm.unmount();
  });
});
