"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/config/query-keys";
import { getCustomerDeals } from "@/services/customer-deals";
import type { CustomerDealsParams } from "@/types/customer-deals";

export const useCustomerDeals = (params: CustomerDealsParams) => {
  const resolvedParams = {
    restaurantId: params.restaurantId ?? null,
    branchId: params.branchId ?? null,
    locale: params.locale ?? null,
    limit: params.limit ?? 20,
  };

  const query = useQuery({
    queryKey: queryKeys.customerDeals.list(resolvedParams),
    queryFn: ({ signal }) => getCustomerDeals(resolvedParams, signal),
    enabled: Boolean(resolvedParams.restaurantId),
    retry: false,
  });

  return {
    ...query,
    deals: query.data?.deals ?? [],
  };
};
