const HOME_HERO_CACHE_PREFIX = "deliveryway-home-hero";
const HOME_HERO_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type HomeHeroCacheEntry = {
  imageUrl: string;
  cachedAt: number;
};

const getCacheKey = (restaurantId: string) =>
  `${HOME_HERO_CACHE_PREFIX}:${restaurantId}`;

const isUsableImageUrl = (value: unknown): value is string =>
  typeof value === "string" &&
  (value.startsWith("https://") || value.startsWith("/"));

const removeCachedEntry = (cacheKey: string) => {
  try {
    window.localStorage.removeItem(cacheKey);
  } catch {
    // Storage can be unavailable in private browsing or restricted embeds.
  }
};

export const readCachedHomeHeroImage = (
  restaurantId: string,
  now = Date.now(),
) => {
  if (!restaurantId || typeof window === "undefined") return null;

  const cacheKey = getCacheKey(restaurantId);

  try {
    const rawValue = window.localStorage.getItem(cacheKey);
    if (!rawValue) return null;

    const entry = JSON.parse(rawValue) as Partial<HomeHeroCacheEntry>;
    const isFresh =
      typeof entry.cachedAt === "number" &&
      now - entry.cachedAt <= HOME_HERO_CACHE_MAX_AGE_MS;

    if (!isFresh || !isUsableImageUrl(entry.imageUrl)) {
      removeCachedEntry(cacheKey);
      return null;
    }

    return entry.imageUrl;
  } catch {
    removeCachedEntry(cacheKey);
    return null;
  }
};

export const writeCachedHomeHeroImage = (
  restaurantId: string,
  imageUrl: string | null | undefined,
  cachedAt = Date.now(),
) => {
  if (
    !restaurantId ||
    !isUsableImageUrl(imageUrl) ||
    typeof window === "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      getCacheKey(restaurantId),
      JSON.stringify({ imageUrl, cachedAt } satisfies HomeHeroCacheEntry),
    );
  } catch {
    // The banner still works when storage is unavailable or full.
  }
};
