/// <reference types="@cloudflare/workers-types" />
import { createDb, type AppDb } from "@/db/client";

function getD1Binding(): D1Database {
  const context = (globalThis as any)[Symbol.for("__cloudflare-context__")];
  const d1 = (context?.env?.DB || (globalThis as any).DB) as D1Database | undefined;

  if (!d1 || typeof d1.prepare !== "function") {
    const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
    if (isBuildPhase) {
      return {
        prepare() {
          return {
            bind() {
              return this;
            },
            first: async () => null,
            run: async () => ({ success: true }),
            all: async () => ({ results: [] }),
            raw: async () => [],
          };
        },
        batch: async () => [],
        exec: async () => ({ count: 0, duration: 0 }),
        dump: async () => new ArrayBuffer(0),
      } as unknown as D1Database;
    }

    throw new Error(
      "Thiếu D1 binding `DB`. Hãy chạy app trên Cloudflare Workers hoặc gán context.env.DB trong môi trường dev.",
    );
  }

  return d1;
}

export function getDb(): AppDb {
  return createDb(getD1Binding());
}
