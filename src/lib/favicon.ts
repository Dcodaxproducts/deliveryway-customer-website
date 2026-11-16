export const normalizeBrowserImageUrl = (
  value: string | null | undefined,
) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;

  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? trimmed : null;
  } catch {
    return null;
  }
};

export const resolveFaviconUrl = ({
  faviconUrl,
  logoUrl,
  fallback = "/favicon.ico",
}: {
  faviconUrl?: string | null;
  logoUrl?: string | null;
  fallback?: string;
}) =>
  normalizeBrowserImageUrl(faviconUrl) ??
  normalizeBrowserImageUrl(logoUrl) ??
  fallback;

const FAVICON_RELS = ["icon", "shortcut icon", "apple-touch-icon"] as const;

export const updateDocumentFavicons = (
  document: Document,
  source: string,
  fallback = "/favicon.ico",
) => {
  const safeSource = normalizeBrowserImageUrl(source) ?? fallback;

  for (const rel of FAVICON_RELS) {
    let link = document.head.querySelector<HTMLLinkElement>(`link[rel='${rel}']`);
    if (!link) {
      link = document.createElement("link");
      link.rel = rel;
      document.head.appendChild(link);
    }

    link.onerror = () => {
      link!.onerror = null;
      link!.href = fallback;
    };
    link.href = safeSource;
  }
};
