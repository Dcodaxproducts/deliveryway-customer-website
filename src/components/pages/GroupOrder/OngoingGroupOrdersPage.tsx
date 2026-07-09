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
  ShoppingBag,
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

function HeroIllustration() {
  return (
    <div className="relative hidden h-[230px] min-w-[340px] items-end justify-center lg:flex">
      <div className="absolute right-12 top-3 h-44 w-44 rounded-full bg-primary/10" />
      <div className="absolute right-0 top-24 h-32 w-32 rounded-full bg-primary/5" />
      <div className="absolute bottom-4 left-8 h-10 w-10 rounded-full bg-emerald-100" />
      <div className="absolute bottom-12 left-1 h-8 w-3 rounded-full bg-green-500" />
      <div className="absolute bottom-12 left-8 h-8 w-3 rounded-full bg-lime-500" />
      <div className="relative z-10 flex items-end gap-3">
        <div className="flex h-36 w-28 items-center justify-center rounded-b-2xl rounded-t-[8px] border border-primary/10 bg-white shadow-[0_24px_55px_rgba(15,23,42,0.12)]">
          <UsersRound className="h-12 w-12 text-primary/20" />
          <span className="absolute -top-5 h-14 w-14 rounded-t-full border-x-4 border-t-4 border-[#6F2E23]" />
        </div>
        <div className="h-32 w-20 rounded-b-2xl rounded-t-[8px] bg-primary shadow-[0_24px_55px_rgba(206,24,27,0.20)]" />
      </div>
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
    <div className="mb-4 flex items-center gap-4">
      <span className="flex size-11 items-center justify-center rounded-[14px] bg-primary/8 text-primary">
        {icon}
      </span>
      <h2 className="text-xl font-black text-gray-950">{title}</h2>
    </div>
  );
}

function EmptyLockedState() {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-dashed border-gray-300 bg-white px-7 py-8 shadow-sm">
      <div className="flex items-center gap-5">
        <span className="flex size-20 items-center justify-center rounded-full bg-violet-100 text-violet-600">
          <LockKeyhole className="h-9 w-9" />
        </span>
        <div>
          <h3 className="text-lg font-black text-gray-950">No locked group orders</h3>
          <p className="mt-1 text-sm text-gray-500">Locked orders will appear here.</p>
        </div>
      </div>
      <div className="absolute bottom-2 right-12 hidden h-24 w-36 rounded-t-full bg-violet-100/70 md:block" />
      <LockKeyhole className="absolute bottom-8 right-24 hidden h-12 w-12 text-violet-500 md:block" />
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
        className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-[0_22px_50px_rgba(15,23,42,0.10)]"
      >
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex min-w-0 items-center gap-8 border-l-[3px] border-emerald-500 px-8 py-8">
            <div className="hidden size-32 shrink-0 items-center justify-center rounded-[18px] bg-emerald-50 text-emerald-600 sm:flex">
              <Store className="h-16 w-16" />
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-500" />
                {status}
              </span>
              <h3 className="mt-5 truncate text-2xl font-black text-gray-950">{getOrderTitle(order)}</h3>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-500">
                <CalendarDays className="h-4 w-4" />
                {formatDateTime(order.orderTime)}
              </p>
              {order.inviteCode ? (
                <p className="mt-4 text-sm font-black uppercase tracking-[0.14em] text-gray-500">
                  Code: <span className="rounded-xl bg-gray-100 px-4 py-2 tracking-normal text-gray-950">{order.inviteCode}</span>
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col justify-center gap-5 border-t border-gray-200 px-8 py-7 lg:border-l lg:border-t-0">
            <Link
              href={`/group-order/lobby?groupOrderId=${encodeURIComponent(String(order.id))}`}
              onClick={() => void handleOpenLobby(order)}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-primary px-8 text-base font-black text-white shadow-[0_16px_32px_rgba(206,24,27,0.24)] transition hover:-translate-y-0.5 hover:bg-primary/90"
            >
              View lobby
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleCancel(order)}
              disabled={isCancelling}
              className="h-14 rounded-full border-primary/30 bg-white px-8 text-base font-black text-primary hover:border-primary hover:bg-primary/5"
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
    <main className="min-h-screen bg-[#F7F7F7] px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1480px] overflow-hidden rounded-[28px] bg-white px-6 py-10 shadow-[0_18px_60px_rgba(15,23,42,0.07)] sm:px-10 lg:px-16">
        <div className="mb-10 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-black text-primary">
              <UsersRound className="h-4 w-4" />
              Group orders
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-[-0.06em] text-gray-950 sm:text-6xl">
              Ongoing <span className="text-primary">group orders</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-500">
              Review your open and locked group orders, jump back into the lobby, or cancel orders that should not continue.
            </p>
          </div>
          <HeroIllustration />
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadOrders({ silent: true })}
            disabled={refreshing || loading}
            className="h-14 rounded-[16px] bg-white px-7 text-base font-black text-primary shadow-sm hover:border-primary/40 hover:bg-primary/5"
          >
            {refreshing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-[190px] animate-pulse rounded-[22px] bg-gray-100" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
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
          <div className="space-y-9">
            <section>
              <SectionHeading icon={<CalendarDays className="h-5 w-5" />} title={`Open orders (${openOrders.length})`} />
              <div className="grid gap-5">
                {openOrders.length ? openOrders.map(renderOrder) : (
                  <p className="rounded-[22px] bg-gray-50 px-6 py-6 text-sm font-semibold text-gray-500">No open group orders.</p>
                )}
              </div>
            </section>

            <section>
              <SectionHeading icon={<LockKeyhole className="h-5 w-5" />} title={`Locked orders (${lockedOrders.length})`} />
              <div className="grid gap-5">
                {lockedOrders.length ? lockedOrders.map(renderOrder) : <EmptyLockedState />}
              </div>
            </section>

            <section className="grid gap-5 rounded-[18px] border border-primary/15 bg-primary/5 px-6 py-6 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Headphones className="h-8 w-8" />
              </span>
              <div>
                <h2 className="text-xl font-black text-gray-950">Need help with a group order?</h2>
                <p className="mt-1 text-sm text-gray-500">If you have any issues or questions, our support team is here to help.</p>
              </div>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] border border-primary/40 bg-white px-6 text-sm font-black text-primary transition hover:bg-primary/5"
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
