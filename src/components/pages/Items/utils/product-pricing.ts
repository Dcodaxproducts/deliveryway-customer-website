import type { MenuItem, MenuVariation, Modifier, VariationPriceOverride } from "../types";
import { normalizeArray, toNumber } from "./product-normalizers";

const getId = (value: unknown) => {
  if (value === undefined || value === null) return "";
  return String(value);
};

export const getMenuItemBasePrice = (menuItem: MenuItem | null | undefined) =>
  toNumber(menuItem?.price ?? menuItem?.basePrice, 0);

export const getMenuItemDisplayPrice = (menuItem: MenuItem | null | undefined) =>
  toNumber(menuItem?.price ?? menuItem?.basePrice, 0);

export const getVariationDisplayPrice = (menuItem: MenuItem | null | undefined, variation: MenuVariation | null | undefined) => {
  if (!variation) return getMenuItemDisplayPrice(menuItem);

  const override = normalizeArray<VariationPriceOverride>(menuItem?.variationPriceOverrides).find(
    (entry) => getId(entry.variationId ?? entry.variation?.id) === getId(variation.id)
  );

  return toNumber(
    override?.price ??
      variation.price ??
      menuItem?.price ??
      menuItem?.basePrice,
    0
  );
};

export const getVariationPickupPrice = (menuItem: MenuItem | null | undefined, variation: MenuVariation | null | undefined) => {
  if (!variation) return toNumber(menuItem?.pickupPrice ?? menuItem?.price ?? menuItem?.basePrice, 0);

  const override = normalizeArray<VariationPriceOverride>(menuItem?.variationPriceOverrides).find(
    (entry) => getId(entry.variationId ?? entry.variation?.id) === getId(variation.id)
  );

  return toNumber(
    override?.pickupPrice ?? variation.pickupPrice ?? override?.price ?? variation.price ?? menuItem?.pickupPrice ?? menuItem?.price ?? menuItem?.basePrice,
    0
  );
};

export const getVariationDisplayText = (menuItem: MenuItem | null | undefined, variation: MenuVariation | null | undefined) => {
  if (!variation) return "";

  const override = normalizeArray<VariationPriceOverride>(menuItem?.variationPriceOverrides).find(
    (entry) => getId(entry.variationId ?? entry.variation?.id) === getId(variation.id)
  );

  return String(override?.displayText ?? variation.displayText ?? variation.name ?? "");
};

export const getLowestPricedVariation = (
  menuItem: MenuItem | null | undefined
) => {
  const variations = [
    ...normalizeArray<MenuVariation>(menuItem?.variations),
    ...normalizeArray<MenuVariation>(menuItem?.category?.variations),
    ...normalizeArray<VariationPriceOverride>(
      menuItem?.variationPriceOverrides
    )
      .map((entry) => entry.variation)
      .filter((variation): variation is MenuVariation => Boolean(variation)),
  ].filter((variation) => variation.isActive !== false);
  const uniqueVariations = new Map<string, MenuVariation>();

  for (const variation of variations) {
    const id = getId(variation.id);
    if (id && !uniqueVariations.has(id)) {
      uniqueVariations.set(id, variation);
    }
  }

  return Array.from(uniqueVariations.values()).reduce<MenuVariation | null>(
    (lowest, variation) => {
      if (!lowest) return variation;

      return getVariationDisplayPrice(menuItem, variation) <
        getVariationDisplayPrice(menuItem, lowest)
        ? variation
        : lowest;
    },
    null
  );
};

export const getMenuItemCardPrice = (
  menuItem: MenuItem | null | undefined
) => {
  const lowestVariation = getLowestPricedVariation(menuItem);

  return lowestVariation
    ? getVariationDisplayPrice(menuItem, lowestVariation)
    : getMenuItemDisplayPrice(menuItem);
};

export const getModifierOverrideAmount = (
  overrides: VariationPriceOverride[] | undefined,
  modifier: Modifier | null | undefined
) => {
  const modifierId = getId(modifier?.id);
  const override = normalizeArray<VariationPriceOverride>(overrides).find(
    (entry) => getId(entry.modifierId ?? entry.modifier?.id) === modifierId
  );

  if (!override) return null;

  if (override.priceDelta !== undefined && override.priceDelta !== null) {
    return toNumber(override.priceDelta, 0);
  }

  if (override.price !== undefined && override.price !== null) {
    return toNumber(override.price, 0);
  }

  return null;
};
