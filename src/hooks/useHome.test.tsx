// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useHome } from "./useHome";

const getHomeMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/home", () => ({
  getHome: getHomeMock,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ token: null, user: null }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0 } },
  });

  const QueryWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  QueryWrapper.displayName = "HomeQueryTestWrapper";

  return QueryWrapper;
};

describe("useHome recovery", () => {
  beforeEach(() => {
    getHomeMock.mockReset();
  });

  it("recovers from bounded transient first-load failures without a refresh", async () => {
    getHomeMock
      .mockRejectedValueOnce(new Error("temporary gateway failure"))
      .mockRejectedValueOnce(new Error("temporary gateway failure"))
      .mockResolvedValueOnce({ data: { restaurant: { id: "restaurant-1" } } });

    const { result } = renderHook(
      () => useHome("restaurant-1", "branch-1", true),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 3_000,
    });
    expect(getHomeMock).toHaveBeenCalledTimes(3);
  });

  it("settles in an error state after the bounded retries", async () => {
    getHomeMock.mockRejectedValue(new Error("persistent gateway failure"));

    const { result } = renderHook(
      () => useHome("restaurant-1", "branch-1", true),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 3_000,
    });
    expect(result.current.isPending).toBe(false);
    expect(getHomeMock).toHaveBeenCalledTimes(3);
  });
});
