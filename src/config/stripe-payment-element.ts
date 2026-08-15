import type { StripePaymentElementOptions } from "@stripe/stripe-js";

export const STRIPE_PAYMENT_ELEMENT_OPTIONS = {
  wallets: {
    applePay: "auto",
    googlePay: "auto",
  },
} satisfies StripePaymentElementOptions;
