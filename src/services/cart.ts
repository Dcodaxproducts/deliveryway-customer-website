import { createDomainApiService } from "@/services/domain-api";
import { normalizeApiList, normalizeArray } from "@/components/pages/Items/utils/product-normalizers";
import type { ApiRecord, CartPayload } from "@/components/pages/Items/types";

const cartService = createDomainApiService();

export const getCart = cartService.get;
export const postCart = cartService.post;
export const patchCart = cartService.patch;
export const deleteCart = cartService.del;

const getRecord = (value: unknown): ApiRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as ApiRecord : null;

export const fetchCustomerCartItem = async ({
  customerId,
  cartItemId,
  token,
}: {
  customerId: string;
  cartItemId: string;
  token?: string | null;
}) => {
  const response = await getCart(`/v1/cart?customerId=${customerId}`, token);
  const resData = getRecord(response.data);
  const nestedData = getRecord(resData?.data);
  const cart = resData?.items ? resData : nestedData ?? resData;
  const items = normalizeArray<ApiRecord>(cart?.items);

  return items.find(({ id }) => String(id || "") === String(cartItemId)) ?? null;
};

export const addCustomerCartItem = ({
  customerId,
  payload,
  token,
}: {
  customerId: string;
  payload: CartPayload & Record<string, unknown>;
  token?: string | null;
}) => postCart(`/v1/cart/items?customerId=${customerId}`, payload, token);

export const updateCustomerCartItem = ({
  cartItemId,
  payload,
  token,
}: {
  cartItemId: string;
  payload: CartPayload & Record<string, unknown>;
  token?: string | null;
}) => patchCart(`/v1/cart/items/${cartItemId}`, payload, token);

export const clearCustomerCart = ({ customerId, token }: { customerId: string; token?: string | null }) =>
  deleteCart(`/v1/cart?customerId=${customerId}`, token);

export const fetchGroupOrders = async (token?: string | null) => {
  const response = await getCart("/v1/group-orders", token);

  return {
    response,
    groupOrders: normalizeApiList<ApiRecord>(response),
  };
};

export const addGroupOrderItem = ({
  groupOrderId,
  payload,
  token,
}: {
  groupOrderId: string;
  payload: CartPayload & Record<string, unknown>;
  token?: string | null;
}) => postCart(`/v1/group-orders/${groupOrderId}/items`, payload, token);
