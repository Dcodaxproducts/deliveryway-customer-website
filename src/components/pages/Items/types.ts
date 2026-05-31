export type PromotionInfo = {
  promotionId?: string;
  title?: string | null;
  description?: string | null;
  applyMode?: "ORDER_TOTAL" | "SCOPED_ITEMS" | string;
  discountType?: "FLAT" | "PERCENTAGE" | string;
  discountValue?: number | string | null;
  maxDiscountAmount?: number | string | null;
  discountAmount?: number | string | null;
  discountedAmount?: number | string | null;
};

export type ItemPriceOverride = {
  id?: string;
  menuItemId?: string | null;
  modifierId?: string | null;
  variationId?: string | null;
  price?: string | number | null;
  priceDelta?: string | number | null;
  modifier?: Modifier;
  menuItem?: { id?: string | number | null } | null;
};

export type VariationPriceOverride = {
  id?: string;
  menuItemId?: string | null;
  variationId?: string | null;
  modifierId?: string | null;
  price?: string | number | null;
  pickupPrice?: string | number | null;
  displayText?: string | null;
  priceDelta?: string | number | null;
  modifier?: Modifier;
  menuItem?: { id?: string | number | null } | null;
  variation?: MenuVariation | null;
  modifierPriceOverrides?: VariationPriceOverride[];
  itemPriceOverrides?: VariationPriceOverride[];
  discountedPrice?: string | number | null;
  promotion?: PromotionInfo | null;
};

export type MenuVariation = {
  id: string;
  categoryId?: string;
  variationId?: string | number | null;
  takeawayPrice?: string | number | null;
  name: string;
  description?: string | null;
  price?: string | number;
  pickupPrice?: string | number | null;
  displayText?: string | null;
  discountedPrice?: string | number | null;
  promotion?: PromotionInfo | null;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
  modifierPriceOverrides?: VariationPriceOverride[];
  itemPriceOverrides?: VariationPriceOverride[];
};

export type Modifier = {
  id: string;
  modifierGroupId?: string;
  restaurantId?: string;
  name: string;
  displayText?: string | null;
  description?: string | null;
  priceDelta?: string | number;
  sortOrder?: number;
  isActive?: boolean;
  itemPriceOverrides?: ItemPriceOverride[];
  variationPriceOverrides?: VariationPriceOverride[];
};

export type SelectedModifier = Modifier & {
  selectedQuantity: number;
};

export type RawModifierLink = {
  id?: string;
  modifierGroupId?: string;
  modifierId?: string;
  sortOrder?: number;
  modifier?: Modifier;
};

export type ModifierGroup = {
  id: string;
  name: string;
  description?: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  modifiers?: Modifier[];
  modifierLinks?: RawModifierLink[];
};

export type ModifierLink = {
  id: string;
  variationId?: string | null;
  sortOrder?: number;
  modifierGroup: ModifierGroup;
};

export type ModifierSelectionMap = Record<string, SelectedModifier[]>;

export type CheckoutType = "delivery" | "pickup";

export type MenuItem = {
  id?: string | number;
  name?: string;
  slug?: string | null;
  description?: string | null;
  price?: string | number | null;
  basePrice?: string | number | null;
  pickupPrice?: string | number | null;
  imageUrl?: string | null;
  categoryId?: string | null;
  category?: Record<string, unknown> & { name?: string | null; variations?: MenuVariation[]; variationLinks?: Array<{ variation?: MenuVariation | null }> };
  variations?: MenuVariation[];
  variationPriceOverrides?: VariationPriceOverride[];
  modifierPriceOverrides?: VariationPriceOverride[];
  modifiers?: Modifier[];
  modifierLinks?: RawModifierLink[];
  minSelect?: string | number | null;
  maxSelect?: string | number | null;
  isRequired?: boolean | null;
  minQuantity?: string | number | null;
  maxQuantity?: string | number | null;
  depositAmount?: string | number | null;
  promotion?: PromotionInfo | null;
  discountedPrice?: string | number | null;
  discountedBasePrice?: string | number | null;
  restaurant?: (Record<string, unknown> & { id?: string | number | null });
  restaurantId?: string | number | null;
  restaurantMenuId?: string | number | null;
  restaurantMenu?: { id?: string | number | null } | null;
  menuLinks?: Array<{ restaurantMenuId?: string | number | null; restaurantMenu?: { id?: string | number | null } | null; menuId?: string | number | null }>;
  prepTimeMinutes?: string | number | null;
  unitPrice?: string | number | null;
  takeawayPriceAdjustment?: string | number | null;
  deliveryPriceAdjustment?: string | number | null;
  supportsSplitPizza?: boolean | null;
  tenant?: Record<string, unknown>;
  labels?: unknown[];
  dietaryFlags?: unknown[];
  allergenAdditives?: unknown[];
  allergenCodes?: unknown[];
  allergenFlags?: unknown[];
  additiveCodes?: unknown[];
  additiveFlags?: unknown[];
  ingredients?: string | null;
  nutritionalInformation?: string | null;
  allergenPdfUrl?: string | null;
};

export type CartPayload = {
  customerId?: string;
  menuItemId?: string | number;
  quantity: number;
  checkoutType: CheckoutType;
  variationId?: string;
  modifiers: Array<{ modifierId: string; quantity: number }>;
  splitPizza?: unknown;
};
