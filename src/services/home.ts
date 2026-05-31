import { getRequest } from "@/services/http";
import { normalizeBrandingApiResponse } from "../lib/branding";
import { isHomeBranch, isLandingPopup, normalizeHomeCategories, normalizePromotions } from "../lib/home";
import type { CustomerHomeData, CustomerHomeResponse, HomeConfig, HomeRestaurant } from "../types/home";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const unwrapHomeData = (value: unknown) => {
  if (!isRecord(value)) {
    return {};
  }

  const firstData = value.data;

  if (isRecord(firstData) && isRecord(firstData.data)) {
    return firstData.data;
  }

  return isRecord(firstData) ? firstData : value;
};

const normalizeHomeConfig = (value: unknown): HomeConfig | null => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    currency: typeof value.currency === "string" ? value.currency : null,
    branding: isRecord(value.branding) ? value.branding : undefined,
  };
};

const normalizeHomeRestaurant = (value: unknown): HomeRestaurant | null => {
  if (!isRecord(value)) {
    return null;
  }

  return value;
};

const normalizeHomeData = (value: unknown): CustomerHomeData => {
  const data = unwrapHomeData(value);
  const record = isRecord(data) ? data : {};

  return {
    restaurant: normalizeHomeRestaurant(record.restaurant),
    config: normalizeHomeConfig(record.config),
    branch: isHomeBranch(record.branch) ? record.branch : null,
    landingPopup: isLandingPopup(record.landingPopup) ? record.landingPopup : null,
    cuisines: normalizeHomeCategories(record.cuisines),
    promotionalItems: normalizePromotions(record.promotionalItems),
    faqs: Array.isArray(record.faqs) ? record.faqs.filter(isRecord) : [],
    branding: normalizeBrandingApiResponse(record),
  };
};

export const getHomeCategories = async (restaurantId: string) =>
  normalizeHomeCategories(await getRequest(`/v1/menu/categories?restaurantId=${restaurantId}`));

export const getHomePromotions = async (restaurantId: string, branchId?: string | null) => {
  const params = new URLSearchParams();
  params.set("restaurantId", restaurantId);

  if (branchId) {
    params.set("branchId", branchId);
  }

  return normalizePromotions(await getRequest(`/customer-app/promotions?${params.toString()}`));
};

export const getHome = async (
  restaurantId?: string | null,
  branchId?: string | null
): Promise<CustomerHomeResponse> => {
  const params = new URLSearchParams();

  if (restaurantId) {
    params.set("restaurantId", restaurantId);
  }

  if (branchId) {
    params.set("branchId", branchId);
  }

  const query = params.toString();
  const response = await getRequest(`/customer-app/home${query ? `?${query}` : ""}`);

  if (response.error) {
    throw new Error(response.error);
  }

  return {
    data: normalizeHomeData(response),
  };
};
