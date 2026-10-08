"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/config/query-keys";
import { getCustomerCoupons } from "@/services/customer-coupons";
import type { CustomerCouponsParams } from "@/types/customer-coupons";

export const useCustomerCoupons = (params: CustomerCouponsParams) => {
  const resolvedParams = {
    restaurantId: params.restaurantId ?? null,
    branchId: params.branchId ?? null,
  };

  const query = useQuery({
    queryKey: queryKeys.customerCoupons.list(resolvedParams),
    queryFn: ({ signal }) => getCustomerCoupons(resolvedParams, signal),
    enabled: Boolean(resolvedParams.restaurantId),
    retry: false,
  });

  return {
    ...query,
    coupons: query.data?.coupons ?? [],
  };
};
