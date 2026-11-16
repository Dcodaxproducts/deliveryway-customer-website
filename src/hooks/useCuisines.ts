"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/config/query-keys";
import {
  fetchCustomerCuisineItems,
  fetchCustomerCuisines,
  fetchPromotionalCuisines,
  type FetchCuisineItemsParams,
  type FetchCuisinesParams,
} from "@/services/cuisines";

export const useCustomerCuisines = (params: FetchCuisinesParams & { enabled?: boolean }) => {
  const { enabled = true, ...queryParams } = params;

  return useQuery({
    queryKey: queryKeys.cuisines.list(queryParams),
    queryFn: () => fetchCustomerCuisines(queryParams),
    enabled: enabled && Boolean(queryParams.restaurantId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useCustomerCuisineItems = (params: FetchCuisineItemsParams & { enabled?: boolean }) => {
  const { enabled = true, ...queryParams } = params;

  return useQuery({
    queryKey: queryKeys.cuisines.items(queryParams),
    queryFn: () => fetchCustomerCuisineItems(queryParams),
    enabled: enabled && Boolean(queryParams.restaurantId && queryParams.cuisineId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const usePromotionalCuisines = (params: FetchCuisinesParams & { enabled?: boolean }) => {
  const { enabled = true, ...queryParams } = params;

  return useQuery({
    queryKey: queryKeys.cuisines.promotional(queryParams),
    queryFn: () => fetchPromotionalCuisines(queryParams),
    enabled: enabled && Boolean(queryParams.restaurantId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
