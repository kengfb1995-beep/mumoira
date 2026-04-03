import { NextResponse } from "next/server";

type Bucket = {
  count: number;
  expiresAt: number;
};

const memoryStore = new Map<string, Bucket>();

export function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return req.headers.get("x-real-ip") ?? "unknown";
}

export function enforceRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const found = memoryStore.get(input.key);

  if (!found || found.expiresAt <= now) {
    memoryStore.set(input.key, {
      count: 1,
      expiresAt: now + input.windowMs,
    });
    return { allowed: true, remaining: input.limit - 1 };
  }

  if (found.count >= input.limit) {
    return { allowed: false, remaining: 0, retryAfterMs: found.expiresAt - now };
  }

  found.count += 1;
  return { allowed: true, remaining: input.limit - found.count };
}

export function rateLimitResponse(retryAfterMs?: number) {
  const retryAfterSeconds = Math.max(1, Math.ceil((retryAfterMs ?? 1000) / 1000));
  return NextResponse.json(
    { message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
