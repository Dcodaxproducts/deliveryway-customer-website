"use client";

import { useQuery } from "@tanstack/react-query";

import { getHome } from "@/services/home";

export const homeQueryKey = (restaurantId?: string | null, branchId?: string | null) => [
  "customer-home",
  restaurantId ?? "",
  branchId ?? "",
];

export const useHome = (restaurantId?: string | null, branchId?: string | null, enabled = true) =>
  useQuery({
    queryKey: homeQueryKey(restaurantId, branchId),
    queryFn: () => getHome(restaurantId, branchId),
    enabled,
  });
