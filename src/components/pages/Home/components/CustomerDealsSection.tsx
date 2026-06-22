"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { BadgePercent } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { DealChooserDrawer } from "@/components/pages/Home/components/deals/DealChooserDrawer";
import {
  getDealImage,
  getDealActionLabel,
  getDealRequirementText,
  getDealTypeLabel,
  getDealActionKind,
  getDealScopedItemIdsForDetails,
  getDealScopedItemCustomizationState,
  isFixedItemDeal,
  isFlexibleAllItemsDeal,
  isFlexibleCategoryDeal,
  isFlexibleItemDeal,
  mergeDealScopedItemDetails,
} from "@/components/pages/Home/utils/customer-deal-cart";
import {
  formatDealPrice,
  getDealItemNames,
  isDealActive,
} from "@/components/pages/Home/utils/customer-deals-formatters";
import { useDealScopedItemsDetails } from "@/hooks/useDealScopedItemsDetails";
import type { CustomerDeal } from "@/types/customer-deals";

type CustomerDealsSectionProps = {
  deals: CustomerDeal[];
  isLoading?: boolean;
  addingDealId?: string | null;
  branchId?: string | null;
  onAddDeal?: (deal: CustomerDeal, selectedMenuItemIds?: string[]) => void;
  compact?: boolean;
};

const CustomerDealsSkeleton = ({ compact = false }: { compact?: boolean }) => (
  <div className={compact ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3" : "flex gap-5 overflow-hidden"}>
    {[1, 2, 3, 4].map((item) => (
      <div
        key={item}
        className={
          compact
            ? "h-[170px] animate-pulse rounded-[16px] bg-gray-100"
            : "h-[250px] min-w-[280px] animate-pulse rounded-[22px] bg-gray-100 sm:min-w-[320px]"
        }
      />
    ))}
  </div>
);

const fallbackDealImages = [
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=640&q=80",
] as const;

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getDealCategoryRuleHighlights = (deal: CustomerDeal) => {
  const categoryNamesById = new Map(
    deal.scopeCategories.map((category) => [category.id, category.name])
  );

  return (deal.scopeCategoryRules ?? [])
    .map((rule) => ({
      id: rule.menuCategoryId,
      count: rule.itemLimit,
      name: categoryNamesById.get(rule.menuCategoryId) || "Category",
    }))
    .filter(({ id, count }) => id && count > 0);
};

const getDealNameChips = (names: string) =>
  names
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 3);

const getDealHighlights = (deal: CustomerDeal, itemNames: string, categoryNames: string) => {
  const categoryRules = getDealCategoryRuleHighlights(deal);
  const chips = getDealNameChips(itemNames || categoryNames);

  if (isFlexibleCategoryDeal(deal) && categoryRules.length > 0) {
    return categoryRules
      .map((rule) => `${rule.count} ${rule.name}`)
      .slice(0, 3);
  }

  return chips;
};

const getDealImageForCard = (deal: CustomerDeal, index: number) => {
  const image = getDealImage(deal);

  return image || fallbackDealImages[index % fallbackDealImages.length];
};

const getComparableDealPrice = (deal: CustomerDeal) => {
  const scopedTotal = deal.scopeMenuItems.reduce(
    (total, item) => total + toNumber(item.basePrice),
    0
  );

  return scopedTotal > deal.discountValue ? formatDealPrice(scopedTotal) : "";
};

const CustomerDealCard = ({
  deal,
  index,
  isAdding,
  onAddDeal,
}: {
  deal: CustomerDeal;
  index: number;
  isAdding: boolean;
  onAddDeal?: (deal: CustomerDeal, selectedMenuItemIds?: string[]) => void;
}) => {
  const t = useTranslations("home.deals");
  const image = getDealImageForCard(deal, index);
  const itemNames = getDealItemNames(deal.scopeMenuItems);
  const categoryNames = getDealItemNames(deal.scopeCategories);
  const actionLabel = getDealActionLabel(deal);
  const highlights = getDealHighlights(deal, itemNames, categoryNames);
  const comparablePrice = getComparableDealPrice(deal);
  const hasDealItems = isFlexibleCategoryDeal(deal)
    ? deal.scopeCategories.length > 0
    : isFlexibleAllItemsDeal(deal) || deal.scopeMenuItems.length > 0;
  const handleAddDeal = useCallback(() => {
    onAddDeal?.(deal);
  }, [deal, onAddDeal]);
  const translatedActionLabel =
    actionLabel === "Browse Items"
      ? t("browseItems")
      : actionLabel === "Choose Items"
        ? t("chooseItems")
        : t("addDeal");

  return (
    <article className="relative flex h-full min-h-[300px] min-w-0 flex-col overflow-hidden rounded-[18px] border border-gray-100 bg-white p-5 shadow-[0_12px_34px_rgba(17,24,39,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(17,24,39,0.12)]">
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_112px] gap-4 sm:grid-cols-[minmax(0,1fr)_132px]">
        <div className="flex min-w-0 flex-1 flex-col">
          {index === 0 ? (
            <span className="mb-3 w-fit max-w-full rounded-full bg-[#FFB23F] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
              {t("bestSeller")}
            </span>
          ) : null}

          <h3 className="line-clamp-2 break-words text-[17px] font-extrabold leading-[1.25] text-gray-950">
            {deal.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[22px] font-black leading-tight text-primary">
              {formatDealPrice(deal.discountValue)}
            </span>
            {comparablePrice ? (
              <span className="text-xs font-semibold text-gray-400 line-through">
                {comparablePrice}
              </span>
            ) : null}
          </div>

          <p className="mt-2 line-clamp-2 break-words text-[12px] font-bold leading-5 text-gray-500">
            {getDealRequirementText(deal) || getDealTypeLabel(deal)}
          </p>

          <ul className="mt-3 space-y-1.5 text-[13px] font-medium leading-5 text-gray-700">
            {(highlights.length > 0 ? highlights : [getDealTypeLabel(deal)])
              .slice(0, 3)
              .map((highlight) => (
                <li key={highlight} className="flex min-w-0 items-start gap-2">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-gray-700" />
                  <span className="line-clamp-2 min-w-0 break-words">{highlight}</span>
                </li>
              ))}
          </ul>
        </div>

        <div className="relative mt-2 h-[124px] w-full self-center sm:h-[138px]">
          <div className="absolute inset-x-3 bottom-1 h-8 rounded-full bg-black/20 blur-xl" />
          {image ? (
            <Image
              src={image}
              alt={deal.title}
              fill
              sizes="(max-width: 640px) 112px, 132px"
              className="object-contain drop-shadow-[0_18px_18px_rgba(17,24,39,0.22)]"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-full bg-primary/10 text-primary">
              <BadgePercent size={42} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-5">
        <p
          className={`mb-2 min-h-4 text-xs font-semibold ${
            hasDealItems ? "invisible" : "text-red-500"
          }`}
          aria-hidden={hasDealItems}
        >
          {hasDealItems ? "" : t("noAvailableItems")}
        </p>

        <Button
          variant="default"
          className="h-12 w-full rounded-[10px] bg-primary px-3 text-base font-bold text-white shadow-md shadow-primary/20 hover:bg-primary/90"
          disabled={!hasDealItems || isAdding}
          onClick={handleAddDeal}
        >
          {isAdding ? t("adding") : translatedActionLabel}
        </Button>
      </div>
    </article>
  );
};

const CustomerDealMenuCard = ({
  deal,
  index,
  isAdding,
  onAddDeal,
}: {
  deal: CustomerDeal;
  index: number;
  isAdding: boolean;
  onAddDeal?: (deal: CustomerDeal, selectedMenuItemIds?: string[]) => void;
}) => {
  const t = useTranslations("home.deals");
  const image = getDealImageForCard(deal, index);
  const itemNames = getDealItemNames(deal.scopeMenuItems);
  const categoryNames = getDealItemNames(deal.scopeCategories);
  const actionLabel = getDealActionLabel(deal);
  const highlights = getDealHighlights(deal, itemNames, categoryNames);
  const hasDealItems = isFlexibleCategoryDeal(deal)
    ? deal.scopeCategories.length > 0
    : isFlexibleAllItemsDeal(deal) || deal.scopeMenuItems.length > 0;
  const handleAddDeal = useCallback(() => {
    onAddDeal?.(deal);
  }, [deal, onAddDeal]);
  const translatedActionLabel =
    actionLabel === "Browse Items"
      ? t("browseItems")
      : actionLabel === "Choose Items"
        ? t("chooseItems")
        : t("addDeal");

  return (
    <article className="group grid min-h-[176px] min-w-0 grid-cols-[104px_minmax(0,1fr)] gap-3 overflow-hidden rounded-[16px] border border-gray-100 bg-white p-3 shadow-[0_10px_28px_rgba(17,24,39,0.07)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_34px_rgba(17,24,39,0.11)] sm:grid-cols-[124px_minmax(0,1fr)]">
      <div className="relative min-h-[148px] overflow-hidden rounded-[12px] bg-gray-50">
        <div className="absolute inset-x-4 bottom-2 h-8 rounded-full bg-black/10 blur-xl" />
        {image ? (
          <Image
            src={image}
            alt={deal.title}
            fill
            sizes="(max-width: 640px) 104px, 124px"
            className="object-contain p-2 transition duration-200 group-hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-primary">
            <BadgePercent size={34} />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <h3 className="line-clamp-2 min-w-0 break-words text-[15px] font-extrabold leading-[1.25] text-gray-950">
            {deal.title}
          </h3>
          {index === 0 ? (
            <span className="shrink-0 rounded-full bg-[#FFB23F]/15 px-2 py-1 text-[10px] font-black uppercase text-[#B96300]">
              {t("bestSeller")}
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[22px] font-black leading-none text-primary">
            {formatDealPrice(deal.discountValue)}
          </span>
          <span className="rounded-full bg-primary/8 px-2 py-1 text-[11px] font-bold text-primary">
            {getDealTypeLabel(deal)}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 min-h-10 break-words text-[12px] font-semibold leading-5 text-gray-500">
          {getDealRequirementText(deal) || getDealTypeLabel(deal)}
        </p>

        <div className="mt-2 flex min-h-7 flex-wrap gap-1.5 overflow-hidden">
          {(highlights.length > 0 ? highlights : [getDealTypeLabel(deal)])
            .slice(0, 2)
            .map((highlight) => (
              <span
                key={highlight}
                className="max-w-full truncate rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700"
              >
                {highlight}
              </span>
            ))}
        </div>

        <div className="mt-auto pt-3">
          {!hasDealItems ? (
            <p className="mb-2 text-xs font-semibold text-red-500">
              {t("noAvailableItems")}
            </p>
          ) : null}
          <Button
            variant="default"
            className="h-10 w-full rounded-[10px] bg-primary px-3 text-sm font-bold text-white shadow-sm shadow-primary/20 hover:bg-primary/90"
            disabled={!hasDealItems || isAdding}
            onClick={handleAddDeal}
          >
            {isAdding ? t("adding") : translatedActionLabel}
          </Button>
        </div>
      </div>
    </article>
  );
};

export const CustomerDealsSection = ({
  deals,
  isLoading = false,
  addingDealId = null,
  branchId = null,
  onAddDeal,
  compact = false,
}: CustomerDealsSectionProps) => {
  const t = useTranslations("home.deals");
  const activeDeals = deals.filter(isDealActive).slice(0, 6);
  const sectionClassName = compact
    ? "mb-8 min-w-0"
    : "mx-auto max-w-[1400px] px-4 pb-[30px] pt-[30px] sm:px-6 sm:pb-[60px] sm:pt-[60px]";
  const headingClassName = compact
    ? "text-xl font-semibold text-gray-900"
    : "text-2xl font-extrabold text-gray-950";
  const [selectedChooserDeal, setSelectedChooserDeal] = useState<CustomerDeal | null>(null);
  const [pendingDeal, setPendingDeal] = useState<CustomerDeal | null>(null);
  const pendingDetailItemIds = useMemo(
    () => (pendingDeal ? getDealScopedItemIdsForDetails(pendingDeal) : []),
    [pendingDeal]
  );
  const scopedDetailsQuery = useDealScopedItemsDetails({
    itemIds: pendingDetailItemIds,
    items: pendingDeal?.scopeMenuItems ?? [],
    enabled: Boolean(pendingDeal && pendingDetailItemIds.length > 0),
  });

  const resolveDealAction = useCallback(
    (deal: CustomerDeal) => {
      if (isFixedItemDeal(deal)) {
        onAddDeal?.(deal);
        return;
      }

      const states = deal.scopeMenuItems.map(getDealScopedItemCustomizationState);

      if (states.includes("UNKNOWN")) {
        toast.warning(t("reviewDealItems"));
        return;
      }

      if (states.includes("REQUIRES_MODIFIERS") || getDealActionKind(deal) === "OPEN_CHOOSER") {
        setSelectedChooserDeal(deal);
        return;
      }

      onAddDeal?.(deal);
    },
    [onAddDeal, setSelectedChooserDeal, t]
  );

  const handleDealClick = useCallback(
    (deal: CustomerDeal) => {
      const detailItemIds = getDealScopedItemIdsForDetails(deal);

      if (detailItemIds.length > 0) {
        setPendingDeal(deal);
        return;
      }

      resolveDealAction(deal);
    },
    [resolveDealAction]
  );

  useEffect(() => {
    if (!pendingDeal || pendingDetailItemIds.length === 0 || scopedDetailsQuery.isLoading) {
      return;
    }

    if (scopedDetailsQuery.isError) {
      setPendingDeal(null);
      toast.warning(t("reviewDealItems"));
      return;
    }

    const missingUnknownItemIds = pendingDetailItemIds.filter((itemId) => {
      if (scopedDetailsQuery.detailsById[itemId]) {
        return false;
      }

      const pendingItem = pendingDeal.scopeMenuItems.find(
        (item) => item.id.trim() === itemId
      );

      return !pendingItem || getDealScopedItemCustomizationState(pendingItem) === "UNKNOWN";
    });

    if (missingUnknownItemIds.length > 0) {
      setPendingDeal(null);
      toast.warning(t("reviewDealItems"));
      return;
    }

    const resolvedDeal = mergeDealScopedItemDetails(
      pendingDeal,
      scopedDetailsQuery.detailsById
    );

    setPendingDeal(null);
    resolveDealAction(resolvedDeal);
  }, [
    pendingDeal,
    pendingDetailItemIds.length,
    resolveDealAction,
    scopedDetailsQuery.detailsById,
    scopedDetailsQuery.isError,
    scopedDetailsQuery.isLoading,
    t,
  ]);

  if (isLoading) {
    return (
      <section className={sectionClassName}>
        <CustomerDealsSkeleton compact={compact} />
      </section>
    );
  }

  if (activeDeals.length === 0) {
    return null;
  }

  const chooserDrawer = (
    <DealChooserDrawer
      deal={selectedChooserDeal}
      open={Boolean(selectedChooserDeal)}
      branchId={branchId}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedChooserDeal(null);
        }
      }}
    />
  );

  if (compact) {
    return (
      <section className={sectionClassName}>
        <div className="rounded-[18px] border border-gray-100 bg-gradient-to-br from-white via-[#fffafa] to-white p-3 shadow-[0_10px_30px_rgba(17,24,39,0.05)] sm:p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BadgePercent size={18} />
              </span>
              <h3 className={headingClassName}>
                {t("available")}
              </h3>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
            {activeDeals.map((deal, index) => (
              <CustomerDealMenuCard
                key={deal.id}
                deal={deal}
                index={index}
                isAdding={addingDealId === deal.id || pendingDeal?.id === deal.id}
                onAddDeal={handleDealClick}
              />
            ))}
          </div>
        </div>

        {chooserDrawer}
      </section>
    );
  }

  return (
    <section className={sectionClassName}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h3 className={headingClassName}>
            {t("available")}
          </h3>
        </div>
      </div>

      <Carousel
        opts={{ align: "start", dragFree: true }}
        className="min-w-0"
      >
        <CarouselContent className="-ml-5 cursor-grab active:cursor-grabbing">
          {activeDeals.map((deal, index) => (
            <CarouselItem
              key={deal.id}
              className="flex basis-[92%] pl-5 sm:basis-[62%] md:basis-[48%] xl:basis-1/3 2xl:basis-1/4"
            >
              <CustomerDealCard
                deal={deal}
                index={index}
                isAdding={addingDealId === deal.id || pendingDeal?.id === deal.id}
                onAddDeal={handleDealClick}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {chooserDrawer}
    </section>
  );
};
