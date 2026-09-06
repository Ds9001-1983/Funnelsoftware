/**
 * In-Process-Scheduler für wiederkehrende Hintergrund-Jobs (stündlicher Tick).
 *
 * Bewusst setInterval statt node-cron: keine neue Dependency, stündliche
 * Granularität reicht, und die Jobs sind idempotent — Zustandsänderungen über
 * WHERE-Bedingungen, Mails über das email_log-Dedupe (storage.tryLogEmail,
 * Unique-Index, INSERT-first). Damit richten auch mehrere parallel laufende
 * Instanzen (reusePort auf Linux) keinen Schaden an.
 *
 * DISABLE_SCHEDULER=1 schaltet ihn ab (Playwright-E2E, Zweitinstanzen).
 */

import { storage } from "./storage";
import { FREE_MAX_PUBLISHED_FUNNELS } from "@shared/schema";
import {
  sendFreeDowngradeEmail,
  sendReEngagementEmail,
  sendTrialEndingSoonEmail,
} from "./email";

const TICK_INTERVAL_MS = 60 * 60 * 1000; // stündlich
const DAY_MS = 24 * 60 * 60 * 1000;

/** Keine Downgrade-Mail an Uralt-Accounts (Trial > 60 Tage vorbei) — die
 *  bekommen ggf. die Re-Engagement-Mail, aber keine "gerade abgelaufen"-Story. */
const DOWNGRADE_MAIL_CUTOFF_MS = 60 * DAY_MS;

/**
 * Free-Normalisierung: Nutzer mit abgelaufenem Trial und ohne Abo werden auf
 * subscriptionStatus "free" gesetzt; überzählige veröffentlichte Funnels
 * gehen auf "draft" (der zuletzt aktualisierte bleibt live). Self-healing —
 * der Erst-Lauf räumt auch Alt-Accounts mit Status expired/cancelled auf.
 */
export async function runFreeDowngradeJob(): Promise<void> {
  const candidates = await storage.getUsersForFreeDowngrade();
  for (const user of candidates) {
    try {
      const demoted = await storage.demoteExtraPublishedFunnels(
        user.id,
        FREE_MAX_PUBLISHED_FUNNELS,
      );
      await storage.markUserFree(user.id);
      if (demoted.length > 0) {
        console.log(
          `[scheduler] Free-Downgrade User ${user.id}: ${demoted.length} Funnel(s) auf Entwurf gesetzt (${demoted.map((d) => `#${d.id} ${d.name}`).join(", ")})`,
        );
      }

      // Downgrade-Mail (einmalig, mit Cutoff für Uralt-Accounts).
      const trialEndedAgo = user.trialEndsAt
        ? Date.now() - new Date(user.trialEndsAt).getTime()
        : Infinity;
      if (trialEndedAgo < DOWNGRADE_MAIL_CUTOFF_MS) {
        if (await storage.tryLogEmail(user.id, "free_downgrade")) {
          const funnels = await storage.getFunnels(user.id);
          const kept = funnels.find((f) => f.status === "published");
          sendFreeDowngradeEmail(
            user.email,
            user.displayName,
            kept?.name ?? null,
            demoted.length,
          ).catch((err) => console.error("[scheduler] Downgrade-Mail fehlgeschlagen:", err));
        }
      }
    } catch (error) {
      // Ein fehlgeschlagener Nutzer darf den Rest des Laufs nicht stoppen.
      console.error(`[scheduler] Free-Downgrade für User ${user.id} fehlgeschlagen:`, error);
    }
  }
}

/**
 * "Trial endet in 3 Tagen"-Mail: Fenster [now+2d, now+3d) statt Punktabfrage —
 * robust gegen verpasste Ticks; das email_log verhindert Doppelversand, wenn
 * ein Nutzer in mehreren Ticks im Fenster liegt.
 */
export async function runTrialEndingJob(): Promise<void> {
  const from = new Date(Date.now() + 2 * DAY_MS);
  const to = new Date(Date.now() + 3 * DAY_MS);
  const candidates = await storage.getUsersForTrialEndingMail(from, to);
  for (const user of candidates) {
    try {
      if (await storage.tryLogEmail(user.id, "trial_ending_3d")) {
        const daysLeft = Math.max(
          1,
          Math.ceil((new Date(user.trialEndsAt as Date).getTime() - Date.now()) / DAY_MS),
        );
        await sendTrialEndingSoonEmail(user.email, user.displayName, daysLeft);
      }
    } catch (error) {
      console.error(`[scheduler] Trial-Ende-Mail für User ${user.id} fehlgeschlagen:`, error);
    }
  }
}

/** Re-Engagement nach 14 Tagen Inaktivität — bewusst nur EINMAL pro Account. */
export async function runReEngagementJob(): Promise<void> {
  const cutoff = new Date(Date.now() - 14 * DAY_MS);
  const candidates = await storage.getInactiveUsersSince(cutoff);
  for (const user of candidates) {
    try {
      if (await storage.tryLogEmail(user.id, "reengagement_14d")) {
        await sendReEngagementEmail(user.email, user.displayName);
      }
    } catch (error) {
      console.error(`[scheduler] Re-Engagement-Mail für User ${user.id} fehlgeschlagen:`, error);
    }
  }
}

/** Ein Tick = alle Jobs, jeder für sich gefangen. Exportiert für Tests. */
export async function tick(): Promise<void> {
  const jobs: Array<[string, () => Promise<void>]> = [
    ["Free-Downgrade", runFreeDowngradeJob],
    ["Trial-Ende-Mail", runTrialEndingJob],
    ["Re-Engagement-Mail", runReEngagementJob],
  ];
  for (const [name, job] of jobs) {
    try {
      await job();
    } catch (error) {
      console.error(`[scheduler] ${name}-Job fehlgeschlagen:`, error);
    }
  }
}

export function startScheduler(): void {
  if (process.env.DISABLE_SCHEDULER) {
    console.log("[scheduler] deaktiviert (DISABLE_SCHEDULER)");
    return;
  }
  // Erst-Tick direkt beim Start (normalisiert Bestandsnutzer nach Deploy),
  // danach stündlich. unref(): der Timer hält den Prozess nicht am Leben.
  void tick();
  setInterval(() => void tick(), TICK_INTERVAL_MS).unref();
  console.log("[scheduler] gestartet (Tick stündlich)");
}
