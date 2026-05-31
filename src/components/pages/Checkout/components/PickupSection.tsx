import AddressSection from "@/components/pages/Checkout/components/AddressSection"
import TimeSection from "@/components/pages/Checkout/components/TimeSection"
import NotesSection from "@/components/pages/Checkout/components/NotesSection"
import PaymentMethodSection from "@/components/pages/Checkout/components/PaymentMethodSection"

type PickupSectionProps = {
  selectedAddress: string | null;
  setSelectedAddress: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  pickupDate: Date | null;
  setPickupDate: (value: Date | null) => void;
  pickupTime: string | null;
  setPickupTime: (value: string | null) => void;
};

export default function PickupSection(props: PickupSectionProps) {
  return (
    <div className="space-y-[38px]">
      <AddressSection {...props} />
      <NotesSection {...props} />
      <TimeSection {...props} />
      <PaymentMethodSection {...props} />
    </div>
  );
}
