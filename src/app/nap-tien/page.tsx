"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  CreditCard,
  ExternalLink,
  HelpCircle,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ContentPageHeader } from "@/components/layout/content-page-header";

const presetAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

type BankInfo = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

export default function TopupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState(100000);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<number | null>(null);
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [transferContent, setTransferContent] = useState<string>("");
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bankCode: "BIDV",
    bankName: "BIDV - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
    accountNumber: "8858978570",
    accountName: "NGUYEN THANH PHONG",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);

  async function createDepositOrder() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/nap-tien/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        qrCodeUrl?: string;
        orderCode?: number;
        transactionId?: number;
        description?: string;
        bankInfo?: BankInfo;
        message?: string;
      };
      setLoading(false);

      if (!res.ok) {
        setError(data.message || "Tạo yêu cầu nạp tiền thất bại");
        return;
      }

      setQrCodeUrl(data.qrCodeUrl || null);
      setOrderCode(data.orderCode || null);
      setTransactionId(data.transactionId || null);
      setTransferContent(data.description || "");
      if (data.bankInfo) {
        setBankInfo(data.bankInfo);
      }
      setStatusMessage("Đã tạo yêu cầu nạp tiền. Đang chờ bạn chuyển khoản...");
      setStep(2);
    } catch {
      setLoading(false);
      setError("Lỗi kết nối máy chủ khi tạo đơn nạp tiền");
    }
  }

  async function checkPaymentStatus() {
    if (!orderCode && !transactionId) return false;

    try {
      const query = transactionId ? `txId=${transactionId}` : `orderCode=${orderCode}`;
      const res = await fetch(`/api/nap-tien/status?${query}`, { cache: "no-store" });
      if (!res.ok) return false;

      const data = (await res.json()) as {
        found?: boolean;
        status?: string;
        currentBalance?: number;
        message?: string;
      };
      if (!data.found) return false;

      if (data.status === "success") {
        setStatusMessage("Nạp tiền thành công! Số dư của bạn đã được cập nhật.");
        setUserBalance(data.currentBalance ?? null);
        setStep(3);
        setPolling(false);
        return true;
      } else if (data.status === "cancelled") {
        setError("Đơn nạp tiền đã bị huỷ hoặc từ chối.");
        setPolling(false);
        return true;
      }

      setStatusMessage("Đang chờ xác nhận giao dịch từ Quản trị viên...");
      return false;
    } catch {
      return false;
    }
  }

  // Tự động kiểm tra trạng thái giao dịch định kỳ khi ở Bước 2
  useEffect(() => {
    if ((!orderCode && !transactionId) || step !== 2) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      setPolling(true);
      const done = await checkPaymentStatus();
      if (cancelled || done) {
        setPolling(false);
        return;
      }
      timer = setTimeout(poll, 4000);
    }

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      setPolling(false);
    };
  }, [orderCode, transactionId, step]);

  function copyToClipboard(text: string, fieldName: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <ContentPageHeader
        icon={Wallet}
        title="Nạp tiền qua Chuyển khoản VietQR"
        description="Nạp tiền tỷ lệ 1:1 không mất phí. Quét mã QR tự động điền thông tin và Admin duyệt tiền nhanh chóng."
      />

      {/* Progress Steps */}
      <div className="grid gap-2 sm:gap-3 sm:grid-cols-3">
        <StepCard
          title="Bước 1"
          subtitle="Chọn số tiền"
          active={step === 1}
          done={step > 1}
          icon={<CircleDollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
        />
        <StepCard
          title="Bước 2"
          subtitle="Quét QR & Chuyển khoản"
          active={step === 2}
          done={step > 2}
          icon={<QrCode className="h-4 w-4 sm:h-5 sm:w-5" />}
        />
        <StepCard
          title="Bước 3"
          subtitle="Hoàn tất & Cộng số dư"
          active={step === 3}
          done={false}
          icon={<Wallet className="h-4 w-4 sm:h-5 sm:w-5" />}
        />
      </div>

      {/* ── BƯỚC 1: CHỌN MỆNH GIÁ NẠP ── */}
      {step === 1 && (
        <section className="rounded-2xl border border-amber-500/25 bg-black/30 p-4 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <h2 className="text-base font-bold text-amber-200 sm:text-xl flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-amber-300" />
              1. Chọn số tiền muốn nạp
            </h2>
            <span className="rounded-full bg-emerald-950/60 border border-emerald-500/40 px-3 py-0.5 text-xs font-semibold text-emerald-300">
              Tỷ lệ 1:1 · Miễn phí giao dịch
            </span>
          </div>

          {/* Presets */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">
              Chọn nhanh gói nạp:
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
              {presetAmounts.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAmount(item)}
                  className={`rounded-xl border px-3 py-3 text-center font-bold transition ${
                    amount === item
                      ? "border-amber-300 bg-amber-600/30 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)] scale-[1.02]"
                      : "border-amber-500/20 bg-black/40 text-zinc-300 hover:border-amber-400/50 hover:bg-black/60"
                  }`}
                >
                  <span className="block text-sm sm:text-base">{item.toLocaleString("vi-VN")}đ</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Hoặc nhập số tiền tùy ý (VNĐ):
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={10000}
                  step={10000}
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Nhập số tiền (tối thiểu 10.000đ)..."
                  className="w-full rounded-xl border border-amber-500/30 bg-black/50 px-4 py-3 text-base font-bold text-amber-100 focus:border-amber-400 focus:outline-none"
                />
                <span className="absolute right-4 top-3.5 text-xs font-bold text-zinc-500">VNĐ</span>
              </div>

              <button
                onClick={createDepositOrder}
                disabled={loading || amount < 10000}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-600/60 bg-gradient-to-r from-red-700 to-amber-700 px-6 py-3 text-sm font-extrabold text-amber-100 shadow-lg transition hover:from-red-600 hover:to-amber-600 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tạo đơn...
                  </>
                ) : (
                  <>
                    <span>Tạo yêu cầu nạp tiền</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200 sm:text-sm">
              {error}
            </div>
          )}

          {/* Info card */}
          <div className="rounded-xl border border-amber-500/20 bg-black/40 p-4 text-xs text-zinc-300 space-y-1.5">
            <p className="flex items-center gap-1.5 text-amber-200 font-semibold">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Lợi ích khi nạp tiền tại Mu Mới Ra:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1">
              <li>Số tiền nạp được cộng 100% vào số dư tài khoản của bạn.</li>
              <li>Dùng số dư để đăng ký gói VIP Server, ghim Banner trang chủ, trang bài viết.</li>
              <li>Hệ thống hỗ trợ duyệt tiền nhanh chóng 24/7 qua chuyển khoản ngân hàng.</li>
            </ul>
          </div>
        </section>
      )}

      {/* ── BƯỚC 2: QUÉT QR & CHUYỂN KHOẢN ── */}
      {step === 2 && (
        <section className="rounded-2xl border border-amber-500/25 bg-black/30 p-4 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
            <h2 className="text-base font-bold text-amber-200 sm:text-xl flex items-center gap-2">
              <QrCode className="h-5 w-5 text-amber-300" />
              2. Quét mã VietQR hoặc Chuyển khoản ngân hàng
            </h2>

            <button
              onClick={() => {
                setStep(1);
                setQrCodeUrl(null);
                setOrderCode(null);
              }}
              className="text-xs text-zinc-400 hover:text-amber-200 underline"
            >
              Chọn lại số tiền
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200 sm:text-sm">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            {/* VietQR Image Container */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-500/30 bg-black/60 p-4 shadow-inner">
              {qrCodeUrl ? (
                <div className="relative overflow-hidden rounded-xl bg-white p-2.5 shadow-md">
                  <Image
                    src={qrCodeUrl}
                    alt="Mã VietQR nạp tiền BIDV"
                    width={260}
                    height={260}
                    unoptimized
                    priority
                    className="h-64 w-64 object-contain rounded-lg sm:h-72 sm:w-72"
                  />
                </div>
              ) : (
                <div className="flex h-64 w-64 items-center justify-center text-zinc-500">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
              <p className="mt-3 text-center text-xs font-semibold text-amber-300">
                Mở app ngân hàng quét mã QR để chuyển tiền nhanh
              </p>
            </div>

            {/* Transfer Details Cards */}
            <div className="space-y-3.5">
              <div className="rounded-xl border border-amber-500/20 bg-black/40 p-4 space-y-3">
                {/* Ngân hàng */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <span className="text-xs text-zinc-400">Ngân hàng:</span>
                  <span className="text-sm font-bold text-amber-100 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-amber-400" />
                    {bankInfo.bankName || "BIDV"}
                  </span>
                </div>

                {/* Số tài khoản */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <span className="text-xs text-zinc-400">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-extrabold text-amber-200">
                      {bankInfo.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bankInfo.accountNumber, "acc")}
                      className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition"
                      title="Sao chép số tài khoản"
                    >
                      {copiedField === "acc" ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Chủ tài khoản */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <span className="text-xs text-zinc-400">Chủ tài khoản:</span>
                  <span className="text-sm font-extrabold text-zinc-100 tracking-wide">
                    {bankInfo.accountName}
                  </span>
                </div>

                {/* Số tiền */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <span className="text-xs text-zinc-400">Số tiền chuyển:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-emerald-400">
                      {amount.toLocaleString("vi-VN")} VNĐ
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(String(amount), "amount")}
                      className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition"
                      title="Sao chép số tiền"
                    >
                      {copiedField === "amount" ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Cú pháp chuyển khoản */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-zinc-400">Nội dung CK:</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 font-mono text-sm font-extrabold text-amber-200">
                      {transferContent}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(transferContent, "memo")}
                      className="inline-flex items-center gap-1 rounded bg-amber-500/30 px-2.5 py-1 text-xs font-bold text-amber-200 hover:bg-amber-500/40 transition"
                      title="Sao chép nội dung"
                    >
                      {copiedField === "memo" ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Warning note */}
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-950/20 p-3.5 text-xs text-yellow-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-yellow-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-400" />
                  Lưu ý quan trọng khi chuyển khoản:
                </p>
                <p className="text-zinc-300">
                  - Quét mã QR để app ngân hàng tự điền chính xác số tiền và nội dung.
                </p>
                <p className="text-zinc-300">
                  - Nếu chuyển tay, vui lòng ghi đúng chính xác <b>Nội dung CK ({transferContent})</b> để hệ thống kiểm tra và duyệt tiền nhanh nhất.
                </p>
              </div>

              {/* Status indicator & check button */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                  <span>{statusMessage || "Đang tự động kiểm tra giao dịch..."}</span>
                </div>

                <button
                  type="button"
                  onClick={() => void checkPaymentStatus()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/60 bg-emerald-800/40 px-3.5 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-800/60"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Kiểm tra trạng thái ngay
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── BƯỚC 3: HOÀN TẤT & CẬP NHẬT SỐ DƯ ── */}
      {step === 3 && (
        <section className="rounded-2xl border border-emerald-500/40 bg-black/40 p-6 sm:p-10 shadow-2xl text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 animate-in zoom-in">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-300">
              Nạp tiền thành công!
            </h2>
            <p className="text-sm text-zinc-300 max-w-md mx-auto">
              Giao dịch nạp tiền <b>+{amount.toLocaleString("vi-VN")}đ</b> đã được duyệt và cộng vào tài khoản của bạn.
            </p>
            {userBalance !== null && (
              <p className="text-base font-bold text-amber-200 pt-1">
                Số dư hiện tại: {userBalance.toLocaleString("vi-VN")}đ
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href="/tai-khoan/tong-quan"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-700/30 px-5 py-2.5 text-sm font-bold text-amber-100 transition hover:bg-amber-700/50"
            >
              <Wallet className="h-4 w-4" />
              Xem trang Tài khoản
            </Link>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOrderCode(null);
                setTransactionId(null);
                setQrCodeUrl(null);
                setStatusMessage(null);
                setError(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800"
            >
              <RefreshCw className="h-4 w-4" />
              Tạo đơn nạp mới
            </button>
          </div>
        </section>
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
      className={`rounded-xl border p-3.5 transition sm:p-4 ${
        active
          ? "border-amber-400 bg-amber-700/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
          : done
          ? "border-emerald-500/40 bg-emerald-950/20"
          : "border-amber-500/20 bg-black/25 opacity-75"
      }`}
    >
      <div className="flex items-center gap-2 text-amber-200">
        {done ? <Check className="h-4 w-4 text-emerald-400" /> : icon}
        <span className="text-xs font-semibold text-zinc-400">{title}</span>
      </div>
      <p className="mt-1 text-sm sm:text-base font-extrabold text-amber-100">{subtitle}</p>
    </div>
  );
}
