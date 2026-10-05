import { z } from "zod";

export const CONTACT_EMAIL = "info@superbrand.marketing";
export const CONTACT_MESSAGE_MAX = 3000;
export const CONTACT_UNAVAILABLE = "Deine Nachricht konnte gerade nicht bestätigt werden. Deine Eingaben bleiben erhalten. Versuche es später erneut oder schreib uns per E-Mail.";

export const contactSchema = z.object({
  email: z.string().max(254).regex(/^[^\r\n\0]+$/).trim().email(),
  message: z.string().trim().min(10).max(CONTACT_MESSAGE_MAX),
  website: z.string().max(200).optional().default(""),
}).strict();

export type ContactMessage = Pick<z.infer<typeof contactSchema>, "email" | "message">;
