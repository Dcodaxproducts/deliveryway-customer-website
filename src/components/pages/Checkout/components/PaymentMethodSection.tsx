import { useTranslations } from "next-intl";
import {
  getAvailableCheckoutPaymentMethods,
  type CheckoutPaymentMethod,
} from "@/components/pages/Checkout/utils/payment-methods";

interface Props {
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  allowCashOnDelivery?: boolean;
  allowCardOnDelivery?: boolean;
  cashLabel?: string;
  allowedPaymentMethods?: CheckoutPaymentMethod[];
  isGuest?: boolean;
}

const PaymentMethodSection = ({
  paymentMethod,
  setPaymentMethod,
  allowCashOnDelivery = true,
  allowCardOnDelivery = false,
  cashLabel,
  allowedPaymentMethods,
  isGuest = false,
}: Props) => {
  const t = useTranslations("checkout");
  const availableMethods = getAvailableCheckoutPaymentMethods({
    allowedPaymentMethods,
    allowCardOnDelivery,
    allowCashOnDelivery,
    isGuest,
  });
  const options = [
    { key: "COD", label: cashLabel || t("cashOnDelivery") },
    { key: "CARD_ON_DELIVERY", label: t("cardOnDelivery") },
    { key: "PAYPAL", label: t("paypal") },
    { key: "STRIPE", label: t("onlineCard") },
    { key: "WALLET", label: t("wallet") },
  ].filter((option) =>
    availableMethods.includes(option.key as CheckoutPaymentMethod),
  );

  return (
    <section className="space-y-[25px]">
      <h2 className="text-[24px] font-semibold text-gray-900 pt-[8px] border-b-2 border-gray-300">
        {t("selectPaymentMethod")}
      </h2>

      <div className="space-y-3">
        {options.length === 0 ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {t("paymentMethodsUnavailable")}
          </p>
        ) : null}
        {options.map((opt) => (
          <button
            type="button"
            key={opt.key}
            onClick={() => setPaymentMethod(opt.key)}
            className="flex w-full items-center justify-between rounded-[12px] border border-gray-100 bg-[#F9F9F9] p-5 text-left"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === opt.key
                    ? "border-primary"
                    : "border-gray-300"
                }`}
              >
                {paymentMethod === opt.key && (
                  <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                )}
              </div>

              <span className="text-sm text-gray-800">
                {opt.label}
              </span>
            </div>
          </button>
        ))}
      </div>


    </section>
  );
};

export { PaymentMethodSection };
