/* eslint-disable @typescript-eslint/no-explicit-any */
// Cloudflare Worker entry — kept for reference only.
// This file is excluded from Next.js build (see tsconfig.json).
// Not used on Netlify deployment.

export { default } from "../.open-next/worker";

import { runExpireBannersWithRetry } from "./cron";

type ScheduledController = {
  cron: string;
  scheduledTime: number;
};

export async function scheduled(
  _controller: ScheduledController,
  env: any,
  ctx: any,
) {
  ctx.waitUntil(runExpireBannersWithRetry(env));
}
