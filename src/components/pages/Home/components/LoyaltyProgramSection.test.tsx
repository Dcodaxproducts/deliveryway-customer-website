// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoyaltyProgramSection } from "./LoyaltyProgramSection";

const loyaltyQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "customer-1" }, token: "token" }),
}));
vi.mock("@/hooks/useLoyalty", () => ({
  useCustomerLoyaltyQuery: loyaltyQueryMock,
}));
vi.mock("@/lib/auth", () => ({ isCustomerAccountUser: () => true }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next/link", () => ({
  default: ({ children, href, className }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} className={className}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
  loyaltyQueryMock.mockReset();
});

describe("LoyaltyProgramSection", () => {
  it("announces a bounded loading state", () => {
    loyaltyQueryMock.mockReturnValue({ isLoading: true });
    render(<LoyaltyProgramSection />);

    expect(screen.getByLabelText("title").getAttribute("aria-busy")).toBe("true");
  });

  it("renders an accessible responsive loyalty summary from the existing contract", () => {
    loyaltyQueryMock.mockReturnValue({
      isLoading: false,
      data: {
        loyalty: { availablePoints: 120, earnedPoints: 250 },
      },
    });
    render(<LoyaltyProgramSection />);

    expect(screen.getByRole("heading", { name: "title" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "viewProgram" }).getAttribute("href")).toBe("/profile");
    expect(screen.getByRole("link", { name: "useAtCheckout" }).getAttribute("href")).toBe("/checkout");
    expect(screen.getByText("120").parentElement?.parentElement?.className).toContain("grid-cols-2");
    expect(screen.getByRole("link", { name: "viewProgram" }).className).toContain("min-h-11");
  });
});
