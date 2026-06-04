import type { CustomerDeal } from "@/types/customer-deals";

export type DealCartItemInput = {
  branchId: string;
  menuItemId: string;
  quantity: number;
};

const getRequiredQuantity = (deal: CustomerDeal) => {
  const parsed = Number(deal.dealRequiredQuantity);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
};

export const isFixedItemDeal = (deal: CustomerDeal) =>
  deal.dealSelectionMode === "FIXED_ITEMS";

export const isFlexibleItemDeal = (deal: CustomerDeal) =>
  deal.dealSelectionMode === "FLEXIBLE_ITEMS" &&
  deal.scopeMenuItems.length > 0 &&
  deal.scopeCategories.length === 0;

export const isFlexibleCategoryDeal = (deal: CustomerDeal) =>
  deal.dealSelectionMode === "FLEXIBLE_ITEMS" &&
  deal.scopeCategories.length > 0;

export const getDealImage = (deal: CustomerDeal): string | null => {
  const scopedItemImage = deal.scopeMenuItems.find(({ imageUrl }) => imageUrl)?.imageUrl;
  const scopedCategoryImage = deal.scopeCategories.find(({ imageUrl }) => imageUrl)?.imageUrl;

  return deal.thumbnailUrl || deal.imageUrl || scopedItemImage || scopedCategoryImage || null;
};

export const getDealTypeLabel = (deal: CustomerDeal) => {
  const requiredQuantity = getRequiredQuantity(deal);

  if (isFlexibleCategoryDeal(deal)) {
    return requiredQuantity
      ? `Any ${requiredQuantity} from Categories`
      : "Any from Categories";
  }

  if (isFlexibleItemDeal(deal)) {
    return requiredQuantity ? `Any ${requiredQuantity} Items` : "Any Items";
  }

  return "Fixed Combo";
};

export const getDealRequirementText = (deal: CustomerDeal) => {
  const requiredQuantity = getRequiredQuantity(deal);

  if (isFlexibleItemDeal(deal)) {
    return requiredQuantity
      ? `Choose any ${requiredQuantity} from ${deal.scopeMenuItems.length} items`
      : "Choose from selected items";
  }

  if (isFlexibleCategoryDeal(deal)) {
    return requiredQuantity
      ? `Choose any ${requiredQuantity} from selected categories`
      : "Choose from selected categories";
  }

  const itemCount = deal.scopeMenuItems.length;

  return itemCount > 0 ? `Includes ${itemCount} selected items` : "";
};

export const getDealActionLabel = (deal: CustomerDeal) => {
  if (isFlexibleCategoryDeal(deal)) {
    return "Browse Items";
  }

  if (isFlexibleItemDeal(deal)) {
    return "Choose Items";
  }

  return "Add Deal";
};

const buildPayload = (branchId: string, menuItemIds: string[]): DealCartItemInput[] => {
  const resolvedBranchId = branchId.trim();

  if (!resolvedBranchId) {
    return [];
  }

  return menuItemIds
    .map((id) => id.trim())
    .filter(Boolean)
    .map((menuItemId) => ({
      branchId: resolvedBranchId,
      menuItemId,
      quantity: 1,
    }));
};

export const buildFixedDealCartItemsInput = (
  deal: CustomerDeal,
  branchId: string
): DealCartItemInput[] => {
  if (!isFixedItemDeal(deal)) {
    return [];
  }

  return buildPayload(
    branchId,
    deal.scopeMenuItems.map(({ id }) => id)
  );
};

export const buildSelectedFlexibleDealCartItemsInput = (
  deal: CustomerDeal,
  branchId: string,
  selectedMenuItemIds: string[]
): DealCartItemInput[] => {
  if (!isFlexibleItemDeal(deal)) {
    return [];
  }

  const eligibleIds = new Set(
    deal.scopeMenuItems.map(({ id }) => id.trim()).filter(Boolean)
  );
  const uniqueSelectedIds = Array.from(new Set(selectedMenuItemIds));

  return buildPayload(
    branchId,
    uniqueSelectedIds.filter((menuItemId) => eligibleIds.has(menuItemId.trim()))
  );
};

export const buildDealCartItemsInput = buildFixedDealCartItemsInput;
