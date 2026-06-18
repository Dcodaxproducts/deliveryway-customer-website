import { getRequest, postRequest } from "@/services/http";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const getNumber = (value: unknown) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

const getNullableNumber = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
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
  averageRating: number | null;
  fiveStarReviews: number;
};

export type CustomerReview = {
  id: string;
  restaurantId: string;
  branchId: string;
  orderId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  branch: {
    id: string;
    name: string;
  };
};

export type CustomerReviewsSummary = {
  reviewCount: number;
  averageRating: number | null;
};

export type CustomerReviewsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type CustomerReviewsResponse = {
  items: CustomerReview[];
  summary: CustomerReviewsSummary;
  meta: CustomerReviewsMeta;
};

export type CustomerReviewsParams = {
  restaurantId?: string | null;
  branchId?: string | null;
  page?: number;
  limit?: number;
  rating?: number | null;
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
    averageRating: getNullableNumber(record.averageRating),
    fiveStarReviews: getNumber(record.fiveStarReviews),
  };
};

const normalizeCustomerReview = (value: unknown): CustomerReview | null => {
  const record = isRecord(value) ? value : null;

  if (!record) {
    return null;
  }

  const customer = isRecord(record.customer) ? record.customer : {};
  const branch = isRecord(record.branch) ? record.branch : {};

  return {
    id: getString(record.id) ?? "",
    restaurantId: getString(record.restaurantId) ?? "",
    branchId: getString(record.branchId) ?? "",
    orderId: getString(record.orderId) ?? "",
    rating: getNumber(record.rating),
    comment: getString(record.comment) ?? null,
    createdAt: getString(record.createdAt) ?? "",
    customer: {
      id: getString(customer.id) ?? "",
      firstName: getString(customer.firstName) ?? null,
      lastName: getString(customer.lastName) ?? null,
      avatarUrl: getString(customer.avatarUrl) ?? null,
    },
    branch: {
      id: getString(branch.id) ?? "",
      name: getString(branch.name) ?? "",
    },
  };
};

export const normalizeCustomerReviewsResponse = (
  value: unknown,
  metaValue?: unknown
): CustomerReviewsResponse => {
  const root = isRecord(value) ? value : {};
  const data = unwrapData(value);
  const record = isRecord(data) ? data : {};
  const summary = isRecord(record.summary) ? record.summary : {};
  const meta = isRecord(metaValue) ? metaValue : isRecord(root.meta) ? root.meta : {};
  const items = Array.isArray(record.items)
    ? record.items.map(normalizeCustomerReview).filter((item): item is CustomerReview => Boolean(item))
    : [];

  return {
    items,
    summary: {
      reviewCount: getNumber(summary.reviewCount),
      averageRating: getNullableNumber(summary.averageRating),
    },
    meta: {
      page: getNumber(meta.page),
      limit: getNumber(meta.limit),
      total: getNumber(meta.total),
      totalPages: getNumber(meta.totalPages),
      hasNext: meta.hasNext === true,
      hasPrevious: meta.hasPrevious === true,
    },
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

export const fetchCustomerReviews = async ({
  restaurantId,
  branchId,
  page = 1,
  limit = 10,
  rating,
}: CustomerReviewsParams) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (restaurantId) {
    params.set("restaurantId", restaurantId);
  }

  if (branchId) {
    params.set("branchId", branchId);
  }

  if (rating) {
    params.set("rating", String(rating));
  }

  const response = await getRequest(`/customer-app/reviews?${params.toString()}`);

  if (response.error) {
    throw new Error(typeof response.error === "string" ? response.error : "Failed to load reviews");
  }

  return normalizeCustomerReviewsResponse(response.data, response.meta);
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
