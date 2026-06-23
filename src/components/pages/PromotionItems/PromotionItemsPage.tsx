"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo } from "react";
import { ArrowLeft, BadgePercent, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { RestaurantCard } from "@/components/pages/Items/components/RestaurantCard";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useAuth } from "@/hooks/useAuth";
import { useHome } from "@/hooks/useHome";
import { useHomePromotionalItems, useHomePromotions } from "@/hooks/useHomeCategories";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import { formatMoney, resolveCustomerCurrency } from "@/lib/money";
import type { MenuItem, PromotionInfo } from "@/components/pages/Items/types";
import type { PromotionCampaign } from "@/types/home";

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatDiscount = (
  promotion: PromotionCampaign,
  fallbackLabel: string,
  currency?: string | null,
) => {
  const value = toNumber(promotion.discountValue, 0);

  if (promotion.discountType === "PERCENTAGE" && value > 0) {
    return `${value}% OFF`;
  }

  if (promotion.discountType === "FLAT" && value > 0) {
    return `${formatMoney(value, currency)} OFF`;
  }

  return fallbackLabel;
};

const getPromotionIds = (promotion?: PromotionInfo | null) =>
  [promotion?.promotionId, promotion?.id]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

const getPromotionMenuItems = ({
  promotion,
  promotionId,
  promotionalItems,
}: {
  promotion?: PromotionCampaign;
  promotionId: string;
  promotionalItems: MenuItem[];
}) => {
  const scopedIds = new Set(
    (promotion?.scopeMenuItems ?? [])
      .map((item) => String(item?.id || "").trim())
      .filter(Boolean),
  );

  const matchingPromotionalItems = promotionalItems.filter((item) => {
    const ids = [
      ...getPromotionIds(item.promotion),
      ...getPromotionIds(item.happyHour),
    ];

    return ids.includes(promotionId) || scopedIds.has(String(item.id || ""));
  });

  if (matchingPromotionalItems.length > 0) {
    return matchingPromotionalItems;
  }

  return (promotion?.scopeMenuItems ?? []).filter((item): item is MenuItem =>
    Boolean(item?.id),
  );
};

function PromotionItemsPageContent() {
  const t = useTranslations("home.promotions");
  const router = useRouter();
  const searchParams = useSearchParams();
  const promotionId = searchParams.get("promotionId") || "";
  const { locale } = useAppLocale();
  const { token, user, restaurantId: authRestaurantId, loading: authLoading } = useAuth();

  const restaurantId = useMemo(
    () => resolveHomeRestaurantId(user, authRestaurantId),
    [authRestaurantId, user],
  );
  const branchId = useMemo(() => resolveHomeBranchId(user), [user]);

  const promotionsQuery = useHomePromotions(restaurantId, branchId, Boolean(token && promotionId));
  const promotionalItemsQuery = useHomePromotionalItems({
    restaurantId,
    branchId,
    locale,
    limit: 25,
    enabled: Boolean(token && promotionId),
  });
  const homeQuery = useHome(restaurantId, branchId, Boolean(token && restaurantId && branchId));

  const promotion = useMemo(
    () => promotionsQuery.data?.find((entry) => entry.id === promotionId),
    [promotionId, promotionsQuery.data],
  );

  const items = useMemo(
    () =>
      getPromotionMenuItems({
        promotion,
        promotionId,
        promotionalItems: promotionalItemsQuery.data ?? [],
      }),
    [promotion, promotionId, promotionalItemsQuery.data],
  );

  const currency = resolveCustomerCurrency({
    configCurrency: homeQuery.data?.data.config?.currency,
    restaurant: homeQuery.data?.data.restaurant,
  });

  const isLoading =
    authLoading ||
    promotionsQuery.isLoading ||
    promotionalItemsQuery.isLoading;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!promotionId) {
      router.replace("/items");
    }
  }, [promotionId, router]);

  useEffect(() => {
    if (isLoading || !promotion) return;

    if (items.length === 0) {
      const firstCategoryId = promotion.scopeCategories?.[0]?.id;
      router.replace(firstCategoryId ? `/items?categoryId=${firstCategoryId}` : "/items");
    }
  }, [isLoading, items.length, promotion, router]);

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1200px] items-center justify-center px-4">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!promotion || items.length === 0) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-16 text-center sm:px-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BadgePercent size={24} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-950">
          {t("promotionItemsUnavailable")}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          {t("promotionItemsUnavailableDescription")}
        </p>
        <Button asChild className="mt-6 rounded-full bg-primary px-6 text-white hover:bg-primary/90">
          <Link href="/items">{t("exploreMenu")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
      <Button asChild variant="link" className="mb-5 p-0 text-sm font-semibold text-primary">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          {t("backToOffers")}
        </Link>
      </Button>

      <section className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-primary via-primary/90 to-[#111827] px-5 py-7 text-white sm:px-8 sm:py-9">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-white/20">
            <BadgePercent className="h-3.5 w-3.5" />
            {formatDiscount(promotion, t("specialOffer"), currency)}
          </span>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
            {promotion.title || t("specialPromotion")}
          </h1>
          {promotion.description ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
              {promotion.description}
            </p>
          ) : null}
          <p className="mt-4 text-sm font-semibold text-white/85">
            {t("promotionItemsCount", { count: items.length })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <RestaurantCard
              key={String(item.id)}
              item={item}
              currency={currency}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export function PromotionItemsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PromotionItemsPageContent />
    </Suspense>
  );
}
