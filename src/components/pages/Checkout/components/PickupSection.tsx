import AddressSection from "@/components/pages/Checkout/components/AddressSection"
import TimeSection from "@/components/pages/Checkout/components/TimeSection"
import NotesSection from "@/components/pages/Checkout/components/NotesSection"
import PaymentMethodSection from "@/components/pages/Checkout/components/PaymentMethodSection"

export default function PickupSection(props: any) {
  return (
    <div className="space-y-[38px]">
      <AddressSection {...props} />
      <NotesSection {...props} />
      <TimeSection {...props} />
      <PaymentMethodSection {...props} />
    </div>
  );
}