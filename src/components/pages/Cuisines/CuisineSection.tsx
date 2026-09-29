"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { CuisineCard } from "@/components/pages/Cuisines/components/CuisineCard";
import { MobileStorefrontRail } from "@/components/pages/Home/components/MobileStorefrontRail";
import { StorefrontSection } from "@/components/pages/Home/components/StorefrontSection";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useAuth } from "@/hooks/useAuth";
import {
  useCustomerCuisines,
  usePromotionalCuisines,
} from "@/hooks/useCuisines";
import { useDomainContext } from "@/hooks/useDomainContext";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import type { CustomerCuisine } from "@/services/cuisines";

const CuisineSkeleton = () => (
  <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,20rem))] gap-5 pb-8">
    {[1, 2, 3, 4].map((item) => (
      <div
        key={item}
        className="h-[340px] min-w-0 animate-pulse rounded-[26px] bg-gray-100"
      />
    ))}
  </div>
);

const mergeCuisines = (
  featured: CustomerCuisine[],
  regular: CustomerCuisine[],
) => {
  const seen = new Set<string>();
  const merged: CustomerCuisine[] = [];

  [...featured, ...regular].forEach((cuisine) => {
    if (seen.has(cuisine.id)) return;
    seen.add(cuisine.id);
    merged.push(cuisine);
  });

  return merged;
};

export function CuisineSection() {
  const t = useTranslations("cuisines.home");
  const { user, restaurantId: authRestaurantId } = useAuth();
  const { context } = useDomainContext();
  const { locale } = useAppLocale();
  const restaurantId = resolveHomeRestaurantId(user, authRestaurantId, context);
  const branchId = resolveHomeBranchId(user, context);
  const params = { restaurantId, branchId, locale, limit: 8 };
  const cuisinesQuery = useCustomerCuisines({
    ...params,
    enabled: Boolean(restaurantId),
  });
  const promotionalQuery = usePromotionalCuisines({
    ...params,
    limit: 4,
    enabled: Boolean(restaurantId),
  });
  const cuisines = mergeCuisines(
    promotionalQuery.data?.cuisines ?? [],
    cuisinesQuery.data?.cuisines ?? [],
  ).slice(0, 8);
  const loading = cuisinesQuery.isLoading || promotionalQuery.isLoading;

  if (!loading && cuisines.length === 0) return null;

  return (
    <StorefrontSection
      id="cuisines"
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      action={
        <Link
          href="/cuisines"
          className="flex items-center gap-1 text-sm font-semibold text-primary"
        >
          {t("viewAll")}
          <ArrowUpRight size={16} />
        </Link>
      }
    >
      {loading ? (
        <>
          <MobileStorefrontRail className="md:hidden" aria-hidden="true">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[340px] animate-pulse rounded-[26px] bg-gray-100"
              />
            ))}
          </MobileStorefrontRail>
          <div className="hidden md:block">
            <CuisineSkeleton />
          </div>
        </>
      ) : (
        <>
          <MobileStorefrontRail className="md:hidden" aria-label={t("title")}>
            {cuisines.map((cuisine) => (
              <div key={cuisine.id} className="flex min-w-0">
                <CuisineCard cuisine={cuisine} />
              </div>
            ))}
          </MobileStorefrontRail>
          <div className="hidden grid-cols-[repeat(auto-fill,minmax(16rem,20rem))] gap-5 pb-8 md:grid">
            {cuisines.map((cuisine) => (
              <div key={cuisine.id} className="flex min-w-0">
                <CuisineCard cuisine={cuisine} />
              </div>
            ))}
          </div>
        </>
      )}

    </StorefrontSection>
  );
}
