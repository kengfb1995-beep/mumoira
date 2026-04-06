import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { eq } from "drizzle-orm";
import { settings } from "@/db/schema";
import { getDb } from "@/lib/db";

type SecureEnvelope = {
  iv: string;
  tag: string;
  ciphertext: string;
};

let cachedKey: Buffer | null = null;

function getEncryptionKey() {
  if (cachedKey) return cachedKey;
  const secret = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("Thiếu SETTINGS_ENCRYPTION_KEY");
  }
  // Tối ưu N=1024 để chạy nhanh hơn trong Cloudflare Worker (Free tier 10ms)
  cachedKey = scryptSync(secret, "mu-moi-ra-settings-salt", 32, { N: 1024 });
  return cachedKey;
}

function encrypt(plainText: string) {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const envelope: SecureEnvelope = {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };

  return `enc:v1:${Buffer.from(JSON.stringify(envelope)).toString("base64")}`;
}

function decrypt(cipherText: string) {
  try {
    if (!cipherText.startsWith("enc:v1:")) {
      return cipherText;
    }

    const raw = cipherText.slice("enc:v1:".length);
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as SecureEnvelope;

    const key = getEncryptionKey();
    const iv = Buffer.from(parsed.iv, "base64");
    const tag = Buffer.from(parsed.tag, "base64");
    const encrypted = Buffer.from(parsed.ciphertext, "base64");

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (e) {
    console.error("Antigravity: Decryption failed. Possible key mismatch or param change.", e);
    return null;
  }
}

export async function upsertSecureSetting(key: string, value: string) {
  const db = getDb();
  const encrypted = encrypt(value);

  const found = await db.select({ id: settings.id }).from(settings).where(eq(settings.key, key)).limit(1);

  if (found[0]) {
    await db.update(settings).set({ value: encrypted }).where(eq(settings.id, found[0].id));
  } else {
    await db.insert(settings).values({ key, value: encrypted });
  }
}

export async function getSecureSetting(key: string) {
  const db = getDb();
  const row = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, key)).limit(1);
  const value = row[0]?.value;
  if (!value) return null;

  return decrypt(value);
}

import { inArray } from "drizzle-orm";

export async function getSecureSettings(keys: string[]) {
  const db = getDb();
  const rows = await db.select({ key: settings.key, value: settings.value }).from(settings).where(inArray(settings.key, keys));
  
  const results: Record<string, string | null> = {};
  for (const key of keys) results[key] = null;
  
  for (const row of rows) {
    results[row.key] = decrypt(row.value);
  }
  
  return results;
}
