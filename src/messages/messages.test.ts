import { describe, expect, it } from "vitest";
import { createTranslator } from "next-intl";

import deMessages from "@/messages/de.json";
import enMessages from "@/messages/en.json";

const REQUIRED_ROOT_NAMESPACES = [
  "common",
  "navigation",
  "footer",
  "auth",
  "home",
  "about",
  "contact",
  "categories",
  "menu",
  "items",
  "productDetails",
  "cart",
  "checkout",
  "orders",
  "ordersHistory",
  "payments",
  "profile",
  "addresses",
  "reservations",
  "reserveTable",
  "orderStatus",
  "notifications",
  "groupOrder",
  "branchSelector",
  "legal",
  "validation",
  "errors",
] as const;

type MessageRecord = Record<string, unknown>;

const collectMessageKeys = (messages: MessageRecord, prefix = ""): string[] => {
  return Object.entries(messages).flatMap(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return collectMessageKeys(value as MessageRecord, nextKey);
    }

    return [nextKey];
  });
};

const collectPlaceholders = (value: unknown): string[] =>
  typeof value === "string"
    ? [...value.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)/g)]
        .map((match) => match[1])
        .sort()
    : [];

describe("message catalog completeness", () => {
  it("keeps English and German message keys identical", () => {
    const enKeys = new Set(collectMessageKeys(enMessages));
    const deKeys = new Set(collectMessageKeys(deMessages));

    const missingInGerman = [...enKeys].filter((key) => !deKeys.has(key)).sort();
    const missingInEnglish = [...deKeys].filter((key) => !enKeys.has(key)).sort();

    expect(missingInGerman).toEqual([]);
    expect(missingInEnglish).toEqual([]);
  });

  it("keeps interpolation variables identical between English and German", () => {
    const compare = (english: MessageRecord, german: MessageRecord) => {
      for (const [key, englishValue] of Object.entries(english)) {
        const germanValue = german[key];
        if (
          englishValue &&
          typeof englishValue === "object" &&
          !Array.isArray(englishValue)
        ) {
          compare(englishValue as MessageRecord, germanValue as MessageRecord);
          continue;
        }

        expect(collectPlaceholders(germanValue)).toEqual(
          collectPlaceholders(englishValue),
        );
      }
    };

    compare(enMessages, deMessages);
  });

  it("contains every required root namespace in both locales", () => {
    for (const namespace of REQUIRED_ROOT_NAMESPACES) {
      expect(enMessages).toHaveProperty(namespace);
      expect(deMessages).toHaveProperty(namespace);
    }
  });

  it("provides the German closing-time label", () => {
    expect(deMessages.items.common.closesAt).toBe("Schließt um {time}");
  });

  it("renders dynamic modifier limits in professional German", () => {
    const t = createTranslator({
      locale: "de",
      messages: deMessages,
      namespace: "items.productCard",
    });

    expect(t("minimumAddons", { itemName: "Dips", count: 1 })).toBe(
      "Für „Dips“ muss mindestens 1 Option ausgewählt werden.",
    );
  });

  it("provides localized reservation contact placeholders", () => {
    expect(enMessages.reserveTable).toMatchObject({
      guestNamePlaceholder: "Enter your full name",
      guestEmailPlaceholder: "you@example.com",
      guestPhonePlaceholder: "+49 151 23456789",
    });
    expect(deMessages.reserveTable).toMatchObject({
      guestNamePlaceholder: "Vollständigen Namen eingeben",
      guestEmailPlaceholder: "name@beispiel.de",
      guestPhonePlaceholder: "+49 151 23456789",
    });
  });
});
