import { describe, expect, it } from "vitest";

import {
  buildFixedDealCartItemsInput,
  buildSelectedFlexibleDealCartItemsInput,
  getDealActionLabel,
  getDealImage,
  getDealRequirementText,
  getDealTypeLabel,
  isFlexibleCategoryDeal,
} from "./customer-deal-cart";
import type { CustomerDeal } from "@/types/customer-deals";

const fixedDeal: CustomerDeal = {
  id: "deal-1",
  title: "Combo",
  dealSelectionMode: "FIXED_ITEMS",
  dealRequiredQuantity: null,
  applyMode: "SCOPED_ITEMS",
  discountType: "FIXED_PRICE",
  discountValue: 799,
  scopeMenuItems: [
    { id: "burger-id", name: "Burger" },
    { id: "", name: "Invalid" },
    { id: "drink-id", name: "Drink" },
  ],
  scopeCategories: [],
};

const flexibleItemDeal: CustomerDeal = {
  ...fixedDeal,
  id: "deal-2",
  dealSelectionMode: "FLEXIBLE_ITEMS",
  dealRequiredQuantity: 2,
  scopeMenuItems: [
    { id: "burger-id", name: "Burger" },
    { id: "fries-id", name: "Fries" },
    { id: "drink-id", name: "Drink" },
  ],
};

const flexibleCategoryDeal: CustomerDeal = {
  ...fixedDeal,
  id: "deal-3",
  dealSelectionMode: "FLEXIBLE_ITEMS",
  dealRequiredQuantity: 3,
  scopeMenuItems: [],
  scopeCategories: [
    { id: "cat-burgers", name: "Burgers" },
    { id: "cat-sides", name: "Sides" },
  ],
};

describe("customer deal cart helpers", () => {
  it("fixed deal builds payload for all scoped items", () => {
    expect(buildFixedDealCartItemsInput(fixedDeal, "branch-1")).toEqual([
      { branchId: "branch-1", menuItemId: "burger-id", quantity: 1 },
      { branchId: "branch-1", menuItemId: "drink-id", quantity: 1 },
    ]);
  });

  it("flexible item deal builds payload only for selected eligible items", () => {
    expect(
      buildSelectedFlexibleDealCartItemsInput(
        flexibleItemDeal,
        "branch-1",
        ["drink-id", "unknown-id", "burger-id", "drink-id"]
      )
    ).toEqual([
      { branchId: "branch-1", menuItemId: "drink-id", quantity: 1 },
      { branchId: "branch-1", menuItemId: "burger-id", quantity: 1 },
    ]);
  });

  it("category deal does not build automatic item payload", () => {
    expect(isFlexibleCategoryDeal(flexibleCategoryDeal)).toBe(true);
    expect(buildFixedDealCartItemsInput(flexibleCategoryDeal, "branch-1")).toEqual([]);
    expect(
      buildSelectedFlexibleDealCartItemsInput(
        flexibleCategoryDeal,
        "branch-1",
        ["burger-id"]
      )
    ).toEqual([]);
  });

  it("does not include dealId, coupon, discountType, or applyMode in cart payload", () => {
    const [payload] = buildFixedDealCartItemsInput(fixedDeal, "branch-1");

    expect(Object.keys(payload)).toEqual(["branchId", "menuItemId", "quantity"]);
    expect(payload).not.toHaveProperty("dealId");
    expect(payload).not.toHaveProperty("coupon");
    expect(payload).not.toHaveProperty("discountType");
    expect(payload).not.toHaveProperty("applyMode");
  });

  it("deal type label works", () => {
    expect(getDealTypeLabel(fixedDeal)).toBe("Fixed Combo");
    expect(getDealTypeLabel(flexibleItemDeal)).toBe("Any 2 Items");
    expect(getDealTypeLabel(flexibleCategoryDeal)).toBe("Any 3 from Categories");
  });

  it("requirement text works", () => {
    expect(getDealRequirementText(fixedDeal)).toBe("Includes 3 selected items");
    expect(getDealRequirementText(flexibleItemDeal)).toBe("Choose any 2 from 3 items");
    expect(getDealRequirementText(flexibleCategoryDeal)).toBe("Choose any 3 from selected categories");
  });

  it("old shape without required quantity does not show choose any text", () => {
    expect(getDealTypeLabel(fixedDeal)).toBe("Fixed Combo");
    expect(getDealRequirementText(fixedDeal)).not.toContain("Choose any");
  });

  it("flexible item deal with five scoped items shows required quantity", () => {
    const deal: CustomerDeal = {
      ...flexibleItemDeal,
      dealRequiredQuantity: 2,
      scopeMenuItems: [
        { id: "item-1", name: "Item 1" },
        { id: "item-2", name: "Item 2" },
        { id: "item-3", name: "Item 3" },
        { id: "item-4", name: "Item 4" },
        { id: "item-5", name: "Item 5" },
      ],
    };

    expect(getDealRequirementText(deal)).toBe("Choose any 2 from 5 items");
  });

  it("flexible deal without required quantity falls back safely", () => {
    const itemDeal: CustomerDeal = {
      ...flexibleItemDeal,
      dealRequiredQuantity: null,
    };
    const categoryDeal: CustomerDeal = {
      ...flexibleCategoryDeal,
      dealRequiredQuantity: null,
    };

    expect(getDealTypeLabel(itemDeal)).toBe("Any Items");
    expect(getDealRequirementText(itemDeal)).toBe("Choose from selected items");
    expect(getDealActionLabel(itemDeal)).toBe("Choose Items");
    expect(getDealTypeLabel(categoryDeal)).toBe("Any from Categories");
    expect(getDealRequirementText(categoryDeal)).toBe("Choose from selected categories");
    expect(getDealActionLabel(categoryDeal)).toBe("Browse Items");
  });

  it("deal image prefers thumbnail over image and scoped images", () => {
    const deal: CustomerDeal = {
      ...fixedDeal,
      thumbnailUrl: "https://example.com/thumb.png",
      imageUrl: "https://example.com/image.png",
      scopeMenuItems: [
        { id: "item-1", name: "Item", imageUrl: "https://example.com/item.png" },
      ],
      scopeCategories: [
        { id: "cat-1", name: "Category", imageUrl: "https://example.com/cat.png" },
      ],
    };

    expect(getDealImage(deal)).toBe("https://example.com/thumb.png");
  });

  it("returns empty if branchId is missing", () => {
    expect(buildFixedDealCartItemsInput(fixedDeal, "")).toEqual([]);
    expect(buildFixedDealCartItemsInput(fixedDeal, "   ")).toEqual([]);
  });
});
