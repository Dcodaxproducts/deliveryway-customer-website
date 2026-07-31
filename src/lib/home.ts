import { readAuthSession } from "./auth";
import type { DomainContext } from "./domain-context";
import { getArrayData } from "./response";
import type { AuthUser } from "../types/auth";
import type {
  HomeBranch,
  HomeCategory,
  LandingPopup,
  PromotionCampaign,
} from "../types/home";
import type { HappyHourInfo } from "@/components/pages/Items/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown) =>
  typeof value === "string" ? value : undefined;

const getBoolean = (value: unknown) =>
  typeof value === "boolean" ? value : undefined;

const getNumberOrString = (value: unknown) => {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  return undefined;
};

const getNumberArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((entry): entry is number => typeof entry === "number")
    : undefined;

const normalizePromotionScope = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).map((entry) => ({
    id: getString(entry.id),
    name: getString(entry.name),
    imageUrl: getString(entry.imageUrl) ?? null,
  }));
};

export const getStoredHomeAuthUser = () => readAuthSession()?.user ?? null;

export const resolveHomeRestaurantId = (
  user?: AuthUser | null,
  authRestaurantId?: string | null,
  domainContext?: Pick<DomainContext, "restaurantId"> | null,
) => {
  const storedUser = getStoredHomeAuthUser();

  return (
    domainContext?.restaurantId ??
    storedUser?.restaurantId ??
    storedUser?.branch?.restaurantId ??
    authRestaurantId ??
    user?.restaurantId ??
    user?.branch?.restaurantId ??
    user?.tenantId ??
    ""
  );
};

export const resolveHomeBranchId = (
  user?: AuthUser | null,
  domainContext?: Pick<DomainContext, "restaurantId" | "branchId"> | null,
) => {
  const storedUser = getStoredHomeAuthUser();
  const domainRestaurantId = domainContext?.restaurantId?.trim();

  if (domainContext?.branchId) {
    return domainContext.branchId;
  }

  if (domainRestaurantId) {
    const matchingUser = [storedUser, user].find((candidate) => {
      const candidateRestaurantId =
        candidate?.branch?.restaurantId ?? candidate?.restaurantId;

      return candidateRestaurantId === domainRestaurantId;
    });

    return matchingUser?.branchId ?? matchingUser?.branch?.id ?? "";
  }

  return (
    storedUser?.branchId ??
    storedUser?.branch?.id ??
    user?.branchId ??
    user?.branch?.id ??
    ""
  );
};

export const normalizeHomeCategories = (response: unknown): HomeCategory[] =>
  getArrayData<Record<string, unknown>>(response)
    .map((item) => ({
      id: getString(item.id) ?? "",
      name: getString(item.name) ?? "",
      imageUrl: getString(item.imageUrl) ?? null,
      happyHour: isRecord(item.happyHour)
        ? (item.happyHour as HappyHourInfo)
        : null,
    }))
    .filter((item) => item.id);

export const normalizePromotions = (response: unknown): PromotionCampaign[] =>
  getArrayData<Record<string, unknown>>(response)
    .map((promotion) => ({
      id: getString(promotion.id) ?? "",
      kind: getString(promotion.kind),
      audience: getString(promotion.audience),
      isEligible: getBoolean(promotion.isEligible),
      requiresRegistration: getBoolean(promotion.requiresRegistration),
      title: getString(promotion.title),
      description: getString(promotion.description),
      code: getString(promotion.code),
      couponCode: getString(promotion.couponCode),
      imageUrl: getString(promotion.imageUrl) ?? null,
      thumbnailUrl: getString(promotion.thumbnailUrl) ?? null,
      applyMode: getString(promotion.applyMode),
      discountType: getString(promotion.discountType),
      discountValue: getNumberOrString(promotion.discountValue),
      maxDiscountAmount: getNumberOrString(promotion.maxDiscountAmount),
      minOrderAmount: getNumberOrString(promotion.minOrderAmount),
      maxUsesPerCustomer: getNumberOrString(promotion.maxUsesPerCustomer),
      startsAt: getString(promotion.startsAt),
      expiresAt: getString(promotion.expiresAt),
      activeDays: getNumberArray(promotion.activeDays),
      dailyStartTime: getString(promotion.dailyStartTime) ?? null,
      dailyEndTime: getString(promotion.dailyEndTime) ?? null,
      isCurrentlyActive: getBoolean(promotion.isCurrentlyActive),
      branch: isRecord(promotion.branch)
        ? {
            id: getString(promotion.branch.id),
            name: getString(promotion.branch.name),
          }
        : null,
      restaurant: isRecord(promotion.restaurant)
        ? {
            id: getString(promotion.restaurant.id),
            name: getString(promotion.restaurant.name),
            slug: getString(promotion.restaurant.slug),
            logoUrl: getString(promotion.restaurant.logoUrl) ?? null,
            coverImage: getString(promotion.restaurant.coverImage) ?? null,
          }
        : null,
      scopeMenuItems: normalizePromotionScope(promotion.scopeMenuItems),
      scopeCategories: normalizePromotionScope(promotion.scopeCategories),
    }))
    .filter((promotion) => promotion.id);

export const isLandingPopup = (value: unknown): value is LandingPopup =>
  isRecord(value);

export const isHomeBranch = (value: unknown): value is HomeBranch =>
  isRecord(value);

export const resolveTableReservationsEnabled = (
  homeBranch?: HomeBranch | null,
  sessionBranch?: AuthUser["branch"] | null,
) => {
  const homeFlag =
    getBoolean(homeBranch?.tableReservationsEnabled) ??
    getBoolean(homeBranch?.settings?.tableReservationsEnabled);

  if (homeFlag !== undefined) {
    return homeFlag;
  }

  return (
    getBoolean(sessionBranch?.tableReservationsEnabled) ??
    getBoolean(sessionBranch?.settings?.tableReservationsEnabled) ??
    false
  );
};
