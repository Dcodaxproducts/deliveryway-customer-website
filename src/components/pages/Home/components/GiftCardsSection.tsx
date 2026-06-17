"use client";

import {
  ArrowRight,
  CreditCard,
  Gift,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
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

type GiftCardTicketProps = {
  giftCard: GiftCardAvailableItem;
  currency?: string | null;
  index: number;
  onSelect: (giftCard: GiftCardAvailableItem) => void;
};

const giftCardBackgrounds = [
  "bg-[linear-gradient(135deg,rgba(209,188,154,0.98)_0%,rgba(173,134,87,0.95)_100%)]",
  "bg-[linear-gradient(135deg,rgba(123,80,53,0.98)_0%,rgba(71,42,31,0.98)_100%)]",
  "bg-[linear-gradient(135deg,rgba(82,79,76,0.98)_0%,rgba(29,29,31,0.98)_100%)]",
  "bg-[linear-gradient(135deg,rgba(226,92,103,0.98)_0%,rgba(154,38,47,0.98)_100%)]",
] as const;

const GiftCardTicket = ({
  giftCard,
  currency,
  index,
  onSelect,
}: GiftCardTicketProps) => {
  const t = useTranslations("home.giftCards");
  const background = giftCardBackgrounds[index % giftCardBackgrounds.length];

  return (
    <button
      type="button"
      className={`group relative flex h-[174px] w-full cursor-grab flex-col overflow-hidden rounded-[24px] ${background} p-4 text-left transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/30 active:cursor-grabbing sm:h-[184px] sm:p-5`}
      onClick={() => onSelect(giftCard)}
    >
      <div className="absolute inset-x-4 top-3 h-px bg-white/35" />
      <div className="absolute -right-14 -top-16 h-36 w-36 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -bottom-14 left-3 h-28 w-28 rounded-full bg-white/10 blur-xl" />

      <div className="relative z-10 flex h-full flex-col">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
            {t("label")}
          </p>
        </div>

        <div className="mt-auto">
          <p className="text-[34px] font-black leading-none tracking-tight text-white">
            {formatAmount(giftCard.amount, currency ?? "USD")}
          </p>
          <h3 className="mt-2 line-clamp-2 text-[15px] font-bold leading-tight text-white">
            {giftCard.title}
          </h3>

          {giftCard.description ? (
            <p className="mt-1.5 line-clamp-2 text-[11px] font-medium leading-4 text-white/75">
              {giftCard.description}
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
};

function GiftCardIntroTile({ onBuy }: { onBuy: () => void }) {
  const t = useTranslations("home.giftCards");

  return (
    <article className="flex h-[174px] w-full flex-col bg-transparent p-0 sm:h-[184px]">
      <div className="flex max-w-[255px] flex-1 flex-col">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          {t("label")}
        </p>
        <h2 className="mt-2 text-2xl font-black leading-[1.05] tracking-tight text-gray-950 sm:text-[28px]">
          {t("buy")}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm font-medium leading-5 text-gray-600">
          {t("description")}
        </p>
        <Button
          type="button"
          className="mt-auto h-10 w-fit rounded-full bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
          onClick={onBuy}
        >
          {t("buy")}
          <ArrowRight size={15} />
        </Button>
      </div>
    </article>
  );
}

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
      <div className="rounded-[30px] bg-white px-4 py-5 sm:px-6 sm:py-6">
        {items.length > 0 ? (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
            <div className="lg:w-[280px] lg:shrink-0">
              <GiftCardIntroTile onBuy={() => openPurchaseModal()} />
            </div>

            <Carousel
              opts={{ align: "start", dragFree: true }}
              className="min-w-0 flex-1"
            >
              <CarouselContent className="-ml-4 cursor-grab active:cursor-grabbing">
                {items.map((giftCard, index) => (
                  <CarouselItem
                    key={giftCard.id}
                    className="basis-[76%] pl-4 sm:basis-[36%] lg:basis-1/4"
                  >
                    <GiftCardTicket
                      giftCard={giftCard}
                      currency={currency}
                      index={index}
                      onSelect={openPurchaseModal}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        ) : (
          <div className="flex min-h-[258px] flex-col items-center justify-center rounded-[28px] bg-gradient-to-br from-[#EB4D3D] via-[#D93528] to-[#A91216] p-6 text-center text-white">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-primary">
              <Gift size={34} />
            </span>
            <h3 className="mt-4 text-xl font-bold">
              {t("customOnlyTitle")}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
              {t("customOnlyDescription")}
            </p>
            <Button
              type="button"
              className="mt-5 h-10 rounded-full bg-white px-5 text-primary hover:bg-white/90"
              onClick={() => openPurchaseModal()}
            >
              {t("buy")}
              <CreditCard size={15} />
            </Button>
          </div>
        )}
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
