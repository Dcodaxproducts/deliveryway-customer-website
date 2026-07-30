import { describe, expect, it } from "vitest";

import {
  canSubmitDealSelection,
  filterDealItemsForCategoryRules,
  getDealRequiredSelectionCount,
  mergeUniqueDealEligibleItems,
  toDealEligibleMenuItem,
} from "./useDealEligibleItems";
import type { CustomerDeal } from "@/types/customer-deals";

const baseDeal: CustomerDeal = {
  id: "deal-1",
  title: "Deal",
  dealSelectionMode: "FLEXIBLE_ITEMS",
  dealRequiredQuantity: 2,
  discountValue: 100,
  scopeMenuItems: [],
  scopeCategories: [],
};

describe("deal eligible item helpers", () => {
  it("merges eligible items for multiple categories by id", () => {
    expect(
      mergeUniqueDealEligibleItems([
        [
          { id: "pizza", name: "Pizza" },
          { id: "drink", name: "Drink" },
        ],
        [
          { id: "drink", name: "Drink duplicate" },
          { id: "side", name: "Side" },
        ],
      ]),
    ).toEqual([
      { id: "pizza", name: "Pizza" },
      { id: "drink", name: "Drink" },
      { id: "side", name: "Side" },
    ]);
  });

  it("normalizes fetched menu items as selectable deal candidates", () => {
    expect(
      toDealEligibleMenuItem({
        id: "pizza",
        name: "Pizza",
        slug: "pizza",
        description: "Cheese pizza",
        imageUrl: null,
        basePrice: 10,
        variations: [{ id: "large", name: "Large" }],
        modifierGroups: [{ id: "addons", name: "Add-ons", isRequired: true }],
        modifiers: [{ id: "cheese", name: "Cheese" }],
        modifierLinks: [{ id: "link-1" }],
        minSelect: 1,
        minQuantity: 1,
        isRequired: true,
      }),
    ).toMatchObject({
      id: "pizza",
      name: "Pizza",
      variations: [{ id: "large", name: "Large" }],
      modifierGroups: [{ id: "addons", name: "Add-ons", isRequired: true }],
      modifiers: [{ id: "cheese", name: "Cheese" }],
      modifierLinks: [{ id: "link-1" }],
      minSelect: 1,
      minQuantity: 1,
      isRequired: true,
    });
  });

  it("preserves a nested category id returned by the public items API", () => {
    expect(
      toDealEligibleMenuItem({
        id: "cola",
        name: "Cola",
        category: {
          id: "drinks",
          name: "Drinks",
        },
      }),
    ).toMatchObject({
      id: "cola",
      category: {
        id: "drinks",
        name: "Drinks",
      },
    });
  });

  it("filters category deal items to backend eligible ids for forced variations", () => {
    const deal: CustomerDeal = {
      ...baseDeal,
      scopeCategories: [{ id: "pizza-category", name: "Pizza" }],
      scopeCategoryRules: [
        {
          menuCategoryId: "pizza-category",
          itemLimit: 1,
          variationId: "large",
          eligibleMenuItemIds: ["margherita"],
          excludedMenuItemIds: ["pepperoni"],
        },
      ],
    };

    expect(
      filterDealItemsForCategoryRules(deal, [
        {
          id: "margherita",
          name: "Margherita",
          category: { id: "pizza-category" },
        },
        {
          id: "pepperoni",
          name: "Pepperoni",
          category: { id: "pizza-category" },
        },
        { id: "cola", name: "Cola", category: { id: "drink-category" } },
      ]),
    ).toEqual([
      {
        id: "margherita",
        name: "Margherita",
        category: { id: "pizza-category" },
      },
      { id: "cola", name: "Cola", category: { id: "drink-category" } },
    ]);
  });

  it("filters category deal items when no forced variation is selected", () => {
    const deal: CustomerDeal = {
      ...baseDeal,
      scopeCategories: [{ id: "pizza-category", name: "Pizza" }],
      scopeCategoryRules: [
        {
          menuCategoryId: "pizza-category",
          itemLimit: 1,
          eligibleMenuItemIds: ["margherita"],
          excludedMenuItemIds: ["pepperoni"],
        },
      ],
    };
    const items = [
      {
        id: "margherita",
        name: "Margherita",
        category: { id: "pizza-category" },
      },
      {
        id: "pepperoni",
        name: "Pepperoni",
        category: { id: "pizza-category" },
      },
    ];

    expect(filterDealItemsForCategoryRules(deal, items)).toEqual([
      {
        id: "margherita",
        name: "Margherita",
        category: { id: "pizza-category" },
      },
    ]);
  });

  it("hides backend excluded ids for forced variations when eligible ids are absent", () => {
    const deal: CustomerDeal = {
      ...baseDeal,
      scopeCategories: [{ id: "pizza-category", name: "Pizza" }],
      scopeCategoryRules: [
        {
          menuCategoryId: "pizza-category",
          itemLimit: 1,
          variationId: "large",
          excludedMenuItemIds: ["pepperoni"],
        },
      ],
    };

    expect(
      filterDealItemsForCategoryRules(deal, [
        {
          id: "margherita",
          name: "Margherita",
          category: { id: "pizza-category" },
        },
        {
          id: "pepperoni",
          name: "Pepperoni",
          category: { id: "pizza-category" },
        },
      ]),
    ).toEqual([
      {
        id: "margherita",
        name: "Margherita",
        category: { id: "pizza-category" },
      },
    ]);
  });

  it("requires selected count to meet deal required quantity", () => {
    expect(canSubmitDealSelection({ selectedCount: 1, requiredCount: 2 })).toBe(
      false,
    );
    expect(canSubmitDealSelection({ selectedCount: 2, requiredCount: 2 })).toBe(
      true,
    );
    expect(canSubmitDealSelection({ selectedCount: 3, requiredCount: 2 })).toBe(
      false,
    );
  });

  it("uses scoped fixed item count as required count for fixed chooser deals", () => {
    expect(
      getDealRequiredSelectionCount({
        ...baseDeal,
        dealSelectionMode: "FIXED_ITEMS",
        dealRequiredQuantity: null,
        scopeMenuItems: [
          { id: "pizza", name: "Pizza" },
          { id: "drink", name: "Drink" },
        ],
      }),
    ).toBe(2);
  });

  it("adds fixed items to category-group quantities for mixed deals", () => {
    expect(
      getDealRequiredSelectionCount({
        ...baseDeal,
        dealSelectionMode: "FLEXIBLE_ITEMS",
        scopeMenuItems: [{ id: "burger", name: "Burger" }],
        scopeCategoryRules: [
          { menuCategoryId: "sides", itemLimit: 2 },
          { menuCategoryId: "drinks", itemLimit: 1 },
        ],
      }),
    ).toBe(4);
  });
});
