"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Copy, TicketPercent, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import type { CustomerCoupon } from "@/types/customer-coupons";

type CouponPerkBannerProps = {
  coupon?: CustomerCoupon | null;
};

const toMoney = (value?: number | null) => {
  if (!value || value <= 0) {
    return "";
  }

  return `$${value}`;
};

const formatDiscount = (coupon: CustomerCoupon) => {
  if (coupon.discountType === "PERCENTAGE") {
    return `${coupon.discountValue}%`;
  }

  if (coupon.discountType === "FLAT") {
    return toMoney(coupon.discountValue);
  }

  return coupon.discountValue > 0 ? toMoney(coupon.discountValue) : "";
};

const formatExpiryDate = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
  });
};

export const CouponPerkBanner = ({ coupon }: CouponPerkBannerProps) => {
  const t = useTranslations("navigation.couponBanner");
  const [isDismissed, setIsDismissed] = useState(false);

  if (!coupon || isDismissed) {
    return null;
  }

  const discount = formatDiscount(coupon);
  const minOrder = toMoney(coupon.minOrderAmount);
  const maxDiscount = toMoney(coupon.maxDiscountAmount);
  const expiryDate = formatExpiryDate(coupon.expiresAt);
  const description = coupon.description?.trim();

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <section className="relative z-40 border-b border-[#F5D8D9] bg-[#FFF7F7] px-4 py-2 shadow-[0_18px_40px_rgba(225,20,45,0.08)]">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 rounded-[22px] border border-[#F4DCDD] bg-white/75 py-3 pl-4 pr-3 shadow-[0_10px_28px_rgba(121,34,42,0.06)] lg:gap-5 lg:pl-8">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1F2] text-primary ring-1 ring-[#F4C9CE]">
          <TicketPercent size={20} />
        </div>

        <div className="min-w-0 flex-1 lg:flex lg:items-center lg:gap-5">
          <div className="min-w-0 lg:min-w-[330px]">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">
              {t("eyebrow")}
            </p>
            <h2 className="mt-0.5 truncate text-base font-black leading-tight text-[#171717] sm:text-xl">
              {coupon.title || (discount ? t("headline", { discount }) : coupon.code)}
            </h2>
          </div>

          <div className="mt-2 hidden h-9 w-px bg-[#F0D5D6] lg:block" />

          <p className="mt-2 min-w-0 truncate text-xs font-semibold text-[#6B7078] lg:mt-0 lg:flex-1">
            {minOrder ? t("minimum", { amount: minOrder }) : description || t("browseOffer")}
            {maxDiscount ? ` · ${t("maxDiscount", { amount: maxDiscount })}` : ""}
            {coupon.maxUsesPerCustomer ? ` · ${t("perCustomer")}` : ""}
          </p>
        </div>

        <div className="hidden items-center overflow-hidden rounded-[18px] border border-dashed border-[#EFA9B1] bg-white p-1.5 lg:flex">
          <span className="px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#A7747B]">
            {t("coupon")}
          </span>
          <span className="px-3 text-lg font-black uppercase tracking-[0.13em] text-primary">
            {coupon.code}
          </span>
          <button
            type="button"
            onClick={() => void handleCopyCode()}
            className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-center text-[11px] font-black uppercase leading-[1.05] text-white transition-colors hover:bg-primary/90"
          >
            <Copy size={14} className="mr-1.5 shrink-0" />
            {t("copyCode")}
          </button>
        </div>

        <button
          type="button"
          onClick={() => void handleCopyCode()}
          className="inline-flex h-10 shrink-0 items-center rounded-xl bg-primary px-3 text-[11px] font-black uppercase text-white lg:hidden"
        >
          {coupon.code}
        </button>

        {expiryDate ? (
          <div className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-[#5F6570] xl:flex">
            <Clock3 size={15} className="text-primary" />
            {t("ends", { date: expiryDate })}
          </div>
        ) : null}

        <Link
          href="/items"
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#171717] text-white shadow-lg shadow-black/20 transition-colors hover:bg-primary md:flex"
          aria-label={t("browse")}
        >
          <ArrowRight size={19} />
        </Link>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#B4A2A4] ring-1 ring-[#F0D8DA] transition-colors hover:text-primary"
          aria-label={t("dismiss")}
        >
          <X size={17} />
        </button>
      </div>
    </section>
  );
};
