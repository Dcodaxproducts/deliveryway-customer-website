"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, Coins, Gift, Loader2, RefreshCcw, Sparkles, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useLoyalty } from "@/hooks/useLoyalty";
import { getApiErrorMessage } from "@/lib/errors";
import type { LoyaltySummary, LoyaltyTransaction } from "@/services/loyalty";

type LoyaltyProgramCardProps = {
  onWalletRedeemed?: () => void;
};

const formatPoints = (value: number) => new Intl.NumberFormat("en-US").format(Math.max(0, Math.round(value)));

const formatCurrency = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Math.max(0, value));

const formatDate = (value: string | null) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getTransactionIcon = (transaction: LoyaltyTransaction) => {
  if (transaction.points < 0 || String(transaction.type).toUpperCase() === "REDEEM") {
    return ArrowDownLeft;
  }

  return ArrowUpRight;
};

const getTransactionTypeKey = (type: string) => {
  const normalizedType = String(type || "").toUpperCase();

  if (normalizedType === "EARN") return "earn";
  if (normalizedType === "REDEEM") return "redeem";
  if (normalizedType === "RESTORE") return "restore";
  if (normalizedType === "ADJUSTMENT") return "adjustment";
  if (normalizedType === "EXPIRE") return "expire";

  return "unknown";
};

export function LoyaltyProgramCard({ onWalletRedeemed }: LoyaltyProgramCardProps) {
  const t = useTranslations("profile.loyalty");
  const { token } = useAuth();
  const { fetchLoyalty, redeemToWallet } = useLoyalty(token);
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [points, setPoints] = useState("");

  const loadLoyalty = useCallback(async () => {
    if (!token) {
      setLoyalty(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { response, loyalty: nextLoyalty } = await fetchLoyalty();

      if (response?.error) {
        toast.error(getApiErrorMessage(response, t("failedLoad")));
        setLoyalty(null);
        return;
      }

      setLoyalty(nextLoyalty);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedLoad"));
      setLoyalty(null);
    } finally {
      setLoading(false);
    }
  }, [fetchLoyalty, t, token]);

  useEffect(() => {
    void loadLoyalty();
  }, [loadLoyalty]);

  const redeemablePoints = useMemo(() => {
    const parsed = Number(points);
    return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
  }, [points]);

  const estimatedWalletValue = redeemablePoints * (loyalty?.redemptionValuePerPoint ?? 0);
  const canRedeem =
    Boolean(loyalty) &&
    redeemablePoints >= (loyalty?.minimumRedeemPoints ?? 0) &&
    redeemablePoints <= (loyalty?.availablePoints ?? 0);

  const handleRedeem = async () => {
    if (!loyalty) return;

    if (redeemablePoints < loyalty.minimumRedeemPoints) {
      toast.error(t("minimumRedeemError", { points: loyalty.minimumRedeemPoints }));
      return;
    }

    if (redeemablePoints > loyalty.availablePoints) {
      toast.error(t("insufficientPoints"));
      return;
    }

    try {
      setRedeeming(true);
      const { response, redemption } = await redeemToWallet(redeemablePoints);

      if (response?.error) {
        toast.error(getApiErrorMessage(response, t("redeemFailed")));
        return;
      }

      toast.success(
        t("redeemedSuccess", {
          amount: formatCurrency(redemption?.redeemedAmount ?? estimatedWalletValue, redemption?.currency ?? "USD"),
        })
      );
      setPoints("");
      await loadLoyalty();
      window.dispatchEvent(new Event("wallet-updated"));
      onWalletRedeemed?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("redeemFailed"));
    } finally {
      setRedeeming(false);
    }
  };

  const recentHistory = loyalty?.history.slice(0, 5) ?? [];

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-black/5 bg-[#111827] p-6 text-white shadow-[0_22px_70px_rgba(17,24,39,0.18)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent)]" />

      <div className="relative">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
              <Sparkles size={13} />
              {t("eyebrow")}
            </div>
            <h3 className="mt-4 text-[28px] font-semibold leading-tight md:text-[34px]">
              {t("title")}
            </h3>
            <p className="mt-2 max-w-[520px] text-sm leading-6 text-white/68">
              {t("description")}
            </p>
          </div>

          <Button
            type="button"
            onClick={() => void loadLoyalty()}
            disabled={loading}
            className="h-10 rounded-full border border-white/15 bg-white/10 px-4 text-white hover:bg-white/15"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            {t("refresh")}
          </Button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <MetricCard
            icon={<Trophy size={18} />}
            label={t("availablePoints")}
            value={loading ? t("loading") : formatPoints(loyalty?.availablePoints ?? 0)}
          />
          <MetricCard
            icon={<ArrowUpRight size={18} />}
            label={t("earnedPoints")}
            value={loading ? t("loading") : formatPoints(loyalty?.earnedPoints ?? 0)}
          />
          <MetricCard
            icon={<Gift size={18} />}
            label={t("redeemedPoints")}
            value={loading ? t("loading") : formatPoints(loyalty?.redeemedPoints ?? 0)}
          />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[20px] border border-white/10 bg-white/[0.07] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                <Coins size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold">{t("convertTitle")}</p>
                <p className="mt-1 text-xs leading-5 text-white/60">
                  {t("convertDescription", {
                    minimum: formatPoints(loyalty?.minimumRedeemPoints ?? 0),
                    value: formatCurrency(loyalty?.redemptionValuePerPoint ?? 0, "USD"),
                  })}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input
                type="number"
                min={0}
                value={points}
                onChange={(event) => setPoints(event.target.value)}
                placeholder={t("pointsPlaceholder")}
                className="h-12 rounded-full border-white/10 bg-white/95 text-gray-900"
              />
              <Button
                type="button"
                onClick={handleRedeem}
                disabled={loading || redeeming || !canRedeem}
                className="h-12 rounded-full bg-white px-6 font-semibold text-gray-950 hover:bg-white/90"
              >
                {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {redeeming ? t("redeeming") : t("redeem")}
              </Button>
            </div>

            {redeemablePoints > 0 ? (
              <p className="mt-3 text-xs font-medium text-white/75">
                {t("estimatedWalletCredit", { amount: formatCurrency(estimatedWalletValue, "USD") })}
              </p>
            ) : null}
          </div>

          <div className="rounded-[20px] border border-white/10 bg-white/[0.07] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{t("recentActivity")}</p>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/70">
                {t("historyCount", { count: loyalty?.history.length ?? 0 })}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {loading ? (
                <p className="text-sm text-white/60">{t("loading")}</p>
              ) : recentHistory.length ? (
                recentHistory.map((transaction) => (
                  <HistoryRow key={transaction.id} transaction={transaction} />
                ))
              ) : (
                <p className="rounded-2xl bg-white/8 p-4 text-sm text-white/60">
                  {t("emptyHistory")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.08] p-4">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
        {icon}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function HistoryRow({ transaction }: { transaction: LoyaltyTransaction }) {
  const t = useTranslations("profile.loyalty");
  const Icon = getTransactionIcon(transaction);
  const isDebit = transaction.points < 0;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.08] p-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        isDebit ? "bg-amber-400/15 text-amber-200" : "bg-emerald-400/15 text-emerald-200"
      }`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">
          {transaction.note || t(`types.${getTransactionTypeKey(transaction.type)}`)}
        </p>
        <p className="mt-0.5 text-xs text-white/50">{formatDate(transaction.createdAt)}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${isDebit ? "text-amber-200" : "text-emerald-200"}`}>
          {transaction.points > 0 ? "+" : ""}
          {transaction.points}
        </p>
        <p className="mt-0.5 text-[11px] text-white/45">
          {t("balanceAfter", { points: formatPoints(transaction.balanceAfter) })}
        </p>
      </div>
    </div>
  );
}
