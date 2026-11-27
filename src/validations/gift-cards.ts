import { z } from "zod";

import type {
  GiftCardGuestPurchasePayload,
  GiftCardPurchasePayload,
  GiftCardRedeemPayload,
} from "@/types/gift-cards";

const giftCardCodePattern = /^(?:DWGC:)?GIFT-[A-Z0-9]+$/i;

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""));

const isValidDateTime = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp);
};

const isFutureDateTime = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
};

export type GiftCardValidationMessages = {
  amountRequired: string;
  amountPositive: string;
  expiryInvalid: string;
  expiryFuture: string;
  emailInvalid: string;
  recipientEmailInvalid: string;
  codeRequired: string;
  codeInvalid: string;
};

const defaultMessages: GiftCardValidationMessages = {
  amountRequired: "Gift card amount is required",
  amountPositive: "Gift card amount must be greater than 0",
  expiryInvalid: "Expiry date must be valid",
  expiryFuture: "Expiry date must be in the future",
  emailInvalid: "Enter a valid email address",
  recipientEmailInvalid: "Enter a valid recipient email address",
  codeRequired: "Gift card code is required",
  codeInvalid: "Enter a valid gift card code",
};

export const createGiftCardPurchaseSchema = (
  messages: GiftCardValidationMessages,
) => z.object({
  amount: z
    .number({
      error: messages.amountRequired,
    })
    .positive(messages.amountPositive),
  title: optionalTrimmedString,
  message: optionalTrimmedString,
  currency: optionalTrimmedString,
  expiresAt: optionalTrimmedString
    .refine((value) => !value || isValidDateTime(value), messages.expiryInvalid)
    .refine((value) => !value || isFutureDateTime(value), messages.expiryFuture),
});

export const giftCardPurchaseSchema = createGiftCardPurchaseSchema(defaultMessages);

export const giftCardGuestPurchaseSchema = giftCardPurchaseSchema.extend({
  buyerEmail: z.string().trim().email("Enter a valid email address"),
  recipientEmail: z
    .string()
    .trim()
    .email("Enter a valid recipient email address"),
  buyerName: optionalTrimmedString,
  branchId: optionalTrimmedString,
  currency: optionalTrimmedString,
});

export const createGiftCardRedeemSchema = (
  messages: Pick<GiftCardValidationMessages, "codeRequired" | "codeInvalid">,
) => z.object({
  code: z
    .string()
    .trim()
    .min(1, messages.codeRequired)
    .regex(giftCardCodePattern, messages.codeInvalid),
});

export const giftCardRedeemSchema = createGiftCardRedeemSchema(defaultMessages);

export type GiftCardPurchaseFormValues = z.infer<typeof giftCardPurchaseSchema>;
export type GiftCardGuestPurchaseFormValues = z.infer<typeof giftCardGuestPurchaseSchema>;
export type GiftCardRedeemFormValues = z.infer<typeof giftCardRedeemSchema>;

const getOptionalText = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const buildGiftCardPurchasePayload = (
  values: GiftCardPurchaseFormValues
): GiftCardPurchasePayload => {
  const expiresAt = getOptionalText(values.expiresAt);

  return {
    amount: values.amount,
    ...(getOptionalText(values.title) ? { title: getOptionalText(values.title) } : {}),
    ...(getOptionalText(values.message) ? { message: getOptionalText(values.message) } : {}),
    ...(getOptionalText(values.currency) ? { currency: getOptionalText(values.currency) } : {}),
    ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
  };
};

export const buildGiftCardGuestPurchasePayload = (
  values: GiftCardGuestPurchaseFormValues
): GiftCardGuestPurchasePayload => {
  const purchasePayload = buildGiftCardPurchasePayload(values);

  return {
    ...purchasePayload,
    buyerEmail: values.buyerEmail.trim(),
    recipientEmail: values.recipientEmail.trim(),
    ...(getOptionalText(values.buyerName) ? { buyerName: getOptionalText(values.buyerName) } : {}),
    ...(getOptionalText(values.branchId) ? { branchId: getOptionalText(values.branchId) } : {}),
    ...(getOptionalText(values.currency) ? { currency: getOptionalText(values.currency) } : {}),
  };
};

export const buildGiftCardRedeemPayload = (
  values: GiftCardRedeemFormValues
): GiftCardRedeemPayload => ({
  code: values.code.trim().toUpperCase(),
});
