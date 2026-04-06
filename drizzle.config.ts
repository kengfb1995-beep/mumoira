import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error("Thiếu TURSO_DATABASE_URL trong .env.local");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} as never);
