import { getRequest, postRequest } from "@/services/http";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const getNumber = (value: unknown) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

const unwrapData = (value: unknown) => (isRecord(value) && isRecord(value.data) ? value.data : value);

export type AboutContent = {
  restaurantId?: string;
  restaurantName?: string;
  restaurantCoverImage?: string;
  title: string;
  content: string;
};

export type BranchStats = {
  completedOrders: number;
  activeMenuItems: number;
  reviewCount: number;
  averageRating: number;
  fiveStarReviews: number;
};

export type ContactFormPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export const normalizeAboutContent = (value: unknown): AboutContent => {
  const record = isRecord(value) ? value : {};

  return {
    restaurantId: getString(record.restaurantId),
    restaurantName: getString(record.restaurantName),
    restaurantCoverImage: getString(record.restaurantCoverImage),
    title: getString(record.title) ?? "About Us",
    content: getString(record.content) ?? "",
  };
};

export const normalizeBranchStats = (value: unknown): BranchStats => {
  const record = isRecord(value) ? value : {};

  return {
    completedOrders: getNumber(record.completedOrders),
    activeMenuItems: getNumber(record.activeMenuItems),
    reviewCount: getNumber(record.reviewCount),
    averageRating: getNumber(record.averageRating),
    fiveStarReviews: getNumber(record.fiveStarReviews),
  };
};

export const fetchAboutContent = async (restaurantId: string) => {
  const response = await getRequest(
    `/v1/public-content/about-us?restaurantId=${encodeURIComponent(restaurantId)}`
  );

  if (response.error) {
    throw new Error(typeof response.error === "string" ? response.error : "Failed to load About content");
  }

  return normalizeAboutContent(response.data);
};

export const fetchBranchStats = async (restaurantId: string, branchId?: string | null) => {
  const params = new URLSearchParams({ restaurantId });

  if (branchId) {
    params.set("branchId", branchId);
  }

  const response = await getRequest(`/customer-app/branch-stats?${params.toString()}`);

  if (response.error) {
    throw new Error(typeof response.error === "string" ? response.error : "Failed to load branch stats");
  }

  return normalizeBranchStats(unwrapData(response.data));
};

export const submitContactForm = async (
  restaurantId: string,
  branchId: string | null | undefined,
  payload: ContactFormPayload
) => {
  const params = new URLSearchParams({ restaurantId });

  if (branchId) {
    params.set("branchId", branchId);
  }

  return postRequest(`/v1/public-content/contact-form?${params.toString()}`, payload);
};
