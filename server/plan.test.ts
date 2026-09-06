import { describe, it, expect } from "vitest";
import { getUserPlan, hasProFeatures } from "./auth";

const inFuture = new Date(Date.now() + 24 * 60 * 60 * 1000);
const inPast = new Date(Date.now() - 24 * 60 * 60 * 1000);

function user(overrides: Partial<{ isAdmin: boolean; isPro: boolean; trialEndsAt: Date | string | null }>) {
  return { isAdmin: false, isPro: false, trialEndsAt: null, ...overrides };
}

describe("getUserPlan", () => {
  it("Admin → pro, unabhängig vom Trial", () => {
    expect(getUserPlan(user({ isAdmin: true }))).toBe("pro");
    expect(getUserPlan(user({ isAdmin: true, trialEndsAt: inPast }))).toBe("pro");
  });

  it("isPro → pro, auch mit abgelaufenem Trial", () => {
    expect(getUserPlan(user({ isPro: true }))).toBe("pro");
    expect(getUserPlan(user({ isPro: true, trialEndsAt: inPast }))).toBe("pro");
  });

  it("laufender Trial → trial", () => {
    expect(getUserPlan(user({ trialEndsAt: inFuture }))).toBe("trial");
    expect(getUserPlan(user({ trialEndsAt: inFuture.toISOString() }))).toBe("trial");
  });

  it("abgelaufener Trial → free (kein Sperr-Zustand mehr)", () => {
    expect(getUserPlan(user({ trialEndsAt: inPast }))).toBe("free");
  });

  it("trialEndsAt exakt jetzt → free (Grenze ist exklusiv)", () => {
    expect(getUserPlan(user({ trialEndsAt: new Date(Date.now() - 1) }))).toBe("free");
  });

  it("kein Trial, kein Abo → free", () => {
    expect(getUserPlan(user({}))).toBe("free");
  });
});

describe("hasProFeatures", () => {
  it("Trial zählt als Pro (volle Features zum Testen)", () => {
    expect(hasProFeatures(user({ trialEndsAt: inFuture }))).toBe(true);
  });

  it("Free hat keine Pro-Features", () => {
    expect(hasProFeatures(user({ trialEndsAt: inPast }))).toBe(false);
    expect(hasProFeatures(user({}))).toBe(false);
  });

  it("Pro und Admin haben Pro-Features", () => {
    expect(hasProFeatures(user({ isPro: true }))).toBe(true);
    expect(hasProFeatures(user({ isAdmin: true }))).toBe(true);
  });
});
