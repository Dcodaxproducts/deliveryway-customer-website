"use client";

import Image from "next/image";
import { Star, MapPin, Clock, Utensils, Loader2, Store, Truck, Info, CalendarDays, Coffee, CircleCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import useItems from "@/hooks/useItems";
import { useAuth } from "@/hooks/useAuth";
import useBranches from "@/hooks/useBranches";
import { getStoredAuthState } from "@/lib/auth";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { AuthRestaurantUser, ItemsCategory, StoredAuthState } from "@/components/pages/Items/types";
import { getBranchHoursDetails, getBranchHoursSummary, getImageUrl, getOperatingHours, getRatingInfo, getRestaurantAddress, getRestaurantName, hasText, resolveHasNext } from "@/components/pages/Items/utils/restaurant-card-utils";
import type { BranchRecord } from "@/types/branch-selector";

const CATEGORY_PAGE_LIMIT = 50;

const getCategoryItemCount = (category: ItemsCategory) => {
  const count = Number(
    category?._count?.items ??
      category?.itemsCount ??
      category?.itemCount ??
      category?.items?.length
  );

  return Number.isFinite(count) && count >= 0 ? count : null;
};

const getSelectedBranchFromSession = (
  authUser: AuthRestaurantUser | null | undefined,
  storedAuth: StoredAuthState | null | undefined
) => authUser?.branch || authUser?.profile?.branch || storedAuth?.user?.branch || storedAuth?.user?.profile?.branch || null;

function BranchHoursDialog({
  branchName,
  branchHours,
}: {
  branchName?: string;
  branchHours: ReturnType<typeof getBranchHoursSummary>;
}) {
  const t = useTranslations("items.common");
  const openingDetails = getBranchHoursDetails(branchHours.openingSchedule);
  const deliveryDetails = getBranchHoursDetails(branchHours.deliverySchedule);
  const hasOpeningDetails = openingDetails.length > 0;
  const openDaysCount = openingDetails.filter((day) => !day.isClosed).length;
  const closedDaysCount = openingDetails.filter((day) => day.isClosed).length;
  const breakWindowsCount = openingDetails.reduce((total, day) => total + day.breakLabels.length, 0);

  const renderScheduleRows = (
    details: typeof openingDetails,
    variant: "opening" | "delivery",
  ) => (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {details.map((day, index) => (
        <div
          key={`${variant}-${day.dayOfWeek}`}
          className={`grid gap-3 px-4 py-3 sm:grid-cols-[120px_1fr] ${
            index === 0 ? "" : "border-t border-gray-100"
          }`}
        >
          <div className="flex items-center justify-between gap-3 sm:block">
            <p className="text-sm font-semibold text-gray-950">{day.dayLabel}</p>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold sm:mt-2 ${
                day.isClosed
                  ? "bg-gray-100 text-gray-500"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {day.isClosed ? t("closed") : t("open")}
            </span>
          </div>

          <div className="min-w-0">
            <p className={`text-sm font-semibold ${day.isClosed ? "text-gray-500" : "text-gray-900"}`}>
              {day.hoursLabel}
            </p>

            {day.breakLabels.length > 0 ? (
              <div className="mt-2 space-y-1.5">
                {day.breakLabels.map((breakLabel) => (
                  <div
                    key={breakLabel}
                    className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900"
                  >
                    <Coffee size={14} className="mt-0.5 shrink-0 text-amber-700" />
                    <span>{t("breakTime", { time: breakLabel })}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t("viewHours")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <Info size={16} />
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[88vh] max-w-[760px] gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl">
        <div className="border-b border-gray-200 px-5 py-5 sm:px-6">
          <DialogHeader className="pr-10 text-left">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays size={22} />
              </span>
              <div className="min-w-0">
                <DialogTitle className="break-words text-2xl font-bold leading-tight text-gray-950">
                  {t("hoursPopupTitle")}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-gray-500">
                  {branchName ? t("hoursPopupSubtitle", { branch: branchName }) : t("hoursPopupSubtitleFallback")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-sm leading-6 text-gray-600">{t("hoursPopupNote")}</p>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("openDays")}</p>
              <p className="mt-1 text-2xl font-bold text-gray-950">{openDaysCount}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("closedDays")}</p>
              <p className="mt-1 text-2xl font-bold text-gray-950">{closedDaysCount}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">{t("breakWindows")}</p>
              <p className="mt-1 text-2xl font-bold text-amber-950">{breakWindowsCount}</p>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <section>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Store size={18} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-gray-950">{t("openingHours")}</h3>
                    <p className="mt-0.5 text-sm text-gray-500">{t("openingHoursDescription")}</p>
                  </div>
                </div>
                <CircleCheck size={18} className="mt-1 shrink-0 text-emerald-600" />
              </div>

              {hasOpeningDetails ? renderScheduleRows(openingDetails, "opening") : (
                <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                  {t("hoursNotConfigured")}
                </p>
              )}
            </section>

            {branchHours.showDeliveryHours ? (
              <section>
                <div className="mb-3 flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-primary">
                    <Truck size={18} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-gray-950">{t("deliveryHours")}</h3>
                    <p className="mt-0.5 text-sm text-gray-500">{t("deliveryHoursDescription")}</p>
                  </div>
                </div>

                {renderScheduleRows(deliveryDetails, "delivery")}
              </section>
            ) : null}
          </div>
        </div>

        <DialogFooter className="border-t border-gray-200 bg-gray-50 px-5 py-4 sm:px-6">
          <DialogClose className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20">
            {t("close")}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RestaurantHeader() {
  const t = useTranslations("items.common");
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId");
  const router = useRouter();

  const { token, restaurantId: authRestaurantId, user } = useAuth();
  const { fetchMenuCategoriesPage } = useItems(token);
  const { fetchBranches } = useBranches(token);

  const [category, setCategory] = useState<ItemsCategory | null>(null);
  const [restaurant, setRestaurant] = useState<{
    name: string;
    address: string;
    operatingHours: string;
    ratingInfo: ReturnType<typeof getRatingInfo>;
    coverImage?: string | null;
    branchName?: string;
    branchHours: ReturnType<typeof getBranchHoursSummary>;
    reservationEnabled: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const storedAuth = useMemo<StoredAuthState | null>(() => getStoredAuthState() as StoredAuthState | null, []);

  const restaurantId = useMemo(() => {
    return (
      authRestaurantId ||
      user?.restaurantId ||
      storedAuth?.user?.restaurantId ||
      ""
    );
  }, [authRestaurantId, user?.restaurantId, storedAuth]);

  const selectedBranchId = useMemo(() => {
    return String(user?.branchId || user?.branch?.id || storedAuth?.user?.branchId || storedAuth?.user?.branch?.id || "");
  }, [user?.branchId, user?.branch?.id, storedAuth]);

  useEffect(() => {
    let cancelled = false;

    const fetchCategory = async () => {
      if (!token || !restaurantId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const sessionBranch = getSelectedBranchFromSession(user as AuthRestaurantUser | null, storedAuth);
        let selectedBranch: BranchRecord | AuthRestaurantUser["branch"] | null = sessionBranch;

        if (selectedBranchId && restaurantId) {
          try {
            const branches = await fetchBranches(
              `/v1/branches?restaurantId=${encodeURIComponent(String(restaurantId))}&page=1&limit=100`
            );

            selectedBranch = branches.find((branch) => String(branch.id) === selectedBranchId) ?? sessionBranch;
          } catch {
            selectedBranch = sessionBranch;
          }
        }

        const branchHours = getBranchHoursSummary(selectedBranch);
        const reservationEnabled = selectedBranch?.settings?.tableReservationsEnabled === true;

        const resolvedRestaurant = {
          name: getRestaurantName(user as AuthRestaurantUser | null, storedAuth),
          address: getRestaurantAddress(user as AuthRestaurantUser | null, storedAuth),
          operatingHours: branchHours.opening.status !== "unknown"
            ? t("hoursAvailable")
            : getOperatingHours(user as AuthRestaurantUser | null, storedAuth),
          ratingInfo: getRatingInfo(user as AuthRestaurantUser | null, storedAuth),
          coverImage:
            storedAuth?.user?.restaurant?.coverImage ||
            storedAuth?.user?.restaurant?.coverImageUrl ||
            storedAuth?.user?.restaurant?.bannerUrl ||
            "",
          branchName: selectedBranch?.name ? String(selectedBranch.name) : undefined,
          branchHours,
          reservationEnabled,
        };

        let page = 1;
        let totalLoaded = 0;
        let selectedCategory: ItemsCategory | null = null;
        let firstCategory: ItemsCategory | null = null;
        let shouldContinue = true;

        while (shouldContinue) {
          const { categories: fetchedCategories, meta } = await fetchMenuCategoriesPage({
            restaurantId: String(restaurantId),
            page,
            limit: CATEGORY_PAGE_LIMIT,
          });

          if (!firstCategory && fetchedCategories.length > 0) {
            firstCategory = fetchedCategories[0] ?? null;
          }

          if (categoryId) {
            selectedCategory = fetchedCategories.find(
              ({ id }) => String(id) === String(categoryId)
            ) ?? null;
          }

          totalLoaded += fetchedCategories.length;

          if (selectedCategory || !categoryId) {
            shouldContinue = false;
          } else {
            shouldContinue = resolveHasNext({
              meta,
              page,
              limit: CATEGORY_PAGE_LIMIT,
              receivedCount: fetchedCategories.length,
              totalLoaded,
            });

            page += 1;
          }

          if (page > 30) {
            shouldContinue = false;
          }
        }

        if (cancelled) return;

        setRestaurant(resolvedRestaurant);
        setCategory(categoryId ? selectedCategory : null);
      } catch (err) {

        if (!cancelled) {
          setRestaurant({
            name: getRestaurantName(user as AuthRestaurantUser | null, storedAuth),
            address: getRestaurantAddress(user as AuthRestaurantUser | null, storedAuth),
            operatingHours: getOperatingHours(user as AuthRestaurantUser | null, storedAuth),
            ratingInfo: getRatingInfo(user as AuthRestaurantUser | null, storedAuth),
            branchName: getSelectedBranchFromSession(user as AuthRestaurantUser | null, storedAuth)?.name || undefined,
            branchHours: getBranchHoursSummary(getSelectedBranchFromSession(user as AuthRestaurantUser | null, storedAuth)),
            reservationEnabled: getSelectedBranchFromSession(user as AuthRestaurantUser | null, storedAuth)?.settings?.tableReservationsEnabled === true,
          });
          setCategory(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCategory();

    return () => {
      cancelled = true;
    };
  }, [categoryId, token, restaurantId, selectedBranchId, fetchBranches, user, storedAuth, t]);

  const categoryItemCount = category ? getCategoryItemCount(category) : null;
  const ratingInfo = restaurant?.ratingInfo;
  const bannerImage = getImageUrl(category, restaurant);

  const title = category?.name ? category.name : t("fullMenu");

  const description = hasText(category?.description)
    ? String(category?.description)
    : category?.name
    ? t("categoryDescription")
    : t("menuDescription");

  if (loading) {
    return (
      <div className="mx-4 mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:mx-10">
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm md:mx-10">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_520px]">
        {/* LEFT CONTENT */}
        <div className="flex min-w-0 flex-col justify-center p-6 md:p-8 lg:p-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {category?.name ? t("category") : t("restaurantMenu")}
            </span>

            {categoryItemCount !== null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                <Utensils size={13} />
                {t("itemCount", { count: categoryItemCount })}
              </span>
            ) : null}
          </div>

          <h1 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-gray-950 md:text-4xl">
            {title}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
            {description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            {ratingInfo ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1.5 text-yellow-700">
                <Star className="fill-yellow-500 text-yellow-500" size={16} />
                <span className="font-semibold">
                  {ratingInfo.rating.toFixed(1)}
                </span>

                {ratingInfo.reviews ? (
                  <span className="text-yellow-700/80">
                    · {t("reviewCount", { count: ratingInfo.reviews })}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
              <Clock size={15} className="text-gray-500" />
              <span>{restaurant?.operatingHours}</span>
              {restaurant?.branchHours ? (
                <BranchHoursDialog
                  branchName={restaurant.branchName}
                  branchHours={restaurant.branchHours}
                />
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
              <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-emerald-200/35" />
              <div className="relative flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Store size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {t("openingHours")}
                  </span>
                  <span className="mt-1 block text-base font-semibold text-gray-950">
                    {restaurant?.branchHours.opening.value}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {restaurant?.branchHours.opening.label}
                    {restaurant?.branchName ? ` · ${restaurant.branchName}` : ""}
                  </span>
                </span>
              </div>
            </div>

            {restaurant?.branchHours.showDeliveryHours ? (
              <div className="group relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-orange-200/40" />
                <div className="relative flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                    <Truck size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-primary">
                      {t("deliveryHours")}
                    </span>
                    <span className="mt-1 block text-base font-semibold text-gray-950">
                      {restaurant.branchHours.delivery.value}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {restaurant.branchHours.delivery.label}
                      {restaurant.branchName ? ` · ${restaurant.branchName}` : ""}
                    </span>
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-5 space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-gray-500" />
              <span>{restaurant?.address}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!restaurant?.reservationEnabled}
              onClick={() => {
                if (restaurant?.reservationEnabled) {
                  router.push("/reservetable");
                }
              }}
              className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {t("reserveTable")}
            </button>

            <div className="text-xs text-gray-400">
              {restaurant?.name ? t("servingFrom", { name: restaurant.name }) : null}
            </div>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="relative h-[260px] w-full overflow-hidden bg-gray-100 md:h-[340px] lg:h-auto">
          <Image
            src={bannerImage}
            alt={category?.name || restaurant?.name || t("restaurantMenuImageAlt")}
            fill
            className="object-cover"
            priority
            unoptimized
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/10" />

          {category?.name ? (
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/90 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {t("currentCategory")}
              </p>
              <p className="mt-1 truncate text-base font-semibold text-gray-900">
                {category.name}
              </p>

              {hasText(category?.description) ? (
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                  {category.description}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
