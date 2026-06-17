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
  onSelect: (giftCard: GiftCardAvailableItem) => void;
};

const GiftCardTicket = ({
  giftCard,
  currency,
  onSelect,
}: GiftCardTicketProps) => {
  const t = useTranslations("home.giftCards");

  return (
    <button
      type="button"
      className="group flex h-[174px] w-full cursor-grab flex-col rounded-[24px] bg-[#FFF5E8] p-4 text-left shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/30 active:cursor-grabbing sm:h-[184px] sm:p-5"
      onClick={() => onSelect(giftCard)}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8B321B]/70">
            {t("label")}
          </p>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-primary shadow-sm">
            <Gift size={18} />
          </span>
        </div>

        <div className="mt-auto">
          <p className="text-[34px] font-black leading-none tracking-tight text-[#8B321B]">
            {formatAmount(giftCard.amount, currency ?? "USD")}
          </p>
          <h3 className="mt-2 line-clamp-2 text-[15px] font-bold leading-tight text-[#8B321B]">
            {giftCard.title}
          </h3>

          {giftCard.description ? (
            <p className="mt-1.5 line-clamp-2 text-[11px] font-medium leading-4 text-[#8B321B]/70">
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
          <Carousel
            opts={{ align: "start", dragFree: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-4 cursor-grab active:cursor-grabbing">
              <CarouselItem className="basis-[76%] pl-4 sm:basis-[36%] lg:basis-[22%]">
                <GiftCardIntroTile onBuy={() => openPurchaseModal()} />
              </CarouselItem>
              {items.map((giftCard) => (
                <CarouselItem
                  key={giftCard.id}
                  className="basis-[76%] pl-4 sm:basis-[36%] lg:basis-[19.5%]"
                >
                  <GiftCardTicket
                    giftCard={giftCard}
                    currency={currency}
                    onSelect={openPurchaseModal}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
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
