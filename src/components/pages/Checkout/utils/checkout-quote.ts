import type { CheckoutAddressValues } from "@/validations/checkout";
import {
  getGuestDeliveryAddressPayload,
  hasGuestDeliveryAddress,
} from "./guest-delivery-address";

export const getCheckoutQuotePayload = ({
  activeTab,
  checkoutPaymentMethod,
  guestDeliveryAddress,
  isGuest,
  selectedAddress,
}: {
  activeTab: string;
  checkoutPaymentMethod: string;
  guestDeliveryAddress: CheckoutAddressValues;
  isGuest: boolean;
  selectedAddress: string | null;
}): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    paymentMethod: checkoutPaymentMethod,
  };

  if (
    activeTab === "delivery" &&
    isGuest &&
    hasGuestDeliveryAddress(guestDeliveryAddress)
  ) {
    payload.guestDeliveryAddress =
      getGuestDeliveryAddressPayload(guestDeliveryAddress);
  }

  if (activeTab === "delivery" && !isGuest && selectedAddress) {
    payload.deliveryAddressId = selectedAddress;
  }

  return payload;
};
