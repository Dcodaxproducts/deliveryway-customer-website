import type { Order } from "@/services/orders";

const normalize = (value?: string | null) => String(value || "").toUpperCase();

export const isStripeOrder = (order?: Pick<Order, "paymentMethod"> | null) =>
  normalize(order?.paymentMethod) === "STRIPE";

export const isOnlinePaymentOrder = (
  order?: Pick<Order, "paymentMethod"> | null,
) => ["STRIPE", "PAYPAL"].includes(normalize(order?.paymentMethod));

export const getPaymentStatusTranslationKey = (
  paymentStatus?: string | null,
  paymentMethod?: string | null,
) => {
  const status = normalize(paymentStatus);

  if (status === "PAID") {
    return ["STRIPE", "PAYPAL"].includes(normalize(paymentMethod))
      ? "paymentStatus.onlinePaid"
      : "paymentStatus.paid";
  }

  if (status === "FAILED") return "paymentStatus.failed";
  if (status === "CANCELLED") return "paymentStatus.cancelled";
  if (status === "PENDING") return "paymentStatus.pending";
  return "paymentStatus.unknown";
};

export const isPendingOnlinePaymentOrder = (
  order?: Pick<Order, "paymentStatus" | "status"> | null,
) =>
  normalize(order?.status) === "PAYMENT_PENDING" &&
  normalize(order?.paymentStatus) === "PENDING";

export const isPaymentPendingStripeOrder = (
  order?: Pick<Order, "paymentMethod" | "paymentStatus" | "status"> | null,
) => isStripeOrder(order) && isPendingOnlinePaymentOrder(order);

export const isPaymentPendingOnlineOrder = (
  order?: Pick<Order, "paymentMethod" | "paymentStatus" | "status"> | null,
) => isOnlinePaymentOrder(order) && isPendingOnlinePaymentOrder(order);

export const isPlacedPaidOrder = (
  order?: Pick<Order, "paymentMethod" | "paymentStatus" | "status"> | null,
) => {
  if (!order) return false;

  if (!isStripeOrder(order)) {
    return normalize(order.status) === "PLACED";
  }

  return (
    normalize(order.status) === "PLACED" &&
    normalize(order.paymentStatus) === "PAID"
  );
};
