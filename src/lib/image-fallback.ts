export const resolveHttpsImageUrl = (imageUrl: string | null | undefined, fallback: string) => {
  return imageUrl?.startsWith("https") ? imageUrl : fallback;
};

export const isRemoteHttpsImageUrl = (imageUrl: string | null | undefined) => {
  return imageUrl?.startsWith("https") ?? false;
};

const SIGNED_IMAGE_QUERY_KEYS = new Set([
  "x-amz-signature",
  "x-amz-credential",
  "x-goog-signature",
  "signature",
  "token",
]);

export const isTimeLimitedImageUrl = (imageUrl: string) => {
  try {
    const url = new URL(imageUrl, "https://deliveryway.invalid");

    return Array.from(url.searchParams.keys()).some((key) =>
      SIGNED_IMAGE_QUERY_KEYS.has(key.toLowerCase()),
    );
  } catch {
    return false;
  }
};
