"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, RefreshCw, UsersRound, XCircle } from "lucide-react";
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
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const statusClassName = (status?: string | null) => {
  const normalizedStatus = String(status || "OPEN").toUpperCase();

  if (normalizedStatus === "LOCKED") return "bg-amber-100 text-amber-700 ring-amber-200";
  if (normalizedStatus === "OPEN") return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  return "bg-gray-100 text-gray-700 ring-gray-200";
};

const getOrderTitle = (order: GroupOrder) => {
  const branchName = order.branch?.name || order.restaurant?.name;
  return branchName || `Group order #${String(order.id || "").slice(-6)}`;
};

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
        className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.11)]"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClassName(status)}`}>
              {status}
            </span>
            <h2 className="mt-4 text-xl font-bold text-gray-950">{getOrderTitle(order)}</h2>
            <p className="mt-2 text-sm font-medium text-gray-500">{formatDateTime(order.orderTime)}</p>
            {order.inviteCode ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Code: {order.inviteCode}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/group-order/lobby?groupOrderId=${encodeURIComponent(String(order.id))}`}
              onClick={() => void handleOpenLobby(order)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-white shadow-[0_12px_26px_rgba(206,24,27,0.22)] transition hover:bg-primary/90"
            >
              View lobby
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleCancel(order)}
              disabled={isCancelling}
              className="h-10 rounded-full border-red-100 px-4 text-sm font-bold text-red-600 hover:border-red-200 hover:bg-red-50"
            >
              {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Cancel
            </Button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <main className="min-h-screen bg-[#FAF7F4] px-4 py-10 sm:px-6 lg:px-10">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
              <UsersRound className="h-4 w-4" />
              Group orders
            </div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-gray-950 sm:text-5xl">
              Ongoing group orders
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
              Review your open and locked group orders, jump back into the lobby, or cancel orders that should not continue.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadOrders({ silent: true })}
            disabled={refreshing || loading}
            className="h-11 rounded-full bg-white px-5 font-bold"
          >
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-[150px] animate-pulse rounded-[24px] bg-white shadow-sm" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-xl font-bold text-gray-950">No ongoing group orders</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Open or locked group orders will appear here. Start a new group order when you are ready to invite people.
            </p>
            <Link
              href="/group-order"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-white shadow-[0_12px_26px_rgba(206,24,27,0.22)]"
            >
              Start group order
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-lg font-bold text-gray-950">Open orders ({openOrders.length})</h2>
              <div className="grid gap-4">
                {openOrders.length ? openOrders.map(renderOrder) : (
                  <p className="rounded-2xl bg-white px-4 py-5 text-sm text-gray-500 shadow-sm">No open group orders.</p>
                )}
              </div>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-gray-950">Locked orders ({lockedOrders.length})</h2>
              <div className="grid gap-4">
                {lockedOrders.length ? lockedOrders.map(renderOrder) : (
                  <p className="rounded-2xl bg-white px-4 py-5 text-sm text-gray-500 shadow-sm">No locked group orders.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
