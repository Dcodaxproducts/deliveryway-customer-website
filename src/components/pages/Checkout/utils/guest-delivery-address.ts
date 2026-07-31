import type { CheckoutAddressValues } from "@/validations/checkout";
import type { StoredDeliveryLocation } from "@/lib/delivery-location";

export const trimGuestDeliveryAddress = (address: CheckoutAddressValues) => ({
  street: address.street.trim(),
  houseNumber: address.houseNumber.trim(),
  area: address.area.trim(),
  postalCode: address.postalCode.trim(),
  city: address.city.trim(),
  state: address.state.trim(),
  country: address.country.trim(),
  lat: address.lat.trim(),
  lng: address.lng.trim(),
});

export const getGuestDeliveryAddressPayload = (
  address: CheckoutAddressValues,
) => {
  const trimmed = trimGuestDeliveryAddress(address);

  return {
    street: trimmed.street,
    houseNumber: trimmed.houseNumber,
    area: trimmed.houseNumber || trimmed.area,
    postalCode: trimmed.postalCode,
    city: trimmed.city,
    state: trimmed.state,
    country: trimmed.country,
    lat: trimmed.lat,
    lng: trimmed.lng,
  };
};

export const hasGuestDeliveryAddress = (address: CheckoutAddressValues) => {
  const trimmed = trimGuestDeliveryAddress(address);

  return Boolean(
    trimmed.street &&
    trimmed.houseNumber &&
    trimmed.postalCode &&
    trimmed.city &&
    trimmed.state &&
    trimmed.country &&
    trimmed.lat &&
    trimmed.lng,
  );
};

export const getGuestDeliveryAddressFromStoredLocation = (
  location: StoredDeliveryLocation | null,
): CheckoutAddressValues | null => {
  if (!location?.address) return null;

  const address = location.address;

  return {
    street: address.street?.trim() ?? "",
    houseNumber: address.houseNumber?.trim() ?? "",
    postalCode: address.postalCode?.trim() ?? "",
    city: address.city?.trim() ?? "",
    state: address.state?.trim() ?? "",
    country: address.country?.trim() ?? "",
    area: "",
    lat: String(location.lat),
    lng: String(location.lng),
    isDefault: false,
  };
};
