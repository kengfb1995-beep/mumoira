import { PayOS } from "@payos/node";
import { getSecureSetting } from "@/lib/secure-settings";

let payosSingleton: PayOS | null = null;
let refreshAt = 0;
const CACHE_TTL_MS = 60_000;

export async function getPayOSClient() {
  if (payosSingleton && Date.now() < refreshAt) {
    return payosSingleton;
  }

  const [clientId, apiKey, checksumKey] = await Promise.all([
    getSecureSetting("PAYOS_CLIENT_ID"),
    getSecureSetting("PAYOS_API_KEY"),
    getSecureSetting("PAYOS_CHECKSUM_KEY"),
  ]);

  if (!clientId || !apiKey || !checksumKey) {
    throw new Error("PayOS credentials chưa được cấu hình. Vui lòng cập nhật trong Admin → API Key.");
  }

  payosSingleton = new PayOS({ clientId, apiKey, checksumKey });
  refreshAt = Date.now() + CACHE_TTL_MS;

  return payosSingleton;
}
