"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Headphones,
  Loader2,
  LockKeyhole,
  MessageSquare,
  RefreshCw,
  Store,
  UsersRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cancelGroupOrder, fetchGroupOrderById, fetchGroupOrders } from "@/services/group-orders";
import { setStoredGroupOrderCode } from "@/lib/group-order";
import type { GroupOrder } from "@/types/group-order";

const BAG_IMAGE_SRC = "/bag.png";

const formatDateTime = (value?: string | null) => {
  if (!value) return "Instant order";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Scheduled order";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getOrderTitle = (order: GroupOrder) => {
  const branchName = order.branch?.name || order.restaurant?.name;
  return branchName || `Group order #${String(order.id || "").slice(-6)}`;
};

function HeroBagImage() {
  return (
    <div className="hidden items-center justify-center lg:flex">
      <img
        src={BAG_IMAGE_SRC}
        alt="Group orders"
        className="h-auto w-[230px] object-contain xl:w-[260px]"
        draggable={false}
      />
    </div>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-[12px] bg-primary/[0.08] text-primary">
        {icon}
      </span>
      <h2 className="text-[18px] font-black leading-none text-gray-950">{title}</h2>
    </div>
  );
}

function EmptyLockedState() {
  return (
    <div className="relative overflow-hidden rounded-[16px] border border-dashed border-gray-300 bg-white px-5 py-5">
      <div className="relative z-10 flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
          <LockKeyhole className="h-6 w-6" />
        </span>
        <div>
          <h3 className="text-base font-black text-gray-950">No locked group orders</h3>
          <p className="mt-1 text-sm font-medium text-gray-500">Locked orders will appear here.</p>
        </div>
      </div>
      <div className="absolute bottom-0 right-16 hidden h-16 w-28 rounded-t-full bg-violet-100/70 md:block" />
      <LockKeyhole className="absolute bottom-5 right-24 hidden h-8 w-8 text-violet-500 md:block" />
      <span className="absolute right-20 top-6 hidden text-lg font-black text-violet-300 md:block">+</span>
      <span className="absolute right-36 top-9 hidden text-xs font-black text-violet-200 md:block">+</span>
      <span className="absolute bottom-10 right-9 hidden text-lg font-black text-violet-300 md:block">+</span>
    </div>
  );
}

export function OngoingGroupOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<GroupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const openOrders = useMemo(
    () => orders.filter((order) => String(order.status || "").toUpperCase() === "OPEN"),
    [orders]
  );
  const lockedOrders = useMemo(
    () => orders.filter((order) => String(order.status || "").toUpperCase() === "LOCKED"),
    [orders]
  );

  const loadOrders = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const { response, groupOrders } = await fetchGroupOrders(token);

      if (!response || response.error) {
        toast.error(response?.message || response?.error || "Unable to load group orders.");
        return;
      }

      setOrders(groupOrders);
    } catch {
      toast.error("Unable to load group orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleOpenLobby = async (order: GroupOrder) => {
    if (order.inviteCode) {
      setStoredGroupOrderCode(order.inviteCode);
    }

    if (!order.id || !token) return;

    try {
      await fetchGroupOrderById({ orderId: order.id, token });
    } catch {
      // Lobby will perform its own detail fetch; this is only a warmup.
    }
  };

  const handleCancel = async (order: GroupOrder) => {
    if (!order.id) return;

    const confirmed = window.confirm("Cancel this group order?");
    if (!confirmed) return;

    try {
      setCancellingId(String(order.id));
      const response = await cancelGroupOrder({ orderId: order.id, token });

      if (!response || response.error) {
        toast.error(response?.message || response?.error || "Unable to cancel group order.");
        return;
      }

      toast.success("Group order cancelled.");
      await loadOrders({ silent: true });
    } catch {
      toast.error("Unable to cancel group order.");
    } finally {
      setCancellingId(null);
    }
  };

  const renderOrder = (order: GroupOrder) => {
    const status = String(order.status || "OPEN").toUpperCase();
    const isCancelling = cancellingId === String(order.id);

    return (
      <article
        key={String(order.id)}
        className="overflow-hidden rounded-[16px] border border-gray-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
      >
        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex min-w-0 items-center gap-5 border-l-[2px] border-emerald-500 px-6 py-5">
            <div className="hidden size-[84px] shrink-0 items-center justify-center rounded-[16px] bg-emerald-50 text-emerald-600 sm:flex">
              <Store className="h-10 w-10" strokeWidth={2.4} />
            </div>

            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[12px] font-black uppercase leading-none text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-500" />
                {status}
              </span>

              <h3 className="mt-3 truncate text-[21px] font-black leading-tight tracking-[-0.03em] text-gray-950">
                {getOrderTitle(order)}
              </h3>

              <p className="mt-2 flex flex-wrap items-center gap-2 text-[14px] font-semibold text-gray-500">
                <CalendarDays className="h-4 w-4" />
                {formatDateTime(order.orderTime)}
              </p>

              {order.inviteCode ? (
                <p className="mt-3 flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.14em] text-gray-500">
                  Code:
                  <span className="rounded-[10px] bg-gray-100 px-3 py-1.5 text-[13px] tracking-normal text-gray-950 shadow-sm">
                    {order.inviteCode}
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col justify-center gap-3 border-t border-gray-200 px-6 py-5 lg:border-l lg:border-t-0">
            <Link
              href={`/group-order/lobby?groupOrderId=${encodeURIComponent(String(order.id))}`}
              onClick={() => void handleOpenLobby(order)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-black text-white shadow-[0_12px_22px_rgba(206,24,27,0.20)] transition hover:-translate-y-0.5 hover:bg-primary/90"
            >
              View lobby
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Button
              type="button"
              variant="outline"
              onClick={() => void handleCancel(order)}
              disabled={isCancelling}
              className="h-11 rounded-full border-primary/35 bg-white px-6 text-[14px] font-black text-primary hover:border-primary hover:bg-primary/[0.04]"
            >
              {isCancelling ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <XCircle className="mr-2 h-5 w-5" />}
              Cancel order
            </Button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <main className="min-h-screen bg-[#f7f7f7] px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1280px] overflow-hidden rounded-[22px] bg-white px-6 py-8 shadow-[0_14px_50px_rgba(15,23,42,0.06)] sm:px-9 lg:px-12">
        <div className="mb-8 grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_280px_140px] xl:grid-cols-[minmax(0,1fr)_320px_140px]">
          <div className="min-w-0">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/[0.09] px-4 py-2 text-[14px] font-black text-primary">
              <UsersRound className="h-4 w-4" />
              Group orders
            </div>

            <h1 className="max-w-[680px] text-[38px] font-black leading-[1.04] tracking-[-0.06em] text-gray-950 sm:text-[48px] lg:text-[52px]">
              Ongoing <span className="text-primary">group orders</span>
            </h1>

            <p className="mt-5 max-w-[600px] text-[16px] font-medium leading-7 text-gray-500">
              Review your open and locked group orders, jump back into the lobby, or cancel orders that should not continue.
            </p>
          </div>

          <HeroBagImage />

          <div className="flex justify-start lg:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadOrders({ silent: true })}
              disabled={refreshing || loading}
              className="h-12 min-w-[130px] rounded-[14px] border-gray-200 bg-white px-5 text-[15px] font-black text-primary shadow-sm hover:border-primary/40 hover:bg-primary/[0.04]"
            >
              {refreshing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-[160px] animate-pulse rounded-[18px] bg-gray-100" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-gray-200 bg-gray-50 px-6 py-14 text-center">
            <h2 className="text-xl font-black text-gray-950">No ongoing group orders</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Open or locked group orders will appear here. Start a new group order when you are ready to invite people.
            </p>
            <Link
              href="/group-order"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-black text-white shadow-[0_12px_26px_rgba(206,24,27,0.22)]"
            >
              Start group order
            </Link>
          </div>
        ) : (
          <div className="space-y-7">
            <section>
              <SectionHeading icon={<CalendarDays className="h-5 w-5" />} title={`Open orders (${openOrders.length})`} />
              <div className="grid gap-4">
                {openOrders.length ? openOrders.map(renderOrder) : (
                  <p className="rounded-[18px] bg-gray-50 px-6 py-5 text-sm font-semibold text-gray-500">No open group orders.</p>
                )}
              </div>
            </section>

            <section>
              <SectionHeading icon={<LockKeyhole className="h-5 w-5" />} title={`Locked orders (${lockedOrders.length})`} />
              <div className="grid gap-4">
                {lockedOrders.length ? lockedOrders.map(renderOrder) : <EmptyLockedState />}
              </div>
            </section>

            <section className="grid gap-4 rounded-[16px] border border-primary/15 bg-primary/[0.045] px-5 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/[0.08] text-primary">
                <Headphones className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-[18px] font-black leading-tight text-gray-950">Need help with a group order?</h2>
                <p className="mt-1 text-[14px] font-medium text-gray-500">If you have any issues or questions, our support team is here to help.</p>
              </div>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-primary/40 bg-white px-5 text-[14px] font-black text-primary transition hover:bg-primary/[0.04]"
              >
                <MessageSquare className="h-4 w-4" />
                Contact Support
              </Link>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
