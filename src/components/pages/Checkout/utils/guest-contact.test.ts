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
