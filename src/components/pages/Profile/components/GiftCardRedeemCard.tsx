"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Gift } from "lucide-react";
import { useTranslations } from "next-intl";

import { CARD_PANEL_CLASS } from "@/components/common/common-classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePurchaseGiftCard, useRedeemGiftCard } from "@/hooks/useGiftCards";
import {
  buildGiftCardPurchasePayload,
  buildGiftCardRedeemPayload,
  giftCardPurchaseSchema,
  giftCardRedeemSchema,
  type GiftCardPurchaseFormValues,
  type GiftCardRedeemFormValues,
} from "@/validations/gift-cards";
import type {
  GiftCardPurchaseResult,
  GiftCardRedeemResult,
} from "@/types/gift-cards";

const redeemDefaultValues: GiftCardRedeemFormValues = {
  code: "",
};

const purchaseDefaultValues: GiftCardPurchaseFormValues = {
  amount: 0,
  title: "",
  message: "",
  expiresAt: "",
};

const formatWalletAmount = (amount: number, currency = "PKR") =>
  `${currency} ${Number(amount || 0).toLocaleString()}`;

export const GiftCardRedeemCard = () => {
  const t = useTranslations("profile.giftCards");
  const validationT = useTranslations("validation");
  const purchaseGiftCard = usePurchaseGiftCard();
  const redeemGiftCard = useRedeemGiftCard();
  const [purchaseResult, setPurchaseResult] = useState<GiftCardPurchaseResult | null>(null);
  const [redeemResult, setRedeemResult] = useState<GiftCardRedeemResult | null>(null);
  const formValues = useMemo(() => redeemDefaultValues, []);
  const purchaseFormValues = useMemo(() => purchaseDefaultValues, []);
  const {
    formState: { errors: purchaseErrors },
    handleSubmit: handlePurchaseSubmit,
    register: registerPurchase,
    reset: resetPurchase,
  } = useForm<GiftCardPurchaseFormValues>({
    resolver: zodResolver(giftCardPurchaseSchema),
    defaultValues: purchaseFormValues,
  });
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<GiftCardRedeemFormValues>({
    resolver: zodResolver(giftCardRedeemSchema),
    defaultValues: formValues,
    values: formValues,
  });

  const onPurchaseSubmit = async (values: GiftCardPurchaseFormValues) => {
    const response = await purchaseGiftCard.mutateAsync({
      payload: buildGiftCardPurchasePayload(values),
    });

    setPurchaseResult(response.result);
    resetPurchase(purchaseFormValues);
  };

  const onSubmit = async (values: GiftCardRedeemFormValues) => {
    const response = await redeemGiftCard.mutateAsync({
      payload: buildGiftCardRedeemPayload(values),
    });

    setRedeemResult(response.result);
    reset(formValues);
  };

  return (
    <div className={CARD_PANEL_CLASS}>
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Gift size={20} />
        </div>

        <div>
          <h3 className="text-[22px] font-medium text-[#222]">
            {t("purchaseTitle")}
          </h3>
          <p className="mt-1 text-sm font-normal text-[#8A8A8A]">
            {t("purchaseDescription")}
          </p>
        </div>
      </div>

      <form onSubmit={handlePurchaseSubmit(onPurchaseSubmit)} noValidate>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label
              htmlFor="gift-card-amount"
              className="mb-2 block text-[11px] uppercase text-[#9A9A9A]"
            >
              {t("amount")}
            </label>
            <Input
              id="gift-card-amount"
              type="number"
              min="1"
              step="1"
              placeholder="1000"
              className="h-11 rounded-full"
              {...registerPurchase("amount", { valueAsNumber: true })}
            />
            {purchaseErrors.amount ? (
              <p className="mt-2 text-sm text-red-600">
                {purchaseErrors.amount.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="gift-card-expires-at"
              className="mb-2 block text-[11px] uppercase text-[#9A9A9A]"
            >
              {t("expiresAt")}
            </label>
            <Input
              id="gift-card-expires-at"
              type="datetime-local"
              className="h-11 rounded-full"
              {...registerPurchase("expiresAt")}
            />
            {purchaseErrors.expiresAt ? (
              <p className="mt-2 text-sm text-red-600">
                {purchaseErrors.expiresAt.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="gift-card-title"
              className="mb-2 block text-[11px] uppercase text-[#9A9A9A]"
            >
              {t("title")}
            </label>
            <Input
              id="gift-card-title"
              placeholder={t("titlePlaceholder")}
              className="h-11 rounded-full"
              {...registerPurchase("title")}
            />
          </div>

          <div>
            <label
              htmlFor="gift-card-message"
              className="mb-2 block text-[11px] uppercase text-[#9A9A9A]"
            >
              {t("message")}
            </label>
            <Input
              id="gift-card-message"
              placeholder={t("messagePlaceholder")}
              className="h-11 rounded-full"
              {...registerPurchase("message")}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={purchaseGiftCard.isPending}
          className="mt-4 h-11 rounded-full bg-primary px-6 text-white hover:bg-primary/90"
        >
          {purchaseGiftCard.isPending ? t("purchasing") : t("purchase")}
        </Button>
      </form>

      {purchaseResult ? (
        <div className="mt-5 grid gap-3 rounded-2xl bg-[#FAFAFA] p-4 md:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase text-[#9A9A9A]">
              {t("code")}
            </p>
            <p className="mt-1 break-all font-semibold text-[#222]">
              {purchaseResult.code}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase text-[#9A9A9A]">
              {t("qrPayload")}
            </p>
            <p className="mt-1 break-all font-semibold text-[#222]">
              {purchaseResult.qrPayload}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase text-[#9A9A9A]">
              {t("amount")}
            </p>
            <p className="mt-1 font-semibold text-[#222]">
              {formatWalletAmount(purchaseResult.amount)}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase text-[#9A9A9A]">
              {t("walletBalance")}
            </p>
            <p className="mt-1 font-semibold text-[#222]">
              {formatWalletAmount(purchaseResult.walletBalance)}
            </p>
          </div>
        </div>
      ) : null}

      <div className="my-6 border-t border-[#F0F0F0]" />

      <div className="mb-4">
        <h4 className="text-[18px] font-medium text-[#222]">
          {t("redeemTitle")}
        </h4>
        <p className="mt-1 text-sm font-normal text-[#8A8A8A]">
          {t("redeemDescription")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <label
              htmlFor="gift-card-code"
              className="mb-2 block text-[11px] uppercase text-[#9A9A9A]"
            >
              {t("code")}
            </label>
            <Input
              id="gift-card-code"
              placeholder="DWGC:GIFT-ABCD1234"
              autoComplete="off"
              className="h-11 rounded-full"
              {...register("code")}
            />
            {errors.code ? (
              <p className="mt-2 text-sm text-red-600">
                {validationT("giftCardCodeRequired")}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={redeemGiftCard.isPending}
            className="mt-[26px] h-11 rounded-full bg-primary px-6 text-white hover:bg-primary/90"
          >
            {redeemGiftCard.isPending ? t("redeeming") : t("redeem")}
          </Button>
        </div>
      </form>

      {redeemResult ? (
        <div className="mt-5 grid gap-3 rounded-2xl bg-[#FAFAFA] p-4 md:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase text-[#9A9A9A]">
              {t("creditedAmount")}
            </p>
            <p className="mt-1 font-semibold text-[#222]">
              {formatWalletAmount(redeemResult.creditedAmount, redeemResult.currency)}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase text-[#9A9A9A]">
              {t("walletBalance")}
            </p>
            <p className="mt-1 font-semibold text-[#222]">
              {formatWalletAmount(redeemResult.walletBalance, redeemResult.currency)}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
