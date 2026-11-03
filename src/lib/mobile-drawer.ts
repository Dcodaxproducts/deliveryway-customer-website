export type BodyScrollStyles = { overflow: string; paddingRight: string };

export const captureBodyScrollStyles = (style: BodyScrollStyles): BodyScrollStyles => ({
  overflow: style.overflow,
  paddingRight: style.paddingRight,
});

export const restoreBodyScrollStyles = (
  style: BodyScrollStyles,
  previous: BodyScrollStyles,
) => {
  style.overflow = previous.overflow;
  style.paddingRight = previous.paddingRight;
};

export const resolveDrawerKeyAction = (input: {
  key: string;
  shiftKey: boolean;
  activeIndex: number;
  focusableCount: number;
}) => {
  if (input.key === "Escape") return "close" as const;
  if (input.key !== "Tab" || input.focusableCount === 0) return "none" as const;
  if (input.shiftKey && input.activeIndex === 0) return "focus-last" as const;
  if (!input.shiftKey && input.activeIndex === input.focusableCount - 1) {
    return "focus-first" as const;
  }
  return "none" as const;
};

export const getNavbarStickyOffset = (height: number) => `${Math.max(0, height)}px`;
