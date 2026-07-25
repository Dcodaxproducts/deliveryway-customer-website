"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  clearAuthSession,
  mergeStoredUserState,
  readAuthSession,
  saveAuthSession,
} from "@/lib/auth";
import { mergePublicBranchIntoAuthSession } from "@/lib/branch-selector";
import { createGuestSessionCoordinator } from "@/lib/guest-session";
import {
  getCurrentUser,
  guestLoginCustomer,
  isUnauthorizedAuthError,
  refreshCustomerToken,
} from "@/services/auth";
import type { AuthContextValue, AuthSession, AuthUser } from "@/types/auth";

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUser = useCallback(
    (
      nextUser: AuthUser | null | ((user: AuthUser | null) => AuthUser | null),
    ) => {
      setUserState((currentUser) => {
        const resolvedUser =
          typeof nextUser === "function" ? nextUser(currentUser) : nextUser;
        const storedAuth = readAuthSession();

        if (storedAuth && resolvedUser) {
          saveAuthSession({
            ...storedAuth,
            user: resolvedUser,
          });
        }

        return resolvedUser;
      });
    },
    [],
  );

  const login = useCallback((data: AuthSession) => {
    const resolvedSession = mergePublicBranchIntoAuthSession(data);

    saveAuthSession(resolvedSession);
    setToken(resolvedSession.accessToken);
    setUserState(resolvedSession.user);
    return resolvedSession;
  }, []);
  const [ensureGuestSession] = useState(() =>
    createGuestSessionCoordinator({
      readSession: readAuthSession,
      registerGuest: (restaurantId) =>
        guestLoginCustomer({
          restaurantId,
        }),
      persistSession: login,
    }),
  );
  const logout = useCallback(() => {
    clearAuthSession();
    setUserState(null);
    setToken(null);
  }, []);
  const renewGuestSession = useCallback(
    async (restaurantId: string) => {
      logout();
      return login(await guestLoginCustomer({ restaurantId }));
    },
    [login, logout],
  );

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedAuth = readAuthSession();

        if (!storedAuth?.accessToken) {
          setLoading(false);
          return;
        }

        try {
          const me = await getCurrentUser(storedAuth.accessToken);
          setUserState(mergeStoredUserState(me, storedAuth.user));
          setToken(storedAuth.accessToken);
        } catch (error) {
          if (!isUnauthorizedAuthError(error)) {
            return;
          }

          if (!storedAuth.refreshToken) {
            logout();
            return;
          }

          try {
            const refreshedToken = await refreshCustomerToken({
              refreshToken: storedAuth.refreshToken,
            });

            const refreshedAuth: AuthSession = {
              ...storedAuth,
              ...refreshedToken,
              user: storedAuth.user,
            };

            saveAuthSession(refreshedAuth);

            const me = await getCurrentUser(refreshedToken.accessToken);
            const latestStoredAuth = readAuthSession();

            setUserState(
              mergeStoredUserState(me, latestStoredAuth?.user ?? storedAuth.user),
            );
            setToken(refreshedToken.accessToken);
          } catch {
            logout();
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        ensureGuestSession,
        renewGuestSession,
        logout,
        updateUser,
        setUser: updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }

  return context;
};
