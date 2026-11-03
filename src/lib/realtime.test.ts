import { describe, expect, it } from "vitest";

import { BoundedEventIdSet, withoutEventId } from "./realtime";

describe("BoundedEventIdSet", () => {
  it("dedupes exact opaque ids without numeric ordering", () => {
    const seen = new BoundedEventIdSet(3);
    expect(seen.accept("order-1", "100")).toBe(true);
    expect(seen.accept("order-1", "2")).toBe(true);
    expect(seen.accept("order-1", "abc")).toBe(true);
    expect(seen.accept("order-1", "2")).toBe(false);
  });

  it("evicts the oldest exact id at the configured bound per scope", () => {
    const seen = new BoundedEventIdSet(2);
    expect(seen.accept("order-1", "a")).toBe(true);
    expect(seen.accept("order-1", "b")).toBe(true);
    expect(seen.accept("order-1", "c")).toBe(true);
    expect(seen.accept("order-1", "a")).toBe(true);
    expect(seen.accept("order-2", "c")).toBe(true);
  });

  it("accepts legacy payloads without ids and strips ids without mutation", () => {
    const seen = new BoundedEventIdSet();
    expect(seen.accept("chat", undefined)).toBe(true);
    expect(seen.accept("chat", undefined)).toBe(true);
    const payload = { id: "one", eventId: "opaque" };
    expect(withoutEventId(payload)).toEqual({ id: "one" });
    expect(payload).toEqual({ id: "one", eventId: "opaque" });
  });
});
