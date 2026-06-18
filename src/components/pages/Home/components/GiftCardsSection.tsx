"use client";

import {
  ArrowRight,
  CreditCard,
  Gift,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
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

const giftCardThemes = [
  {
    accent: "from-[#fff1df] via-[#ffe5d3] to-[#ffd9c2]",
    card: "from-[#f74b42] via-[#d91f2b] to-[#9a111d]",
  },
  {
    accent: "from-[#fff5e8] via-[#ffe1cf] to-[#ffd2bb]",
    card: "from-[#ff704d] via-[#df252c] to-[#8b101a]",
  },
  {
    accent: "from-[#fff1e6] via-[#ffe6d8] to-[#ffd8c9]",
    card: "from-[#f9566a] via-[#d72032] to-[#83101b]",
  },
  {
    accent: "from-[#fff6e9] via-[#ffe3ce] to-[#ffcfb7]",
    card: "from-[#ff6958] via-[#dd2538] to-[#951421]",
  },
] as const;

const giftCardImages = [
  "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=640&q=80",
] as const;

const GiftCardTicket = ({
  giftCard,
  currency,
  index,
  onSelect,
}: GiftCardTicketProps) => {
  const t = useTranslations("home.giftCards");
  const theme = giftCardThemes[index % giftCardThemes.length];
  const image = giftCardImages[index % giftCardImages.length];
  const secondaryImage = giftCardImages[(index + 1) % giftCardImages.length];
  const tertiaryImage = giftCardImages[(index + 2) % giftCardImages.length];

  return (
    <button
      type="button"
      className={`group relative h-[258px] w-full cursor-grab overflow-hidden rounded-[30px] bg-gradient-to-br ${theme.accent} p-5 text-left shadow-[0_20px_55px_rgba(126,44,29,0.14)] ring-1 ring-[#f2c9b6] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(126,44,29,0.18)] focus:outline-none focus:ring-2 focus:ring-primary/30 active:cursor-grabbing sm:h-[270px] sm:p-6`}
      onClick={() => onSelect(giftCard)}
    >
      <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/55" />
      <div className="absolute -bottom-16 left-16 h-40 w-40 rounded-full bg-[#fbc7a9]/45 blur-2xl" />

      <div className="relative z-10 flex h-full max-w-[48%] flex-col sm:max-w-[50%]">
        <span className="inline-flex h-8 w-fit items-center gap-1.5 rounded-full bg-white/80 px-3 text-[10px] font-extrabold uppercase text-primary shadow-sm ring-1 ring-white">
          <Sparkles size={12} strokeWidth={2.4} />
          {t("label")}
        </span>

        <h3 className="mt-4 line-clamp-2 text-[19px] font-black leading-[1.05] text-gray-950 sm:text-[23px]">
          {giftCard.title}
        </h3>
        <div className="mt-auto flex flex-col items-start gap-2">
          <span className="inline-flex h-10 items-center whitespace-nowrap rounded-full bg-primary px-3 text-[11px] font-extrabold text-white shadow-lg shadow-primary/20 sm:h-11 sm:px-4 sm:text-[12px]">
            {t("buy")}
          </span>
          <span className="text-[22px] font-black leading-none text-primary sm:text-[24px]">
            {formatAmount(giftCard.amount, currency ?? "USD")}
          </span>
        </div>
      </div>

      <div className="absolute bottom-7 right-5 h-[148px] w-[128px] rotate-[10deg] overflow-hidden rounded-[22px] bg-white p-2 shadow-[0_22px_45px_rgba(91,18,14,0.28)] transition duration-200 group-hover:rotate-[7deg] sm:right-8 sm:h-[162px] sm:w-[142px]">
        <div className={`relative h-full overflow-hidden rounded-[17px] bg-gradient-to-br ${theme.card} p-3 text-white`}>
          <div className="absolute -right-6 -top-5 h-24 w-24 rounded-full bg-white/15" />
          <div className="absolute bottom-3 right-3 h-16 w-16 overflow-hidden rounded-full border-4 border-white/35">
            <Image
              src={image}
              alt=""
              fill
              sizes="72px"
              className="object-cover"
              unoptimized
            />
          </div>
          <p className="relative text-[10px] font-extrabold uppercase text-white/75">
            {t("label")}
          </p>
          <p className="relative mt-1 text-[30px] font-black leading-none">
            {formatAmount(giftCard.amount, currency ?? "USD")}
          </p>
          <Gift className="relative mt-8 text-white/90" size={28} strokeWidth={2.2} />
        </div>
      </div>

      <div className="absolute right-14 top-5 hidden h-[104px] w-[92px] -rotate-[13deg] overflow-hidden rounded-[18px] bg-white p-1.5 shadow-[0_18px_35px_rgba(91,18,14,0.18)] transition duration-200 group-hover:-translate-y-1 sm:block">
        <div className={`relative h-full overflow-hidden rounded-[14px] bg-gradient-to-br ${theme.card}`}>
          <Image
            src={secondaryImage}
            alt=""
            fill
            sizes="92px"
            className="object-cover opacity-70"
            unoptimized
          />
          <div className="absolute inset-0 bg-primary/35" />
          <p className="absolute bottom-3 left-3 text-xl font-black text-white">
            {formatAmount(Math.max(10, Math.round(giftCard.amount / 2)), currency ?? "USD")}
          </p>
        </div>
      </div>

      <div className="absolute right-3 top-9 h-[96px] w-[104px] rotate-[20deg] overflow-hidden rounded-[18px] bg-white p-1.5 shadow-[0_18px_35px_rgba(91,18,14,0.16)] sm:right-5">
        <Image
          src={tertiaryImage}
          alt=""
          fill
          sizes="104px"
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-primary/10" />
      </div>
    </button>
  );
};

function GiftCardIntroTile({ onBuy }: { onBuy: () => void }) {
  const t = useTranslations("home.giftCards");

  return (
    <article className="flex h-[258px] w-full flex-col justify-center rounded-[30px] bg-[#fff7ef] p-6 ring-1 ring-[#f2c9b6] sm:h-[270px]">
      <div className="flex max-w-[290px] flex-1 flex-col justify-center">
        <p className="text-[11px] font-bold uppercase text-primary">
          {t("label")}
        </p>
        <h2 className="mt-2 text-3xl font-black leading-[1.02] text-gray-950 sm:text-[34px]">
          {t("buy")}
        </h2>
        <p className="mt-3 text-sm font-medium leading-6 text-gray-600">
          {t("description")}
        </p>
        <Button
          type="button"
          className="mt-5 h-11 w-fit rounded-full bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
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
      <div className="rounded-[34px] bg-white px-4 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:px-6 sm:py-6">
        {items.length > 0 ? (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
            <div className="lg:w-[320px] lg:shrink-0">
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
                    className="basis-[88%] pl-4 sm:basis-[58%] lg:basis-[38%] xl:basis-[34%]"
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
