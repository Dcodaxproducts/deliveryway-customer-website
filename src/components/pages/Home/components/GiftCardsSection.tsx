"use client";

import Image from "next/image";
import { ArrowRight, CreditCard, Gift, Mail, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { GiftCardAvailableItem, HomeGiftCards } from "@/types/gift-cards";
import { GiftCardPurchaseModal } from "@/components/pages/Home/components/GiftCardPurchaseModal";

type GiftCardsSectionProps = {
  giftCards?: HomeGiftCards | null;
  restaurantId?: string | null;
  branchId?: string | null;
  currency?: string | null;
};

const formatAmount = (amount: number, currency = "USD") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

export const GiftCardsSection = ({
  giftCards,
  restaurantId,
  branchId,
  currency,
}: GiftCardsSectionProps) => {
  const t = useTranslations("home.giftCards");
  const [selectedGiftCard, setSelectedGiftCard] = useState<GiftCardAvailableItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const items = useMemo(() => giftCards?.items ?? [], [giftCards?.items]);

  if (giftCards?.isEnabled !== true || !restaurantId) {
    return null;
  }

  const openPurchaseModal = (giftCard?: GiftCardAvailableItem) => {
    setSelectedGiftCard(giftCard ?? null);
    setIsModalOpen(true);
  };

  return (
    <section
      id="gift-cards"
      className="mx-auto max-w-[1400px] px-4 pb-[30px] pt-[30px] sm:px-6 sm:pb-[60px] sm:pt-[60px]"
    >
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Gift size={14} />
            {t("label")}
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight text-gray-950 sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            {t("description")}
          </p>
        </div>

        <Button
          type="button"
          className="h-11 w-full rounded-full bg-primary px-5 text-white shadow-lg shadow-primary/20 hover:bg-primary/90 md:w-fit"
          onClick={() => openPurchaseModal()}
        >
          {t("customAmount")}
          <ArrowRight size={16} />
        </Button>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-gray-100 bg-gradient-to-br from-white via-primary/5 to-gray-50 shadow-xl shadow-primary/5">
        <div className="grid gap-0 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="relative flex min-h-[360px] flex-col justify-between border-b border-gray-100 bg-white p-6 lg:border-b-0 lg:border-r sm:p-8">
            <div className="relative overflow-hidden rounded-[22px] bg-primary p-5 text-white shadow-2xl shadow-primary/25">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                    {t("label")}
                  </p>
                  <h3 className="mt-3 max-w-[240px] text-2xl font-bold leading-tight">
                    {t("customOnlyTitle")}
                  </h3>
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Gift size={22} />
                </span>
              </div>

              <div className="mt-8 border-t border-white/20 pt-5">
                <p className="text-sm leading-6 text-white/80">
                  {t("customOnlyDescription")}
                </p>
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-[#1f1f1f]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("instantCheckout")}
                  </span>
                  <CreditCard className="text-primary" size={18} />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm font-medium text-gray-700 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                  <Sparkles size={16} />
                </span>
                {t("instantCheckout")}
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                  <Mail size={16} />
                </span>
                {t("emailDelivery")}
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {items.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.slice(0, 6).map((giftCard) => (
                  <article
                    key={giftCard.id}
                    className="group flex min-h-[286px] flex-col overflow-hidden rounded-[20px] border border-gray-100 bg-white text-gray-900 shadow-lg shadow-gray-200/70 transition duration-200 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10"
                  >
                    <div className="relative h-[128px] bg-gradient-to-br from-primary/10 to-gray-100">
                      {giftCard.imageUrl ? (
                        <Image
                          src={giftCard.imageUrl}
                          alt={giftCard.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-primary shadow-lg shadow-primary/10">
                            <Gift size={30} />
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                        {formatAmount(giftCard.amount, currency ?? "USD")}
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-base font-bold text-gray-900">
                        {giftCard.title}
                      </h3>
                      {giftCard.description ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-500">
                          {giftCard.description}
                        </p>
                      ) : null}
                      <Button
                        type="button"
                        className="mt-auto h-10 rounded-full bg-primary text-white hover:bg-primary/90"
                        onClick={() => openPurchaseModal(giftCard)}
                      >
                        {t("buyPreset")}
                        <ArrowRight size={15} />
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[22px] border border-dashed border-primary/20 bg-white p-6 text-center shadow-inner shadow-primary/5">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Gift size={34} />
                </span>
                <h3 className="mt-4 text-xl font-bold text-gray-900">
                  {t("customOnlyTitle")}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                  {t("customOnlyDescription")}
                </p>
                <Button
                  type="button"
                  className="mt-5 h-10 rounded-full bg-primary text-white hover:bg-primary/90"
                  onClick={() => openPurchaseModal()}
                >
                  {t("customAmount")}
                  <ArrowRight size={15} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <GiftCardPurchaseModal
        open={isModalOpen}
        restaurantId={restaurantId}
        branchId={branchId}
        currency={currency}
        selectedGiftCard={selectedGiftCard}
        onOpenChange={setIsModalOpen}
      />
    </section>
  );
};
