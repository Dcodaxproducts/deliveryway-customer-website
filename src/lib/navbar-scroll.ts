type NavbarVisibilityInput = {
  currentScrollY: number;
  lastScrollY: number;
  currentVisible: boolean;
  hasOpenOverlay: boolean;
};

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
