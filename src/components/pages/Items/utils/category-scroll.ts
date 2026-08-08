type CategorySection = {
  id?: string | number | null;
};

export const resolveCategoryNavigation = (
  categoryId?: string | null,
) => ({
  activeCategoryId: String(categoryId || ""),
  viewMode: "onePage" as const,
});

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

export const getCategoryLoadOrder = (
  sections: CategorySection[],
  targetId?: string | null,
) => {
  const categoryIds = sections
    .map((section) => String(section.id || ""))
    .filter(Boolean);
  const targetIndex = targetId
    ? categoryIds.indexOf(String(targetId))
    : -1;

  if (targetIndex <= 0) return categoryIds;

  return [
    categoryIds[targetIndex],
    ...categoryIds.slice(0, targetIndex),
    ...categoryIds.slice(targetIndex + 1),
  ];
};

export const loadCategoryIdsInBatches = async ({
  categoryIds,
  load,
  batchSize = 2,
  shouldContinue = () => true,
}: {
  categoryIds: string[];
  load: (categoryId: string) => Promise<void>;
  batchSize?: number;
  shouldContinue?: () => boolean;
}) => {
  const safeBatchSize = Math.max(1, Math.floor(batchSize));

  for (let index = 0; index < categoryIds.length; index += safeBatchSize) {
    if (!shouldContinue()) return;

    await Promise.all(
      categoryIds.slice(index, index + safeBatchSize).map(load),
    );
  }
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
