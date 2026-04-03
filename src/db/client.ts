import { drizzle } from "drizzle-orm/d1";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

export type D1DatabaseBinding = {
  prepare: (query: string) => unknown;
  dump: () => Promise<ArrayBuffer>;
  batch: <T = unknown>(statements: unknown[]) => Promise<T[]>;
  exec: (query: string) => Promise<unknown>;
};

export type AppDb = DrizzleD1Database<typeof schema>;

export function createDb(db: D1DatabaseBinding): AppDb {
  return drizzle(db as never, { schema });
}
