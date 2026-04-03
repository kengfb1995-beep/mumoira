import { buildCsrfResponse } from "@/lib/csrf";

export async function GET() {
  return buildCsrfResponse();
}
