"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  MapPin,
  Search,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/common/BrandLogo";
import { getDealImage } from "@/components/pages/Home/utils/customer-deal-cart";
import { isDealActive } from "@/components/pages/Home/utils/customer-deals-formatters";
import { PromotionalItemsSection } from "@/components/pages/Home/components/PromotionalItemsSection";
import { CustomerDealsSection } from "@/components/pages/Home/components/CustomerDealsSection";
import { Button } from "@/components/ui/button";
import { resolveHttpsImageUrl } from "@/lib/image-fallback";
import type { Branding } from "@/types/branding";
import type { HomeCategory } from "@/types/home";
import type { CustomerDeal } from "@/types/customer-deals";
import type { CheckoutType, MenuItem } from "@/components/pages/Items/types";
import type { CheckoutTypePreference } from "@/lib/checkout-type-preference";

type MobileHomeExperienceProps = {
  restaurantName: string;
  tagline: string;
  heroImage?: string | null;
  branding: Branding;
  branch: { name?: string | null } | null;
  categories: HomeCategory[];
  categoriesLoading: boolean;
  promotionalItems: MenuItem[];
  promotionalItemsLoading: boolean;
  deals: CustomerDeal[];
  dealsLoading?: boolean;
  addingDealId?: string | null;
  branchId?: string | null;
  onAddDeal?: (deal: CustomerDeal, selectedMenuItemIds?: string[]) => void;
  currency?: string | null;
  checkoutType?: CheckoutType;
  availableCheckoutTypes?: CheckoutTypePreference[];
  onCheckoutTypeChange?: (checkoutType: CheckoutTypePreference) => void;
};

const getCategoryImage = (category: HomeCategory) =>
  category.imageUrl && category.imageUrl.startsWith("http")
    ? category.imageUrl
    : "/burger.png";

const getFeaturedDeal = (deals: CustomerDeal[]) =>
  deals.find(isDealActive) ?? deals[0] ?? null;

export function MobileHomeExperience({
  restaurantName,
  tagline,
  heroImage,
  branding,
  branch,
  categories,
  categoriesLoading,
  promotionalItems,
  promotionalItemsLoading,
  deals,
  dealsLoading = false,
  addingDealId = null,
  branchId = null,
  onAddDeal,
  currency,
  checkoutType = "delivery",
  availableCheckoutTypes = ["delivery", "pickup"],
  onCheckoutTypeChange,
}: MobileHomeExperienceProps) {
  const router = useRouter();
  const t = useTranslations("home.mobile");
  const heroT = useTranslations("home.hero");
  const [selectedCheckoutType, setSelectedCheckoutType] =
    useState<CheckoutTypePreference>(checkoutType);

  useEffect(() => {
    setSelectedCheckoutType(checkoutType);
  }, [checkoutType]);
  const activeDeals = deals.filter(isDealActive).slice(0, 8);
  const featuredDeal = getFeaturedDeal(deals);
  const featuredImage = featuredDeal ? getDealImage(featuredDeal) : null;
  const bannerImage = resolveHttpsImageUrl(
    featuredImage || heroImage || branding.assets.bannerImage,
    "/burger.png",
  );
  const branchLabel = branch?.name || restaurantName;
  const visibleCategories = categories.slice(0, 10);
  return (
    <div className="min-h-screen bg-[#f7f3ef] pb-8 md:hidden">
      <section className="relative overflow-hidden rounded-b-[34px] bg-primary px-5 pb-8 pt-5 text-white shadow-[0_18px_45px_rgba(206,24,27,0.24)]">
        <div className="absolute -right-14 top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -left-20 bottom-0 h-44 w-44 rounded-full bg-black/10" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              {t("deliverTo")}
            </p>
            <div className="mt-1 flex max-w-[250px] items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <p className="truncate text-sm font-bold">{branchLabel}</p>
            </div>
          </div>

          <Link
            href="/notifications"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20"
            aria-label={t("notifications")}
          >
            <Bell className="h-5 w-5" />
          </Link>
        </div>

        <div className="relative z-10 mt-6 flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm">
            <BrandLogo
              restaurantLogoUrl={branding.logo.light || branding.logo.default}
              alt={t("restaurantLogo", { restaurant: restaurantName })}
              fill
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-white/80">
              {t("whatWouldYouLike")}
            </p>
            <h1 className="mt-1 line-clamp-2 max-w-[300px] text-[30px] font-black leading-[1.08]">
              {restaurantName}
            </h1>
          </div>
        </div>

      </section>

      <section
        className="sticky z-40 border-b border-black/5 bg-[#f7f3ef]/95 px-4 pb-3 pt-3 shadow-[0_8px_22px_rgba(31,23,18,0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#f7f3ef]/88"
        style={{ top: "var(--storefront-sticky-offset, 64px)" }}
        aria-label={heroT("orderPanelTitle")}
      >
        <button
          type="button"
          onClick={() => router.push("/items")}
          className="flex h-12 w-full items-center gap-3 rounded-2xl border border-black/[0.04] bg-white px-4 text-left text-sm font-semibold text-gray-500 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate">{t("searchPlaceholder")}</span>
        </button>

        {availableCheckoutTypes.length > 0 ? (
          <div
            className="mt-2 grid gap-1 rounded-2xl bg-primary/[0.07] p-1"
            style={{
              gridTemplateColumns: `repeat(${availableCheckoutTypes.length}, minmax(0, 1fr))`,
            }}
          >
            {availableCheckoutTypes.map((option) => {
              const isSelected = selectedCheckoutType === option;
              const Icon = option === "delivery" ? Truck : ShoppingBag;

              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedCheckoutType(option);
                    onCheckoutTypeChange?.(option);
                  }}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none ${
                    isSelected
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-600 hover:bg-white/60"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {option === "delivery"
                    ? heroT("deliveryPanelTitle")
                    : heroT("pickupPanelTitle")}
                </button>
              );
            })}
          </div>
        ) : null}

        {categoriesLoading ? (
          <div className="storefront-rail mt-2" aria-hidden="true">
            {[1, 2, 3].map((item) => (
              <span key={item} className="h-10 min-w-[118px] animate-pulse rounded-full bg-white" />
            ))}
          </div>
        ) : visibleCategories.length > 0 ? (
          <div
            className="storefront-rail mt-2"
            aria-label={t("categories")}
          >
            {visibleCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => router.push(`/items?categoryId=${category.id}`)}
                className="storefront-category-chip"
              >
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/10">
                  <Image
                    src={getCategoryImage(category)}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                    unoptimized
                  />
                </span>
                <span className="truncate">{category.name}</span>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <main className="space-y-8 px-4 pt-4">
        <section className="relative z-10 overflow-hidden rounded-[28px] bg-[#2b1714] p-5 text-white shadow-[0_18px_45px_rgba(31,23,18,0.18)]">
          <div className="relative z-10 max-w-[60%]">
            <span className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
              {t("todayOnly")}
            </span>
            <h2 className="mt-4 text-[23px] font-black leading-[1.08]">
              {featuredDeal?.title || t("featuredTitleFallback")}
            </h2>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/70">
              {featuredDeal?.description ||
                tagline ||
                t("featuredSubtitleFallback")}
            </p>
            <Button
              type="button"
              variant="primary"
              className="mt-5 h-10 rounded-full bg-white px-5 text-primary hover:bg-white/90"
              onClick={() => router.push("/items")}
            >
              {t("orderNow")}
            </Button>
          </div>

          <div className="absolute -right-6 bottom-2 h-[150px] w-[150px] overflow-hidden rounded-full border-[10px] border-white/10 bg-white/10">
            <Image
              src={bannerImage}
              alt={featuredDeal?.title || t("featuredTitleFallback")}
              fill
              className="object-cover"
              sizes="150px"
              unoptimized
            />
          </div>
        </section>

        <PromotionalItemsSection
          items={promotionalItems}
          isLoading={promotionalItemsLoading}
          currency={currency}
          compact
          checkoutType={selectedCheckoutType}
        />

        <CustomerDealsSection
          deals={deals}
          isLoading={dealsLoading}
          addingDealId={addingDealId}
          branchId={branchId}
          onAddDeal={onAddDeal}
          compact
          currency={currency}
        />

        {activeDeals.length === 0 &&
        promotionalItems.length === 0 &&
        !promotionalItemsLoading ? (
          <section>
            <div className="rounded-[28px] bg-white p-6 text-center shadow-[0_16px_34px_rgba(31,41,55,0.07)]">
              <h3 className="text-base font-black text-gray-950">
                {t("browseMenu")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {t("recommendationsEmpty")}
              </p>
              <Button
                type="button"
                variant="primary"
                className="mt-5 h-11 rounded-full px-6"
                onClick={() => router.push("/items")}
              >
                {t("exploreFood")}
              </Button>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
