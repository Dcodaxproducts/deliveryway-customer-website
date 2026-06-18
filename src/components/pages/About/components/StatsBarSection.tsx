"use client";

import { useTranslations } from "next-intl";

export default function StatsBarSection() {
  const t = useTranslations("about.whyChooseUs");

  const stats = [
    { value: "2M+", label: t("happyCustomers") },
    { value: "98%", label: t("satisfaction") },
    { value: "20+", label: t("branches") },
    { value: "100+", label: t("employees") },
  ];

  return (
    <section className="bg-[#2b2b2b] py-12">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((item) => (
          <div key={item.label}>
            <h3 className="text-[#FF5A2C] text-2xl md:text-3xl font-semibold">
              {item.value}
            </h3>

            <p className="mt-2 text-xs tracking-widest uppercase text-white/70">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
