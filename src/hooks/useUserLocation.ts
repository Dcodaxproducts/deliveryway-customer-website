"use client";

import { useCallback, useEffect, useState } from "react";

import {
  clearStoredDeliveryLocation,
  getStoredDeliveryLocation,
  setStoredDeliveryLocation,
} from "@/lib/delivery-location";
import { isReliableGeolocationAccuracy } from "@/lib/geolocation";
import {
  parseReverseGeocodeAddress,
  reverseGeocode,
} from "@/services/geocoding";
import type { GoogleAddressDetails } from "@/types/google-maps";

export type UserCoordinates = {
  lat: number;
  lng: number;
};

export type LocationPermissionState = "idle" | "requesting" | "granted" | "denied" | "unsupported";

const isBrowser = () => typeof window !== "undefined";

export const useUserLocation = () => {
  const [coordinates, setCoordinates] = useState<UserCoordinates | null>(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [permissionState, setPermissionState] = useState<LocationPermissionState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const storedCoordinates = getStoredDeliveryLocation();

    if (storedCoordinates) {
      setCoordinates(storedCoordinates);
      setLocationLabel(storedCoordinates.label ?? "");
      setPermissionState("granted");
    }
  }, []);

  const acceptCoordinates = useCallback((
    nextCoordinates: UserCoordinates,
    label = "",
    address?: GoogleAddressDetails,
  ) => {
    const nextLocation = {
      ...nextCoordinates,
      label,
      ...(address ? { address } : {}),
    };

    setStoredDeliveryLocation(nextLocation);
    setCoordinates(nextCoordinates);
    setLocationLabel(label);
    setPermissionState("granted");
    setErrorMessage("");
  }, []);

  const clearLocation = useCallback(() => {
    clearStoredDeliveryLocation();
    setCoordinates(null);
    setLocationLabel("");
    setPermissionState("idle");
    setErrorMessage("");
  }, []);

  const requestLocation = useCallback(() => {
    if (!isBrowser() || !navigator.geolocation) {
      setPermissionState("unsupported");
      setErrorMessage("Location is not supported by this browser.");
      return;
    }

    setPermissionState("requesting");
    setErrorMessage("");
    clearStoredDeliveryLocation();
    setCoordinates(null);
    setLocationLabel("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isReliableGeolocationAccuracy(position.coords.accuracy)) {
          setPermissionState("idle");
          setErrorMessage(
            "Your browser returned an approximate location. Please search your address or pick it on the map."
          );
          return;
        }

        const nextCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        reverseGeocode(nextCoordinates.lat, nextCoordinates.lng)
          .then((data) => {
            const parsedAddress = parseReverseGeocodeAddress(
              data.address,
              data.displayName,
            );

            acceptCoordinates(
              nextCoordinates,
              data.displayName || "Current location",
              {
                street: parsedAddress.street,
                houseNumber: parsedAddress.houseNumber,
                postalCode: parsedAddress.postalCode,
                city: parsedAddress.city,
                state: parsedAddress.state,
                country: parsedAddress.country,
              },
            );
          })
          .catch(() => {
            acceptCoordinates(nextCoordinates, "Current location");
          });
      },
      (error) => {
        setPermissionState(error.code === error.PERMISSION_DENIED ? "denied" : "idle");
        setErrorMessage(error.message || "We could not access your location.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 12000,
      }
    );
  }, [acceptCoordinates]);

  return {
    coordinates,
    locationLabel,
    permissionState,
    errorMessage,
    acceptCoordinates,
    requestLocation,
    clearLocation,
  };
};
