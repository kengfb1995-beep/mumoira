/// <reference types="@cloudflare/workers-types" />
import { drizzle } from "drizzle-orm/d1";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

export type D1DatabaseBinding = D1Database;
export type AppDb = DrizzleD1Database<typeof schema>;

export function createDb(d1: D1Database): AppDb {
  return drizzle(d1, { schema });
}
