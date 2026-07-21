import { describe, expect, it } from "vitest";

import {
  createLoginSchema,
  defaultEnglishValidationMessages,
  forgotPasswordSchema,
  guestLoginSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "./auth";

const validLogin = {
  email: "customer@example.com",
  password: "secret123",
};

const validGuestLogin = {
  firstName: "Ada",
  lastName: "Lovelace",
  phone: "+923001234567",
};

const validSignup = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "+923001234567",
  password: "secret123",
  confirmPassword: "secret123",
  tenantId: "tenant-1",
  acceptTerms: true,
};

describe("auth validation schemas", () => {
  it("requires login email and password", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["email", "password"])
    );
  });

  it("rejects invalid login email", () => {
    expect(loginSchema.safeParse({ ...validLogin, email: "not-an-email" }).success).toBe(false);
  });

  it("keeps English defaults while allowing translated schema factories", () => {
    const translatedLoginSchema = createLoginSchema({
      ...defaultEnglishValidationMessages,
      emailRequired: "E-Mail ist erforderlich",
    });

    const defaultResult = loginSchema.safeParse({ ...validLogin, email: "" });
    const translatedResult = translatedLoginSchema.safeParse({ ...validLogin, email: "" });

    expect(defaultResult.error?.issues[0]?.message).toBe("Please enter your email");
    expect(translatedResult.error?.issues[0]?.message).toBe("E-Mail ist erforderlich");
  });

  it("requires guest login names and phone", () => {
    const result = guestLoginSchema.safeParse({ firstName: "", lastName: "", phone: "" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["firstName", "lastName", "phone"])
    );
  });

  it("accepts a valid signup payload", () => {
    expect(signupSchema.safeParse(validSignup).success).toBe(true);
  });

  it("validates forgot and reset password required fields", () => {
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ email: "", otp: "", newPassword: "" }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: "ada@example.com" }).success).toBe(true);
    expect(
      resetPasswordSchema.safeParse({
        email: "ada@example.com",
        otp: "123456",
        newPassword: "secret123",
      }).success
    ).toBe(true);
  });
});
