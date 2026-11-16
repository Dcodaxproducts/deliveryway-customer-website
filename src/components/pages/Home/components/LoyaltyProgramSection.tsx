"use client";

import Link from "next/link";
import { Coins, Gift, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerLoyaltyQuery } from "@/hooks/useLoyalty";
import { isCustomerAccountUser } from "@/lib/auth";

const formatPoints = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    Math.max(0, value),
  );

export function LoyaltyProgramSection() {
  const t = useTranslations("home.loyalty");
  const { user, token } = useAuth();
  const isCustomer = isCustomerAccountUser(user);
  const loyaltyQuery = useCustomerLoyaltyQuery({
    token,
    customerId: user?.id,
    enabled: isCustomer,
  });

  if (!isCustomer || !token) return null;

  if (loyaltyQuery.isLoading) {
    return (
      <section
        aria-busy="true"
        aria-label={t("title")}
        className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6"
      >
        <LoadingSkeleton className="h-44 rounded-[28px]" />
      </section>
    );
  }

  const loyalty = loyaltyQuery.data?.loyalty;
  if (!loyalty) return null;

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6" aria-labelledby="loyalty-program-title">
      <div className="overflow-hidden rounded-[28px] border border-primary/15 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_10%,white),white_62%,#fff7ed)] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
              <Sparkles size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{t("eyebrow")}</p>
              <h2 id="loyalty-program-title" className="mt-2 text-2xl font-black text-gray-950 sm:text-3xl">
                {t("title")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">{t("description")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <Coins className="h-5 w-5 text-primary" aria-hidden="true" />
              <p className="mt-3 text-2xl font-black text-gray-950">{formatPoints(loyalty.availablePoints)}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{t("availablePoints")}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <Gift className="h-5 w-5 text-primary" aria-hidden="true" />
              <p className="mt-3 text-2xl font-black text-gray-950">{formatPoints(loyalty.earnedPoints)}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{t("earnedPoints")}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 border-t border-primary/10 pt-5">
          <Link href="/profile" className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">
            {t("viewProgram")}
          </Link>
          <Link href="/checkout" className="inline-flex min-h-11 items-center rounded-full border border-primary/20 bg-white px-5 py-2 text-sm font-semibold text-primary">
            {t("useAtCheckout")}
          </Link>
        </div>
      </div>
    </section>
  );
}
