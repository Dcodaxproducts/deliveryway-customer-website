"use client";

import { useEffect, useMemo, type ReactNode } from "react";

import { DEFAULT_BRANDING } from "@/config/default-branding";
import { useAuthContext } from "@/hooks/useAuth";
import { BrandingContext } from "@/hooks/useBranding";
import { useDomainContext } from "@/hooks/useDomainContext";
import { useHome } from "@/hooks/useHome";
import { getBrandingCssVariables } from "@/lib/branding";
import {
  getBrandingFaviconUrl,
  maintainDocumentFavicons,
  resolveFaviconUrl,
} from "@/lib/favicon";

const getUserRestaurantId = (user: ReturnType<typeof useAuthContext>["user"]) =>
  user?.restaurantId ?? user?.branch?.restaurantId ?? null;

const getUserBranchId = (user: ReturnType<typeof useAuthContext>["user"]) =>
  user?.branchId ?? user?.branch?.id ?? null;

type BrandingProviderProps = {
  children: ReactNode;
};

export const BrandingProvider = ({ children }: BrandingProviderProps) => {
  const { user, loading } = useAuthContext();
  const { context: domainContext, loading: domainLoading } = useDomainContext();
  const restaurantId = getUserRestaurantId(user) ?? domainContext?.restaurantId;
  const branchId = getUserBranchId(user) ?? domainContext?.branchId;
  const homeQuery = useHome(
    restaurantId,
    branchId,
    !loading && !domainLoading && Boolean(restaurantId),
  );
  const branding = homeQuery.data?.data.branding ?? DEFAULT_BRANDING;
  const hasResolvedRestaurantBranding = Boolean(homeQuery.data?.data);

  useEffect(() => {
    const root = document.documentElement;
    const variables = getBrandingCssVariables(branding);

    for (const [name, value] of Object.entries(variables)) {
      root.style.setProperty(name, value);
    }
  }, [branding]);

  useEffect(() => {
    if (!domainContext && !hasResolvedRestaurantBranding) {
      return;
    }

    return maintainDocumentFavicons(
      document,
      resolveFaviconUrl({
        faviconUrl:
          domainContext?.faviconUrl ??
          getBrandingFaviconUrl(domainContext?.branding) ??
          branding.assets.faviconUrl,
        logoUrl: domainContext?.logoUrl ?? branding.logo.default,
      }),
      "/favicon.ico",
      domainContext?.brandingVersion,
    );
  }, [
    branding.assets.faviconUrl,
    branding.logo.default,
    domainContext,
    hasResolvedRestaurantBranding,
  ]);

  const value = useMemo(
    () => ({
      branding,
      isLoading:
        loading ||
        domainLoading ||
        (Boolean(restaurantId) && homeQuery.isPending),
    }),
    [
      branding,
      domainLoading,
      homeQuery.isPending,
      loading,
      restaurantId,
    ],
  );

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};
