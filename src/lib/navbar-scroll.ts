type NavbarVisibilityInput = {
  currentScrollY: number;
  lastScrollY: number;
  currentVisible: boolean;
  hasOpenOverlay: boolean;
};

type ResponsiveNavbarVisibilityInput = NavbarVisibilityInput & {
  isMobileViewport: boolean;
};

export const MOBILE_NAVBAR_MEDIA_QUERY = "(max-width: 767px)";

export const resolveNavbarVisibility = ({
  currentScrollY,
  lastScrollY,
  currentVisible,
  hasOpenOverlay,
}: NavbarVisibilityInput) => {
  if (currentScrollY <= 24 || hasOpenOverlay) return true;

  const scrollDelta = currentScrollY - lastScrollY;

  if (scrollDelta > 2) return false;
  if (scrollDelta < -2) return true;

  return currentVisible;
};


export const resolveResponsiveNavbarVisibility = ({
  isMobileViewport,
  ...visibilityInput
}: ResponsiveNavbarVisibilityInput) =>
  isMobileViewport ? true : resolveNavbarVisibility(visibilityInput);
