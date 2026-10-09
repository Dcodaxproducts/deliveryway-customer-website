"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";

import { HeroSection } from "@/components/pages/Home/components/heroSection";
import { FoodCategorySection } from "@/components/pages/Home/components/foodCategorySection";
import WhyChooseUs from "@/components/pages/Home/components/whyChooseUsSection";
import { AppPromo } from "@/components/pages/Home/components/appPromoSection";
import Stats from "@/components/pages/Home/components/statsSection";
import { RequiredBranchSelectionModal } from "@/components/common/branch-selector/RequiredBranchSelectionModal";
import BranchOpeningHoursPopup from "@/components/pages/Home/components/BranchOpeningHours";
import { CustomerDealsSection } from "@/components/pages/Home/components/CustomerDealsSection";
import { GiftCardsSection } from "@/components/pages/Home/components/GiftCardsSection";
import { MobileHomeExperience } from "@/components/pages/Home/components/MobileHomeExperience";
import { PromotionalItemsSection } from "@/components/pages/Home/components/PromotionalItemsSection";
import { CuisineSection } from "@/components/pages/Cuisines/CuisineSection";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

import { DEFAULT_BRANDING } from "@/config/default-branding";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/hooks/useBranding";
import { useAddDealToCart } from "@/hooks/useCart";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useCustomerDeals } from "@/hooks/useCustomerDeals";
import { useDomainContext } from "@/hooks/useDomainContext";
import { useHome } from "@/hooks/useHome";
import {
  useHomeCategories,
  useHomePromotionalItems,
} from "@/hooks/useHomeCategories";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import {
  branchSupportsDelivery,
  branchSupportsPickup,
  normalizeBranch,
  persistSelectedBranch,
  shouldRequireBranchSelection,
} from "@/lib/branch-selector";
import { resolveCustomerCurrency } from "@/lib/money";
import type { CustomerDeal } from "@/types/customer-deals";
import type { AuthBranch } from "@/types/auth";
import type { BranchScheduleTimings, BranchSettings } from "@/types/branches";
import type { HomeBranch, HomeRestaurant } from "@/types/home";
import {
  checkoutTypeToOrderType,
  orderTypeToCheckoutType,
  setStoredCheckoutTypePreference,
  type CheckoutTypePreference,
} from "@/lib/checkout-type-preference";

const getRestaurantHeroImage = (restaurant?: HomeRestaurant | null) =>
  restaurant?.coverImage ||
  restaurant?.coverImageUrl ||
  restaurant?.heroImageUrl ||
  null;

const getTrimmedText = (value?: string | null) => {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : null;
};

const hasScheduleEntries = (value: unknown) =>
  Array.isArray(value) && value.length > 0;

const mergeScheduleField = <TValue,>(
  homeValue: TValue | undefined,
  sessionValue: TValue | undefined,
) => {
  if (hasScheduleEntries(homeValue) || homeValue === undefined) {
    return homeValue ?? sessionValue;
  }

  if (hasScheduleEntries(sessionValue)) {
    return sessionValue;
  }

  return homeValue ?? sessionValue;
};

const mergeBranchSettings = (
  homeSettings?: Record<string, unknown> | null,
  sessionSettings?: BranchSettings | null,
): BranchSettings => {
  const mergedSettings = {
    ...(sessionSettings ?? {}),
    ...(homeSettings ?? {}),
  } as BranchSettings;

  mergedSettings.openingHours = mergeScheduleField(
    homeSettings?.openingHours as BranchSettings["openingHours"] | undefined,
    sessionSettings?.openingHours,
  );
  mergedSettings.deliveryHours = mergeScheduleField(
    homeSettings?.deliveryHours as BranchSettings["deliveryHours"] | undefined,
    sessionSettings?.deliveryHours,
  );
  mergedSettings.holidayOpeningHours = mergeScheduleField(
    homeSettings?.holidayOpeningHours as
      BranchSettings["holidayOpeningHours"] | undefined,
    sessionSettings?.holidayOpeningHours,
  );

  return mergedSettings;
};

const mergeScheduleTimings = (
  homeSchedule?: BranchScheduleTimings | null,
  sessionSchedule?: BranchScheduleTimings | null,
) => {
  const mergedSchedule = {
    ...(sessionSchedule ?? {}),
    ...(homeSchedule ?? {}),
  } as BranchScheduleTimings;

  mergedSchedule.openingHours = mergeScheduleField(
    homeSchedule?.openingHours,
    sessionSchedule?.openingHours,
  );
  mergedSchedule.deliveryHours = mergeScheduleField(
    homeSchedule?.deliveryHours,
    sessionSchedule?.deliveryHours,
  );
  mergedSchedule.holidayOpeningHours = mergeScheduleField(
    homeSchedule?.holidayOpeningHours,
    sessionSchedule?.holidayOpeningHours,
  );

  return Object.keys(mergedSchedule).length > 0 ? mergedSchedule : null;
};

const mergeHomeBranch = (
  homeBranch?: HomeBranch | null,
  sessionBranch?: AuthBranch | null,
): HomeBranch | AuthBranch | null => {
  if (!homeBranch) return sessionBranch ?? null;
  if (
    !sessionBranch ||
    String(homeBranch.id || "") !== String(sessionBranch.id || "")
  ) {
    return homeBranch;
  }

  const sessionHomeBranch = sessionBranch as HomeBranch;

  return {
    ...sessionBranch,
    ...homeBranch,
    isOnlyBranch: homeBranch.isOnlyBranch ?? sessionBranch.isOnlyBranch,
    settings: mergeBranchSettings(homeBranch.settings, sessionBranch.settings),
    availability: {
      ...(sessionHomeBranch.availability ?? {}),
      ...(homeBranch.availability ?? {}),
      temporaryClosure:
        homeBranch.availability?.temporaryClosure ??
        sessionHomeBranch.availability?.temporaryClosure ??
        null,
    },
    scheduleTimings: mergeScheduleTimings(
      homeBranch.scheduleTimings,
      sessionHomeBranch.scheduleTimings,
    ),
  };
};

const HomePage = () => {
  const t = useTranslations("home.hero");
  const {
    user,
    token,
    restaurantId: authRestaurantId,
    loading: authLoading,
    setUser,
  } = useAuth();
  const { context: domainContext, loading: domainLoading } = useDomainContext();
  const { locale } = useAppLocale();
  const { branding: fallbackBranding } = useBranding();

  const restaurantId = useMemo(
    () => resolveHomeRestaurantId(user, authRestaurantId, domainContext),
    [authRestaurantId, domainContext, user],
  );
  const branchId = useMemo(
    () => resolveHomeBranchId(user, domainContext),
    [domainContext, user],
  );
  const hasRestaurantContext = Boolean(restaurantId);
  const homeQuery = useHome(restaurantId, branchId, hasRestaurantContext);
  const categoriesQuery = useHomeCategories(
    restaurantId,
    locale,
    hasRestaurantContext,
  );
  const promotionalItemsQuery = useHomePromotionalItems({
    restaurantId,
    branchId,
    locale,
    limit: 8,
    enabled: hasRestaurantContext,
  });
  const dealsQuery = useCustomerDeals({
    restaurantId,
    branchId,
    locale,
    limit: 20,
  });
  const addDealMutation = useAddDealToCart(branchId);
  const handleAddDeal = useCallback(
    (deal: CustomerDeal, selectedMenuItemIds?: string[]) => {
      addDealMutation.mutate({ deal, selectedMenuItemIds });
    },
    [addDealMutation],
  );
  const homeResponse = homeQuery.data;
  const homeData = homeResponse ? homeResponse.data : undefined;
  const isRestaurantContentLoading =
    authLoading || domainLoading || (hasRestaurantContext && !homeData);

  const branding = homeData?.branding ?? fallbackBranding ?? DEFAULT_BRANDING;
  const resolvedBranch = useMemo(
    () => mergeHomeBranch(homeData?.branch, user?.branch),
    [homeData?.branch, user?.branch],
  );
  const checkoutType =
    orderTypeToCheckoutType(
      user?.selectedOrderType ?? user?.branch?.selectedOrderType,
    ) ?? "delivery";
  const normalizedBranch = useMemo(
    () => normalizeBranch(resolvedBranch),
    [resolvedBranch],
  );
  const availableCheckoutTypes = useMemo(
    () => {
      const hasOrderTypeRules = Boolean(
        normalizedBranch?.settings?.allowedOrderTypes?.length,
      );
      const supportsDelivery =
        !hasOrderTypeRules ||
        Boolean(normalizedBranch && branchSupportsDelivery(normalizedBranch));
      const supportsPickup =
        !hasOrderTypeRules ||
        Boolean(normalizedBranch && branchSupportsPickup(normalizedBranch));

      return [
        ...(normalizedBranch && supportsDelivery
          ? (["delivery"] as const)
          : []),
        ...(normalizedBranch && supportsPickup ? (["pickup"] as const) : []),
      ];
    },
    [normalizedBranch],
  );
  const handleMobileCheckoutTypeChange = useCallback(
    (nextCheckoutType: CheckoutTypePreference) => {
      setStoredCheckoutTypePreference(nextCheckoutType);

      if (!normalizedBranch) return;

      persistSelectedBranch(normalizedBranch, setUser, {
        orderType: checkoutTypeToOrderType(nextCheckoutType),
      });
    },
    [normalizedBranch, setUser],
  );
  const landingPopup = homeData?.landingPopup ?? null;
  const heroTitle =
    homeData?.restaurant?.name ?? branding.restaurantName ?? t("defaultTitle");
  const heroTagline = branding.tagline;
  const heroBannerTitle =
    getTrimmedText(homeData?.restaurant?.tagline) ?? t("deliveryTitle");
  const heroBannerDescription =
    getTrimmedText(homeData?.restaurant?.bio) ?? t("description");
  const heroImage =
    getRestaurantHeroImage(homeData?.restaurant) ??
    branding.assets.heroImage ??
    branding.assets.coverImage ??
    DEFAULT_BRANDING.assets.heroImage;
  const currency = resolveCustomerCurrency({
    configCurrency: homeData?.config?.currency,
    restaurant: homeData?.restaurant,
  });

  if (isRestaurantContentLoading) {
    return (
      <main
        aria-busy="true"
        aria-describedby="restaurant-loading-status"
        className="min-h-screen bg-white"
      >
        <span id="restaurant-loading-status" className="sr-only" role="status">
          Loading restaurant
        </span>

        <div className="relative min-h-[620px] overflow-hidden md:min-h-[620px] lg:min-h-[660px]">
          <LoadingSkeleton className="absolute inset-0 h-full w-full rounded-none bg-[#351b1d]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/10" />
          <div className="relative mx-auto grid min-h-[620px] w-full max-w-[1440px] items-center gap-8 px-5 py-10 sm:px-6 lg:min-h-[660px] lg:grid-cols-[minmax(0,1fr)_480px] lg:px-8">
            <div aria-hidden="true" className="max-w-[680px] space-y-5">
              <LoadingSkeleton className="h-14 w-[min(100%,620px)] rounded-2xl bg-white/20" />
              <LoadingSkeleton className="h-6 w-[min(82%,520px)] rounded-xl bg-white/15" />
              <div className="grid gap-3 pt-2 sm:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <LoadingSkeleton
                    key={index}
                    className="h-[118px] rounded-[18px] bg-white/12"
                  />
                ))}
              </div>
            </div>
            <LoadingSkeleton className="h-[360px] rounded-[26px] bg-white/85" />
          </div>
        </div>

        <div className="relative z-20 mx-auto -mt-15 max-w-[1400px] px-4 sm:-mt-20 sm:px-6">
          <div className="rounded-[30px] bg-white px-4 py-5 shadow-sm sm:px-6 sm:py-6">
            <LoadingSkeleton className="mb-5 h-7 w-44 rounded-lg" />
            <div className="grid grid-cols-2 gap-3 overflow-hidden sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  key={index}
                  aria-hidden="true"
                  className="flex min-h-[132px] flex-col items-center justify-center gap-3"
                >
                  <LoadingSkeleton className="h-[81px] w-[81px] rounded-full" />
                  <LoadingSkeleton className="h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div>
      <BranchOpeningHoursPopup popup={landingPopup} branch={resolvedBranch} />

      <MobileHomeExperience
        restaurantName={heroTitle}
        tagline={heroTagline}
        heroImage={heroImage}
        branding={branding}
        branch={resolvedBranch}
        categories={categoriesQuery.data ?? []}
        categoriesLoading={categoriesQuery.isLoading}
        categoriesError={categoriesQuery.isError}
        onRetryCategories={() => void categoriesQuery.refetch()}
        promotionalItems={promotionalItemsQuery.data ?? []}
        promotionalItemsLoading={promotionalItemsQuery.isLoading}
        deals={dealsQuery.deals}
        dealsLoading={dealsQuery.isLoading}
        addingDealId={
          addDealMutation.isPending
            ? (addDealMutation.variables?.deal.id ?? null)
            : null
        }
        branchId={branchId}
        onAddDeal={handleAddDeal}
        currency={currency}
        checkoutType={checkoutType}
        availableCheckoutTypes={availableCheckoutTypes}
        onCheckoutTypeChange={handleMobileCheckoutTypeChange}
      />

      <div className="md:hidden">
        <GiftCardsSection
          giftCards={homeData?.giftCards}
          restaurantId={restaurantId}
          branchId={branchId}
          currency={currency}
        />

        <CuisineSection />

        <WhyChooseUs />
        {branding.showAppPromotion ? <AppPromo /> : null}
        <Stats />
      </div>

      <div className="hidden md:block">
        {branding.showHeroBanner ? (
          <HeroSection
            restaurantName={heroTitle}
            tagline={heroTagline}
            title={heroBannerTitle}
            description={heroBannerDescription}
            heroImage={heroImage}
            branch={resolvedBranch}
          />
        ) : null}

        {branding.showCategories ? (
          <section id="categories">
            <FoodCategorySection />
          </section>
        ) : null}

        <CuisineSection />

        <PromotionalItemsSection
          items={promotionalItemsQuery.data ?? []}
          isLoading={promotionalItemsQuery.isLoading}
          currency={currency}
          checkoutType={checkoutType}
        />

        <CustomerDealsSection
          deals={dealsQuery.deals}
          isLoading={dealsQuery.isLoading}
          addingDealId={
            addDealMutation.isPending
              ? (addDealMutation.variables?.deal.id ?? null)
              : null
          }
          branchId={branchId}
          currency={currency}
          onAddDeal={handleAddDeal}
        />

        <GiftCardsSection
          giftCards={homeData?.giftCards}
          restaurantId={restaurantId}
          branchId={branchId}
          currency={currency}
        />

        <WhyChooseUs />
        {branding.showAppPromotion ? <AppPromo /> : null}
        <Stats />
      </div>

      {shouldRequireBranchSelection(restaurantId, branchId) ? (
        <RequiredBranchSelectionModal restaurantId={restaurantId} />
      ) : null}
    </div>
  );
};

export { HomePage };
