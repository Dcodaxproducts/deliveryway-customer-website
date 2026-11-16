// @vitest-environment jsdom

import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCustomerLoyaltyQuery } from "./useLoyalty";
import { fetchCustomerLoyaltyPoints } from "@/services/loyalty";

vi.mock("@/services/loyalty", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/services/loyalty")>();
  return { ...original, fetchCustomerLoyaltyPoints: vi.fn() };
});

const fetchLoyaltyMock = vi.mocked(fetchCustomerLoyaltyPoints);

describe("useCustomerLoyaltyQuery", () => {
  beforeEach(() => fetchLoyaltyMock.mockReset());

  it("makes one cold request and reuses the warm customer cache", async () => {
    fetchLoyaltyMock.mockResolvedValue({
      response: { data: {} } as never,
      loyalty: {
        customerId: "customer-1",
        availablePoints: 40,
        redeemedPoints: 0,
        earnedPoints: 40,
        minimumRedeemPoints: 10,
        redemptionValuePerPoint: 0.01,
        history: [],
      },
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const options = { token: "token", customerId: "customer-1" };

    const cold = renderHook(() => useCustomerLoyaltyQuery(options), { wrapper });
    await waitFor(() => expect(cold.result.current.isSuccess).toBe(true));
    cold.unmount();

    const warm = renderHook(() => useCustomerLoyaltyQuery(options), { wrapper });
    await waitFor(() => expect(warm.result.current.isSuccess).toBe(true));

    expect(fetchLoyaltyMock).toHaveBeenCalledTimes(1);
    warm.unmount();
  });

  it("does not call the authenticated contract without customer credentials", () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(
      () => useCustomerLoyaltyQuery({ token: null, customerId: null }),
      { wrapper },
    );

    expect(fetchLoyaltyMock).not.toHaveBeenCalled();
  });
});
