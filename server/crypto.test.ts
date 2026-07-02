import { describe, it, expect } from "vitest";
import { encryptSecret, decryptSecret, last4 } from "./crypto";

describe("crypto (AES-256-GCM)", () => {
  it("verschlüsselt und entschlüsselt verlustfrei (Roundtrip)", () => {
    const secret = "sk-ant-api03-EXAMPLE-1234567890";
    const enc = encryptSecret(secret);
    expect(enc).not.toContain(secret); // Klartext taucht nicht im Ciphertext auf
    expect(decryptSecret(enc)).toBe(secret);
  });

  it("erzeugt bei gleichem Input unterschiedliche Ciphertexte (zufälliges IV)", () => {
    const a = encryptSecret("gleicher-key");
    const b = encryptSecret("gleicher-key");
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe(decryptSecret(b));
  });

  it("hat das Format iv:authTag:ciphertext (3 Hex-Teile)", () => {
    const parts = encryptSecret("x").split(":");
    expect(parts).toHaveLength(3);
    parts.forEach((p) => expect(p).toMatch(/^[a-f0-9]+$/));
  });

  it("wirft bei manipuliertem Ciphertext (GCM-Auth)", () => {
    const enc = encryptSecret("geheim");
    const [iv, tag, data] = enc.split(":");
    const tampered = `${iv}:${tag}:${data.slice(0, -2)}00`;
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("last4 gibt die letzten 4 Zeichen zurück", () => {
    expect(last4("abcdef1234")).toBe("1234");
  });
});
