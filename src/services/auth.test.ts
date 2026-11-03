import { afterEach, describe, expect, it, vi } from "vitest";

import { API_BASE_URL, API_REQUEST_TIMEOUT_MS } from "@/lib/axios";
import { buildApiUrl } from "@/lib/api-endpoint";

import {
  getCurrentUser,
  googleLoginCustomer,
  guestLoginCustomer,
  isUnauthorizedAuthError,
  updateCustomerLocale,
} from "./auth";

const authResponse = {
  success: true,
  data: {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    user: {
      id: "customer-1",
      email: "customer@example.com",
      role: "CUSTOMER",
      tenantId: "tenant-1",
      restaurantId: "restaurant-1",
    },
  },
};

describe("auth service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends Google login credentials to the customer auth endpoint", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(authResponse), { status: 200 }));

    const session = await googleLoginCustomer({
      idToken: "google-id-token",
      restaurantId: "restaurant-1",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      buildApiUrl(API_BASE_URL, "/v1/auth/google-login"),
      expect.objectContaining({
        method: "POST",
        headers: {
          "Accept-Language": "de",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken: "google-id-token",
          restaurantId: "restaurant-1",
        }),
      })
    );
    expect(session.accessToken).toBe("access-token");
  });

  it("preserves the HTTP status for unauthorized auth responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
        { status: 401 },
      ),
    );

    const request = getCurrentUser("expired-token");

    await expect(request).rejects.toMatchObject({
      name: "AuthRequestError",
      message: "Unauthorized",
      status: 401,
    });
    await expect(request.catch((error: unknown) => error)).resolves.toSatisfy(
      isUnauthorizedAuthError,
    );
  });

  it("persists the authenticated customer's email locale", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));

    await updateCustomerLocale("access-token", "de");

    expect(fetchMock).toHaveBeenCalledWith(
      buildApiUrl(API_BASE_URL, "/v1/auth/me/profile"),
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
          "Accept-Language": "de",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ locale: "de" }),
      }),
    );
  });

  it("aborts guest renewal through the shared 15-second timeout signal", async () => {
    const timeoutController = new AbortController();
    const timeoutSpy = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(timeoutController.signal);
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(init.signal?.reason);
        });
      }),
    );

    const renewal = guestLoginCustomer({ restaurantId: "restaurant-1" });
    timeoutController.abort(new DOMException("Timed out", "TimeoutError"));

    await expect(renewal).rejects.toMatchObject({ name: "TimeoutError" });
    expect(timeoutSpy).toHaveBeenCalledWith(API_REQUEST_TIMEOUT_MS);
  });
});
