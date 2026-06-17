"use client";

import Image from "next/image";
import { Store } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useAuthContext } from "@/hooks/useAuth";
import { useNearbyBranches } from "@/hooks/useBranches";
import { useUserLocation } from "@/hooks/useUserLocation";
import { AddressLocationPicker } from "@/components/common/branch-selector/AddressLocationPicker";
import {
  branchSupportsDelivery,
  branchSupportsPickup,
  formatBranchAddress,
  formatBranchDistance,
  getSelectedOrderType,
  isBranchCurrentlyAvailable,
  nearbyBranchToBranchRecord,
  persistSelectedBranch,
} from "@/lib/branch-selector";
import {
  checkoutTypeToOrderType,
  getStoredCheckoutTypePreference,
  setStoredCheckoutTypePreference,
} from "@/lib/checkout-type-preference";
import { resolveHttpsImageUrl } from "@/lib/image-fallback";
import type { BranchOrderType, NearbyBranch } from "@/types/branches";

type HeroSectionProps = {
  restaurantName?: string;
  tagline?: string;
  heroImage?: string | null;
};

type BranchSearchMode = "delivery" | "pickup";

const getOrderType = (mode: BranchSearchMode): BranchOrderType =>
  mode === "pickup" ? "TAKEAWAY" : "DELIVERY";

export const HeroSection = ({
  restaurantName,
  tagline,
  heroImage = "/hero.png",
}: HeroSectionProps) => {
  const t = useTranslations("home.hero");
  const { user, setUser } = useAuthContext();
  const resolvedHeroImage = resolveHttpsImageUrl(heroImage, "/hero.png");
  const branchSearchRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<BranchSearchMode>("delivery");
  const [showResults, setShowResults] = useState(false);
  const {
    coordinates,
    locationLabel,
    permissionState,
    errorMessage,
    requestLocation,
    acceptCoordinates,
  } = useUserLocation();
  const nearbyQuery = useNearbyBranches(
    coordinates
      ? {
          lat: coordinates.lat,
          lng: coordinates.lng,
          page: 1,
          limit: 20,
        }
      : null,
    { enabled: showResults }
  );

  const displayRestaurantName = restaurantName || t("defaultTitle");
  const displayTagline = tagline || t("defaultTagline");
  const selectedBranch = user?.branch ?? null;
  const selectedOrderType = getSelectedOrderType(user);
  const selectedOrderLabel = selectedOrderType === "TAKEAWAY" ? "Pickup" : selectedOrderType === "DELIVERY" ? "Delivery" : "";
  const hasOrderTypeRules = Boolean(selectedBranch?.settings?.allowedOrderTypes?.length);
  const showDeliveryOption = !hasOrderTypeRules || (selectedBranch ? branchSupportsDelivery(selectedBranch) : false);
  const showPickupOption = !hasOrderTypeRules || (selectedBranch ? branchSupportsPickup(selectedBranch) : false);
  const availableModes = useMemo(
    () => [
      ...(showDeliveryOption ? ["delivery" as const] : []),
      ...(showPickupOption ? ["pickup" as const] : []),
    ],
    [showDeliveryOption, showPickupOption]
  );

  const filteredBranches = useMemo(
    () =>
      nearbyQuery.branches.filter((branch) =>
        mode === "pickup" ? branchSupportsPickup(branch) : branchSupportsDelivery(branch)
      ),
    [mode, nearbyQuery.branches]
  );

  useEffect(() => {
    if (!showResults) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) return;
      if (branchSearchRef.current?.contains(target)) return;

      setShowResults(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowResults(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showResults]);

  useEffect(() => {
    if (availableModes.length > 0 && !availableModes.includes(mode)) {
      setMode(availableModes[0]);
    }
  }, [availableModes, mode]);

  useEffect(() => {
    const storedMode = getStoredCheckoutTypePreference();

    if (!storedMode || !availableModes.includes(storedMode)) return;

    setMode(storedMode);
  }, [availableModes]);

  const handleModeChange = (nextMode: BranchSearchMode) => {
    setMode(nextMode);
    setStoredCheckoutTypePreference(nextMode);

    if (selectedBranch) {
      persistSelectedBranch({
        ...selectedBranch,
        settings: selectedBranch.settings ?? undefined,
      }, setUser, {
        orderType: checkoutTypeToOrderType(nextMode),
      });
    }
  };

  const handleFindNearbyBranches = () => {
    setShowResults(true);

    if (!coordinates) {
      requestLocation();
    }
  };

  const handleUseCurrentLocation = () => {
    setShowResults(true);
    requestLocation();
  };

  const handleSelectSearchLocation = (nextCoordinates: { lat: number; lng: number }, label?: string) => {
    acceptCoordinates(nextCoordinates, label || "Selected address");
    setShowResults(true);
  };

  const handleSelectBranch = (branch: NearbyBranch) => {
    const orderType = getOrderType(mode);

    persistSelectedBranch(nearbyBranchToBranchRecord(branch), setUser, {
      orderType,
    });

    toast.success(`${branch.name} selected for ${mode === "pickup" ? "pickup" : "delivery"}.`);
    setShowResults(false);
  };

  return (
    <main className="relative overflow-hidden bg-[#fff8f4] px-4 pb-14 pt-10 sm:px-6 md:pb-20 md:pt-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,210,190,0.55),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(206,24,27,0.12),transparent_28%),linear-gradient(180deg,#fff8f4_0%,#ffffff_86%)]" />
      <div className="relative mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="max-w-2xl">
          <h1 className="text-[48px] font-black leading-[0.98] tracking-normal text-[#241814] md:text-[72px] xl:text-[88px]">
            {displayRestaurantName}
          </h1>
          <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-[#6b5650] md:text-xl">
            {displayTagline}
          </p>

          <div className="mt-8 w-full max-w-[720px] rounded-[30px] border border-red-100/80 bg-white p-4 shadow-[0_28px_80px_rgba(206,24,27,0.12)] md:p-5">
          {availableModes.length > 0 ? (
            <div className="mb-5 inline-flex rounded-full bg-[#fff1ec] p-1">
              {availableModes.map((nextMode) => (
              <button
                key={nextMode}
                type="button"
                onClick={() => handleModeChange(nextMode)}
                className={`min-w-[116px] rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                  mode === nextMode
                    ? "bg-primary text-white shadow-sm"
                    : "text-[#7b625a] hover:bg-white"
                }`}
              >
                {nextMode === "delivery" ? "Delivery" : "Pickup"}
              </button>
              ))}
            </div>
          ) : null}

          {selectedBranch ? (
            <div className="mb-4 flex flex-col gap-3 rounded-[22px] border border-primary/15 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary">
                  <Store size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#111827]">
                    {selectedBranch.name}
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    {[formatBranchDistance(selectedBranch.distanceKm), selectedOrderLabel].filter(Boolean).join(" - ") || "Selected branch"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFindNearbyBranches}
                className="h-10 rounded-full border border-primary/20 bg-white px-4 text-sm font-bold text-primary transition hover:bg-primary/5"
              >
                Change
              </button>
            </div>
          ) : null}

          <div ref={branchSearchRef} className="relative">
            <AddressLocationPicker
              coordinates={coordinates}
              locationLabel={locationLabel}
              onSelectLocation={handleSelectSearchLocation}
              onUseCurrentLocation={handleUseCurrentLocation}
              isLocating={permissionState === "requesting"}
              showSelectedLabel={false}
            />

            {showResults ? (
              <div className="mt-4 overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.14)]">
                {errorMessage ? (
                  <div className="px-5 py-6 text-sm text-gray-600">
                    {errorMessage || "Location is unavailable. Please choose a branch from the branch selector."}
                  </div>
                ) : nearbyQuery.isFetching ? (
                  <div className="flex items-center justify-center gap-2 px-5 py-8 text-sm text-gray-500">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    Finding nearby branches...
                  </div>
                ) : filteredBranches.length === 0 && coordinates ? (
                  <div className="px-5 py-8 text-center text-sm text-gray-500">
                    No nearby {mode === "pickup" ? "pickup" : "delivery"} branches found.
                  </div>
                ) : (
                  <div className="max-h-[min(320px,36vh)] divide-y divide-gray-100 overflow-y-auto">
                    {filteredBranches.map((branch) => {
                      const available = isBranchCurrentlyAvailable(branch);

                      return (
                        <button
                          key={branch.id}
                          type="button"
                          onClick={() => handleSelectBranch(branch)}
                          className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-orange-50/50"
                        >
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-semibold text-gray-900">
                              {branch.name}
                            </h4>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                              {formatBranchAddress(branch)}
                            </p>
                            <p className="mt-2 text-xs font-semibold text-primary">
                              {[formatBranchDistance(branch.distanceKm), available ? "Available" : branch.availability?.reason || "Availability limited"]
                                .filter(Boolean)
                                .join(" - ")}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            Select
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>
          </div>
        </div>

        <div className="relative hidden min-h-[560px] lg:block">
          <div className="absolute right-0 top-8 h-[500px] w-[500px] rounded-full bg-primary/10" />
          <div className="absolute right-12 top-0 h-[520px] w-[520px] overflow-hidden rounded-full border-[18px] border-white bg-white shadow-[0_30px_100px_rgba(80,25,16,0.14)]">
            <Image
              src={resolvedHeroImage}
              alt={t("heroImageAlt")}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute bottom-14 left-8 rounded-[28px] bg-white p-4 shadow-[0_24px_70px_rgba(80,25,16,0.14)]">
            <div className="relative h-[120px] w-[180px] overflow-hidden rounded-[22px] bg-[#fff1ec]">
              <Image
                src="/pizza.png"
                alt={t("heroImageAlt")}
                fill
                className="object-contain p-4"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
