"use client";

import { useEffect, useMemo, type ReactNode } from "react";

import { DEFAULT_BRANDING } from "@/config/default-branding";
import { useAuthContext } from "@/hooks/useAuth";
import { BrandingContext } from "@/hooks/useBranding";
import { useDomainContext } from "@/hooks/useDomainContext";
import { useHome } from "@/hooks/useHome";
import { getBrandingCssVariables } from "@/lib/branding";
import { resolveFaviconUrl, updateDocumentFavicons } from "@/lib/favicon";

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
    if (!hasResolvedRestaurantBranding) {
      return;
    }

    updateDocumentFavicons(
      document,
      resolveFaviconUrl({
        faviconUrl: branding.assets.faviconUrl,
        logoUrl: branding.logo.default,
      }),
    );
  }, [
    branding.assets.faviconUrl,
    branding.logo.default,
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
