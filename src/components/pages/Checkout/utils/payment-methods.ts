export type CheckoutPaymentMethod =
  | "COD"
  | "CARD_ON_DELIVERY"
  | "PAYPAL"
  | "STRIPE"
  | "EASYPAISA"
  | "JAZZCASH"
  | "BANK_TRANSFER"
  | "WALLET";

const paymentMethodOrder: CheckoutPaymentMethod[] = [
  "COD",
  "CARD_ON_DELIVERY",
  "PAYPAL",
  "STRIPE",
  "EASYPAISA",
  "JAZZCASH",
  "BANK_TRANSFER",
  "WALLET",
];

export const getAvailableCheckoutPaymentMethods = ({
  allowedPaymentMethods,
  allowCardOnDelivery,
  allowCashOnDelivery,
  isGuest,
}: {
  allowedPaymentMethods: unknown;
  allowCardOnDelivery: boolean;
  allowCashOnDelivery: boolean;
  isGuest: boolean;
}) => {
  const configuredMethods = Array.isArray(allowedPaymentMethods)
    ? allowedPaymentMethods.filter(
        (method): method is CheckoutPaymentMethod =>
          typeof method === "string" &&
          paymentMethodOrder.includes(method as CheckoutPaymentMethod),
      )
    : [];

  return paymentMethodOrder.filter((method) => {
    if (!configuredMethods.includes(method)) return false;
    if (!allowCashOnDelivery && method === "COD") return false;
    if (!allowCardOnDelivery && method === "CARD_ON_DELIVERY") return false;
    if (isGuest && method === "WALLET") return false;
    return true;
  });
};
