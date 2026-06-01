import { beforeEach, describe, expect, it, vi } from "vitest";

import { getHome } from "./home";

const getRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/http", () => ({
  getRequest: getRequestMock,
}));

describe("getHome", () => {
  beforeEach(() => {
    getRequestMock.mockReset();
  });

  it("calls customer-app home with only present restaurantId param", async () => {
    getRequestMock.mockResolvedValue({
      data: {
        restaurant: { name: "Demo" },
        config: { currency: "USD", branding: { theme: { primaryColor: "#111111" } } },
        cuisines: [{ id: "c1" }],
        promotionalItems: [{ id: "p1" }],
        faqs: [{ id: "f1" }],
      },
    });

    const response = await getHome("restaurant-1", null);

    expect(getRequestMock).toHaveBeenCalledWith("/customer-app/home?restaurantId=restaurant-1");
    expect(response.data.restaurant?.name).toBe("Demo");
    expect(response.data.config?.currency).toBe("USD");
    expect(response.data.branding.primaryColor).toBe("#111111");
    expect(response.data.cuisines).toHaveLength(1);
  });

  it("passes restaurantId and branchId params only when present", async () => {
    getRequestMock.mockResolvedValue({ data: {} });

    await getHome("restaurant-1", "branch-1");
    await getHome(null, "branch-1");

    expect(getRequestMock).toHaveBeenNthCalledWith(1,
      "/customer-app/home?restaurantId=restaurant-1&branchId=branch-1"
    );
    expect(getRequestMock).toHaveBeenNthCalledWith(2, "/customer-app/home?branchId=branch-1");
  });

  it("does not duplicate api or v1 segments", async () => {
    getRequestMock.mockResolvedValue({ data: {} });

    await getHome();

    expect(getRequestMock).toHaveBeenCalledWith("/customer-app/home");
    expect(getRequestMock.mock.calls[0][0]).not.toContain("/api/v1");
  });
});
