"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  canAutoAddDealItem,
  getDealTypeLabel,
  isFixedItemDeal,
  requiresCustomizationForDealItem,
} from "@/components/pages/Home/utils/customer-deal-cart";
import { formatDealPrice } from "@/components/pages/Home/utils/customer-deals-formatters";
import {
  canSubmitDealSelection,
  getDealRequiredSelectionCount,
  useDealEligibleItems,
} from "@/hooks/useDealEligibleItems";
import { useAddDealToCart } from "@/hooks/useCart";
import type { CustomerDeal, CustomerDealMenuItem } from "@/types/customer-deals";

type DealChooserDrawerProps = {
  deal: CustomerDeal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string | null;
};

const getMenuItemInitial = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

const getMenuItemPrice = (item: CustomerDealMenuItem) =>
  item.discountedBasePrice ?? item.basePrice;

const hasMenuItemPrice = (value: CustomerDealMenuItem["basePrice"]) =>
  value !== null && value !== undefined && value !== "";

const getRequirementText = (
  deal: CustomerDeal | null,
  requiredQuantity: number,
  t: ReturnType<typeof useTranslations>
) => {
  if (!deal) {
    return "";
  }

  if (isFixedItemDeal(deal)) {
    return t("fixedRequirement");
  }

  if (deal.scopeCategories.length > 0) {
    return t("categoryRequirement", { count: requiredQuantity });
  }

  return t("flexibleRequirement", { count: requiredQuantity });
};

export function DealChooserDrawer({
  deal,
  open,
  onOpenChange,
  branchId,
}: DealChooserDrawerProps) {
  const t = useTranslations("home.deals");
  const router = useRouter();
  const addDealMutation = useAddDealToCart(branchId);
  const { items, isLoading, error } = useDealEligibleItems({ deal, open });
  const [selectedMenuItemIds, setSelectedMenuItemIds] = useState<string[]>([]);

  const requiredQuantity = getDealRequiredSelectionCount(deal);
  const selectedCount = selectedMenuItemIds.length;
  const canAddSelectedItems = canSubmitDealSelection({
    selectedCount,
    requiredCount: requiredQuantity,
  });

  const selectedItems = useMemo(
    () => items.filter((item) => selectedMenuItemIds.includes(item.id)),
    [items, selectedMenuItemIds]
  );

  useEffect(() => {
    if (!open) {
      setSelectedMenuItemIds([]);
    }
  }, [open]);

  const toggleSelectedItem = useCallback((menuItemId: string, checked: boolean) => {
    setSelectedMenuItemIds((current) => {
      if (checked) {
        return current.includes(menuItemId) ? current : [...current, menuItemId];
      }

      return current.filter((id) => id !== menuItemId);
    });
  }, []);

  const customizeItem = useCallback(
    (item: CustomerDealMenuItem) => {
      const params = new URLSearchParams();
      params.set("itemId", item.id);
      params.set("dealContext", "chooser");

      if (item.slug) {
        params.set("slug", item.slug);
      }

      onOpenChange(false);
      router.push(`/items/details?${params.toString()}`);
    },
    [onOpenChange, router]
  );

  const addSelectedItems = useCallback(() => {
    if (!deal || !canAddSelectedItems) {
      return;
    }

    addDealMutation.mutate(
      {
        deal: isFixedItemDeal(deal)
          ? { ...deal, dealSelectionMode: "FLEXIBLE_ITEMS", dealRequiredQuantity: requiredQuantity }
          : deal,
        selectedMenuItemIds,
        eligibleMenuItems: selectedItems,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          router.push("/checkout");
        },
      }
    );
  }, [
    addDealMutation,
    canAddSelectedItems,
    deal,
    onOpenChange,
    requiredQuantity,
    router,
    selectedItems,
    selectedMenuItemIds,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-auto rounded-[24px] sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>{deal?.title || t("chooseItems")}</DialogTitle>
          <DialogDescription>
            {deal?.description || getRequirementText(deal, requiredQuantity, t)}
          </DialogDescription>
        </DialogHeader>

        {deal ? (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
              {formatDealPrice(deal.discountValue)}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1">
              {getDealTypeLabel(deal)}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1">
              {getRequirementText(deal, requiredQuantity, t)}
            </span>
            <span className="ml-auto rounded-full bg-orange-50 px-2.5 py-1 text-orange-700">
              {selectedCount}/{requiredQuantity} {t("selected")}
            </span>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
            {t("loadingEligibleItems")}
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && items.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
            {t("noEligibleItems")}
          </div>
        ) : null}

        {!isLoading && !error && items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => {
              const checked = selectedMenuItemIds.includes(item.id);
              const itemPrice = getMenuItemPrice(item);
              const categoryName = item.category?.name?.trim();
              const description = item.description?.trim();
              const requiresCustomization = requiresCustomizationForDealItem(item);
              const canSelectInline = canAutoAddDealItem(item);

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-primary/10 text-primary">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-lg font-bold">
                        {getMenuItemInitial(item.name)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {item.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                      {hasMenuItemPrice(itemPrice) ? (
                        <span className="text-primary">
                          {formatDealPrice(itemPrice)}
                        </span>
                      ) : null}
                      {categoryName ? <span>{categoryName}</span> : null}
                    </div>
                    {description ? (
                      <p className="mt-1 line-clamp-1 text-xs leading-5 text-gray-500">
                        {description}
                      </p>
                    ) : null}
                  </div>

                  {requiresCustomization ? (
                    <Button
                      className="h-9 shrink-0 rounded-full border border-primary/20 bg-white px-3 text-xs text-primary hover:bg-primary/5"
                      onClick={() => customizeItem(item)}
                    >
                      {t("customize")}
                    </Button>
                  ) : (
                    <Checkbox
                      className="size-5"
                      checked={checked}
                      disabled={!canSelectInline}
                      onCheckedChange={(value) => toggleSelectedItem(item.id, value === true)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="primary"
            className="h-11 w-full px-6 py-2 sm:w-auto"
            disabled={!canAddSelectedItems || addDealMutation.isPending}
            onClick={addSelectedItems}
          >
            {addDealMutation.isPending ? t("adding") : t("addSelectedItems")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
