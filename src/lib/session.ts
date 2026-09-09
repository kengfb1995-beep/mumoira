import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "mmr_session";

type SessionPayload = {
  userId: number;
  role: "super_admin" | "admin" | "user";
  email: string;
};

/** Khi chưa đặt SESSION_SECRET, dùng khóa riêng (SHA-256) từ SETTINGS_ENCRYPTION_KEY để tránh Worker production 500. Nên đặt SESSION_SECRET riêng khi có thể. */
function deriveSessionSecretFromEncryptionKey(): string | null {
  const context = (globalThis as any)[Symbol.for("__cloudflare-context__")];
  const env = context?.env || (globalThis as any);
  const k = (env?.SETTINGS_ENCRYPTION_KEY || process.env.SETTINGS_ENCRYPTION_KEY)?.trim();
  if (!k) return null;
  return createHash("sha256").update(`mmr_session_v1|${k}`, "utf8").digest("hex");
}

function getSessionSecret() {
  const context = (globalThis as any)[Symbol.for("__cloudflare-context__")];
  const env = context?.env || (globalThis as any);
  const explicit = (env?.SESSION_SECRET || process.env.SESSION_SECRET)?.trim();
  if (explicit) return explicit;

  if (process.env.NODE_ENV === "production") {
    const derived = deriveSessionSecretFromEncryptionKey();
    if (derived) return derived;
    throw new Error(
      "Thiếu SESSION_SECRET và SETTINGS_ENCRYPTION_KEY. Hãy đặt ít nhất một trong hai (.env.local hoặc Netlify environment variables).",
    );
  }
  return "dev-session-secret-change-me";
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

function encode(payload: SessionPayload) {
  const raw = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${raw}.${sign(raw)}`;
}

function decode(token: string): SessionPayload | null {
  const [raw, signature] = token.split(".");
  if (!raw || !signature) return null;

  const expected = sign(raw);
  const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return null;

  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const context = (globalThis as any)[Symbol.for("__cloudflare-context__")];
  const env = context?.env || (globalThis as any);
  const rawList = (env?.ADMIN_EMAILS || env?.ADMIN_EMAIL || process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")?.trim();
  const allowed = new Set<string>(
    rawList
      .split(/[,;\s]+/)
      .map((e: string) => e.trim().toLowerCase())
      .filter(Boolean),
  );
  // Default fallback owner admin email
  allowed.add("kengfb1995@gmail.com");
  return allowed.has(email.trim().toLowerCase());
}

export async function createSession(payload: SessionPayload) {
  const store = await cookies();
  const effectiveRole =
    payload.role === "super_admin" || isAdminEmail(payload.email)
      ? "super_admin"
      : payload.role;
  const finalPayload: SessionPayload = {
    ...payload,
    role: effectiveRole,
  };
  store.set(SESSION_COOKIE_NAME, encode(finalPayload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    const session = decode(token);
    if (!session) return null;
    if (session.role !== "super_admin" && isAdminEmail(session.email)) {
      return { ...session, role: "super_admin" };
    }
    return session;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;
  if (session.role !== "admin" && session.role !== "super_admin") return null;
  return session;
}

