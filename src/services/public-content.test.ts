import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchBranchStats,
  normalizeAboutContent,
  normalizeBranchStats,
  submitContactForm,
} from "./public-content";

const getRequestMock = vi.hoisted(() => vi.fn());
const postRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/http", () => ({
  getRequest: getRequestMock,
  postRequest: postRequestMock,
}));

describe("public content service", () => {
  beforeEach(() => {
    getRequestMock.mockReset();
    postRequestMock.mockReset();
  });

  it("normalizes about content safely", () => {
    expect(
      normalizeAboutContent({
        restaurantId: "restaurant-1",
        restaurantName: "Demo",
        title: "About",
        content: "<p>Fresh food.</p>",
      })
    ).toMatchObject({
      restaurantId: "restaurant-1",
      restaurantName: "Demo",
      title: "About",
      content: "<p>Fresh food.</p>",
    });
  });

  it("normalizes branch stats numbers", () => {
    expect(
      normalizeBranchStats({
        completedOrders: "12",
        activeMenuItems: 8,
        reviewCount: "3",
        averageRating: "4.67",
        fiveStarReviews: "2",
      })
    ).toEqual({
      completedOrders: 12,
      activeMenuItems: 8,
      reviewCount: 3,
      averageRating: 4.67,
      fiveStarReviews: 2,
    });
  });

  it("fetches branch stats with restaurant and branch params", async () => {
    getRequestMock.mockResolvedValue({
      data: { data: { completedOrders: 5 } },
    });

    await fetchBranchStats("restaurant-1", "branch-1");

    expect(getRequestMock).toHaveBeenCalledWith(
      "/customer-app/branch-stats?restaurantId=restaurant-1&branchId=branch-1"
    );
  });

  it("submits contact form to public content endpoint", async () => {
    postRequestMock.mockResolvedValue({ success: true, data: {} });

    await submitContactForm("restaurant-1", "branch-1", {
      name: "Ada",
      email: "ada@example.com",
      subject: "Support",
      message: "Hello",
    });

    expect(postRequestMock).toHaveBeenCalledWith(
      "/v1/public-content/contact-form?restaurantId=restaurant-1&branchId=branch-1",
      {
        name: "Ada",
        email: "ada@example.com",
        subject: "Support",
        message: "Hello",
      }
    );
  });
});
