export const hasStreetName = (value: unknown): value is string =>
  typeof value === "string" && /\p{L}/u.test(value.trim());
