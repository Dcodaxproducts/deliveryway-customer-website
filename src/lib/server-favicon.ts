export type TenantBrandingContext = {
  restaurantId: string;
  branding: unknown;
  brandingVersion: string | null;
  faviconUrl: string | null;
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
  fetcher?: Fetcher,
): Promise<TenantBrandingContext | null> => {
  const apiBaseUrl = getApiBaseUrl();
  const requestFetcher = fetcher ?? globalThis.fetch;
  if (!apiBaseUrl || !host) {
    return null;
  }

  try {
    const response = await requestFetcher(
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
      faviconUrl: typeof data.faviconUrl === "string" ? data.faviconUrl : null,
    };
  } catch {
    return null;
  }
};

export const getCustomTenantFaviconUrl = (
  context: TenantBrandingContext | null,
): string | null => {
  const value = context?.faviconUrl?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.toString()
      : null;
  } catch {
    return null;
  }
};
