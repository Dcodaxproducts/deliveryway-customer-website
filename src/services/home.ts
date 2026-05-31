import { getRequest } from "@/services/http";
import { normalizeBrandingApiResponse } from "../lib/branding";
import type { CustomerHomeData, CustomerHomeResponse } from "../types/home";

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

const getArray = (value: unknown) => (Array.isArray(value) ? value : []);

const normalizeHomeData = (value: unknown): CustomerHomeData => {
  const data = unwrapHomeData(value);
  const record = isRecord(data) ? data : {};

  return {
    restaurant: isRecord(record.restaurant) ? record.restaurant : null,
    config: isRecord(record.config) ? record.config : null,
    branch: isRecord(record.branch) ? record.branch : null,
    landingPopup: record.landingPopup ?? null,
    cuisines: getArray(record.cuisines),
    promotionalItems: getArray(record.promotionalItems),
    faqs: getArray(record.faqs),
    branding: normalizeBrandingApiResponse(record),
  };
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
