import { logEvent } from "./lib/logger";

export interface Env {
  APP_BASE_URL: string;
  MAINTENANCE_CRON_SECRET: string;
  CRON_ALERT_WEBHOOK_URL?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendCronAlert(env: Env, payload: Record<string, unknown>) {
  if (!env.CRON_ALERT_WEBHOOK_URL) return;

  try {
    await fetch(env.CRON_ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    logEvent("error", "cron_alert_failed", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

async function callExpireBanners(env: Env) {
  const url = `${env.APP_BASE_URL.replace(/\/$/, "")}/api/maintenance/expire-banners`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.MAINTENANCE_CRON_SECRET}`,
      "Content-Type": "application/json",
    },
  });

  const bodyText = await response.text();
  return { response, bodyText };
}

async function runExpireBannersWithRetry(env: Env) {
  const maxAttempts = 3;
  const backoffMs = [0, 1000, 3000];

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (backoffMs[attempt - 1] > 0) {
      await sleep(backoffMs[attempt - 1]);
    }

    try {
      const { response, bodyText } = await callExpireBanners(env);

      if (!response.ok) {
        throw new Error(`status=${response.status} body=${bodyText.slice(0, 500)}`);
      }

      logEvent("info", "cron_expire_banners_success", {
        attempt,
        body: bodyText,
      });

      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("unknown_error");
      logEvent("warn", "cron_expire_banners_attempt_failed", {
        attempt,
        message: lastError.message,
      });
    }
  }

  await sendCronAlert(env, {
    event: "cron_expire_banners_failed",
    message: lastError?.message ?? "unknown_error",
    at: new Date().toISOString(),
  });

  throw lastError ?? new Error("expire-banners failed after retries");
}

type CronExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
};

const schedulerWorker = {
  async fetch() {
    return new Response("mu-moi-ra scheduler worker is running", { status: 200 });
  },

  async scheduled(_controller: unknown, env: Env, ctx: CronExecutionContext) {
    ctx.waitUntil(runExpireBannersWithRetry(env));
  },
};

export default schedulerWorker;
