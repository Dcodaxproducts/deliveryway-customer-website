"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/config/query-keys";
import { getHome } from "@/services/home";
import { useAuth } from "@/hooks/useAuth";
import { getStorefrontRequestIdentity } from "@/lib/storefront-request-identity";

type UseHomeOptions = {
  staleTime?: number;
  refetchInterval?: number | false;
  refetchOnMount?: boolean | "always";
  refetchOnReconnect?: boolean | "always";
  refetchOnWindowFocus?: boolean | "always";
};

export const useHome = (
  restaurantId?: string | null,
  branchId?: string | null,
  enabled = true,
  options?: UseHomeOptions
) => {
  const { token, user } = useAuth();
  const requestIdentity = getStorefrontRequestIdentity({ token, userId: user?.id });

  return useQuery({
    queryKey: [...queryKeys.home.detail(restaurantId, branchId), requestIdentity],
    queryFn: ({ signal }) => getHome(restaurantId, branchId, signal),
    enabled,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    refetchInterval: options?.refetchInterval,
    refetchOnMount: options?.refetchOnMount,
    refetchOnReconnect: options?.refetchOnReconnect,
    refetchOnWindowFocus: options?.refetchOnWindowFocus,
    retry: false,
  });
};
