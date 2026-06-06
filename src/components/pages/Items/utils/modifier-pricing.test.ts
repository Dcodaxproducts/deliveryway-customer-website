import { describe, expect, it } from "vitest";

import {
  formatModifierPriceDelta,
  getModifierPriceForVariation,
} from "./modifier-pricing";
import type { MenuItem } from "../types";

describe("modifier pricing", () => {
  const baseItem: MenuItem = {
    id: "item-1",
    name: "Pizza",
    modifierGroups: [
      {
        id: "group-1",
        name: "Extras",
        modifiers: [
          { id: "modifier-1", name: "Cheese", priceDelta: 50 },
          { id: "modifier-2", name: "Sauce", priceDelta: "25" },
        ],
      },
    ],
  };

  it("returns variation-specific modifier price when available", () => {
    expect(
      getModifierPriceForVariation({
        item: {
          ...baseItem,
          variationPriceOverrides: [
            {
              variationId: "small",
              price: 800,
              modifierPriceOverrides: [
                { modifierId: "modifier-1", priceDelta: 100 },
              ],
            },
          ],
        },
        selectedVariationId: "small",
        modifierId: "modifier-1",
      })
    ).toBe(100);
  });

  it("preserves variation-specific price 0", () => {
    expect(
      getModifierPriceForVariation({
        item: {
          ...baseItem,
          variationPriceOverrides: [
            {
              variationId: "small",
              modifierPriceOverrides: [
                { modifierId: "modifier-1", priceDelta: 0 },
              ],
            },
          ],
        },
        selectedVariationId: "small",
        modifierId: "modifier-1",
      })
    ).toBe(0);
  });

  it("falls back to item-level modifier price", () => {
    expect(
      getModifierPriceForVariation({
        item: {
          ...baseItem,
          modifierPriceOverrides: [
            { modifierId: "modifier-1", priceDelta: "75" },
          ],
        },
        selectedVariationId: "small",
        modifierId: "modifier-1",
      })
    ).toBe(75);
  });

  it("falls back to group modifier default price", () => {
    expect(
      getModifierPriceForVariation({
        item: baseItem,
        selectedVariationId: "small",
        modifierId: "modifier-2",
      })
    ).toBe(25);
  });

  it("falls back to 0", () => {
    expect(
      getModifierPriceForVariation({
        item: { id: "item-1", name: "Pizza" },
        selectedVariationId: "small",
        modifierId: "missing",
      })
    ).toBe(0);
  });

  it("supports variation id matching by variationId, id, and variation.id", () => {
    const item: MenuItem = {
      ...baseItem,
      variationPriceOverrides: [
        {
          variationId: "by-variation-id",
          modifierPriceOverrides: [
            { modifierId: "modifier-1", priceDelta: 10 },
          ],
        },
        {
          id: "by-id",
          modifierPriceOverrides: [
            { modifierId: "modifier-1", priceDelta: 20 },
          ],
        },
        {
          variation: { id: "by-nested-id", name: "Nested" },
          modifierPriceOverrides: [
            { modifierId: "modifier-1", priceDelta: 30 },
          ],
        },
      ],
    };

    expect(
      getModifierPriceForVariation({
        item,
        selectedVariationId: "by-variation-id",
        modifierId: "modifier-1",
      })
    ).toBe(10);
    expect(
      getModifierPriceForVariation({
        item,
        selectedVariationId: "by-id",
        modifierId: "modifier-1",
      })
    ).toBe(20);
    expect(
      getModifierPriceForVariation({
        item,
        selectedVariationId: "by-nested-id",
        modifierId: "modifier-1",
      })
    ).toBe(30);
  });

  it("supports modifier id matching by modifierId, modifier.id, and id", () => {
    const item: MenuItem = {
      ...baseItem,
      variationPriceOverrides: [
        {
          variationId: "small",
          modifierPriceOverrides: [
            { modifierId: "by-modifier-id", priceDelta: 10 },
            { modifier: { id: "by-nested-id" }, priceDelta: 20 },
          ],
        },
      ],
      modifiers: [
        { id: "by-id", name: "Default", priceDelta: 30 },
      ],
    };

    expect(
      getModifierPriceForVariation({
        item,
        selectedVariationId: "small",
        modifierId: "by-modifier-id",
      })
    ).toBe(10);
    expect(
      getModifierPriceForVariation({
        item,
        selectedVariationId: "small",
        modifierId: "by-nested-id",
      })
    ).toBe(20);
    expect(
      getModifierPriceForVariation({
        item,
        selectedVariationId: "small",
        modifierId: "by-id",
      })
    ).toBe(30);
  });

  it("uses fallback default when selectedVariationId is missing", () => {
    expect(
      getModifierPriceForVariation({
        item: {
          ...baseItem,
          variationPriceOverrides: [
            {
              variationId: "small",
              modifierPriceOverrides: [
                { modifierId: "modifier-1", priceDelta: 100 },
              ],
            },
          ],
        },
        selectedVariationId: null,
        modifierId: "modifier-1",
      })
    ).toBe(50);
  });

  it("formats modifier price deltas", () => {
    expect(formatModifierPriceDelta(10)).toBe("+$10.00");
    expect(formatModifierPriceDelta(-2.5)).toBe("-$2.50");
    expect(formatModifierPriceDelta(0)).toBe("$0.00");
  });
});
