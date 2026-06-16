"use client";

import Image from "next/image";
import { Gift, Mail, Sparkles } from "lucide-react";
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
      <div className="overflow-hidden rounded-[24px] border border-gray-100 bg-[#111827] text-white shadow-xl shadow-primary/10">
        <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex min-h-[360px] flex-col justify-between bg-[radial-gradient(circle_at_top_left,rgba(206,24,27,0.45),transparent_42%),linear-gradient(135deg,#111827,#1f2937)] p-6 sm:p-8">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/80">
                <Gift size={14} />
                {t("label")}
              </p>
              <h2 className="mt-5 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">
                {t("title")}
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/72">
                {t("description")}
              </p>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-white/80 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Sparkles size={16} />
                </span>
                {t("instantCheckout")}
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Mail size={16} />
                </span>
                {t("emailDelivery")}
              </div>
            </div>

            <Button
              type="button"
              className="mt-8 h-11 w-full rounded-xl bg-white text-[#111827] hover:bg-white/90 sm:w-fit"
              onClick={() => openPurchaseModal()}
            >
              {t("customAmount")}
            </Button>
          </div>

          <div className="bg-white p-5 sm:p-6">
            {items.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.slice(0, 6).map((giftCard) => (
                  <article
                    key={giftCard.id}
                    className="flex min-h-[260px] flex-col overflow-hidden rounded-[18px] border border-gray-100 bg-white text-gray-900 shadow-lg shadow-gray-200/60"
                  >
                    <div className="relative h-[116px] bg-primary/10">
                      {giftCard.imageUrl ? (
                        <Image
                          src={giftCard.imageUrl}
                          alt={giftCard.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-primary">
                          <Gift size={38} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
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
                        className="mt-auto h-10 rounded-xl bg-primary text-white hover:bg-primary/90"
                        onClick={() => openPurchaseModal(giftCard)}
                      >
                        {t("buyPreset")}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[18px] border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                <Gift className="text-primary" size={42} />
                <h3 className="mt-4 text-xl font-bold text-gray-900">
                  {t("customOnlyTitle")}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                  {t("customOnlyDescription")}
                </p>
                <Button
                  type="button"
                  className="mt-5 h-10 rounded-xl bg-primary text-white hover:bg-primary/90"
                  onClick={() => openPurchaseModal()}
                >
                  {t("customAmount")}
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
