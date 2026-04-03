let cachedToken: string | null = null;

export async function getCsrfToken() {
  if (cachedToken) return cachedToken;

  const res = await fetch("/api/csrf", {
    method: "GET",
    credentials: "same-origin",
  });

  if (!res.ok) {
    throw new Error("Không lấy được CSRF token");
  }

  const data = (await res.json()) as { token?: string };
  if (!data.token) {
    throw new Error("CSRF token không hợp lệ");
  }

  cachedToken = data.token;
  return cachedToken;
}

export async function withCsrfHeaders(headers?: HeadersInit) {
  const token = await getCsrfToken();
  return {
    ...(headers ?? {}),
    "x-csrf-token": token,
  } as HeadersInit;
}
