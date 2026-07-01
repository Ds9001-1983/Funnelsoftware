import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// Symmetrische Verschlüsselung at-rest für Kunden-API-Keys (BYOK).
//
// Schlüssel-Ableitung: bevorzugt AI_ENCRYPTION_KEY, sonst SESSION_SECRET (in Prod
// ohnehin Pflicht — server/index.ts validateEnv). Bewusst KEIN throw bei fehlendem
// AI_ENCRYPTION_KEY: sonst würde ein Deploy ohne den neuen Secret den ganzen Server
// beim Boot crashen. Ein dediziertes AI_ENCRYPTION_KEY ist empfohlen (unabhängige
// Rotation), aber optional.
const SECRET =
  process.env.AI_ENCRYPTION_KEY || process.env.SESSION_SECRET || "dev-ai-encryption-secret";

// scrypt leitet aus der (beliebig langen) Passphrase einen 32-Byte-Schlüssel ab.
const KEY = scryptSync(SECRET, "trichterwerk-ai-v1", 32);

/** Verschlüsselt einen String → "iv:authTag:ciphertext" (alles hex). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

/** Entschlüsselt "iv:authTag:ciphertext". Wirft bei Manipulation (GCM-Auth-Fehler). */
export function decryptSecret(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex) throw new Error("Ungültiges Ciphertext-Format");
  const decipher = createDecipheriv("aes-256-gcm", KEY, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const dec = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return dec.toString("utf8");
}

/** Letzte 4 Zeichen für die maskierte Anzeige (z. B. "…ab12"). */
export function last4(value: string): string {
  return value.slice(-4);
}
