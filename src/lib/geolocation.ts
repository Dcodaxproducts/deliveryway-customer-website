export const MAX_RELIABLE_GEOLOCATION_ACCURACY_METERS = 1000;

export const isReliableGeolocationAccuracy = (
  accuracy: number | null | undefined
) =>
  typeof accuracy === "number" &&
  Number.isFinite(accuracy) &&
  accuracy >= 0 &&
  accuracy <= MAX_RELIABLE_GEOLOCATION_ACCURACY_METERS;
