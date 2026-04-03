import { PayOS } from "@payos/node";

let payosSingleton: PayOS | null = null;

export function getPayOSClient() {
  if (payosSingleton) {
    return payosSingleton;
  }

  payosSingleton = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY,
  });

  return payosSingleton;
}
