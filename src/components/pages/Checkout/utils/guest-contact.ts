export type GuestContactValues = {
  name: string;
  phone: string;
  email: string;
};

export const hasGuestContact = (customer: GuestContactValues) =>
  Boolean(
    customer.name.trim() &&
      customer.email.trim() &&
      customer.phone.trim(),
  );

export const getGuestContactPayload = (
  customer: GuestContactValues,
  privacyPolicyAccepted: boolean,
) => ({
  firstName: customer.name.trim(),
  email: customer.email.trim(),
  phone: customer.phone.trim(),
  privacyPolicyAccepted,
});
