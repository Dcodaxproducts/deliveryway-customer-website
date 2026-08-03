"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAuthContext } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useCheckout } from "@/hooks/useCheckout";
import { dispatchCartChanged } from "@/lib/cart-events";
import { getBackendErrorMessage, hasBackendError } from "@/components/pages/Checkout/utils/checkout-normalizers";

function PaypalReturnContent() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user, loading } = useAuthContext();
  const { post } = useCheckout(token);
  const { clearCustomerCart } = useCart(token);
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || started.current) return;
    const orderId = searchParams.get("orderId");
    const paypalOrderId = searchParams.get("token");

    if (!token || !orderId || !paypalOrderId) {
      setError(t("paypalReturnInvalid"));
      return;
    }

    started.current = true;
    void (async () => {
      const response = await post(
        `/v1/payments/orders/${orderId}/paypal/capture`,
        { paypalOrderId },
      );
      if (hasBackendError(response) || response?.success === false) {
        setError(getBackendErrorMessage(response, t("paypalCaptureFailed")));
        return;
      }

      if (user?.id) {
        await clearCustomerCart({ customerId: String(user.id) });
      }
      dispatchCartChanged({ itemCount: 0 });
      window.dispatchEvent(new Event("loyalty-updated"));
      router.replace(`/order?success=true&orderId=${orderId}`);
    })().catch((reason: unknown) => {
      setError(
        reason instanceof Error ? reason.message : t("paypalCaptureFailed"),
      );
    });
  }, [
    clearCustomerCart,
    loading,
    post,
    router,
    searchParams,
    t,
    token,
    user?.id,
  ]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center p-6">
      <div className="w-full rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        {error ? (
          <>
            <h1 className="text-xl font-semibold text-red-700">{t("paypalCaptureFailed")}</h1>
            <p className="mt-3 text-sm text-gray-600">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <h1 className="mt-4 text-xl font-semibold">{t("paypalProcessing")}</h1>
            <p className="mt-2 text-sm text-gray-500">{t("paypalProcessingDescription")}</p>
          </>
        )}
      </div>
    </main>
  );
}

export default function PaypalReturnPage() {
  return (
    <Suspense fallback={null}>
      <PaypalReturnContent />
    </Suspense>
  );
}
