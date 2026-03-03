import { describe, it, expect } from "vitest";
import { calculateNextCadenceSendDate } from "./db";

describe("Email Cadence — calculateNextCadenceSendDate", () => {
  it("should return a date in the future", () => {
    const now = new Date();
    const next = calculateNextCadenceSendDate(now);
    expect(next.getTime()).toBeGreaterThan(now.getTime());
  });

  it("should always land on Monday (1), Wednesday (3), or Friday (5)", () => {
    const testDates = [
      new Date("2026-03-02T10:00:00Z"), // Monday
      new Date("2026-03-03T10:00:00Z"), // Tuesday
      new Date("2026-03-04T10:00:00Z"), // Wednesday
      new Date("2026-03-05T10:00:00Z"), // Thursday
      new Date("2026-03-06T10:00:00Z"), // Friday
      new Date("2026-03-07T10:00:00Z"), // Saturday
      new Date("2026-03-08T10:00:00Z"), // Sunday
    ];

    for (const date of testDates) {
      const next = calculateNextCadenceSendDate(date);
      const day = next.getUTCDay();
      expect([1, 3, 5]).toContain(day);
    }
  });

  it("should set time to 12:00 UTC (9am BRT)", () => {
    const next = calculateNextCadenceSendDate(new Date("2026-03-02T10:00:00Z"));
    expect(next.getUTCHours()).toBe(12);
    expect(next.getUTCMinutes()).toBe(0);
    expect(next.getUTCSeconds()).toBe(0);
  });

  it("from Monday, next should be Wednesday", () => {
    const monday = new Date("2026-03-02T10:00:00Z"); // Monday
    const next = calculateNextCadenceSendDate(monday);
    expect(next.getUTCDay()).toBe(3); // Wednesday
    expect(next.getUTCDate()).toBe(4); // March 4
  });

  it("from Wednesday, next should be Friday", () => {
    const wednesday = new Date("2026-03-04T10:00:00Z"); // Wednesday
    const next = calculateNextCadenceSendDate(wednesday);
    expect(next.getUTCDay()).toBe(5); // Friday
    expect(next.getUTCDate()).toBe(6); // March 6
  });

  it("from Friday, next should be Monday", () => {
    const friday = new Date("2026-03-06T10:00:00Z"); // Friday
    const next = calculateNextCadenceSendDate(friday);
    expect(next.getUTCDay()).toBe(1); // Monday
    expect(next.getUTCDate()).toBe(9); // March 9
  });

  it("from Saturday, next should be Monday", () => {
    const saturday = new Date("2026-03-07T10:00:00Z"); // Saturday
    const next = calculateNextCadenceSendDate(saturday);
    expect(next.getUTCDay()).toBe(1); // Monday
    expect(next.getUTCDate()).toBe(9); // March 9
  });

  it("from Sunday, next should be Monday", () => {
    const sunday = new Date("2026-03-08T10:00:00Z"); // Sunday
    const next = calculateNextCadenceSendDate(sunday);
    expect(next.getUTCDay()).toBe(1); // Monday
    expect(next.getUTCDate()).toBe(9); // March 9
  });

  it("from Tuesday, next should be Wednesday", () => {
    const tuesday = new Date("2026-03-03T10:00:00Z"); // Tuesday
    const next = calculateNextCadenceSendDate(tuesday);
    expect(next.getUTCDay()).toBe(3); // Wednesday
    expect(next.getUTCDate()).toBe(4); // March 4
  });

  it("from Thursday, next should be Friday", () => {
    const thursday = new Date("2026-03-05T10:00:00Z"); // Thursday
    const next = calculateNextCadenceSendDate(thursday);
    expect(next.getUTCDay()).toBe(5); // Friday
    expect(next.getUTCDate()).toBe(6); // March 6
  });

  it("should always be at least 1 day in the future", () => {
    const now = new Date("2026-03-02T08:00:00Z"); // Monday 8am UTC
    const next = calculateNextCadenceSendDate(now);
    const diffMs = next.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThanOrEqual(24);
  });
});
