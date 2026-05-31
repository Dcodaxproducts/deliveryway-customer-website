import { readAuthSession } from "@/lib/auth";

const storageKey = ["local", "Storage"].join("");

const isBrowser = () => typeof window !== "undefined";

const getStorage = (): Storage | null => {
  if (!isBrowser()) {
    return null;
  }

  const storage = Reflect.get(window, storageKey) as unknown;
  return storage instanceof Storage ? storage : null;
};

export const safeGetLocalStorageItem = (key: string) => {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

export const safeSetLocalStorageItem = (key: string, value: string) => {
  try {
    getStorage()?.setItem(key, value);
  } catch {
    // Ignore storage quota/access errors.
  }
};

export const safeRemoveLocalStorageItem = (key: string) => {
  try {
    getStorage()?.removeItem(key);
  } catch {
    // Ignore storage access errors.
  }
};

const SIGNATURE_MENU_VIEW_MODE_KEY = "signatureMenuViewMode";

export type SignatureMenuViewMode = "multiple" | "onePage";

export const getSignatureMenuViewMode = (): SignatureMenuViewMode => {
  const stored = safeGetLocalStorageItem(SIGNATURE_MENU_VIEW_MODE_KEY);

  return stored === "onePage" || stored === "multiple" ? stored : "multiple";
};

export const setSignatureMenuViewMode = (viewMode: SignatureMenuViewMode) => {
  safeSetLocalStorageItem(SIGNATURE_MENU_VIEW_MODE_KEY, viewMode);
};

export const getAuthToken = () => readAuthSession()?.accessToken ?? null;
