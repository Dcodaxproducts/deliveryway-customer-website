"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronDown, Loader2, MapPin, Navigation, X } from "lucide-react";
import { AddressLocationPicker } from "@/components/common/branch-selector/AddressLocationPicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { INPUT_BASE_CLASS, LABEL_TEXT_CLASS } from "@/components/common/common-classes";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCheckout } from "@/hooks/useCheckout";
import { reverseGeocode } from "@/services/geocoding";
import { useAuth } from "@/hooks/useAuth";
import { createCheckoutAddressSchema, type CheckoutAddressValues } from "@/validations/checkout";
import type { GoogleLatLngLiteral } from "@/types/google-maps";
import { useTranslations } from "next-intl";

type AddressModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (address?: { id?: string | number }) => void;
  editData?: (Partial<CheckoutAddressValues> & { id?: string | number }) | null;
};

const initialForm: CheckoutAddressValues = {
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  state: "",
  country: "",
  area: "",
  lat: "",
  lng: "",
  isDefault: false,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getSavedAddress = (value: unknown): { id?: string | number } | undefined => {
  if (isRecord(value) && isRecord(value.data)) {
    return {
      id:
        typeof value.data.id === "string" || typeof value.data.id === "number"
          ? value.data.id
          : undefined,
    };
  }

  if (isRecord(value)) {
    return {
      id: typeof value.id === "string" || typeof value.id === "number" ? value.id : undefined,
    };
  }

  return undefined;
};

export function AddressModal({
  open,
  onOpenChange,
  onSuccess,
  editData,
}: AddressModalProps) {
  const t = useTranslations("addresses");
  const commonT = useTranslations("common");
  const errorT = useTranslations("errors");
  const validationT = useTranslations("validation");
  const { token } = useAuth();
  const { post, patch } = useCheckout(token);
  const checkoutAddressSchema = useMemo(
    () =>
      createCheckoutAddressSchema({
        streetRequired: validationT("streetRequired"),
        postalCodeRequired: validationT("postalCodeRequired"),
        cityRequired: validationT("cityRequired"),
        stateRequired: validationT("stateRequired"),
        countryRequired: validationT("countryRequired"),
        latitudeRequired: validationT("latitudeRequired"),
        longitudeRequired: validationT("longitudeRequired"),
      }),
    [validationT]
  );

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const { register, reset, setValue, getValues, handleSubmit, watch, formState: { errors } } = useForm<CheckoutAddressValues>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: initialForm,
  });
  const isDefaultSelected = watch("isDefault");
  const selectedStreet = watch("street");
  const selectedLat = watch("lat");
  const selectedLng = watch("lng");
  const selectedCoordinates = useMemo<GoogleLatLngLiteral | null>(() => {
    const lat = Number(selectedLat);
    const lng = Number(selectedLng);

    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }, [selectedLat, selectedLng]);

  useEffect(() => {
    if (!open) return;

    if (editData) {
      reset({
        street: editData.street || "",
        houseNumber: editData.houseNumber || editData.area || "",
        postalCode: editData.postalCode || "",
        city: editData.city || "",
        state: editData.state || "",
        country: editData.country || "",
        area: editData.houseNumber || editData.area || "",
        lat: editData.lat ? String(editData.lat) : "",
        lng: editData.lng ? String(editData.lng) : "",
        isDefault: Boolean(editData.isDefault),
      });
    } else {
      reset(initialForm);
    }
  }, [editData, open, reset]);

  const setAddressValue = useCallback(
    (field: keyof CheckoutAddressValues, value: string | boolean) => {
      setValue(field, value, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [setValue]
  );

  const handleLocationSelect = useCallback(
    (coordinates: GoogleLatLngLiteral, label?: string) => {
      setAddressValue("lat", String(coordinates.lat));
      setAddressValue("lng", String(coordinates.lng));

      if (label) {
        const currentStreet = getValues("street").trim();
        setAddressValue("street", currentStreet || label);
      }
    },
    [getValues, setAddressValue]
  );

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error(t("geolocationUnsupported"));
      return;
    }

    try {
      setLocating(true);

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const lat = position.coords.latitude.toString();
      const lng = position.coords.longitude.toString();

      setAddressValue("lat", lat);
      setAddressValue("lng", lng);

      // Reverse geocoding using OpenStreetMap Nominatim
      // Good for quick integration, but for production use your own geocoding provider/keyed API.
      const data = await reverseGeocode(position.coords.latitude, position.coords.longitude);

      if (!data.ok) {
        toast.success(t("locationFetchedManual"));
        return;
      }

      const address = data.address || {};
      const getAddressValue = (value: unknown) => typeof value === "string" ? value : "";

      const currentValues = getValues();
      setAddressValue("street", data.displayName || currentValues.street || "");
      setAddressValue(
        "area",
        getAddressValue(address.suburb) ||
          getAddressValue(address.neighbourhood) ||
          getAddressValue(address.quarter) ||
          getAddressValue(address.village) ||
          currentValues.area ||
          ""
      );
      setAddressValue("houseNumber", currentValues.houseNumber || currentValues.area || "");
      setAddressValue(
        "city",
        getAddressValue(address.city) ||
          getAddressValue(address.town) ||
          getAddressValue(address.village) ||
          getAddressValue(address.municipality) ||
          currentValues.city ||
          ""
      );
      setAddressValue("state", getAddressValue(address.state) || currentValues.state || "");
      setAddressValue("postalCode", getAddressValue(address.postcode) || currentValues.postalCode || "");
      setAddressValue("country", getAddressValue(address.country) || currentValues.country || "");
      setAddressValue("lat", lat);
      setAddressValue("lng", lng);

      toast.success(t("locationFetched"));
    } catch (error) {

      const geolocationError = error instanceof GeolocationPositionError ? error : null;

      if (geolocationError?.code === 1) {
        toast.error(t("locationPermissionDenied"));
      } else if (geolocationError?.code === 2) {
        toast.error(t("unableDetectLocation"));
      } else if (geolocationError?.code === 3) {
        toast.error(t("locationTimedOut"));
      } else {
        toast.error(t("failedGetLocation"));
      }
    } finally {
      setLocating(false);
    }
  };

  const submitAddress = async (form: CheckoutAddressValues) => {

    try {
      setLoading(true);

      const houseNumber = form.houseNumber.trim();
      const payload = {
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        houseNumber,
        area: houseNumber,
        postalCode: form.postalCode.trim() || undefined,
        lat: form.lat.trim(),
        lng: form.lng.trim(),
        isDefault: Boolean(form.isDefault),
      };

      const res = editData
        ? await patch(`/v1/addresses/${editData.id}`, payload)
        : await post("/v1/addresses", payload);

      if (res?.error) {
        throw new Error(res.error);
      }

      toast.success(editData ? t("addressUpdated") : t("addressAdded"));
      onSuccess?.(getSavedAddress(res));
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : errorT("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="w-[95vw] max-w-[760px] rounded-[28px] border-0 p-0 overflow-hidden bg-white max-h-[95vh] overflow-auto" showCloseButton={false}>
        <div className="h-[4px] w-full bg-[#D91F26]" />

        <div className="px-5 py-5 md:px-8 md:py-8">
          <DialogHeader className="space-y-1 pr-8">
            <DialogTitle className="text-[28px] font-bold leading-tight text-[#171717]">
              {editData ? t("editAddress") : t("addNewAddress")}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#7A7A7A]">
              {editData
                ? t("editDescription")
                : t("addDescription")}
            </DialogDescription>
          </DialogHeader>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-5 top-5 rounded-full p-2 text-[#8C8C8C] transition hover:bg-[#F5F5F5] hover:text-black"
            aria-label={t("closeModal")}
          >
            <X size={18} />
          </button>

          <form noValidate className="mt-6 space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={LABEL_TEXT_CLASS}>
                  {t("quickFill")}
                </p>
                <p className="mt-1 text-[13px] text-[#8A8A8A]">
                  {t("quickFillDescription")}
                </p>
              </div>

              <Button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={locating}
                className="h-[44px] rounded-full bg-[#111111] px-5 text-white hover:bg-[#222222]"
              >
                {locating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("gettingLocation")}
                  </>
                ) : (
                  <>
                    <Navigation className="mr-2 h-4 w-4" />
                    {t("getCurrentLocation")}
                  </>
                )}
              </Button>
            </div>

            <div className="h-px bg-[#ECECEC]" />

            <button
              type="button"
              role="switch"
              aria-checked={isDefaultSelected}
              onClick={() => {
                setValue("isDefault", !isDefaultSelected, {
                  shouldDirty: true,
                  shouldTouch: true,
                });
              }}
              className={`flex w-full items-center justify-between gap-4 rounded-[18px] border p-4 text-left transition ${
                isDefaultSelected
                  ? "border-[#D91F26]/25 bg-[#D91F26]/5"
                  : "border-[#ECECEC] bg-[#FAFAFA] hover:border-[#D7D7D7]"
              }`}
            >
              <span>
                <span className="block text-[14px] font-semibold text-[#202020]">
                  {t("setAsDefault")}
                </span>
                <span className="mt-1 block text-[12px] leading-5 text-[#7A7A7A]">
                  {t("setAsDefaultDescription")}
                </span>
              </span>
              <span
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
                  isDefaultSelected ? "bg-[#D91F26]" : "bg-[#D8D8D8]"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition ${
                    isDefaultSelected ? "translate-x-5" : "translate-x-0"
                  }`}
                >
                  {isDefaultSelected ? (
                    <Check className="h-3.5 w-3.5 text-[#D91F26]" />
                  ) : null}
                </span>
              </span>
            </button>

            <div className="space-y-2">
              <label className={LABEL_TEXT_CLASS}>
                {t("streetAddress")}
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A3A3A3]" />
                <Input
                  placeholder={t("streetPlaceholder")}
                  {...register("street")}
                  className="h-[56px] rounded-[16px] border-0 bg-[#F6F6F6] pl-11 pr-4 text-[15px] shadow-none focus-visible:ring-1 focus-visible:ring-[#D91F26]"
                />
              </div>
              {errors.street?.message ? (
                <p className="text-xs font-medium text-[#D91F26]">{errors.street.message}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr]">
              <div className="space-y-2">
                <label className={LABEL_TEXT_CLASS}>
                  {t("houseNumber")}
                </label>
                <Input
                  placeholder={t("houseNumberPlaceholder")}
                  {...register("houseNumber")}
                  className={INPUT_BASE_CLASS}
                />
              </div>

              <div className="space-y-2">
                <label className={LABEL_TEXT_CLASS}>
                  {t("postalCode")}
                </label>
                <Input
                  placeholder={t("postalCodePlaceholder")}
                  {...register("postalCode")}
                  className={INPUT_BASE_CLASS}
                />
                {errors.postalCode?.message ? (
                  <p className="text-xs font-medium text-[#D91F26]">{errors.postalCode.message}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.25fr_1fr]">
              <div className="space-y-2">
                <label className={LABEL_TEXT_CLASS}>
                  {t("city")}
                </label>
                <Input
                  placeholder={t("cityPlaceholder")}
                  {...register("city")}
                  className={INPUT_BASE_CLASS}
                />
                {errors.city?.message ? (
                  <p className="text-xs font-medium text-[#D91F26]">{errors.city.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className={LABEL_TEXT_CLASS}>
                  {t("state")}
                </label>
                <Input
                  placeholder={t("statePlaceholder")}
                  {...register("state")}
                  className={INPUT_BASE_CLASS}
                />
                {errors.state?.message ? (
                  <p className="text-xs font-medium text-[#D91F26]">{errors.state.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <label className={LABEL_TEXT_CLASS}>
                {t("country")}
              </label>
              <Input
                placeholder={t("countryPlaceholder")}
                {...register("country")}
                className={INPUT_BASE_CLASS}
              />
              {errors.country?.message ? (
                <p className="text-xs font-medium text-[#D91F26]">{errors.country.message}</p>
              ) : null}
            </div>

            <input type="hidden" {...register("area")} />
            <input type="hidden" {...register("lat")} />
            <input type="hidden" {...register("lng")} />

            <div className="rounded-[22px] border border-[#ECECEC] bg-[#FAFAFA] p-4">
              <button
                type="button"
                onClick={() => setLocationPickerOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <span className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#D91F26]/10 text-[#D91F26]">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-[#202020]">
                      {t("mapLocation")}
                    </span>
                    <span className="mt-1 block text-[12px] leading-5 text-[#7A7A7A]">
                      {selectedCoordinates
                        ? t("mapLocationSelected", {
                            lat: selectedCoordinates.lat.toFixed(5),
                            lng: selectedCoordinates.lng.toFixed(5),
                          })
                        : t("mapLocationDescription")}
                    </span>
                  </span>
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-[#7A7A7A] transition ${locationPickerOpen ? "rotate-180" : ""}`}
                />
              </button>

              {errors.lat?.message || errors.lng?.message ? (
                <p className="mt-3 text-xs font-medium text-[#D91F26]">
                  {errors.lat?.message || errors.lng?.message}
                </p>
              ) : null}

              {locationPickerOpen ? (
                <div className="mt-4 rounded-[18px] border border-white bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                  <AddressLocationPicker
                    coordinates={selectedCoordinates}
                    locationLabel={selectedStreet}
                    onSelectLocation={handleLocationSelect}
                    onUseCurrentLocation={handleGetCurrentLocation}
                    isLocating={locating}
                    compact
                    actionsBelow
                    showSelectedLabel
                  />
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#ECECEC] pt-6 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-[52px] rounded-full px-6 text-[#4B4B4B] hover:bg-[#F4F4F4]"
              >
                {commonT("cancel")}
              </Button>

              <Button
                type="button"
                onClick={handleSubmit(submitAddress)}
                disabled={loading || locating}
                className="h-[52px] min-w-[180px] rounded-full bg-[#D91F26] px-8 text-white shadow-[0_12px_30px_rgba(217,31,38,0.28)] hover:bg-[#c61b22]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : editData ? (
                  t("updateAddress")
                ) : (
                  t("saveAddress")
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
