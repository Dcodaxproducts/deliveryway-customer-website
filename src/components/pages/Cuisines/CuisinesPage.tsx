"use client";

import { Suspense, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { CuisineCard } from "@/components/pages/Cuisines/components/CuisineCard";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerCuisines } from "@/hooks/useCuisines";
import { useDomainContext } from "@/hooks/useDomainContext";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";

function CuisinesPageContent() {
  const t = useTranslations("cuisines");
  const { user, restaurantId: authRestaurantId } = useAuth();
  const { context } = useDomainContext();
  const { locale } = useAppLocale();
  const [search, setSearch] = useState("");
  const restaurantId = resolveHomeRestaurantId(user, authRestaurantId) || context?.restaurantId || "";
  const branchId = resolveHomeBranchId(user) || context?.branchId || "";
  const params = useMemo(
    () => ({ restaurantId, branchId, locale, limit: 24, search, sort: "sortOrder" }),
    [branchId, locale, restaurantId, search],
  );
  const cuisinesQuery = useCustomerCuisines({ ...params, enabled: Boolean(restaurantId) });
  const cuisines = cuisinesQuery.data?.cuisines ?? [];

  return (
    <main className="mx-auto mb-20 mt-10 max-w-[1400px] px-4 sm:px-6">
      <div className="rounded-[32px] bg-gradient-to-br from-primary via-primary/90 to-[#111827] p-8 text-white sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/75">{t("eyebrow")}</p>
        <h1 className="mt-3 text-3xl font-black sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">{t("description")}</p>
      </div>

      <div className="mt-8 flex flex-col gap-4 rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900">{t("browseTitle")}</p>
          <p className="text-xs text-gray-500">{t("browseDescription")}</p>
        </div>
        <label className="relative block w-full sm:w-[360px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-11 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:bg-white"
          />
        </label>
      </div>

      {cuisinesQuery.isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="h-[340px] animate-pulse rounded-[26px] bg-gray-100" />
          ))}
        </div>
      ) : cuisines.length === 0 ? (
        <div className="mt-8 rounded-[24px] border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">
          {t("empty")}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cuisines.map((cuisine) => (
            <CuisineCard key={cuisine.id} cuisine={cuisine} />
          ))}
        </div>
      )}
    </main>
  );
}

export function CuisinesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <CuisinesPageContent />
    </Suspense>
  );
}
