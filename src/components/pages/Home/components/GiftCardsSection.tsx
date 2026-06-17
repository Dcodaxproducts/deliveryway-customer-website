"use client";

import Image from "next/image";
import {
  ArrowRight,
  CreditCard,
  Gift,
} from "lucide-react";
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

type GiftCardVisualStyle = {
  cardClass: string;
  textClass: string;
  mutedClass: string;
  buttonClass: string;
  illustration: "cupcake" | "burger" | "icecream" | "gift";
};

const giftCardVisualStyles: GiftCardVisualStyle[] = [
  {
    cardClass: "bg-[#F4C568]",
    textClass: "text-[#8B321B]",
    mutedClass: "text-[#8B321B]/70",
    buttonClass: "bg-[#8B321B] text-white hover:bg-[#6F2715]",
    illustration: "cupcake",
  },
  {
    cardClass: "bg-[#F47D3D]",
    textClass: "text-white",
    mutedClass: "text-white/78",
    buttonClass: "bg-white text-[#E55322] hover:bg-white/90",
    illustration: "burger",
  },
  {
    cardClass: "bg-[#F3D979]",
    textClass: "text-[#70401E]",
    mutedClass: "text-[#70401E]/70",
    buttonClass: "bg-[#70401E] text-white hover:bg-[#5A3218]",
    illustration: "icecream",
  },
  {
    cardClass: "bg-[#D81F2A]",
    textClass: "text-white",
    mutedClass: "text-white/76",
    buttonClass: "bg-white text-[#D81F2A] hover:bg-white/90",
    illustration: "gift",
  },
];

type GiftCardTicketProps = {
  giftCard: GiftCardAvailableItem;
  currency?: string | null;
  index: number;
  onSelect: (giftCard: GiftCardAvailableItem) => void;
};

function GiftCardIllustration({
  giftCard,
  style,
}: {
  giftCard: GiftCardAvailableItem;
  style: GiftCardVisualStyle;
}) {
  if (giftCard.imageUrl) {
    return (
      <div className="absolute -right-5 bottom-0 h-[138px] w-[138px] overflow-hidden rounded-full bg-white/30 sm:h-[152px] sm:w-[152px]">
        <Image
          src={giftCard.imageUrl}
          alt={giftCard.title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  if (style.illustration === "cupcake") {
    return (
      <div className="absolute -right-3 bottom-0 h-[150px] w-[150px] sm:h-[164px] sm:w-[164px]">
        <div className="absolute bottom-5 right-5 h-[94px] w-[104px] rounded-full bg-[#F9F1D5] shadow-[0_18px_35px_rgba(108,55,22,0.18)]" />
        <div className="absolute bottom-[74px] right-[47px] h-12 w-12 rounded-full bg-[#F9FBF2]" />
        <div className="absolute bottom-[58px] right-[76px] h-12 w-12 rounded-full bg-[#FFF8E8]" />
        <div className="absolute bottom-[52px] right-[32px] h-12 w-12 rounded-full bg-[#FFFDF1]" />
        <div className="absolute bottom-[32px] right-[46px] h-12 w-16 rounded-b-[18px] rounded-t-[8px] bg-[#D35F45]" />
        <div className="absolute bottom-[33px] right-[57px] h-12 w-[3px] bg-white/35" />
        <div className="absolute bottom-[33px] right-[74px] h-12 w-[3px] bg-white/35" />
        <div className="absolute bottom-[104px] right-[68px] h-3 w-3 rounded-full bg-[#D51F2C]" />
      </div>
    );
  }

  if (style.illustration === "burger") {
    return (
      <div className="absolute -right-5 bottom-1 h-[150px] w-[166px] sm:h-[164px] sm:w-[178px]">
        <div className="absolute bottom-[70px] right-3 h-14 w-[132px] rounded-t-full bg-[#F7B34B] shadow-[0_16px_34px_rgba(115,38,14,0.18)]" />
        <div className="absolute bottom-[67px] right-10 h-1.5 w-1.5 rounded-full bg-white" />
        <div className="absolute bottom-[80px] right-20 h-1.5 w-1.5 rounded-full bg-white" />
        <div className="absolute bottom-[61px] right-5 h-4 w-[124px] rounded-full bg-[#65A845]" />
        <div className="absolute bottom-[49px] right-2 h-6 w-[132px] rounded-full bg-[#7B351A]" />
        <div className="absolute bottom-[42px] right-6 h-4 w-[118px] rounded-full bg-[#F7D357]" />
        <div className="absolute bottom-[28px] right-5 h-7 w-[128px] rounded-b-[28px] bg-[#D9893A]" />
      </div>
    );
  }

  if (style.illustration === "icecream") {
    return (
      <div className="absolute -right-2 bottom-0 h-[150px] w-[150px] sm:h-[164px] sm:w-[164px]">
        <div className="absolute bottom-[38px] right-[48px] h-[74px] w-[58px] rotate-[-8deg] rounded-b-[28px] rounded-t-[18px] bg-[#F6E5C1] shadow-[0_18px_34px_rgba(97,63,29,0.16)]" />
        <div className="absolute bottom-[88px] right-[43px] h-[48px] w-[68px] rounded-full bg-[#EE4C57]" />
        <div className="absolute bottom-[108px] right-[61px] h-[38px] w-[42px] rounded-full bg-[#FFF5D1]" />
        <div className="absolute bottom-[72px] right-[32px] h-[42px] w-[44px] rounded-full bg-[#68B06A]" />
        <div className="absolute bottom-[29px] right-[60px] h-16 w-[32px] rotate-[-8deg] rounded-b-[18px] bg-[#C98944]" />
        <div className="absolute bottom-[30px] right-[68px] h-14 w-[2px] rotate-[18deg] bg-[#A96E35]/55" />
        <div className="absolute bottom-[30px] right-[78px] h-14 w-[2px] rotate-[18deg] bg-[#A96E35]/55" />
      </div>
    );
  }

  if (style.illustration === "gift") {
    return (
      <div className="absolute -right-2 bottom-0 h-[150px] w-[150px] sm:h-[164px] sm:w-[164px]">
        <div className="absolute bottom-5 right-5 h-[86px] w-[96px] rotate-[-6deg] rounded-[22px] bg-white shadow-[0_20px_38px_rgba(78,7,12,0.28)]">
          <div className="absolute left-1/2 top-0 h-full w-4 -translate-x-1/2 bg-[#FFBE32]" />
          <div className="absolute left-0 top-8 h-4 w-full bg-[#FFBE32]" />
        </div>
        <div className="absolute bottom-[107px] right-[32px] h-8 w-16 rounded-t-full border-[9px] border-white border-b-0" />
        <div className="absolute bottom-[107px] right-[82px] h-8 w-16 rounded-t-full border-[9px] border-white border-b-0" />
      </div>
    );
  }

  return null;
}

const GiftCardTicket = ({
  giftCard,
  currency,
  index,
  onSelect,
}: GiftCardTicketProps) => {
  const t = useTranslations("home.giftCards");
  const style = giftCardVisualStyles[index % giftCardVisualStyles.length];

  return (
    <article className={`group relative h-[182px] min-w-[232px] overflow-hidden rounded-[26px] ${style.cardClass} p-4 text-left shadow-[0_18px_42px_rgba(15,23,42,0.10)] transition duration-200 hover:-translate-y-0.5 sm:h-[196px] sm:min-w-[268px] sm:p-5`}>
      <div className="absolute -left-10 -top-12 h-28 w-28 rounded-full bg-white/22 blur-xl" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />
      <GiftCardIllustration giftCard={giftCard} style={style} />

      <div className="relative z-10 flex h-full max-w-[62%] flex-col">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${style.mutedClass}`}>
            {t("label")}
          </p>
          <p className={`mt-3 text-[34px] font-black leading-none tracking-tight ${style.textClass}`}>
            {formatAmount(giftCard.amount, currency ?? "USD")}
          </p>
          <h3 className={`mt-2 line-clamp-2 text-[15px] font-bold leading-tight ${style.textClass}`}>
            {giftCard.title}
          </h3>
        </div>

        {giftCard.description ? (
          <p className={`mt-1.5 line-clamp-2 text-[11px] font-medium leading-4 ${style.mutedClass}`}>
            {giftCard.description}
          </p>
        ) : null}

        <Button
          type="button"
          className={`mt-auto h-9 w-fit rounded-full px-4 text-xs font-bold shadow-lg shadow-black/10 ${style.buttonClass}`}
          onClick={() => onSelect(giftCard)}
        >
          {t("buy")}
          <ArrowRight size={14} />
        </Button>
      </div>
    </article>
  );
};

function GiftCardIntroTile({ onBuy }: { onBuy: () => void }) {
  const t = useTranslations("home.giftCards");

  return (
    <article className="relative flex h-[182px] min-w-[258px] overflow-hidden rounded-[26px] bg-[#FFF5E8] p-5 shadow-[0_18px_42px_rgba(15,23,42,0.08)] sm:h-[196px] sm:min-w-[304px] sm:p-6">
      <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[#F7C05E]/45 blur-2xl" />
      <div className="absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative z-10 flex max-w-[230px] flex-col">
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
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:gap-5 sm:px-6 [&::-webkit-scrollbar]:hidden">
            <GiftCardIntroTile onBuy={() => openPurchaseModal()} />
            {items.map((giftCard, index) => (
              <GiftCardTicket
                key={giftCard.id}
                giftCard={giftCard}
                currency={currency}
                index={index}
                onSelect={openPurchaseModal}
              />
            ))}
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
