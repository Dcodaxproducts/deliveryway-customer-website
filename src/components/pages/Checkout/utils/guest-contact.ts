export type GuestContactValues = {
  name: string;
  phone: string;
  email: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\d\s./-]+$/;

export const hasGuestContact = (customer: GuestContactValues) =>
  (() => {
    const name = customer.name.trim();
    const email = customer.email.trim();
    const phone = customer.phone.trim();
    const phoneDigits = phone.replace(/\D/g, "");

    return (
      name.length >= 2 &&
      /\p{L}/u.test(name) &&
      EMAIL_PATTERN.test(email) &&
      !/@guest\.deliveryways?(?:\.local)?$/i.test(email) &&
      PHONE_PATTERN.test(phone) &&
      phoneDigits.length >= 7 &&
      phoneDigits.length <= 15
    );
  })();

export const getGuestContactPayload = (
  customer: GuestContactValues,
  privacyPolicyAccepted: boolean,
) => ({
  firstName: customer.name.trim(),
  email: customer.email.trim(),
  phone: customer.phone.trim(),
  privacyPolicyAccepted,
});
