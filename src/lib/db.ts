import { createDb, type D1DatabaseBinding } from "@/db/client";

function getD1Binding(): D1DatabaseBinding {
  const maybeBinding = (globalThis as { DB?: D1DatabaseBinding }).DB;

  if (!maybeBinding) {
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
      } as unknown as D1DatabaseBinding;
    }

    throw new Error(
      "Thiếu D1 binding `DB`. Hãy chạy app trên Cloudflare Workers hoặc gán globalThis.DB trong môi trường dev.",
    );
  }

  return maybeBinding;
}

export function getDb() {
  return createDb(getD1Binding());
}
