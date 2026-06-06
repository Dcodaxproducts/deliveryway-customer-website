"use client";

import { useCallback, useEffect, useState } from "react";

import { safeGetLocalStorageItem, safeRemoveLocalStorageItem, safeSetLocalStorageItem } from "@/lib/browser-storage";

export type UserCoordinates = {
  lat: number;
  lng: number;
};

export type LocationPermissionState = "idle" | "requesting" | "granted" | "denied" | "unsupported";

const USER_LOCATION_STORAGE_KEY = "deliveryway:last-user-location";

const isBrowser = () => typeof window !== "undefined";

const isCoordinates = (value: unknown): value is UserCoordinates => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.lat === "number" && Number.isFinite(record.lat) && typeof record.lng === "number" && Number.isFinite(record.lng);
};

const readStoredCoordinates = () => {
  const stored = safeGetLocalStorageItem(USER_LOCATION_STORAGE_KEY);

  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    return isCoordinates(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const saveCoordinates = (coordinates: UserCoordinates) => {
  safeSetLocalStorageItem(USER_LOCATION_STORAGE_KEY, JSON.stringify(coordinates));
};

export const useUserLocation = () => {
  const [coordinates, setCoordinates] = useState<UserCoordinates | null>(null);
  const [permissionState, setPermissionState] = useState<LocationPermissionState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const storedCoordinates = readStoredCoordinates();

    if (storedCoordinates) {
      setCoordinates(storedCoordinates);
      setPermissionState("granted");
    }
  }, []);

  const clearLocation = useCallback(() => {
    safeRemoveLocalStorageItem(USER_LOCATION_STORAGE_KEY);
    setCoordinates(null);
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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        saveCoordinates(nextCoordinates);
        setCoordinates(nextCoordinates);
        setPermissionState("granted");
      },
      (error) => {
        setPermissionState(error.code === error.PERMISSION_DENIED ? "denied" : "idle");
        setErrorMessage(error.message || "We could not access your location.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5 * 60 * 1000,
        timeout: 12000,
      }
    );
  }, []);

  return {
    coordinates,
    permissionState,
    errorMessage,
    requestLocation,
    clearLocation,
  };
};
