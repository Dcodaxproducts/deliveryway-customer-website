import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CustomerDeal } from "@/types/customer-deals";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/image", () => ({
  default: ({ fill: _fill, unoptimized: _unoptimized, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; unoptimized?: boolean }) =>
    React.createElement("img", props),
}));

vi.mock("sonner", () => ({
  toast: { warning: vi.fn() },
}));

vi.mock("@/components/pages/Home/components/deals/DealChooserDrawer", () => ({
  DealChooserDrawer: () => null,
}));

vi.mock("@/hooks/useDealScopedItemsDetails", () => ({
  useDealScopedItemsDetails: () => ({
    detailsById: {},
    isError: false,
    isLoading: false,
  }),
}));

import { CustomerDealsSection } from "./CustomerDealsSection";

const makeDeal = (index: number): CustomerDeal => ({
  id: `deal-${index}`,
  title: `Distinct deal ${index}`,
  discountValue: 10 + index,
  dealSelectionMode: "FIXED_ITEMS",
  dealRequiredQuantity: null,
  startsAt: null,
  expiresAt: null,
  scopeMenuItems: [
    {
      id: `item-${index}`,
      name: `Item ${index}`,
      basePrice: 20 + index,
    },
  ],
  scopeCategories: [],
});

describe("CustomerDealsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders every active deal when more than six distinct deals are available", () => {
    const deals = Array.from({ length: 8 }, (_, index) => makeDeal(index + 1));
    const html = renderToStaticMarkup(
      <CustomerDealsSection deals={deals} currency="EUR" />,
    );

    expect((html.match(/<article/g) ?? [])).toHaveLength(8);
    for (const deal of deals) {
      expect(html).toContain(deal.title);
    }
    expect(new Set(deals.map((deal) => deal.id))).toHaveLength(8);
  });

  it("renders the same complete distinct set in the compact mobile layout", () => {
    const deals = Array.from({ length: 7 }, (_, index) => makeDeal(index + 1));
    const html = renderToStaticMarkup(
      <CustomerDealsSection deals={deals} currency="EUR" compact />,
    );

    expect((html.match(/<article/g) ?? [])).toHaveLength(7);
    expect(html.match(/data-testid="available-deals-grid"/g)).toHaveLength(1);
    for (const deal of deals) {
      expect(html).toContain(deal.title);
    }
  });
});
