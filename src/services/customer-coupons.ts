import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import {
  normalizeCustomerCouponsResponse,
  type CustomerCouponsParams,
  type CustomerCouponsResponse,
} from "@/types/customer-coupons";

const CUSTOMER_COUPONS_ENDPOINT = "/customer-app/coupons";

export const getCustomerCoupons = async (
  params: CustomerCouponsParams,
  signal?: AbortSignal,
): Promise<CustomerCouponsResponse> => {
  const response = await httpClient.get<unknown>(CUSTOMER_COUPONS_ENDPOINT, {
    signal,
    params: cleanParams({
      restaurantId: params.restaurantId,
      branchId: params.branchId,
    }),
  });

  return normalizeCustomerCouponsResponse(response.data);
};
