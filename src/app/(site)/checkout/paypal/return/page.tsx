"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { API_BASE_URL } from "@/lib/axios";

function PaypalReturnContent() {
  const t = useTranslations("checkout");
  const searchParams = useSearchParams();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;

    const orderId = searchParams.get("orderId");
    const paypalOrderId = searchParams.get("token");

    if (!orderId || !paypalOrderId) {
      setError(t("paypalReturnInvalid"));
      return;
    }

    started.current = true;
    const callbackUrl = new URL(`${API_BASE_URL}/payments/paypal/return`);
    callbackUrl.searchParams.set("token", paypalOrderId);
    callbackUrl.searchParams.set("orderId", orderId);
    window.location.replace(callbackUrl.toString());
  }, [searchParams, t]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center p-6">
      <div className="w-full rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        {error ? (
          <>
            <h1 className="text-xl font-semibold text-red-700">
              {t("paypalCaptureFailed")}
            </h1>
            <p className="mt-3 text-sm text-gray-600">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <h1 className="mt-4 text-xl font-semibold">
              {t("paypalProcessing")}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {t("paypalProcessingDescription")}
            </p>
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
