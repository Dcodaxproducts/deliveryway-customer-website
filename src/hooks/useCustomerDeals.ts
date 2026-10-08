"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/config/query-keys";
import { getCustomerDeals } from "@/services/customer-deals";
import type { CustomerDealsParams } from "@/types/customer-deals";
import { useAuth } from "@/hooks/useAuth";
import { getStorefrontRequestIdentity } from "@/lib/storefront-request-identity";

export const useCustomerDeals = (params: CustomerDealsParams) => {
  const { token, user } = useAuth();
  const requestIdentity = getStorefrontRequestIdentity({ token, userId: user?.id });
  const resolvedParams = {
    restaurantId: params.restaurantId ?? null,
    branchId: params.branchId ?? null,
    locale: params.locale ?? null,
    limit: params.limit ?? 20,
  };

  const query = useQuery({
    queryKey: [...queryKeys.customerDeals.list(resolvedParams), requestIdentity],
    queryFn: ({ signal }) => getCustomerDeals(resolvedParams, signal),
    enabled: Boolean(resolvedParams.restaurantId),
    retry: false,
  });

  return {
    ...query,
    deals: query.data?.deals ?? [],
  };
};
