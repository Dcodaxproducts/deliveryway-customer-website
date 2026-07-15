import type { CheckoutAddressValues } from "@/validations/checkout";

const PENDING_DELIVERY_ADDRESS_KEY = "deliveryway.pendingDeliveryAddress";

export type PendingDeliveryAddress = CheckoutAddressValues & {
  label?: string;
};

const isBrowser = () => typeof window !== "undefined";

const sanitizeAddress = (address: PendingDeliveryAddress): PendingDeliveryAddress => ({
  street: String(address.street || "").trim(),
  houseNumber: String(address.houseNumber || "").trim(),
  postalCode: String(address.postalCode || "").trim(),
  city: String(address.city || "").trim(),
  state: String(address.state || "").trim(),
  country: String(address.country || "").trim(),
  area: String(address.houseNumber || address.area || "").trim(),
  lat: String(address.lat || "").trim(),
  lng: String(address.lng || "").trim(),
  isDefault: Boolean(address.isDefault),
  label: String(address.label || "").trim(),
});

export const hasUsablePendingDeliveryAddress = (
  address: Partial<PendingDeliveryAddress> | null | undefined
) =>
  Boolean(
    address?.street &&
      address.city &&
      address.state &&
      address.country &&
      address.lat &&
      address.lng
  );

export const getPendingDeliveryAddress = (): PendingDeliveryAddress | null => {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(PENDING_DELIVERY_ADDRESS_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as PendingDeliveryAddress;
    const sanitized = sanitizeAddress(parsed);

    return hasUsablePendingDeliveryAddress(sanitized) ? sanitized : null;
  } catch {
    return null;
  }
};

export const setPendingDeliveryAddress = (address: PendingDeliveryAddress) => {
  if (!isBrowser()) return;

  const sanitized = sanitizeAddress(address);

  if (!hasUsablePendingDeliveryAddress(sanitized)) return;

  window.localStorage.setItem(
    PENDING_DELIVERY_ADDRESS_KEY,
    JSON.stringify(sanitized)
  );
};

export const clearPendingDeliveryAddress = () => {
  if (!isBrowser()) return;

  window.localStorage.removeItem(PENDING_DELIVERY_ADDRESS_KEY);
};
