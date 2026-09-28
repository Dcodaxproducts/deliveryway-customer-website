import { getTenantFaviconUrl } from "@/lib/favicon";

export type TenantBrandingContext = {
  restaurantId: string;
  branding: unknown;
  brandingVersion: string | null;
};

type Fetcher = typeof fetch;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getApiBaseUrl = (): string | null => {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return value ? value.replace(/\/+$/, "") : null;
};

export const fetchTenantBrandingContext = async (
  host: string,
  fetcher: Fetcher = fetch,
): Promise<TenantBrandingContext | null> => {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl || !host) {
    return null;
  }

  try {
    const response = await fetcher(
      `${apiBaseUrl}/customer-app/domain-context?host=${encodeURIComponent(host)}`,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
      },
    );
    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();
    const data = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
    if (!isRecord(data) || typeof data.restaurantId !== "string") {
      return null;
    }

    return {
      restaurantId: data.restaurantId,
      branding: data.branding,
      brandingVersion:
        typeof data.brandingVersion === "string" ? data.brandingVersion : null,
    };
  } catch {
    return null;
  }
};

export const getCustomTenantFaviconUrl = (
  context: TenantBrandingContext | null,
): string | null => {
  const value = getTenantFaviconUrl(context?.branding);
  return value?.startsWith("https://") ? value : null;
};
