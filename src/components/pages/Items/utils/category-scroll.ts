type CategorySection = {
  id?: string | number | null;
  itemCount?: string | number | null;
  itemsCount?: string | number | null;
  _count?: { items?: string | number | null } | null;
};

const toSafeCount = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
};

export const getCategoryPlaceholderCount = (
  section?: CategorySection | null,
  pageLimit = 50,
  fallbackCount = 6,
) => {
  const reportedCount =
    toSafeCount(section?.itemCount) ??
    toSafeCount(section?.itemsCount) ??
    toSafeCount(section?._count?.items);

  return Math.min(pageLimit, reportedCount ?? fallbackCount);
};

export const getProgressiveCategoryLoadCandidates = ({
  visibleCategoryIds,
  programmaticTargetId,
}: {
  visibleCategoryIds: string[];
  programmaticTargetId?: string | null;
}) => {
  if (programmaticTargetId) return [];

  return visibleCategoryIds.filter(Boolean).slice(0, 1);
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

  if (!categoryIds.length) return [];

  return [targetIndex >= 0 ? categoryIds[targetIndex] : categoryIds[0]];
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
