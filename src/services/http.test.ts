import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { request } from "./http";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    request: vi.fn(),
  },
  normalizeApiEndpoint: (endpoint: string) => endpoint,
}));

const { httpClient } = await import("@/lib/axios");
const requestMock = vi.mocked(httpClient.request);

describe("http service", () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it("passes AbortController signals to Axios", async () => {
    const controller = new AbortController();
    requestMock.mockResolvedValue({ data: { success: true } });

    await request("GET", "/v1/cart", undefined, undefined, {
      signal: controller.signal,
    });

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it.each([
    ["ERR_CANCELED", { aborted: true, timedOut: false }],
    ["ECONNABORTED", { aborted: false, timedOut: true }],
  ])("marks %s failures so callers can clear loading state", async (code, expected) => {
    requestMock.mockRejectedValue(new axios.AxiosError("request failed", code));

    await expect(request("GET", "/v1/cart")).resolves.toMatchObject(expected);
  });

  it("preserves backend error response bodies from Axios failures", async () => {
    requestMock.mockRejectedValue(
      new axios.AxiosError(
        "Request failed with status code 400",
        "ERR_BAD_REQUEST",
        undefined,
        undefined,
        {
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config: {
            headers: new axios.AxiosHeaders(),
          },
          data: {
            success: false,
            message: "deliveryAddressId is required for delivery orders",
            error: {
              code: "Bad Request",
              message: "deliveryAddressId is required for delivery orders",
            },
          },
        }
      )
    );

    await expect(request("GET", "/v1/cart")).resolves.toMatchObject({
      success: false,
      message: "deliveryAddressId is required for delivery orders",
      error: {
        code: "Bad Request",
        message: "deliveryAddressId is required for delivery orders",
      },
      status: 400,
    });
  });

});
