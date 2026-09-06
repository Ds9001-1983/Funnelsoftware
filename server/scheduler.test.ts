import { describe, it, expect, vi, beforeEach } from "vitest";

// Storage + E-Mail mocken — die Job-Logik (Reihenfolge, Cutoffs, Dedupe-Gates)
// ist das Testobjekt, nicht die DB.
vi.mock("./storage", () => ({
  storage: {
    getUsersForFreeDowngrade: vi.fn(),
    demoteExtraPublishedFunnels: vi.fn(),
    markUserFree: vi.fn(),
    tryLogEmail: vi.fn(),
    getFunnels: vi.fn(),
    getUsersForTrialEndingMail: vi.fn(),
    getInactiveUsersSince: vi.fn(),
  },
}));
vi.mock("./email", () => ({
  sendFreeDowngradeEmail: vi.fn().mockResolvedValue(true),
  sendReEngagementEmail: vi.fn().mockResolvedValue(true),
  sendTrialEndingSoonEmail: vi.fn().mockResolvedValue(true),
}));

import { storage } from "./storage";
import {
  sendFreeDowngradeEmail,
  sendReEngagementEmail,
  sendTrialEndingSoonEmail,
} from "./email";
import { runFreeDowngradeJob, runReEngagementJob, runTrialEndingJob } from "./scheduler";

const DAY_MS = 24 * 60 * 60 * 1000;

function user(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    email: "u@example.com",
    displayName: "U",
    trialEndsAt: new Date(Date.now() - 2 * DAY_MS),
    subscriptionStartedAt: null,
    ...overrides,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(storage.demoteExtraPublishedFunnels).mockResolvedValue([]);
  vi.mocked(storage.getFunnels).mockResolvedValue([]);
  vi.mocked(storage.tryLogEmail).mockResolvedValue(true);
});

describe("runFreeDowngradeJob", () => {
  it("demotet, mailt und setzt den Status ZULETZT auf free", async () => {
    const calls: string[] = [];
    vi.mocked(storage.getUsersForFreeDowngrade).mockResolvedValue([user()]);
    vi.mocked(storage.demoteExtraPublishedFunnels).mockImplementation(async () => {
      calls.push("demote");
      return [{ id: 7, name: "Alt" }];
    });
    vi.mocked(storage.tryLogEmail).mockImplementation(async () => {
      calls.push("logEmail");
      return true;
    });
    vi.mocked(storage.markUserFree).mockImplementation(async () => {
      calls.push("markFree");
    });

    await runFreeDowngradeJob();

    expect(sendFreeDowngradeEmail).toHaveBeenCalledOnce();
    // markUserFree materialisiert den Status erst NACH dem Mail-Gate — sonst
    // fällt ein Nutzer bei einem transienten Fehler dauerhaft aus dem
    // Kandidaten-Set, ohne je eine Mail bekommen zu haben.
    expect(calls).toEqual(["demote", "logEmail", "markFree"]);
  });

  it("wirft tryLogEmail (z. B. email_log fehlt), bleibt der Nutzer Kandidat (kein markUserFree)", async () => {
    vi.mocked(storage.getUsersForFreeDowngrade).mockResolvedValue([user()]);
    vi.mocked(storage.tryLogEmail).mockRejectedValue(new Error("relation email_log missing"));

    await runFreeDowngradeJob();

    expect(storage.markUserFree).not.toHaveBeenCalled();
  });

  it("Uralt-Trial ohne je ein Abo: keine Downgrade-Mail, aber Status-Normalisierung", async () => {
    vi.mocked(storage.getUsersForFreeDowngrade).mockResolvedValue([
      user({ trialEndsAt: new Date(Date.now() - 90 * DAY_MS) }),
    ]);

    await runFreeDowngradeJob();

    expect(sendFreeDowngradeEmail).not.toHaveBeenCalled();
    expect(storage.markUserFree).toHaveBeenCalledOnce();
  });

  it("Ex-Zahler (subscriptionStartedAt gesetzt) bekommt die Mail auch mit uraltem Trial", async () => {
    vi.mocked(storage.getUsersForFreeDowngrade).mockResolvedValue([
      user({
        trialEndsAt: new Date(Date.now() - 180 * DAY_MS),
        subscriptionStartedAt: new Date(Date.now() - 170 * DAY_MS),
      }),
    ]);

    await runFreeDowngradeJob();

    expect(sendFreeDowngradeEmail).toHaveBeenCalledOnce();
  });

  it("Fehler bei einem Nutzer stoppt den Lauf nicht", async () => {
    vi.mocked(storage.getUsersForFreeDowngrade).mockResolvedValue([
      user({ id: 1 }),
      user({ id: 2 }),
    ]);
    vi.mocked(storage.demoteExtraPublishedFunnels)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce([]);

    await runFreeDowngradeJob();

    expect(storage.markUserFree).toHaveBeenCalledTimes(1);
    expect(storage.markUserFree).toHaveBeenCalledWith(2);
  });
});

describe("runTrialEndingJob", () => {
  it("mailt nur, wenn das email_log-Gate zuschlägt (Dedupe)", async () => {
    vi.mocked(storage.getUsersForTrialEndingMail).mockResolvedValue([
      user({ id: 1, trialEndsAt: new Date(Date.now() + 2.5 * DAY_MS) }),
      user({ id: 2, trialEndsAt: new Date(Date.now() + 2.5 * DAY_MS) }),
    ]);
    vi.mocked(storage.tryLogEmail).mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await runTrialEndingJob();

    expect(sendTrialEndingSoonEmail).toHaveBeenCalledTimes(1);
  });
});

describe("runReEngagementJob", () => {
  it("einmalig pro Account (Gate false → keine Mail)", async () => {
    vi.mocked(storage.getInactiveUsersSince).mockResolvedValue([user()]);
    vi.mocked(storage.tryLogEmail).mockResolvedValue(false);

    await runReEngagementJob();

    expect(sendReEngagementEmail).not.toHaveBeenCalled();
  });
});
