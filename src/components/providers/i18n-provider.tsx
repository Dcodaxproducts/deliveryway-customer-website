"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AbstractIntlMessages } from "next-intl";
import { NextIntlClientProvider } from "next-intl";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type AppLocale,
  resolveLocale,
} from "@/config/i18n";
import deMessages from "@/messages/de.json";
import enMessages from "@/messages/en.json";
import { useAuthContext } from "@/components/providers/auth-provider";
import { updateCustomerLocale } from "@/services/auth";

type I18nProviderProps = {
  children: ReactNode;
};

type I18nContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  isLocaleReady: boolean;
};

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const messagesByLocale: Record<AppLocale, AbstractIntlMessages> = {
  en: enMessages,
  de: deMessages,
};

export const I18nContext = createContext<I18nContextValue | null>(null);

const readCookieLocale = () => {
  const localeCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${LOCALE_STORAGE_KEY}=`));

  return localeCookie ? decodeURIComponent(localeCookie.split("=")[1] || "") : null;
};

const persistLocale = (locale: AppLocale) => {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.cookie = `${LOCALE_STORAGE_KEY}=${encodeURIComponent(
    locale
  )}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

export function I18nProvider({ children }: I18nProviderProps) {
  const queryClient = useQueryClient();
  const { token, user, loading: authLoading, updateUser } = useAuthContext();
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const previousLocaleRef = useRef<AppLocale | null>(null);

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const cookieLocale = readCookieLocale();
    const resolvedLocale = resolveLocale(storedLocale || cookieLocale);

    setLocaleState(resolvedLocale);
    document.documentElement.lang = resolvedLocale;
    persistLocale(resolvedLocale);
    setIsLocaleReady(true);
  }, []);

  useEffect(() => {
    if (!isLocaleReady) {
      return;
    }

    const previousLocale = previousLocaleRef.current;
    previousLocaleRef.current = locale;

    if (previousLocale && previousLocale !== locale) {
      void queryClient.invalidateQueries();
    }
  }, [isLocaleReady, locale, queryClient]);

  useEffect(() => {
    if (
      !isLocaleReady ||
      authLoading ||
      !token ||
      !user ||
      user.isGuest ||
      user.profile?.metadata?.locale === locale
    ) {
      return;
    }

    let cancelled = false;

    void updateCustomerLocale(token, locale)
      .then(() => {
        if (cancelled) {
          return;
        }

        updateUser((currentUser) =>
          currentUser
            ? {
                ...currentUser,
                profile: currentUser.profile
                  ? {
                      ...currentUser.profile,
                      metadata: {
                        ...(currentUser.profile.metadata ?? {}),
                        locale,
                      },
                    }
                  : currentUser.profile,
              }
            : currentUser,
        );
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    isLocaleReady,
    locale,
    token,
    updateUser,
    user,
  ]);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
    persistLocale(nextLocale);
  }, []);

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      isLocaleReady,
    }),
    [isLocaleReady, locale, setLocale]
  );

  return (
    <I18nContext.Provider value={contextValue}>
      <NextIntlClientProvider
        locale={locale}
        messages={messagesByLocale[locale]}
        timeZone="UTC"
      >
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  );
}
