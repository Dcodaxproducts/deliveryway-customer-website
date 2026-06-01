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

const MENU_VIEW_MODE_KEY = "menuViewMode";
const GROUP_ORDER_CODE_KEY = "groupOrderCode";
const SIGNATURE_MENU_VIEW_MODE_KEY = "signatureMenuViewMode";

export type MenuViewMode = "multiple" | "onePage";
export type SignatureMenuViewMode = "multiple" | "onePage";

const parseRecord = (value: string | null): Record<string, unknown> | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as unknown;

    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
};

const getNestedRecord = (record: Record<string, unknown> | null, key: string) => {
  const value = record?.[key];

  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
};

const getNestedString = (record: Record<string, unknown> | null, key: string) => {
  const value = record?.[key];

  return typeof value === "string" || typeof value === "number" ? String(value) : null;
};

export const getItemsMenuViewMode = (): MenuViewMode => {
  const stored = safeGetLocalStorageItem(MENU_VIEW_MODE_KEY);

  return stored === "onePage" || stored === "multiple" ? stored : "multiple";
};

export const setItemsMenuViewMode = (viewMode: MenuViewMode) => {
  safeSetLocalStorageItem(MENU_VIEW_MODE_KEY, viewMode);
};

export const getStoredAuthState = () => parseRecord(safeGetLocalStorageItem("auth"));

export const getStoredRestaurantId = () => {
  const auth = getStoredAuthState();
  const user = getNestedRecord(auth, "user");

  return getNestedString(user, "restaurantId");
};

export const getStoredGroupOrderCode = () => safeGetLocalStorageItem(GROUP_ORDER_CODE_KEY);

export const getSignatureMenuViewMode = (): SignatureMenuViewMode => {
  const stored = safeGetLocalStorageItem(SIGNATURE_MENU_VIEW_MODE_KEY);

  return stored === "onePage" || stored === "multiple" ? stored : "multiple";
};

export const setSignatureMenuViewMode = (viewMode: SignatureMenuViewMode) => {
  safeSetLocalStorageItem(SIGNATURE_MENU_VIEW_MODE_KEY, viewMode);
};

export const getAuthToken = () => readAuthSession()?.accessToken ?? null;
