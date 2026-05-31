'use client';
import DeliveryAddressSection from '@/components/pages/Checkout/components/DeliveryAddressSection';
import NotesSection from '@/components/pages/Checkout/components/NotesSection';
import CustomerDetailsForm from '@/components/pages/Checkout/components/CustomerDetailsForm';
import PaymentMethodSection from '@/components/pages/Checkout/components/PaymentMethodSection';

export default function DeliverySection(props: any) {
  return (
    <div className="space-y-[38px]">
      <DeliveryAddressSection {...props} />
      <NotesSection note={props.note} setNote={props.setNote} />
      <CustomerDetailsForm {...props} />
      <PaymentMethodSection {...props} />
    </div>
  );
}