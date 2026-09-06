/**
 * In-Process-Scheduler für wiederkehrende Hintergrund-Jobs (stündlicher Tick).
 *
 * Bewusst setInterval statt node-cron: keine neue Dependency, stündliche
 * Granularität reicht, und die Jobs sind idempotent (WHERE-Bedingungen bzw.
 * — ab dem Lifecycle-Mail-Ausbau — das email_log-Dedupe), sodass auch
 * mehrere parallel laufende Instanzen (reusePort auf Linux) keinen Schaden
 * anrichten.
 *
 * DISABLE_SCHEDULER=1 schaltet ihn ab (Playwright-E2E, Zweitinstanzen).
 */

import { storage } from "./storage";
import { FREE_MAX_PUBLISHED_FUNNELS } from "@shared/schema";

const TICK_INTERVAL_MS = 60 * 60 * 1000; // stündlich

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
    } catch (error) {
      // Ein fehlgeschlagener Nutzer darf den Rest des Laufs nicht stoppen.
      console.error(`[scheduler] Free-Downgrade für User ${user.id} fehlgeschlagen:`, error);
    }
  }
}

/** Ein Tick = alle Jobs, jeder für sich gefangen. Exportiert für Tests. */
export async function tick(): Promise<void> {
  try {
    await runFreeDowngradeJob();
  } catch (error) {
    console.error("[scheduler] Free-Downgrade-Job fehlgeschlagen:", error);
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
