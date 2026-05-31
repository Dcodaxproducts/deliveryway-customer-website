import type { Branding } from "@/types/branding";

export type HomeRestaurant = {
  id?: string | null;
  name?: string | null;
  tagline?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  heroImageUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  fontFamily?: string | null;
};

export type HomeBranch = {
  id?: string | null;
  name?: string | null;
  restaurantId?: string | null;
  address?: unknown;
  settings?: unknown;
};

export type HomeConfig = {
  currency?: string | null;
  branding?: unknown;
};

export type CustomerHomeData = {
  restaurant?: HomeRestaurant | null;
  config?: HomeConfig | null;
  branch?: HomeBranch | null;
  landingPopup?: unknown | null;
  cuisines: unknown[];
  promotionalItems: unknown[];
  faqs: unknown[];
  branding: Branding;
};

export type CustomerHomeResponse = {
  data: CustomerHomeData;
};
