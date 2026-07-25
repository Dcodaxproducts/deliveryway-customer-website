import { describe, expect, it } from "vitest";

import { isCustomerAccountUser } from "./auth";
import type { AuthUser } from "@/types/auth";

const createUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: "customer-1",
  email: "customer@example.com",
  role: "CUSTOMER",
  tenantId: "tenant-1",
  ...overrides,
});

describe("isCustomerAccountUser", () => {
  it("returns true for a signed-in customer", () => {
    expect(isCustomerAccountUser(createUser())).toBe(true);
  });

  it("returns false for silent guest sessions", () => {
    expect(isCustomerAccountUser(createUser({ isGuest: true }))).toBe(false);
    expect(isCustomerAccountUser(createUser({ role: "guest" }))).toBe(false);
  });

  it("returns false without a user", () => {
    expect(isCustomerAccountUser(null)).toBe(false);
  });
});
