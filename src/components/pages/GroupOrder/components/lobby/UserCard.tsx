"use client";

import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useGroupOrderApi } from "@/hooks/useGroupOrder";
import { formatCurrency } from "@/components/pages/Checkout/components/CartSummarySection";
import { getBackendErrorMessage, hasBackendError, toNumber } from "@/components/pages/Checkout/utils/checkout-normalizers";
import type { GroupOrderItem, GroupOrderParticipant, GroupOrderSelectedOption } from "@/types/group-order";
import { isGroupOrderParticipantCompleted } from "@/lib/group-order";

type UserCardProps = {
  participant: GroupOrderParticipant;
  orderId: string | number;
  isHost?: boolean;
  canEdit: boolean;
  onItemQuantityChange: (participantId: string | number, itemId: string | number, quantity: number) => void;
  onItemRemove: (participantId: string | number, itemId: string | number) => void;
};

const getOptionName = (option: GroupOrderSelectedOption) =>
  option.name || option.modifier?.name || option.addOn?.name || option.addon?.name || "";

const getOptionQuantity = (option: GroupOrderSelectedOption) =>
  Math.max(1, toNumber(option.quantity, 1));

const getOptionPrice = (option: GroupOrderSelectedOption) =>
  toNumber(
    option.totalPrice ??
      option.price ??
      option.modifier?.totalPrice ??
      option.modifier?.price ??
      option.addOn?.totalPrice ??
      option.addOn?.price ??
      option.addon?.totalPrice ??
      option.addon?.price,
    0
  );

const getSelectedOptions = (item: GroupOrderItem) => [
  ...(item.selectedAddons || []),
  ...(item.selectedAddOns || []),
  ...(item.addOns || []),
  ...(item.addons || []),
  ...(item.selectedModifiers || []),
  ...(item.modifiers || []),
].filter((option) => getOptionName(option));

const getItemLineTotal = (item: GroupOrderItem) => {
  const explicitTotal = toNumber(item.lineTotal ?? item.totalPrice, NaN);

  if (Number.isFinite(explicitTotal)) return explicitTotal;

  const quantity = Math.max(1, toNumber(item.quantity, 1));
  const unitPrice = toNumber(item.unitPrice ?? item.price ?? item.menuItem?.price, NaN);

  if (!Number.isFinite(unitPrice)) return null;

  const modifiersTotal = toNumber(item.modifiersTotal, 0);

  return (unitPrice + modifiersTotal) * quantity;
};

export function UserCard({ participant, orderId, isHost, canEdit, onItemQuantityChange, onItemRemove }: UserCardProps) {
  const t = useTranslations("groupOrder.lobby.userCard");
  const cartT = useTranslations("cart");
  const { token } = useAuth();
  const { deleteGroupOrderItem, updateGroupOrderItemQuantity } = useGroupOrderApi(token);
  const [pendingItemIds, setPendingItemIds] = useState<Set<string>>(new Set());

  const user = participant?.user;
  const items = participant?.items || [];
  const isCompleted = isGroupOrderParticipantCompleted(participant);

  const handleDelete = async (itemId: string | number) => {
    if (!canEdit) {
      toast.error(t("completedCannotEdit"));
      return;
    }

    const itemKey = String(itemId);

    if (pendingItemIds.has(itemKey)) return;

    setPendingItemIds((current) => new Set(current).add(itemKey));

    try {
      const response = await deleteGroupOrderItem({ orderId, itemId });

      if (hasBackendError(response)) {
        toast.error(getBackendErrorMessage(response, cartT("failedRemoveItem")));
        return;
      }

      onItemRemove(participant.id, itemId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : cartT("failedRemoveItem"));
    } finally {
      setPendingItemIds((current) => {
        const next = new Set(current);
        next.delete(itemKey);
        return next;
      });
    }
  };

  const updateQty = async (item: GroupOrderItem, qty: number) => {
    if (!canEdit) {
      toast.error(t("completedCannotEdit"));
      return;
    }

    if (qty < 1) return;

    const itemKey = String(item.id);
    if (pendingItemIds.has(itemKey)) return;

    const previousQuantity = item.quantity;

    onItemQuantityChange(participant.id, item.id, qty);
    setPendingItemIds((current) => new Set(current).add(itemKey));

    try {
      const response = await updateGroupOrderItemQuantity({ orderId, itemId: item.id, quantity: qty });

      if (hasBackendError(response)) {
        onItemQuantityChange(participant.id, item.id, previousQuantity);
        toast.error(getBackendErrorMessage(response, cartT("failedUpdateQuantity")));
      }
    } catch (err) {
      onItemQuantityChange(participant.id, item.id, previousQuantity);
      toast.error(err instanceof Error ? err.message : cartT("failedUpdateQuantity"));
    } finally {
      setPendingItemIds((current) => {
        const next = new Set(current);
        next.delete(itemKey);
        return next;
      });
    }
  };
  const picking = items.length === 0 && !isCompleted;
const statusLabel = isCompleted ? t("completed") : picking ? t("pickingItems") : t("active");
const statusClassName = isCompleted
  ? "bg-emerald-100 text-emerald-700"
  : picking
  ? "bg-orange-100 text-orange-600"
  : "bg-blue-100 text-blue-700";
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-md border border-gray-100 transition hover:shadow-lg hover:-translate-y-[2px] ${picking ? "border-dashed border-gray-300 bg-gray-50" : ""}`}>

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-full overflow-hidden relative border border-gray-200">
            <Image
              src={user?.avatarUrl || "https://i.pravatar.cc/150"}
              alt={user?.firstName || ""}
              fill
              className="object-cover"
            />
          </div>

          <div>
            <p className="font-semibold text-gray-900">
              {user?.firstName} {user?.lastName} {isHost && t("hostSuffix")}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              {statusLabel}
            </p>
          </div>
        </div>

        <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusClassName}`}>
          {statusLabel}
        </span>
      </div>

      {!picking && (
        <div className="mt-5 space-y-3">
          {items.map((item) => {
            const selectedOptions = getSelectedOptions(item);
            const lineTotal = getItemLineTotal(item);

            return (
            <div key={item.id} className={`flex items-start justify-between gap-3 ${pendingItemIds.has(String(item.id)) ? "opacity-70" : ""}`}>

              <div className="flex min-w-0 items-start gap-3">
                <div className="w-11 h-11 shrink-0 rounded-md overflow-hidden relative border border-gray-200">
                  <Image
                    src={item.menuItem?.imageUrl || "/items/table.png"}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 font-medium">
                    {item.menuItem?.name}
                  </p>
                  {selectedOptions.length > 0 ? (
                    <div className="mt-1 space-y-1 text-xs text-gray-500">
                      {selectedOptions.map((option, index) => {
                        const optionPrice = getOptionPrice(option);

                        return (
                          <p key={`${getOptionName(option)}-${index}`}>
                            {getOptionQuantity(option)}× {getOptionName(option)}
                            {optionPrice > 0 ? ` · ${formatCurrency(optionPrice)}` : ""}
                          </p>
                        );
                      })}
                    </div>
                  ) : null}
                  {lineTotal !== null ? (
                    <p className="mt-1 text-xs font-semibold text-gray-900">
                      {formatCurrency(lineTotal)}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">

                {/* QTY */}
                <div className="flex items-center gap-2 border rounded-full px-2 py-1">
                  <button onClick={() => updateQty(item, item.quantity - 1)}  disabled={!canEdit || pendingItemIds.has(String(item.id))}>
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="text-sm">{item.quantity}</span>

                  <button onClick={() => updateQty(item, item.quantity + 1)}  disabled={!canEdit || pendingItemIds.has(String(item.id))}>
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* DELETE */}
                 <button
  disabled={!canEdit || pendingItemIds.has(String(item.id))}
  onClick={() => handleDelete(item.id)}
  className={`text-red-500 ${(!canEdit || pendingItemIds.has(String(item.id))) && "opacity-40 cursor-not-allowed"}`}
>

                  <Trash2 className="w-4 h-4" />
                </button>

              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
