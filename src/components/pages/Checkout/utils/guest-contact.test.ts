import { describe, expect, it } from "vitest";

import {
  getGuestContactPayload,
  hasGuestContact,
} from "./guest-contact";

describe("guest checkout contact", () => {
  it("requires name, email, and phone", () => {
    expect(
      hasGuestContact({
        name: "",
        email: "guest@example.com",
        phone: "+49 151 23456789",
      }),
    ).toBe(false);
    expect(
      hasGuestContact({
        name: "Max Mustermann",
        email: "guest@example.com",
        phone: "+49 151 23456789",
      }),
    ).toBe(true);
  });

  it("rejects generated guest identities and malformed contact details", () => {
    expect(
      hasGuestContact({
        name: "Guest Customer",
        email: "guest+123@guest.deliveryways.local",
        phone: "+49 151 23456789",
      }),
    ).toBe(false);
    expect(
      hasGuestContact({
        name: "M",
        email: "not-an-email",
        phone: "123",
      }),
    ).toBe(false);
    expect(
      hasGuestContact({
        name: "Max Mustermann",
        email: "max@example.com",
        phone: "invalid phone",
      }),
    ).toBe(false);
  });

  it("trims and submits the entered name as firstName", () => {
    expect(
      getGuestContactPayload(
        {
          name: "  Max Mustermann  ",
          email: "  guest@example.com ",
          phone: " +49 151 23456789 ",
        },
        true,
      ),
    ).toEqual({
      firstName: "Max Mustermann",
      email: "guest@example.com",
      phone: "+49 151 23456789",
      privacyPolicyAccepted: true,
    });
  });
});
