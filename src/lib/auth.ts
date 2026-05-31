import type { AuthSession, AuthUser } from "@/types/auth";

export const AUTH_STORAGE_KEY = "auth";

const storageKey = ["local", "Storage"].join("");

const isBrowser = () => typeof window !== "undefined";

const getStorage = (): Storage | null => {
  if (!isBrowser()) {
    return null;
  }

  const storage = Reflect.get(window, storageKey) as unknown;
  return storage instanceof Storage ? storage : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

export const isAuthUser = (value: unknown): value is AuthUser => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.email) &&
    isString(value.role) &&
    isString(value.tenantId)
  );
};

export const isAuthSession = (value: unknown): value is AuthSession => {
  if (!isRecord(value)) {
    return false;
  }

  return isString(value.accessToken) && isAuthUser(value.user);
};

export const readAuthSession = () => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const storedAuth = getStorage()?.getItem(AUTH_STORAGE_KEY);

    if (!storedAuth) {
      return null;
    }

    const parsedAuth = JSON.parse(storedAuth) as unknown;
    return isAuthSession(parsedAuth) ? parsedAuth : null;
  } catch {
    return null;
  }
};

export const saveAuthSession = (authSession: AuthSession) => {
  if (!isBrowser()) {
    return;
  }

  getStorage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(authSession));
};

export const clearAuthSession = () => {
  if (!isBrowser()) {
    return;
  }

  getStorage()?.removeItem(AUTH_STORAGE_KEY);
};

export const mergeStoredUserState = (user: AuthUser, storedUser?: AuthUser | null): AuthUser => ({
  ...user,
  restaurantId: storedUser?.restaurantId ?? user.restaurantId ?? null,
  branchId: storedUser?.branchId ?? user.branchId ?? null,
  branch: storedUser?.branch ?? user.branch ?? null,
});

export const getAuthErrorMessage = (error: unknown, fallback = "Something went wrong") => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};
