import { describe, expect, it, vi } from "vitest";

import { createGuestSessionCoordinator } from "./guest-session";
import type { AuthSession } from "@/types/auth";

const session: AuthSession = {
  accessToken: "guest-token",
  user: {
    id: "guest-1",
    email: "guest@example.com",
    role: "CUSTOMER",
    tenantId: "tenant-1",
    isGuest: true,
  },
};

describe("createGuestSessionCoordinator", () => {
  it("returns an existing session without registering a guest", async () => {
    const registerGuest = vi.fn();
    const persistSession = vi.fn();
    const ensureGuestSession = createGuestSessionCoordinator({
      readSession: () => session,
      registerGuest,
      persistSession,
    });

    await expect(ensureGuestSession("restaurant-1")).resolves.toBe(session);
    expect(registerGuest).not.toHaveBeenCalled();
    expect(persistSession).not.toHaveBeenCalled();
  });

  it("coalesces concurrent guest registration and persists the result once", async () => {
    const registerGuest = vi.fn().mockResolvedValue(session);
    const persistSession = vi.fn((nextSession: AuthSession) => nextSession);
    const ensureGuestSession = createGuestSessionCoordinator({
      readSession: () => null,
      registerGuest,
      persistSession,
    });

    const [first, second] = await Promise.all([
      ensureGuestSession("restaurant-1"),
      ensureGuestSession("restaurant-1"),
    ]);

    expect(first).toBe(session);
    expect(second).toBe(session);
    expect(registerGuest).toHaveBeenCalledTimes(1);
    expect(registerGuest).toHaveBeenCalledWith("restaurant-1");
    expect(persistSession).toHaveBeenCalledTimes(1);
  });
});
