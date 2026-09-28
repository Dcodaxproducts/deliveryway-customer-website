import type { Metadata } from "next";

type BrandingRecord = Record<string, unknown>;
type HeaderReader = { get(name: string): string | null };

const isRecord = (value: unknown): value is BrandingRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export const getTenantFaviconUrl = (branding: unknown): string | null => {
  if (!isRecord(branding) || !isRecord(branding.assets)) {
    return null;
  }

  const direct = getNonEmptyString(branding.assets.faviconUrl);
  if (direct) {
    return direct;
  }

  return isRecord(branding.assets.logos)
    ? getNonEmptyString(branding.assets.logos.faviconUrl)
    : null;
};

export const getRequestHost = (headers: HeaderReader): string => {
  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headers.get("host") || "";
  const normalized = host.trim().toLowerCase();

  if (!normalized) {
    return "";
  }

  try {
    const url = normalized.includes("://")
      ? new URL(normalized)
      : new URL(`https://${normalized}`);
    return url.hostname;
  } catch {
    return normalized.split("/")[0]?.split(":")[0] ?? "";
  }
};

export const getVersionedFaviconHref = (version?: string | null): string => {
  const token = version?.trim() || "fallback";
  return `/favicon.ico?v=${encodeURIComponent(token)}`;
};

export const getFaviconMetadata = (
  version?: string | null,
): NonNullable<Metadata["icons"]> => {
  const href = getVersionedFaviconHref(version);
  return {
    icon: [{ url: href }],
    shortcut: [{ url: href }],
  };
};
