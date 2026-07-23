"use client";

import Image from "next/image";
import { ArrowLeft, Loader2, UtensilsCrossed } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ItemsCategory } from "@/components/pages/Items/types";
import { getImageUrl } from "@/components/pages/Items/utils/restaurant-card-utils";

type MobileCategoryBrowserProps = {
  categories: ItemsCategory[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onCategorySelect: (categoryId: string) => void;
  onLoadMore: () => void;
};

type MobileCategoryHeroProps = {
  category?: ItemsCategory | null;
  itemCount?: number | null;
  onBack: () => void;
};

type MobileCategoryTabsProps = {
  categories: ItemsCategory[];
  activeCategoryId: string;
  onCategorySelect: (categoryId: string) => void;
};

export function MobileCategoryBrowser({
  categories,
  loading,
  loadingMore,
  hasMore,
  onCategorySelect,
  onLoadMore,
}: MobileCategoryBrowserProps) {
  const t = useTranslations("items.common");
  const tSidebar = useTranslations("items.sidebar");

  return (
    <section className="px-4 pb-8 pt-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-950">
          {t("browseCategories")}
        </h2>
        <p className="mt-1 text-sm leading-5 text-gray-500">
          {t("browseCategoriesDescription")}
        </p>
      </div>

      {loading && categories.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white text-sm text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
          {tSidebar("loadingCategories")}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-400">
          {t("noCategories")}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {categories.map((category) => {
            const id = String(category.id || "");

            if (!id) return null;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onCategorySelect(id)}
                className="group relative min-h-[148px] overflow-hidden rounded-2xl border border-primary/5 bg-[#fff8f6] text-left shadow-[0_8px_24px_rgba(108,28,32,0.05)] transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Image
                  src={getImageUrl(category, null)}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 30vw, 160px"
                  className="object-cover object-center transition duration-300 group-hover:scale-[1.03]"
                  unoptimized
                />
                <span className="absolute inset-0 bg-gradient-to-b from-[#fff8f6] via-[#fff8f6]/95 to-[#fff8f6]/5" />

                <span className="relative z-10 flex h-full min-h-[148px] flex-col p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm ring-1 ring-primary/10">
                    <UtensilsCrossed className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <span className="mt-2 line-clamp-2 text-[13px] font-semibold leading-4 text-gray-950">
                    {category.name || t("category")}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-white text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingMore ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          {loadingMore ? t("loadingMore") : tSidebar("loadMoreCategories")}
        </button>
      ) : null}
    </section>
  );
}

export function MobileCategoryHero({
  category,
  itemCount,
  onBack,
}: MobileCategoryHeroProps) {
  const t = useTranslations("items.common");

  return (
    <section className="px-4 pb-5 pt-5">
      <button
        type="button"
        onClick={onBack}
        aria-label={t("backToCategories")}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <h1 className="mt-5 font-serif text-[38px] leading-[0.95] text-gray-950">
        {category?.name || t("category")}
      </h1>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
        {category?.description || t("categoryDescription")}
      </p>

      <div className="relative mt-5 aspect-[1.55/1] overflow-hidden rounded-3xl bg-gray-100 shadow-sm">
        <Image
          src={getImageUrl(category, null)}
          alt={category?.name || t("category")}
          fill
          sizes="(max-width: 1023px) calc(100vw - 32px), 640px"
          className="object-cover"
          priority
          unoptimized
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {typeof itemCount === "number" ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm backdrop-blur">
            {t("itemCount", { count: itemCount })}
          </span>
        ) : null}
      </div>
    </section>
  );
}

export function MobileCategoryTabs({
  categories,
  activeCategoryId,
  onCategorySelect,
}: MobileCategoryTabsProps) {
  const t = useTranslations("items.common");

  return (
    <nav
      aria-label={t("browseCategories")}
      className="overflow-x-auto px-4 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex w-max min-w-full gap-2">
        {categories.map((category) => {
          const id = String(category.id || "");
          const isActive = id === activeCategoryId;

          if (!id) return null;

          return (
            <button
              key={id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onCategorySelect(id)}
              className={
                isActive
                  ? "h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm"
                  : "h-10 rounded-xl border border-gray-200 bg-white px-5 text-sm font-medium text-gray-500 transition hover:border-primary/30 hover:text-primary"
              }
            >
              {category.name || t("category")}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
