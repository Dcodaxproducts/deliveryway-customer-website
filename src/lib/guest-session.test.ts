import { describe, expect, it, vi } from "vitest";

import {
  createGuestSessionCoordinator,
  runWithGuestSessionRecovery,
} from "./guest-session";
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

  it("renews an unauthorized guest session and retries once", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ status: 201, success: true });
    const renewSession = vi.fn().mockResolvedValue({
      customerId: "guest-2",
      token: "fresh-token",
      isGuest: true,
    });

    await expect(
      runWithGuestSessionRecovery({
        session: {
          customerId: "guest-1",
          token: "expired-token",
          isGuest: true,
        },
        request,
        renewSession,
      }),
    ).resolves.toEqual({ status: 201, success: true });

    expect(renewSession).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenNthCalledWith(2, {
      customerId: "guest-2",
      token: "fresh-token",
      isGuest: true,
    });
  });

  it("does not replace an unauthorized signed-in customer with a guest", async () => {
    const request = vi.fn().mockResolvedValue({ status: 401 });
    const renewSession = vi.fn();

    await expect(
      runWithGuestSessionRecovery({
        session: {
          customerId: "customer-1",
          token: "expired-token",
          isGuest: false,
        },
        request,
        renewSession,
      }),
    ).resolves.toEqual({ status: 401 });

    expect(renewSession).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledTimes(1);
  });
});
