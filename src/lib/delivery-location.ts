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
const SELECTED_DELIVERY_ADDRESS_STORAGE_PREFIX =
  "deliveryway:selected-delivery-address";

export type StoredDeliveryLocation = GoogleLatLngLiteral & {
  label?: string;
  address?: GoogleAddressDetails;
};

export type SavedDeliveryAddressCandidate = {
  id: string;
  lat?: string;
  lng?: string;
  isDefault?: boolean;
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

const getSelectedDeliveryAddressStorageKey = (userId: string) =>
  `${SELECTED_DELIVERY_ADDRESS_STORAGE_PREFIX}:${userId}`;

export const getStoredSelectedDeliveryAddressId = (userId: string) =>
  safeGetLocalStorageItem(getSelectedDeliveryAddressStorageKey(userId));

export const setStoredSelectedDeliveryAddressId = (
  userId: string,
  addressId: string,
) => {
  safeSetLocalStorageItem(
    getSelectedDeliveryAddressStorageKey(userId),
    addressId,
  );
};

export const resolvePreferredSavedDeliveryAddressId = ({
  addresses,
  location,
  storedAddressId,
}: {
  addresses: SavedDeliveryAddressCandidate[];
  location: StoredDeliveryLocation | null;
  storedAddressId: string | null;
}) => {
  if (storedAddressId && addresses.some(({ id }) => id === storedAddressId)) {
    return storedAddressId;
  }

  if (location) {
    const coordinateMatch = addresses.find((address) => {
      const lat = Number(address.lat);
      const lng = Number(address.lng);

      return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat - location.lat) < 0.00001 &&
        Math.abs(lng - location.lng) < 0.00001
      );
    });

    if (coordinateMatch) {
      return coordinateMatch.id;
    }
  }

  return (
    addresses.find(({ isDefault }) => isDefault)?.id ??
    (addresses.length === 1 ? addresses[0].id : null)
  );
};
