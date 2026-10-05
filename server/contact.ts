import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { contactSchema, CONTACT_UNAVAILABLE, type ContactMessage } from "@shared/contact";
import { sendContactMessage } from "./contact-email";

export function createContactRouter(send: (message: ContactMessage) => Promise<boolean> = sendContactMessage) {
  const router = Router();
  router.post("/", rateLimit({
    windowMs: 15 * 60 * 1000, limit: 5,
    standardHeaders: "draft-8", legacyHeaders: false,
    message: { error: "Zu viele Kontaktanfragen. Bitte warte 15 Minuten oder schreib uns per E-Mail." },
  }), async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    // Requiring JSON also prevents cross-origin submissions from ordinary HTML forms.
    if (!req.is("application/json")) return res.status(415).json({ error: "Bitte nutze das Kontaktformular." });
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Bitte prüfe deine E-Mail-Adresse und gib eine Nachricht mit 10 bis 3000 Zeichen ein." });
    if (parsed.data.website) return res.json({ ok: true });
    try {
      const { email, message } = parsed.data;
      if (await send({ email, message })) return res.json({ ok: true });
    } catch {
      // No request bodies, addresses or SMTP diagnostics in logs or responses.
    }
    return res.status(503).json({ error: CONTACT_UNAVAILABLE });
  });
  return router;
}
