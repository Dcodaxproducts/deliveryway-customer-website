"use client";

import Image from "next/image";
import {
  ArrowRight,
  CakeSlice,
  CreditCard,
  Gift,
  Mail,
  Sandwich,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
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
  accent: string;
  background: string;
  button: string;
  illustration: "cupcake" | "burger" | "pasta" | "gift";
  Icon: LucideIcon;
};

const giftCardVisualStyles: GiftCardVisualStyle[] = [
  {
    accent: "text-[#7A3D10]",
    background: "from-[#FFE8C8] via-[#FFC875] to-[#F59D2A]",
    button: "bg-[#7A3D10] text-white hover:bg-[#5F2F0D]",
    illustration: "cupcake",
    Icon: CakeSlice,
  },
  {
    accent: "text-[#843018]",
    background: "from-[#FFD9C8] via-[#FF8F61] to-[#EF4B25]",
    button: "bg-[#843018] text-white hover:bg-[#662412]",
    illustration: "burger",
    Icon: Sandwich,
  },
  {
    accent: "text-[#3C4A1D]",
    background: "from-[#F5E7BC] via-[#D6C174] to-[#8EA64F]",
    button: "bg-[#3C4A1D] text-white hover:bg-[#2B3614]",
    illustration: "pasta",
    Icon: UtensilsCrossed,
  },
  {
    accent: "text-white",
    background: "from-[#EB4D3D] via-[#D93528] to-[#A91216]",
    button: "bg-white text-primary hover:bg-white/90",
    illustration: "gift",
    Icon: Gift,
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
  const Icon = style.Icon;

  if (giftCard.imageUrl) {
    return (
      <div className="absolute bottom-0 right-0 h-[150px] w-[150px] translate-x-5 translate-y-5 overflow-hidden rounded-full bg-white/30 sm:h-[170px] sm:w-[170px]">
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

  if (style.illustration === "gift") {
    return (
      <div className="absolute bottom-0 right-0 h-[150px] w-[150px] translate-x-4 translate-y-6 sm:h-[170px] sm:w-[170px]">
        <div className="absolute bottom-7 right-6 h-[82px] w-[92px] rounded-[20px] bg-white shadow-2xl shadow-black/20">
          <div className="absolute left-1/2 top-0 h-full w-4 -translate-x-1/2 bg-[#FFB703]" />
          <div className="absolute left-0 top-7 h-4 w-full bg-[#FFB703]" />
        </div>
        <div className="absolute bottom-[108px] right-[34px] h-9 w-16 rounded-t-full border-[10px] border-white border-b-0" />
        <div className="absolute bottom-[108px] right-[86px] h-9 w-16 rounded-t-full border-[10px] border-white border-b-0" />
      </div>
    );
  }

  return (
    <div className="absolute bottom-0 right-0 flex h-[150px] w-[150px] translate-x-5 translate-y-6 items-center justify-center rounded-full bg-white/28 text-white shadow-2xl shadow-black/10 sm:h-[170px] sm:w-[170px]">
      <div className="flex h-[108px] w-[108px] items-center justify-center rounded-full bg-white/30 backdrop-blur">
        <Icon size={58} strokeWidth={1.7} />
      </div>
    </div>
  );
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
    <article className={`group relative min-h-[258px] min-w-[260px] overflow-hidden rounded-[28px] bg-gradient-to-br ${style.background} p-5 text-left shadow-[0_18px_55px_rgba(17,24,39,0.12)] transition duration-200 hover:-translate-y-1 sm:min-w-[300px]`}>
      <div className="absolute -left-12 -top-14 h-32 w-32 rounded-full bg-white/25 blur-2xl" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />
      <GiftCardIllustration giftCard={giftCard} style={style} />

      <div className="relative z-10 flex min-h-[218px] max-w-[68%] flex-col">
        <div>
          <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${style.accent} opacity-80`}>
            {t("label")}
          </p>
          <p className={`mt-4 text-[34px] font-black leading-none ${style.accent}`}>
            {formatAmount(giftCard.amount, currency ?? "USD")}
          </p>
          <h3 className={`mt-3 line-clamp-2 text-lg font-extrabold leading-tight ${style.accent}`}>
            {giftCard.title}
          </h3>
        </div>

        {giftCard.description ? (
          <p className={`mt-2 line-clamp-2 text-xs font-medium leading-5 ${style.accent} opacity-80`}>
            {giftCard.description}
          </p>
        ) : null}

        <Button
          type="button"
          className={`mt-auto h-10 w-fit rounded-full px-5 text-sm font-bold shadow-lg shadow-black/10 ${style.button}`}
          onClick={() => onSelect(giftCard)}
        >
          {t("buy")}
          <ArrowRight size={15} />
        </Button>
      </div>
    </article>
  );
};

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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {t("label")}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              {t("buy")}
            </h2>
            <p className="mt-2 max-w-[620px] text-sm leading-6 text-gray-500">
              {t("description")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden items-center gap-3 rounded-full bg-[#FFF4EF] px-4 py-2 text-sm font-semibold text-primary sm:flex">
              <Sparkles size={16} />
              {t("instantCheckout")}
            </div>
            <div className="hidden items-center gap-3 rounded-full bg-[#F8FAFC] px-4 py-2 text-sm font-semibold text-gray-600 lg:flex">
              <Mail size={16} />
              {t("emailDelivery")}
            </div>
            <Button
              type="button"
              className="h-11 rounded-full bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
              onClick={() => openPurchaseModal()}
            >
              {t("buy")}
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:-mx-6 sm:gap-5 sm:px-6 [&::-webkit-scrollbar]:hidden">
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
