import { describe, expect, it } from "vitest";

import {
  getGuestContactPayload,
  getGuestContactErrors,
  getSavedGuestContact,
  hasGuestContact,
  mergeSavedGuestContact,
  saveGuestContactOnUser,
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

  it("identifies each invalid field independently", () => {
    expect(
      getGuestContactErrors({
        name: "M",
        email: "not-an-email",
        phone: "123",
      }),
    ).toEqual({
      name: "invalid",
      phone: "invalid",
      email: "invalid",
    });

    expect(
      getGuestContactErrors({
        name: "",
        email: "",
        phone: "",
      }),
    ).toEqual({
      name: "required",
      phone: "required",
      email: "required",
    });
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

  it("loads the real guest contact saved on the account profile", () => {
    expect(
      getSavedGuestContact({
        id: "guest-1",
        email: "guest+1@guest.deliveryways.local",
        role: "GUEST",
        tenantId: "tenant-1",
        isGuest: true,
        profile: {
          firstName: "Max Mustermann",
          lastName: "",
          avatarUrl: "",
          phone: "+49 151 23456789",
          metadata: {
            guestContact: {
              email: "max@example.com",
              phone: "+49 151 23456789",
            },
          },
        },
      }),
    ).toEqual({
      name: "Max Mustermann",
      phone: "+49 151 23456789",
      email: "max@example.com",
    });
  });

  it("fills only empty or generated guest fields", () => {
    expect(
      mergeSavedGuestContact(
        {
          name: "Guest Customer",
          phone: "",
          email: "guest+1@guest.deliveryways.local",
        },
        {
          name: "Max Mustermann",
          phone: "+49 151 23456789",
          email: "max@example.com",
        },
      ),
    ).toEqual({
      name: "Max Mustermann",
      phone: "+49 151 23456789",
      email: "max@example.com",
    });
  });

  it("keeps the submitted guest contact in the current account session", () => {
    const updatedUser = saveGuestContactOnUser(
      {
        id: "guest-1",
        email: "guest+1@guest.deliveryways.local",
        role: "GUEST",
        tenantId: "tenant-1",
        isGuest: true,
        profile: {
          firstName: "Guest",
          lastName: "Customer",
          avatarUrl: "",
          metadata: { locale: "de" },
        },
      },
      {
        name: "Max Mustermann",
        phone: "+49 151 23456789",
        email: "Max@Example.com",
      },
    );

    expect(updatedUser.profile).toMatchObject({
      firstName: "Max Mustermann",
      lastName: "",
      phone: "+49 151 23456789",
      metadata: {
        locale: "de",
        guestContact: {
          email: "max@example.com",
          phone: "+49 151 23456789",
        },
      },
    });
  });
});
