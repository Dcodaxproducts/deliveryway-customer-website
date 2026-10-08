// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  auth: { token: "token-1" as string | null, user: { id: "user-1" } },
  getHome: vi.fn(),
  getDeals: vi.fn(),
  getCoupons: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => state.auth }));
vi.mock("@/services/home", () => ({ getHome: state.getHome }));
vi.mock("@/services/customer-deals", () => ({ getCustomerDeals: state.getDeals }));
vi.mock("@/services/customer-coupons", () => ({ getCustomerCoupons: state.getCoupons }));

import { useHome } from "./useHome";
import { useCustomerDeals } from "./useCustomerDeals";
import { useCustomerCoupons } from "./useCustomerCoupons";
import { getStorefrontRequestIdentity } from "@/lib/storefront-request-identity";

beforeEach(() => {
  state.auth = { token: "token-1", user: { id: "user-1" } };
  state.getHome.mockReset().mockResolvedValue({ data: {} });
  state.getDeals.mockReset().mockResolvedValue({ deals: [] });
  state.getCoupons.mockReset().mockResolvedValue({ coupons: [] });
});

describe("storefront query identity", () => {
  it("changes for domain and auth transitions without exposing the token", () => {
    const first = getStorefrontRequestIdentity({ domain: "A.Example", token: "secret-token" });
    const nextDomain = getStorefrontRequestIdentity({ domain: "b.example", token: "secret-token" });
    const signedOut = getStorefrontRequestIdentity({ domain: "a.example", token: null });
    expect(first).not.toBe(nextDomain);
    expect(first).not.toBe(signedOut);
    expect(first).not.toContain("secret-token");
  });

  it("refetches home, deals, and coupons after sign-in and sign-out identity changes", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { rerender } = renderHook(() => {
      useHome("restaurant-1", "branch-1");
      useCustomerDeals({ restaurantId: "restaurant-1", branchId: "branch-1" });
      useCustomerCoupons({ restaurantId: "restaurant-1", branchId: "branch-1" });
    }, { wrapper });

    await waitFor(() => {
      expect(state.getHome).toHaveBeenCalledTimes(1);
      expect(state.getDeals).toHaveBeenCalledTimes(1);
      expect(state.getCoupons).toHaveBeenCalledTimes(1);
    });

    state.auth = { token: "token-2", user: { id: "user-2" } };
    rerender();
    await waitFor(() => {
      expect(state.getHome).toHaveBeenCalledTimes(2);
      expect(state.getDeals).toHaveBeenCalledTimes(2);
      expect(state.getCoupons).toHaveBeenCalledTimes(2);
    });

    state.auth = { token: null, user: { id: "user-2" } };
    rerender();
    await waitFor(() => {
      expect(state.getHome).toHaveBeenCalledTimes(3);
      expect(state.getDeals).toHaveBeenCalledTimes(3);
      expect(state.getCoupons).toHaveBeenCalledTimes(3);
    });
  });
});
