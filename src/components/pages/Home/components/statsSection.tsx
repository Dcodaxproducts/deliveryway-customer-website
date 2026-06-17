import { useTranslations } from "next-intl";

import { montserrat } from "@/lib/fonts";

const stats = [
  { labelKey: "happyCustomers", value: "2M+" },
  { labelKey: "customerSatisfaction", value: "98%" },
  { labelKey: "branches", value: "20+" },
  { labelKey: "employees", value: "100+" },
] as const;

export default function Stats() {
  const t = useTranslations("home.stats");

  return (
    <section className={`mx-auto max-w-[1400px] px-4 py-12 md:py-16 ${montserrat.className}`}>
      <div className="grid grid-cols-2 gap-4 rounded-[34px] border border-red-100/80 bg-[#fff8f4] p-4 text-center text-primary shadow-[0_22px_70px_rgba(206,24,27,0.08)] md:grid-cols-4 md:gap-6 md:p-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 rounded-[26px] bg-white px-4 py-6 shadow-sm md:gap-3">
            
            {/* VALUE */}
            <span className="
              text-3xl sm:text-4xl md:text-[50px]
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
