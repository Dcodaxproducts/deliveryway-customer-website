import type { ServiceChargeType } from "@/types/cart";

type TotalsInput = {
  payableAmount?: unknown;
  totalAmount?: unknown;
};

const toNullableNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const shouldShowPositiveAmountLine = (value: unknown) => {
  const parsed = toNullableNumber(value);
  return parsed !== null && parsed > 0;
};

export const getDisplayTotalAmount = (quote: TotalsInput | null | undefined) => {
  return toNullableNumber(quote?.payableAmount) ?? toNullableNumber(quote?.totalAmount) ?? 0;
};

export const getServiceChargeLabel = ({
  serviceChargeType,
  serviceChargeValue,
  serviceChargeLabel,
  serviceChargeWithPercentageLabel,
}: {
  serviceChargeType?: ServiceChargeType | null;
  serviceChargeValue?: number | string | null;
  serviceChargeLabel: string;
  serviceChargeWithPercentageLabel: (value: string) => string;
}) => {
  const value = toNullableNumber(serviceChargeValue);

  if (String(serviceChargeType || "").toUpperCase() === "PERCENTAGE" && value !== null) {
    return serviceChargeWithPercentageLabel(Number.isInteger(value) ? String(value) : String(value));
  }

  return serviceChargeLabel;
};
