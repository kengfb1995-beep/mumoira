import { getSecureSetting } from "@/lib/secure-settings";

export type BankConfig = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

export const DEFAULT_BANK_CONFIG: BankConfig = {
  bankCode: "BIDV",
  bankName: "BIDV - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
  accountNumber: "8858978570",
  accountName: "NGUYEN THANH PHONG",
};

/**
 * Lấy cấu hình ngân hàng nhận tiền nạp (ưu tiên cấu hình trong database, fallback về mặc định).
 */
export async function getBankConfig(): Promise<BankConfig> {
  try {
    const [customBankCode, customAccountNum, customAccountName] = await Promise.all([
      getSecureSetting("BANK_CODE"),
      getSecureSetting("BANK_ACCOUNT_NUMBER"),
      getSecureSetting("BANK_ACCOUNT_NAME"),
    ]);

    return {
      bankCode: customBankCode?.trim() || DEFAULT_BANK_CONFIG.bankCode,
      bankName: DEFAULT_BANK_CONFIG.bankName,
      accountNumber: customAccountNum?.trim() || DEFAULT_BANK_CONFIG.accountNumber,
      accountName: (customAccountName?.trim() || DEFAULT_BANK_CONFIG.accountName).toUpperCase(),
    };
  } catch {
    return DEFAULT_BANK_CONFIG;
  }
}

/**
 * Tạo cú pháp nội dung chuyển khoản chuẩn: NAP <userId> <orderCode>
 */
export function generateTransferContent(userId: number, orderCode: number | string): string {
  return `NAP ${userId} ${orderCode}`;
}

/**
 * Sinh link ảnh VietQR chuẩn theo định dạng VietQR.io (nhúng sẵn số tài khoản, số tiền và nội dung chuyển khoản)
 */
export function getVietQrUrl(params: {
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  amount: number;
  description: string;
}): string {
  const bank = params.bankCode || DEFAULT_BANK_CONFIG.bankCode;
  const acc = params.accountNumber || DEFAULT_BANK_CONFIG.accountNumber;
  const name = encodeURIComponent(params.accountName || DEFAULT_BANK_CONFIG.accountName);
  const memo = encodeURIComponent(params.description);
  const amount = Math.max(0, Math.round(params.amount));

  return `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${name}`;
}
