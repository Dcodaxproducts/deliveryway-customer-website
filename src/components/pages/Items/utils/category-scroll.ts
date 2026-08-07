type CategorySection = {
  id?: string | number | null;
};

export const getCategoryIdsThroughTarget = (
  sections: CategorySection[],
  targetId: string,
) => {
  const categoryIds = sections
    .map((section) => String(section.id || ""))
    .filter(Boolean);
  const targetIndex = categoryIds.indexOf(String(targetId));

  return targetIndex >= 0
    ? categoryIds.slice(0, targetIndex + 1)
    : categoryIds;
};

export const isProgrammaticCategoryTargetReached = ({
  targetTop,
  atBottom,
  scrollMarginTop = 128,
  tolerance = 48,
}: {
  targetTop: number;
  atBottom: boolean;
  scrollMarginTop?: number;
  tolerance?: number;
}) =>
  atBottom || Math.abs(targetTop - scrollMarginTop) <= tolerance;
