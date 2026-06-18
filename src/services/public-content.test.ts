import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchCustomerReviews,
  fetchBranchStats,
  normalizeAboutContent,
  normalizeBranchStats,
  normalizeCustomerReviewsResponse,
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

  it("normalizes customer reviews response", () => {
    expect(
      normalizeCustomerReviewsResponse({
        data: {
          items: [
            {
              id: "review-1",
              restaurantId: "restaurant-1",
              branchId: "branch-1",
              orderId: "order-1",
              rating: "5",
              comment: "Great",
              createdAt: "2026-06-18T00:00:00.000Z",
              customer: {
                id: "customer-1",
                firstName: "Ada",
                lastName: null,
                avatarUrl: null,
              },
              branch: { id: "branch-1", name: "Main" },
            },
          ],
          summary: {
            reviewCount: "1",
            averageRating: "5",
          },
        },
        meta: {
          page: "1",
          limit: "10",
          total: "1",
          totalPages: "1",
          hasNext: false,
          hasPrevious: false,
        },
      })
    ).toMatchObject({
      items: [{ id: "review-1", rating: 5, comment: "Great" }],
      summary: { reviewCount: 1, averageRating: 5 },
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
  });

  it("fetches customer reviews with restaurant, branch, pagination, and rating params", async () => {
    getRequestMock.mockResolvedValue({
      data: { data: { items: [], summary: { reviewCount: 0, averageRating: null } } },
      meta: { page: 2, limit: 5, total: 0, totalPages: 0 },
    });

    await fetchCustomerReviews({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      page: 2,
      limit: 5,
      rating: 5,
    });

    expect(getRequestMock).toHaveBeenCalledWith(
      "/customer-app/reviews?page=2&limit=5&restaurantId=restaurant-1&branchId=branch-1&rating=5"
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
