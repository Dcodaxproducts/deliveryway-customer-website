"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { CuisineItemCard } from "@/components/pages/Cuisines/components/CuisineItemCard";
import { getCuisineBadge, getCuisineImage } from "@/components/pages/Cuisines/components/cuisine-display";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerCuisineItems, useCustomerCuisines } from "@/hooks/useCuisines";
import { useDomainContext } from "@/hooks/useDomainContext";
import { useHome } from "@/hooks/useHome";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import { resolveCustomerCurrency } from "@/lib/money";

function CuisineDetailContent({ cuisineId }: { cuisineId: string }) {
  const t = useTranslations("cuisines");
  const { user, restaurantId: authRestaurantId } = useAuth();
  const { context } = useDomainContext();
  const { locale } = useAppLocale();
  const restaurantId = resolveHomeRestaurantId(user, authRestaurantId) || context?.restaurantId || "";
  const branchId = resolveHomeBranchId(user) || context?.branchId || "";
  const cuisinesQuery = useCustomerCuisines({ restaurantId, branchId, locale, limit: 50, enabled: Boolean(restaurantId) });
  const itemsQuery = useCustomerCuisineItems({ cuisineId, restaurantId, branchId, locale, limit: 48, enabled: Boolean(restaurantId && cuisineId) });
  const homeQuery = useHome(restaurantId, branchId, Boolean(restaurantId && branchId));
  const cuisine = cuisinesQuery.data?.cuisines.find((entry) => entry.id === cuisineId) ?? null;
  const items = itemsQuery.data?.items ?? [];
  const currency = resolveCustomerCurrency({
    configCurrency: homeQuery.data?.data.config?.currency,
    restaurant: homeQuery.data?.data.restaurant,
  });

  return (
    <main className="mx-auto mb-20 mt-8 max-w-[1400px] px-4 sm:px-6">
      <Link href="/cuisines" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        <ArrowLeft className="h-4 w-4" />
        {t("backToCuisines")}
      </Link>

      <section className="relative overflow-hidden rounded-[34px] bg-[#111827] p-7 text-white sm:p-10">
        <div className="absolute inset-0 opacity-35">
          <Image
            src={getCuisineImage(cuisine)}
            alt={cuisine?.name || t("title")}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide ring-1 ring-white/20">
            <Sparkles className="h-3.5 w-3.5" />
            {cuisine ? getCuisineBadge(cuisine, t("badges.cuisine")) : t("badges.cuisine")}
          </span>
          <h1 className="mt-5 text-3xl font-black sm:text-5xl">{cuisine?.name || t("title")}</h1>
          <p className="mt-4 text-sm leading-6 text-white/75 sm:text-base">
            {cuisine?.description || t("detailDescription")}
          </p>
        </div>
      </section>

      <div className="mt-9 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t("itemsEyebrow")}</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">{t("itemsTitle")}</h2>
        </div>
        <p className="text-sm font-semibold text-gray-500">{t("itemCount", { count: items.length })}</p>
      </div>

      {itemsQuery.isLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="h-[360px] animate-pulse rounded-[24px] bg-gray-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">
          {t("emptyItems")}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <CuisineItemCard key={String(item.id)} item={item} currency={currency} />
          ))}
        </div>
      )}
    </main>
  );
}

export function CuisineDetailPage({ cuisineId }: { cuisineId: string }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <CuisineDetailContent cuisineId={cuisineId} />
    </Suspense>
  );
}
