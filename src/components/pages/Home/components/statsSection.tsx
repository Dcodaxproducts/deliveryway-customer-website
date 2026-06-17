import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/config/query-keys";
import { useAuth } from "@/hooks/useAuth";
import { montserrat } from "@/lib/fonts";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import { fetchBranchStats } from "@/services/public-content";

const compactNumber = (value: number) =>
  new Intl.NumberFormat("en", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);

export default function Stats() {
  const t = useTranslations("home.stats");
  const { user, restaurantId: authRestaurantId } = useAuth();
  const restaurantId = resolveHomeRestaurantId(user, authRestaurantId);
  const branchId = resolveHomeBranchId(user);
  const statsQuery = useQuery({
    queryKey: queryKeys.home.branchStats(restaurantId, branchId),
    queryFn: () => fetchBranchStats(restaurantId, branchId),
    enabled: Boolean(restaurantId),
    staleTime: 5 * 60 * 1000,
  });
  const branchStats = statsQuery.data;
  const stats = [
    {
      labelKey: "completedOrders",
      value: branchStats ? compactNumber(branchStats.completedOrders) : "2M+",
    },
    {
      labelKey: "averageRating",
      value: branchStats?.averageRating
        ? branchStats.averageRating.toFixed(1)
        : "98%",
    },
    {
      labelKey: "activeMenuItems",
      value: branchStats ? compactNumber(branchStats.activeMenuItems) : "20+",
    },
    {
      labelKey: "fiveStarReviews",
      value: branchStats ? compactNumber(branchStats.fiveStarReviews) : "100+",
    },
  ] as const;

  return (
    <section className={`max-w-6xl mx-auto py-12 md:py-16 px-4 ${montserrat.className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center text-primary">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 md:gap-3">
            
            {/* VALUE */}
            <span className="
              text-3xl sm:text-4xl md:text-[56px] 
              font-bold 
              leading-tight md:leading-[66%]
              h-auto md:h-[66px]
            ">
              {stat.value}
            </span>

            {/* LABEL */}
            <span className="
              text-sm sm:text-base md:text-lg 
              font-semibold 
              leading-normal md:leading-[30%]
            ">
              {t(stat.labelKey)}
            </span>

          </div>
        ))}
      </div>
    </section>
  );
}
