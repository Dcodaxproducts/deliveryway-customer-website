import { SECTION_TITLE_CLASS } from '@/components/common/common-classes'
import { useTranslations } from "next-intl"

interface Props {
  customer: {
    name: string
    phone: string
    email: string
  }
  setCustomer: (value: {
    name: string
    phone: string
    email: string
  }) => void
  editable?: boolean
  privacyPolicyAccepted?: boolean
  setPrivacyPolicyAccepted?: (value: boolean) => void
  privacyPolicy?: {
    title: string
    content: string
    policyLink: string
  } | null
  privacyPolicyLoading?: boolean
}

const CustomerDetailsForm = ({
  customer,
  setCustomer,
  editable = false,
  privacyPolicyAccepted = false,
  setPrivacyPolicyAccepted,
  privacyPolicy,
  privacyPolicyLoading = false,
}: Props) => {
  const t = useTranslations("checkout")
  const updateCustomerField = (field: keyof Props["customer"], value: string) => {
    setCustomer({
      ...customer,
      [field]: value,
    })
  }

  return (
    <section className="space-y-[36px] -mt-[20px]">
      <h2 className={`${SECTION_TITLE_CLASS} pt-[8px] border-b-2 border-gray-300`}>
        {t("customerDetails")}
      </h2>

      <div className="space-y-[36px]">

        {/* Name */}
       <div className="space-y-[16px]">
  <label className="text-md font-medium text-gray-900">
    {t("name")}
  </label>

  {editable ? (
    <input
      type="text"
      value={customer.name}
      onChange={(event) => updateCustomerField("name", event.target.value)}
      placeholder={t("namePlaceholder")}
      className="mt-3 flex h-[55px] w-full items-center rounded-md border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
    />
  ) : (
    <div className="h-[55px] flex items-center px-4 bg-gray-50 border border-gray-200 rounded-md text-gray-900 mt-3">
      {customer.name || "—"}
    </div>
  )}
</div>

        {/* Contact */}
     <div className="space-y-[16px]">
  <label className="text-md font-medium text-gray-900">
    {t("contact")}
  </label>

  {editable ? (
    <input
      type="tel"
      value={customer.phone}
      onChange={(event) => updateCustomerField("phone", event.target.value)}
      placeholder={t("phonePlaceholder")}
      className="mt-3 flex h-[55px] w-full items-center rounded-md border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
    />
  ) : (
    <div className="h-[55px] flex items-center px-4 bg-gray-50 border border-gray-200 rounded-md text-gray-900 mt-3">
      {customer.phone || "—"}
    </div>
  )}
</div>
        {/* Email */}
      <div className="space-y-[16px]">
  <label className="text-md font-medium text-gray-900">
    {t("email")}
  </label>

  {editable ? (
    <input
      type="email"
      value={customer.email}
      onChange={(event) => updateCustomerField("email", event.target.value)}
      placeholder={t("emailPlaceholder")}
      className="mt-3 flex h-[55px] w-full items-center rounded-md border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
    />
  ) : (
    <div className="h-[55px] flex items-center px-4 bg-gray-50 border border-gray-200 rounded-md text-gray-700 mt-3">
      {customer.email || "—"}
    </div>
  )}
</div>

<p className="text-sm text-gray-500 mt-2">
  {editable ? t("guestCustomerDetailsRequired") : t("customerDetailsAutoFilled")}
</p>

{editable ? (
  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={privacyPolicyAccepted}
        onChange={(event) => setPrivacyPolicyAccepted?.(event.target.checked)}
        className="mt-1 size-5 rounded border-gray-300 text-primary accent-primary focus:ring-primary/30"
      />
      <span className="space-y-2 text-sm text-gray-700">
        <span className="block font-medium text-gray-950">
          {t("guestPrivacyPolicyConsent")}
        </span>
        <span className="block max-h-28 overflow-y-auto pr-2 leading-6">
          {privacyPolicyLoading
            ? t("guestPrivacyPolicyLoading")
            : privacyPolicy?.content || t("guestPrivacyPolicyFallback")}
        </span>
        <a
          href={privacyPolicy?.policyLink || "/privacy"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t("viewPrivacyPolicy")}
        </a>
      </span>
    </label>
  </div>
) : null}
      </div>
    </section>
  )
}

export default CustomerDetailsForm
