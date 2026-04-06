"use client";

import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";

type ToastItem = {
  id: number;
  title: string;
  type: "success" | "error" | "info";
};

type ToastInput = {
  title: string;
  type?: "success" | "error" | "info";
};

type ConfirmInput = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ConfirmState = ConfirmInput & {
  resolve: (value: boolean) => void;
};

type UiContextValue = {
  notify: (input: ToastInput) => void;
  confirm: (input: ConfirmInput) => Promise<boolean>;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const notify = useCallback((input: ToastInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const toast: ToastItem = {
      id,
      title: input.title,
      type: input.type ?? "info",
    };

    setToasts((prev) => [...prev, toast]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 2800);
  }, []);

  const confirm = useCallback((input: ConfirmInput) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        ...input,
        resolve,
      });
    });
  }, []);

  function closeConfirm(result: boolean) {
    const current = confirmState;
    setConfirmState(null);
    current?.resolve(result);
  }

  const value = useMemo(() => ({ notify, confirm }), [notify, confirm]);

  return (
    <UiContext.Provider value={value}>
      {children}

      {confirmState ? (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          role="presentation"
          onClick={() => closeConfirm(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ui-confirm-title"
            className="pointer-events-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") closeConfirm(false);
            }}
          >
            <div className="flex gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="ui-confirm-title" className="text-lg font-bold text-zinc-900 sm:text-xl">
                  {confirmState.title}
                </h2>
                {confirmState.description ? (
                  <p className="mt-2 text-base leading-relaxed text-zinc-600 font-medium">{confirmState.description}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100"
              >
                {confirmState.cancelLabel ?? "Hủy"}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 shadow-md shadow-red-200"
              >
                {confirmState.confirmLabel ?? "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md ${
              toast.type === "success"
                ? "border-emerald-500/40 bg-emerald-900/70 text-emerald-100"
                : toast.type === "error"
                  ? "border-red-500/40 bg-red-950/75 text-red-100"
                  : "border-amber-500/40 bg-zinc-900/75 text-amber-100"
            }`}
          >
            {toast.title}
          </div>
        ))}
      </div>
    </UiContext.Provider>
  );
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) {
    throw new Error("useUi must be used within UiProvider");
  }
  return ctx;
}

export function useUiNotify() {
  return useUi().notify;
}
