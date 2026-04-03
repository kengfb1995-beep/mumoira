import { randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "mmr_csrf";

function parseCookie(cookieHeader: string | null, key: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    const [k, ...rest] = part.split("=");
    if (k === key) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

export function createCsrfToken() {
  return randomBytes(24).toString("base64url");
}

export function buildCsrfResponse() {
  const token = createCsrfToken();
  const response = NextResponse.json({ token });
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 6,
  });
  return response;
}

export function verifyCsrf(req: Request) {
  const headerToken = req.headers.get("x-csrf-token") ?? "";
  const cookieToken = parseCookie(req.headers.get("cookie"), CSRF_COOKIE_NAME) ?? "";

  if (!headerToken || !cookieToken || headerToken.length !== cookieToken.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(headerToken), Buffer.from(cookieToken));
}

export function assertCsrf(req: Request) {
  return verifyCsrf(req);
}
