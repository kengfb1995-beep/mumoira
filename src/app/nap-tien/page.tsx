"use client";

import Image from "next/image";
import { useState } from "react";

export default function TopupPage() {
  const [amount, setAmount] = useState(100000);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createPaymentLink() {
    setError(null);
    const res = await fetch("/api/payos/create-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    const data = (await res.json()) as {
      checkoutUrl?: string;
      qrCode?: string;
      message?: string;
    };

    if (!res.ok) {
      setError(data.message ?? "Tạo thanh toán thất bại");
      return;
    }

    setCheckoutUrl(data.checkoutUrl ?? null);
    setQrCode(data.qrCode ?? null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-amber-500/20 bg-black/25 p-6">
      <h1 className="text-2xl font-bold text-amber-200">Nạp tiền PayOS</h1>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          type="number"
          min={10000}
          step={10000}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          className="rounded-md border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
        />
        <button
          onClick={createPaymentLink}
          className="rounded-md border border-red-700/60 bg-red-800/80 px-4 py-2 text-sm font-semibold text-amber-100"
        >
          Tạo QR nạp tiền
        </button>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {qrCode ? (
        <div className="rounded-lg border border-amber-500/30 bg-black/30 p-4">
          <p className="mb-2 text-sm text-zinc-200">Quét mã QR để thanh toán:</p>
          <Image
            src={qrCode}
            alt="QR PayOS"
            width={288}
            height={288}
            unoptimized
            className="h-72 w-72 rounded-md border border-amber-500/20"
          />
        </div>
      ) : null}

      {checkoutUrl ? (
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm font-medium text-amber-300 hover:underline"
        >
          Mở trang thanh toán PayOS
        </a>
      ) : null}
    </div>
  );
}
