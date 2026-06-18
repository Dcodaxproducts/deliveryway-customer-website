"use client";

import {
  ArrowRight,
  CreditCard,
  Gift,
  IceCreamBowl,
  PartyPopper,
  Sandwich,
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
  "bg-[radial-gradient(circle_at_88%_12%,rgba(255,255,255,0.32)_0_18%,transparent_19%),linear-gradient(135deg,#ff8a7a_0%,#ef3f32_46%,#a90f17_100%)]",
  "bg-[radial-gradient(circle_at_86%_14%,rgba(255,215,196,0.34)_0_17%,transparent_18%),linear-gradient(135deg,#ff6b57_0%,#d9272c_48%,#7f1017_100%)]",
  "bg-[radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.24)_0_18%,transparent_19%),linear-gradient(135deg,#f45264_0%,#be1726_48%,#5f0d14_100%)]",
  "bg-[radial-gradient(circle_at_88%_12%,rgba(255,226,226,0.38)_0_18%,transparent_19%),linear-gradient(135deg,#ff9a9a_0%,#e3263e_45%,#97101d_100%)]",
] as const;

const giftCardAccentIcons = [Sandwich, PartyPopper, IceCreamBowl, Gift] as const;

const GiftCardTicket = ({
  giftCard,
  currency,
  index,
  onSelect,
}: GiftCardTicketProps) => {
  const t = useTranslations("home.giftCards");
  const background = giftCardBackgrounds[index % giftCardBackgrounds.length];
  const AccentIcon = giftCardAccentIcons[index % giftCardAccentIcons.length];

  return (
    <button
      type="button"
      className={`group relative flex h-[208px] w-full cursor-grab flex-col overflow-hidden rounded-[24px] ${background} p-5 text-left shadow-[0_18px_45px_rgba(169,15,23,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(169,15,23,0.28)] focus:outline-none focus:ring-2 focus:ring-primary/30 active:cursor-grabbing sm:h-[218px] sm:p-5`}
      onClick={() => onSelect(giftCard)}
    >
      <div className="absolute -right-14 -top-16 h-36 w-36 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -bottom-14 left-3 h-28 w-28 rounded-full bg-black/10 blur-xl" />
      <div className="absolute bottom-0 right-0 h-20 w-24 rounded-tl-full bg-black/10" />
      <AccentIcon
        aria-hidden="true"
        className="absolute -right-3 bottom-9 h-24 w-24 rotate-[-12deg] text-white/10 transition duration-200 group-hover:text-white/14"
        strokeWidth={1.6}
      />
      <Gift
        aria-hidden="true"
        className="absolute left-4 top-[58%] h-12 w-12 rotate-12 text-white/8"
        strokeWidth={1.8}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
            {t("label")}
          </p>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-white/35 backdrop-blur">
            <Gift size={18} strokeWidth={2.3} />
          </span>
        </div>

        <div className="mt-5 min-h-0 flex-1 space-y-1.5 sm:mt-6">
          <p className="text-[30px] font-black leading-none tracking-tight text-white sm:text-[32px]">
            {formatAmount(giftCard.amount, currency ?? "USD")}
          </p>
          <h3 className="line-clamp-2 pr-10 text-[14px] font-bold leading-tight text-white sm:text-[15px]">
            {giftCard.title}
          </h3>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="inline-flex h-9 min-w-[118px] items-center justify-center rounded-full bg-white px-4 text-[11px] font-extrabold uppercase tracking-[0.08em] text-primary shadow-sm transition group-hover:bg-white/95 sm:h-10 sm:text-[12px]">
            {t("purchase")}
          </span>
          <span className="h-px flex-1 bg-white/20" />
        </div>
      </div>
    </button>
  );
};

function GiftCardIntroTile({ onBuy }: { onBuy: () => void }) {
  const t = useTranslations("home.giftCards");

  return (
    <article className="flex h-[208px] w-full flex-col bg-transparent p-0 sm:h-[218px]">
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
