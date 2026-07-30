import { describe, expect, it } from "vitest";

import { buildCustomerTestimonials } from "./Testimonials";
import type { CustomerReview } from "@/services/public-content";

describe("product testimonials", () => {
  it("does not invent testimonials when an item has no reviews", () => {
    expect(buildCustomerTestimonials([], "item-1")).toEqual([]);
  });

  it("maps only real customer reviews", () => {
    const review = {
      id: "review-1",
      rating: 5,
      comment: "Excellent",
      customer: { firstName: "Alex", lastName: "Smith" },
      order: {
        items: [
          {
            menuItemId: "item-1",
            menuItemName: "Pasta",
            variationName: null,
          },
        ],
      },
    } as CustomerReview;

    expect(buildCustomerTestimonials([review], "item-1")).toEqual([
      expect.objectContaining({
        name: "Alex Smith",
        text: '"Excellent"',
        rating: 5,
        orderedItems: "Pasta",
      }),
    ]);
  });
});
