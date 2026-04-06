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
    // Ưu tiên dùng Cloudflare D1 nếu có binding
    const context = (globalThis as any)[Symbol.for("__cloudflare-context__")];
    const d1 = (context?.env?.DB || (globalThis as any).DB) as D1Database | undefined;
    
    if (d1 && typeof d1.prepare === "function") {
      cachedDb = createD1Db(d1);
    } else {
      const tursoUrl = process.env.TURSO_DATABASE_URL;
      if (!tursoUrl) throw new Error("Thiếu DB");
      cachedDb = createTursoDb(tursoUrl, process.env.TURSO_AUTH_TOKEN);
    }
  } catch (e) {
    console.error("Antigravity: getDb error", e);
  } finally {
    isInitializing = false;
  }
  
  return cachedDb;
}
