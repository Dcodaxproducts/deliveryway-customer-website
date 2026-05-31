const authStorageKey = "auth";

const isBrowser = () => typeof window !== "undefined";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const safeGetLocalStorageItem = (key: string) => {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const safeSetLocalStorageItem = (key: string, value: string) => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota/access errors.
  }
};

export const safeRemoveLocalStorageItem = (key: string) => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage access errors.
  }
};

export const getAuthToken = () => {
  const authRaw = safeGetLocalStorageItem(authStorageKey);

  if (!authRaw) {
    return null;
  }

  try {
    const auth = JSON.parse(authRaw) as unknown;

    if (!isRecord(auth)) {
      return null;
    }

    const token = auth.accessToken;
    return typeof token === "string" && token.trim() ? token : null;
  } catch {
    return null;
  }
};
