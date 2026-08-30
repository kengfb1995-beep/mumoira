/// <reference types="@cloudflare/workers-types" />
import { createD1Db, createTursoDb } from "@/db/client";

let cachedDb: any = null;
let isInitializing = false;

export function getDb(): any {
  if (cachedDb) return cachedDb;
  if (isInitializing) {
    console.error("Antigravity: Recursive getDb() detected!");
    return null; // Tránh treo
  }
  
  isInitializing = true;
  try {
    const context = (globalThis as any)[Symbol.for("__cloudflare-context__")];
    const env = context?.env || (globalThis as any);

    // Ưu tiên dùng Turso Database nếu có cấu hình
    const tursoUrl = env?.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
    const tursoAuthToken = env?.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

    if (tursoUrl) {
      cachedDb = createTursoDb(tursoUrl, tursoAuthToken);
    } else {
      // Fallback về D1 nếu có binding
      const d1 = (env?.DB || (globalThis as any).DB) as D1Database | undefined;
      if (d1 && typeof d1.prepare === "function") {
        cachedDb = createD1Db(d1);
      } else {
        throw new Error("Thiếu cấu hình Database (TURSO_DATABASE_URL hoặc Cloudflare D1)");
      }
    }
  } catch (e) {
    console.error("Antigravity: getDb error", e);
  } finally {
    isInitializing = false;
  }
  
  return cachedDb;
}
