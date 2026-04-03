"use client";

import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastItem = {
  id: number;
  title: string;
  type: "success" | "error" | "info";
};

type ToastInput = {
  title: string;
  type?: "success" | "error" | "info";
};

type UiContextValue = {
  notify: (input: ToastInput) => void;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <UiContext.Provider value={value}>
      {children}

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

export function useUiNotify() {
  const ctx = useContext(UiContext);
  if (!ctx) {
    throw new Error("useUiNotify must be used within UiProvider");
  }
  return ctx.notify;
}
