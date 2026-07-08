"use client";

import Image from "next/image";
import { Check, Clock, CreditCard, MapPin, Power, ReceiptText, UsersRound } from "lucide-react";
import { useTranslations } from "next-intl";
import type { GroupOrderParticipant, GroupOrderSuccessData } from "@/types/group-order";

type OrderSuccessProps = {
  data?: GroupOrderSuccessData | null;
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (value: unknown) => `$${toNumber(value, 0).toFixed(2)}`;

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    hourCycle: "h23",
  }).format(date);
};

const formatLabel = (value?: string | null) =>
  String(value || "—")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const OrderSuccess = ({ data }: OrderSuccessProps) => {
  const t = useTranslations("groupOrder.success");
  const order = data?.order;
  const session = data?.session;

  const total = order?.payableAmount ?? order?.totalAmount ?? session?.finalOrder?.totalAmount ?? 0;
  const finalOrderId = order?.id || session?.finalOrder?.id || session?.finalOrderId || "";
  const participants = session?.participants || [];
  const items = order?.items || [];
  const couponLabel = order?.coupon?.title || order?.coupon?.code || "";

  return (
    <section className="flex min-h-screen w-full flex-col items-center bg-[#FAFAF9] px-4 py-12 md:px-6">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500">
          <Check className="h-7 w-7 text-white" strokeWidth={5} />
        </div>
      </div>

      <h1 className="text-center text-3xl font-semibold text-gray-900 md:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-center text-sm text-gray-500 md:text-base">
        {t("description")}
      </p>

      <div className="relative mt-10 w-full max-w-6xl overflow-hidden rounded-[28px] bg-white p-5 shadow-[0_12px_32px_rgba(26,28,28,0.06)] md:p-8">
        <div className="absolute right-0 top-0 opacity-50">
          <Image
            src="/group-order/abstract_accent.png"
            alt={t("accentAlt")}
            width={120}
            height={120}
          />
        </div>

        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-[#FAFAF9] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  {t("orderId")}
                </p>
                <p className="mt-1 break-all text-sm font-semibold text-gray-900">
                  {finalOrderId || "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-[#FAFAF9] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  {t("totalPaid")}
                </p>
                <p className="mt-1 text-2xl font-semibold text-orange-500">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <Clock className="h-4 w-4 text-primary" />
                  {t("orderTiming")}
                </div>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {formatDateTime(order?.orderTime)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {order?.isScheduled ? t("scheduledOrder") : t("asap")}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <CreditCard className="h-4 w-4 text-primary" />
                  {t("payment")}
                </div>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {formatLabel(order?.paymentMethod)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatLabel(order?.paymentStatus)}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <MapPin className="h-4 w-4 text-primary" />
                  {t("orderType")}
                </div>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {formatLabel(order?.orderType)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {session?.deliveryAddress ? t("savedAddress") : t("pickupFromRestaurant")}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <ReceiptText className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-gray-900">{t("itemsTitle")}</h2>
              </div>

              {items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={String(item.id || index)} className="rounded-2xl bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {item.menuItemName || t("itemFallback")}
                          </p>
                          {item.variationName ? (
                            <p className="mt-1 text-xs text-gray-500">{item.variationName}</p>
                          ) : null}
                          <p className="mt-1 text-xs text-gray-500">
                            {t("quantity", { count: toNumber(item.quantity, 0) })} · {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-gray-900">
                          {formatCurrency(item.lineTotal)}
                        </p>
                      </div>

                      {item.snapshotModifiers?.length ? (
                        <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                          {item.snapshotModifiers.map((modifier, modifierIndex) => (
                            <div
                              key={`${modifier.modifierId || modifier.name || modifierIndex}`}
                              className="flex items-center justify-between gap-3 text-xs text-gray-600"
                            >
                              <span>
                                {modifier.name || t("addonFallback")} × {toNumber(modifier.quantity, 1)}
                              </span>
                              <span className="font-medium text-gray-800">
                                {formatCurrency(modifier.unitPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t("noItems")}</p>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl bg-[#F3F3F3] p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-primary" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    {t("notifiedMembers")}
                  </p>
                </div>
                <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-medium text-sky-700">
                  {t("trackingShared")}
                </span>
              </div>

              <div className="space-y-4">
                {participants.map((p: GroupOrderParticipant, i: number) => (
                  <div key={String(p.id || i)} className="flex items-center gap-3">
                    <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gray-200">
                      {p?.user?.avatarUrl ? (
                        <Image
                          src={p.user.avatarUrl}
                          alt={p.user.firstName || ""}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {p?.user?.firstName} {p?.user?.lastName}
                      </p>
                      <p className="text-xs text-green-600">{formatLabel(p.status)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">{t("totalsTitle")}</h2>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="flex justify-between"><span>{t("subtotal")}</span><span>{formatCurrency(order?.subtotal)}</span></div>
                {toNumber(order?.taxAmount, 0) > 0 ? <div className="flex justify-between"><span>{t("tax")}</span><span>{formatCurrency(order?.taxAmount)}</span></div> : null}
                {toNumber(order?.deliveryFee, 0) > 0 ? <div className="flex justify-between"><span>{t("deliveryFee")}</span><span>{formatCurrency(order?.deliveryFee)}</span></div> : null}
                {toNumber(order?.discountAmount, 0) > 0 ? <div className="flex justify-between text-green-700"><span>{couponLabel || t("discount")}</span><span>- {formatCurrency(order?.discountAmount)}</span></div> : null}
                {order?.totalBeforeDiscount ? <div className="flex justify-between"><span>{t("totalBeforeDiscount")}</span><span>{formatCurrency(order.totalBeforeDiscount)}</span></div> : null}
              </div>
              <div className="mt-4 flex justify-between border-t border-gray-100 pt-4 text-base font-semibold text-gray-950">
                <span>{t("payable")}</span>
                <span className="text-orange-500">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <button
          onClick={() => {
            if (!finalOrderId) return;
            window.location.href = `/order?orderId=${encodeURIComponent(String(finalOrderId))}`;
          }}
          disabled={!finalOrderId}
          className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 font-medium text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Power className="h-4 w-4" />
          {t("trackOrder")}
        </button>

        <button
          onClick={() => (window.location.href = "/")}
          className="rounded-full border border-gray-300 px-6 py-3 font-medium text-gray-600 transition hover:bg-gray-100"
        >
          {t("backHome")}
        </button>
      </div>
    </section>
  );
};

export default OrderSuccess;
