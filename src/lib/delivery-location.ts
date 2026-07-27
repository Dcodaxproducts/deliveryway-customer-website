import {
  safeGetLocalStorageItem,
  safeRemoveLocalStorageItem,
  safeSetLocalStorageItem,
} from "@/lib/browser-storage";
import type {
  GoogleAddressDetails,
  GoogleLatLngLiteral,
} from "@/types/google-maps";

const DELIVERY_LOCATION_STORAGE_KEY = "deliveryway:last-user-location";

export type StoredDeliveryLocation = GoogleLatLngLiteral & {
  label?: string;
  address?: GoogleAddressDetails;
};

const isFiniteCoordinate = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value);

const isStoredDeliveryLocation = (
  value: unknown,
): value is StoredDeliveryLocation => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const location = value as Record<string, unknown>;

  return (
    isFiniteCoordinate(location.lat) &&
    isFiniteCoordinate(location.lng) &&
    (location.label === undefined || typeof location.label === "string") &&
    (location.address === undefined ||
      (typeof location.address === "object" &&
        location.address !== null &&
        !Array.isArray(location.address)))
  );
};

export const getStoredDeliveryLocation = () => {
  const stored = safeGetLocalStorageItem(DELIVERY_LOCATION_STORAGE_KEY);

  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as unknown;
    return isStoredDeliveryLocation(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const setStoredDeliveryLocation = (
  location: StoredDeliveryLocation,
) => {
  safeSetLocalStorageItem(
    DELIVERY_LOCATION_STORAGE_KEY,
    JSON.stringify(location),
  );
};

export const clearStoredDeliveryLocation = () => {
  safeRemoveLocalStorageItem(DELIVERY_LOCATION_STORAGE_KEY);
};
