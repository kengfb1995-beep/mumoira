"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, CircleDollarSign, Loader2, QrCode, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ContentPageHeader } from "@/components/layout/content-page-header";

const presetAmounts = [50000, 100000, 200000, 500000, 1000000];

export default function TopupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState(100000);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fee = useMemo(() => Math.round(amount * 0.01), [amount]);
  const total = amount + fee;

  async function createPaymentLink() {
    setError(null);
    setLoading(true);

    const res = await fetch("/api/payos/create-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    const data = (await res.json()) as {
      checkoutUrl?: string;
      qrCode?: string;
      orderCode?: number;
      message?: string;
      detail?: string;
    };

    setLoading(false);

    if (!res.ok) {
      setError(data.detail ? `${data.message ?? "Tạo thanh toán thất bại"} (${data.detail})` : (data.message ?? "Tạo thanh toán thất bại"));
      return;
    }

    setCheckoutUrl(data.checkoutUrl ?? null);
    setQrCode(data.qrCode ?? null);
    setOrderCode(data.orderCode ?? null);
    setStatusMessage("Đã tạo thanh toán. Đang chờ PayOS xác nhận...");

    if (data.checkoutUrl) {
      setShowModal(true);
      // window.open(data.checkoutUrl, "payos_popup", "width=520,height=760,menubar=no,toolbar=no,location=no,status=no");
    }

    setStep(2);
  }

  async function checkPaymentStatus() {
    if (!orderCode) return false;

    const res = await fetch(`/api/payos/status?orderCode=${orderCode}`, { cache: "no-store" });
    if (!res.ok) return false;

    const data = (await res.json()) as { found?: boolean; status?: string };
    if (!data.found) return false;

    if (data.status === "success") {
      setStatusMessage("Thanh toán thành công. Số dư đã được cập nhật.");
      setStep(3);
      setPolling(false);
      return true;
    }

    setStatusMessage("Đang chờ xác nhận giao dịch từ PayOS...");
    return false;
  }

  useEffect(() => {
    if (step === 3) {
      setShowModal(false);
    }
  }, [step]);

  useEffect(() => {
    if (!orderCode || step !== 2) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      setPolling(true);
      const done = await checkPaymentStatus();
      if (cancelled || done) return;
      timer = setTimeout(poll, 3000);
    }

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      setPolling(false);
    };
  }, [orderCode, step]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <ContentPageHeader
        icon={Wallet}
        title="Nạp tiền nhanh với PayOS"
        description="Chọn mệnh giá, thanh toán QR PayOS, số dư cập nhật sau khi giao dịch thành công."
      />

      <div className="grid gap-2 sm:gap-3 sm:grid-cols-3">
        <StepCard title="Bước 1" subtitle="Chọn mệnh giá" active={step === 1} done={step > 1} icon={<CircleDollarSign className="h-4 w-4 sm:h-5 sm:w-5" />} />
        <StepCard title="Bước 2" subtitle="Quét mã QR" active={step === 2} done={step > 2} icon={<QrCode className="h-4 w-4 sm:h-5 sm:w-5" />} />
        <StepCard title="Bước 3" subtitle="Cập nhật số dư" active={step === 3} done={false} icon={<Wallet className="h-4 w-4 sm:h-5 sm:w-5" />} />
      </div>

      <section className="rounded-2xl border border-amber-500/25 bg-black/25 p-3 sm:p-5">
        <h2 className="text-base font-bold text-amber-200 sm:text-xl">1) Chọn số tiền nạp</h2>

        <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-5">
          {presetAmounts.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setAmount(item);
                setStep(1);
              }}
              className={`rounded-xl border px-2 py-1.5 text-xs font-semibold transition sm:px-3 sm:py-2 sm:text-sm ${
                amount === item
                  ? "border-amber-300 bg-amber-700/30 text-amber-100"
                  : "border-amber-500/25 bg-black/30 text-zinc-200 hover:border-amber-400/50"
              }`}
            >
              {item.toLocaleString("vi-VN")}đ
            </button>
          ))}
        </div>

        <div className="mt-2 grid gap-2 sm:mt-3 sm:grid-cols-[1fr_auto]">
          <input
            type="number"
            min={10000}
            step={10000}
            value={amount}
            onChange={(event) => {
              setAmount(Number(event.target.value));
              setStep(1);
            }}
            className="w-full rounded-xl border border-amber-500/30 bg-black/40 px-3 py-2 text-sm"
          />
          <button
            onClick={createPaymentLink}
            disabled={loading || amount < 10000}
            className="rounded-xl border border-red-700/60 bg-red-800/80 px-4 py-2 text-sm font-bold text-amber-100 disabled:opacity-50 sm:px-5"
          >
            {loading ? "Đang tạo..." : "Tạo thanh toán"}
          </button>
        </div>

        <div className="mt-3 rounded-xl border border-amber-500/20 bg-black/30 p-3 text-xs text-zinc-200 sm:mt-4 sm:p-4 sm:text-sm">
          <p>Số tiền nạp: {amount.toLocaleString("vi-VN")}đ</p>
          <p>Phí xử lý dự kiến: {fee.toLocaleString("vi-VN")}đ</p>
          <p className="font-semibold text-amber-200">Tổng thanh toán: {total.toLocaleString("vi-VN")}đ</p>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/25 bg-black/25 p-3 sm:p-5">
        <h2 className="text-base font-bold text-amber-200 sm:text-xl">2) Quét QR và thanh toán</h2>
        {error ? <p className="mt-2 text-xs text-red-300 sm:mt-3 sm:text-sm">{error}</p> : null}

        {qrCode ? (
          <div className="mt-3 grid gap-3 sm:mt-4 lg:grid-cols-[280px_1fr]">
            <div className="rounded-xl border border-amber-500/25 bg-black/30 p-3 sm:p-4">
              <Image src={qrCode} alt="QR PayOS" width={240} height={240} unoptimized className="h-60 w-full rounded-lg object-contain sm:h-72" />
            </div>

            <div className="space-y-2.5 rounded-xl border border-amber-500/20 bg-black/30 p-3 text-xs text-zinc-200 sm:space-y-3 sm:p-4 sm:text-sm">
              <p>Quét mã bằng app ngân hàng để hoàn tất nạp tiền.</p>
              {statusMessage ? <p className="text-amber-200">{statusMessage}</p> : null}
              {polling ? (
                <p className="inline-flex items-center gap-2 text-zinc-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tự động kiểm tra thanh toán...
                </p>
              ) : null}
              {checkoutUrl ? (
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-lg border border-amber-400/60 bg-amber-700/20 px-3 py-1.5 font-semibold text-amber-100 sm:px-4 sm:py-2"
                >
                  Mở popup thanh toán PayOS
                </a>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  if (!checkoutUrl) return;
                  window.open(checkoutUrl, "payos_popup", "width=520,height=760,menubar=no,toolbar=no,location=no,status=no");
                }}
                className="block rounded-lg border border-amber-500/60 bg-amber-900/30 px-3 py-1.5 font-semibold text-amber-200 sm:px-4 sm:py-2"
              >
                Mở popup nhỏ để thanh toán
              </button>

              <button
                type="button"
                onClick={() => void checkPaymentStatus()}
                className="block rounded-lg border border-emerald-600/60 bg-emerald-800/30 px-3 py-1.5 font-semibold text-emerald-200 sm:px-4 sm:py-2"
              >
                Kiểm tra trạng thái ngay
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-zinc-300 sm:mt-3 sm:text-sm">Tạo giao dịch ở Bước 1 để nhận mã QR.</p>
        )}
      </section>

      <section className="rounded-2xl border border-amber-500/25 bg-black/25 p-3 sm:p-5">
        <h2 className="text-base font-bold text-amber-200 sm:text-xl">3) Kiểm tra trạng thái và số dư</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-200 sm:mt-3 sm:gap-3 sm:text-sm">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 sm:h-4 sm:w-4" />
          <span className="text-zinc-200">Giao dịch thành công sẽ được ghi nhận ngay trong tài khoản và phản ánh vào số dư khả dụng.</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
          <Link href="/tai-khoan/tong-quan" className="rounded-lg border border-amber-500/40 bg-black/30 px-3 py-1.5 text-xs text-amber-100 sm:px-4 sm:py-2 sm:text-sm">
            Mở trang Tài khoản
          </Link>
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setOrderCode(null);
              setCheckoutUrl(null);
              setQrCode(null);
              setStatusMessage(null);
              setError(null);
            }}
            className="rounded-lg border border-zinc-600/60 bg-zinc-900/40 px-3 py-1.5 text-xs text-zinc-200 sm:px-4 sm:py-2 sm:text-sm"
          >
            Tạo giao dịch mới
          </button>
        </div>
      </section>

      {/* --- PayOS Iframe Modal --- */}
      {showModal && checkoutUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-md">
          <div className="relative h-full w-full max-w-[500px] animate-in fade-in zoom-in duration-300">
            {/* Header / Close button */}
            <div className="absolute -top-10 right-0 flex items-center gap-3">
              <span className="text-xs text-zinc-400">Tự động đóng khi thanh toán thành công</span>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full bg-red-600/80 p-2 text-white hover:bg-red-600 transition shadow-lg"
                title="Đóng cửa sổ"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Iframe container */}
            <div className="h-full w-full overflow-hidden rounded-2xl border border-amber-500/40 bg-[#1a1b1e] shadow-2xl">
              <iframe
                src={checkoutUrl}
                title="PayOS Checkout"
                className="h-full w-full"
                allow="payment"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepCard({
  title,
  subtitle,
  active,
  done,
  icon,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  done: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        active
          ? "border-amber-300 bg-amber-700/20"
          : done
            ? "border-emerald-500/40 bg-emerald-900/20"
            : "border-amber-500/20 bg-black/25"
      }`}
    >
      <div className="flex items-center gap-2 text-amber-200">{icon}</div>
      <p className="mt-2 text-sm text-zinc-300">{title}</p>
      <p className="text-lg font-bold text-amber-100">{subtitle}</p>
    </div>
  );
}
