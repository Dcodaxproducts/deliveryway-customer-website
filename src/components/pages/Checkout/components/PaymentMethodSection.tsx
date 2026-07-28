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
  const configuredGroups: Array<{
    title: string;
    description: string;
    options: Array<{ key: CheckoutPaymentMethod; label: string }>;
  }> = [
    {
      title: t("paymentTypePayAtFulfillment"),
      description: t("paymentTypePayAtFulfillmentDescription"),
      options: [
        { key: "COD", label: cashLabel || t("cashOnDelivery") },
        { key: "CARD_ON_DELIVERY", label: t("cardOnDelivery") },
      ],
    },
    {
      title: t("paymentTypeDigital"),
      description: t("paymentTypeDigitalDescription"),
      options: [
        { key: "STRIPE", label: t("onlineCard") },
        { key: "PAYPAL", label: t("paypal") },
        { key: "EASYPAISA", label: t("easypaisa") },
        { key: "JAZZCASH", label: t("jazzcash") },
      ],
    },
    {
      title: t("paymentTypeTransferAndWallet"),
      description: t("paymentTypeTransferAndWalletDescription"),
      options: [
        { key: "BANK_TRANSFER", label: t("bankTransfer") },
        { key: "WALLET", label: t("wallet") },
      ],
    },
  ];
  const methodGroups = configuredGroups
    .map((group) => ({
      ...group,
      options: group.options.filter((option) =>
        availableMethods.includes(option.key),
      ),
    }))
    .filter((group) => group.options.length > 0);
  const hasMethods = methodGroups.length > 0;

  return (
    <section className="space-y-[25px]">
      <h2 className="text-[24px] font-semibold text-gray-900 pt-[8px] border-b-2 border-gray-300">
        {t("selectPaymentMethod")}
      </h2>

      <div className="space-y-3">
        {!hasMethods ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {t("paymentMethodsUnavailable")}
          </p>
        ) : null}
        {methodGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {group.title}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                {group.description}
              </p>
            </div>
            {group.options.map((opt) => (
              <button
                type="button"
                key={opt.key}
                onClick={() => setPaymentMethod(opt.key)}
                className="flex w-full items-center justify-between rounded-[12px] border border-gray-100 bg-[#F9F9F9] p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      paymentMethod === opt.key
                        ? "border-primary"
                        : "border-gray-300"
                    }`}
                  >
                    {paymentMethod === opt.key && (
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-sm text-gray-800">{opt.label}</span>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export { PaymentMethodSection };
