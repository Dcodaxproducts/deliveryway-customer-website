type CheckoutErrorTranslator = (
  key: string,
) => string;

type CheckoutErrorInput = {
  code?: string | null;
  message?: string | null;
};

const CODE_KEYS: Record<string, string> = {
  BRANCH_TEMPORARILY_CLOSED: "errors.branchTemporarilyClosed",
  BRANCH_HOLIDAY_CLOSED: "errors.branchHolidayClosed",
  MINIMUM_ORDER_AMOUNT_NOT_MET: "errors.minimumOrderAmountNotMet",
};

const MESSAGE_KEYS: Array<{ pattern: RegExp; key: string }> = [
  {
    pattern: /outside branch delivery zone(?:s| bands)?|postal code is not serviceable/i,
    key: "errors.outsideDeliveryArea",
  },
  {
    pattern: /delivery address must include (?:lat[/]lng|postalcode)/i,
    key: "errors.incompleteDeliveryAddress",
  },
  {
    pattern: /branch delivery zone(?:s| bands)? are not configured|branch location is missing lat[/]lng/i,
    key: "errors.deliveryConfigurationUnavailable",
  },
  {
    pattern: /delivery is not available at requested order time/i,
    key: "errors.deliveryTimeUnavailable",
  },
  {
    pattern: /pickup is not available at requested order time/i,
    key: "errors.pickupTimeUnavailable",
  },
  {
    pattern: /branch is temporarily closed/i,
    key: "errors.branchTemporarilyClosed",
  },
  {
    pattern: /branch is closed for holiday/i,
    key: "errors.branchHolidayClosed",
  },
  {
    pattern: /subtotal is below .* minimum order amount/i,
    key: "errors.minimumOrderAmountNotMet",
  },
  {
    pattern: /branch not found or inactive/i,
    key: "errors.branchUnavailable",
  },
];

export const resolveCheckoutErrorMessage = (
  { code, message }: CheckoutErrorInput,
  t: CheckoutErrorTranslator,
  fallback: string,
) => {
  const normalizedCode = String(code || "").trim().toUpperCase();
  const codeKey = CODE_KEYS[normalizedCode];
  if (codeKey) return t(codeKey);

  const normalizedMessage = String(message || "").trim();
  const messageKey = MESSAGE_KEYS.find(({ pattern }) => pattern.test(normalizedMessage))?.key;
  if (messageKey) return t(messageKey);

  return normalizedMessage || fallback;
};
