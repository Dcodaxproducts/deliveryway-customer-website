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

export const addFaviconVersion = (source: string, version?: string | null) => {
  const normalizedSource = normalizeBrowserImageUrl(source);
  const normalizedVersion = version?.trim();

  if (!normalizedSource || !normalizedVersion) return normalizedSource ?? source;

  try {
    const url = new URL(normalizedSource, "https://deliveryway.invalid");
    const isSignedUrl =
      url.searchParams.has("X-Amz-Signature") ||
      url.searchParams.has("X-Amz-Credential") ||
      url.searchParams.has("Signature");

    if (isSignedUrl) return normalizedSource;

    url.searchParams.set("v", normalizedVersion);

    return normalizedSource.startsWith("/")
      ? url.pathname + url.search + url.hash
      : url.toString();
  } catch {
    return normalizedSource;
  }
};

export const getBrandingFaviconUrl = (branding: unknown) => {
  if (!branding || typeof branding !== "object" || Array.isArray(branding)) {
    return null;
  }

  const brandingRecord = branding as Record<string, unknown>;
  const assets = brandingRecord.assets;
  if (!assets || typeof assets !== "object" || Array.isArray(assets)) {
    return null;
  }

  const assetRecord = assets as Record<string, unknown>;
  const logos = assetRecord.logos;
  const nestedFavicon =
    logos && typeof logos === "object" && !Array.isArray(logos)
      ? (logos as Record<string, unknown>).faviconUrl
      : null;

  return (
    normalizeBrowserImageUrl(
      typeof assetRecord.faviconUrl === "string"
        ? assetRecord.faviconUrl
        : null,
    ) ??
    normalizeBrowserImageUrl(
      typeof nestedFavicon === "string" ? nestedFavicon : null,
    )
  );
};

const FAVICON_RELS = ["icon", "shortcut icon", "apple-touch-icon"] as const;

export const updateDocumentFavicons = (
  document: Document,
  source: string,
  fallback = "/favicon.ico",
  version?: string | null,
) => {
  const safeSource = addFaviconVersion(
    normalizeBrowserImageUrl(source) ?? fallback,
    version,
  );

  for (const rel of FAVICON_RELS) {
    const existingLinks = Array.from(
      document.head.querySelectorAll<HTMLLinkElement>(`link[rel='${rel}']`),
    );
    const links = existingLinks.length
      ? existingLinks
      : [document.createElement("link")];

    if (!existingLinks.length) {
      links[0].rel = rel;
      document.head.appendChild(links[0]);
    }

    for (const link of links) {
      link.onerror = () => {
        link.onerror = null;
        link.dataset.faviconFallback = "true";
        link.href = fallback;
      };
      delete link.dataset.faviconFallback;
      if (link.getAttribute("href") !== safeSource) {
        link.href = safeSource;
      }
    }
  }
};

export const maintainDocumentFavicons = (
  document: Document,
  source: string,
  fallback = "/favicon.ico",
  version?: string | null,
) => {
  let isApplying = false;
  let isStopped = false;

  const apply = () => {
    isApplying = true;
    updateDocumentFavicons(document, source, fallback, version);
    queueMicrotask(() => {
      isApplying = false;
    });
  };

  apply();

  const observer = new MutationObserver((mutations) => {
    const isFallbackMutation = mutations.every(
      (mutation) =>
        mutation.target instanceof HTMLLinkElement &&
        mutation.target.dataset.faviconFallback === "true",
    );
    if (isFallbackMutation) return;

    if (isApplying) {
      queueMicrotask(() => {
        if (!isStopped) apply();
      });
      return;
    }

    apply();
  });

  observer.observe(document.head, {
    attributes: true,
    attributeFilter: ["href", "rel"],
    childList: true,
    subtree: true,
  });

  return () => {
    isStopped = true;
    observer.disconnect();
  };
};
