"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import { withCsrfHeaders } from "@/lib/csrf-client";

type Thresholds = {
  minSuccessRate: number;
  maxAvgDurationMs: number;
  maxWebhookRejects: number;
};

type AnalyticsResponse = {
  filters: {
    days: 7 | 30 | 90;
    taskName: string;
    availableTasks: string[];
  };
  kpi: {
    totalRuns: number;
    successRuns: number;
    failedRuns: number;
    successRate: number;
    totalProcessed: number;
    avgDurationMs: number;
    webhookRejectCount: number;
  };
  compare: {
    currentPeriodDays: number;
    previousPeriodDays: number;
    totalRunsDelta: number;
    successRateDelta: number;
    processedDelta: number;
  };
  thresholds: Thresholds;
  chart: Array<{ date: string; totalRuns: number; successRuns: number; failedRuns: number; processedCount: number }>;
  taskBreakdown: Array<{ taskName: string; totalRuns: number; successRuns: number; failedRuns: number; processedCount: number; avgDurationMs: number; successRate: number }>;
  anomalies: Array<{ type: string; severity: string; message: string }>;
  sla: {
    incidentCount: number;
    breachedCount: number;
    breachRate: number;
    mttaMs: number;
    mttrMs: number;
    daily: Array<{ date: string; total: number; breached: number; resolved: number }>;
    topAssignees: Array<{ email: string; count: number }>;
    topIncidentTypes: Array<{ incidentType: string; total: number; breached: number; breachRate: number }>;
  };
};

type IncidentsResponse = {
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  canAcknowledge: boolean;
  canResolve: boolean;
  items: Array<{
    id: string;
    source: string;
    incidentType: string;
    message: string;
    createdAt: number;
    status: "open" | "acknowledged" | "resolved";
    acknowledged: boolean;
    acknowledgedBy: string | null;
    acknowledgedAt: number | null;
    assignedTo: string | null;
    assignedToUserId: number | null;
    resolvedAt: number | null;
    slaDueAt: number | null;
    slaState: "unknown" | "within" | "breached" | "resolved";
    note: string | null;
  }>;
};

const RUNBOOK: Record<string, string[]> = {
  success_rate: [
    "Kiểm tra endpoint maintenance có timeout hoặc 5xx gần đây.",
    "Xem log cron_runs để xác định task fail nhiều nhất.",
    "Kiểm tra secret MAINTENANCE_CRON_SECRET và APP_BASE_URL.",
  ],
  latency: [
    "Xem durationMs trung bình theo task trong Task breakdown.",
    "Kiểm tra DB latency và số bản ghi xử lý mỗi lần chạy.",
    "Giảm tần suất cron hoặc chia nhỏ batch xử lý.",
  ],
  webhook_reject: [
    "Rà soát PAYOS_WEBHOOK_ALLOWLIST_IPS có đúng IP nguồn mới nhất.",
    "Kiểm tra proxy/load balancer có làm đổi IP header không.",
    "Xác minh chữ ký webhook vẫn hợp lệ.",
  ],
};

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 2;
  return <div className={`h-2 rounded ${color}`} style={{ width: `${width}%` }} />;
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-amber-500/20 bg-black/30 p-3">
      <p className="text-xs text-zinc-300">{title}</p>
      <p className="text-lg font-semibold text-amber-200">{value}</p>
    </div>
  );
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [incidents, setIncidents] = useState<IncidentsResponse | null>(null);
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [taskName, setTaskName] = useState("all");
  const [incidentPage, setIncidentPage] = useState(1);
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<"all" | "open" | "acknowledged" | "resolved">("all");
  const [incidentBreachedOnly, setIncidentBreachedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [thresholds, setThresholds] = useState<Thresholds>({
    minSuccessRate: 95,
    maxAvgDurationMs: 4000,
    maxWebhookRejects: 3,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({ days: String(days), taskName });
    const [oRes, iRes] = await Promise.all([
      fetch(`/api/admin/analytics/overview?${query.toString()}`, { cache: "no-store" }),
      fetch(
        `/api/admin/analytics/incidents?days=${days}&page=${incidentPage}&status=${incidentStatusFilter}&breached=${incidentBreachedOnly ? "1" : "0"}`,
        { cache: "no-store" },
      ),
    ]);

    if (oRes.ok) {
      const oData = (await oRes.json()) as AnalyticsResponse;
      setData(oData);
      setThresholds(oData.thresholds);
    }
    if (iRes.ok) {
      const iData = (await iRes.json()) as IncidentsResponse;
      setIncidents(iData);
    }
    setLoading(false);
  }, [days, taskName, incidentPage, incidentStatusFilter, incidentBreachedOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => void load(), 15000);
    const sse = new EventSource("/api/admin/analytics/stream");
    sse.addEventListener("incidents", () => void load());
    return () => {
      clearInterval(id);
      sse.close();
    };
  }, [autoRefresh, load]);

  const maxRuns = useMemo(() => (data?.chart.length ? Math.max(...data.chart.map((i) => i.totalRuns)) : 0), [data]);

  async function saveThresholds() {
    setMessage(null);
    const res = await fetch("/api/admin/analytics/thresholds", {
      method: "POST",
      headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(thresholds),
    });
    const payload = (await res.json()) as { message?: string };
    setMessage(res.ok ? "Lưu ngưỡng thành công" : payload.message ?? "Lưu ngưỡng thất bại");
    await load();
  }

  async function acknowledgeIncident(incidentId: string, incidentType: string) {
    const note = prompt("Ghi chú xử lý (tuỳ chọn):") ?? "";
    const res = await fetch("/api/admin/analytics/acknowledge", {
      method: "POST",
      headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ incidentId, incidentType, note }),
    });
    const payload = (await res.json()) as { message?: string };
    setMessage(res.ok ? "Đã acknowledge incident" : payload.message ?? "Acknowledge thất bại");
    await load();
  }

  async function assignIncident(incidentId: string) {
    const input = prompt("Nhập user ID admin nhận xử lý:");
    const assignedToUserId = Number(input ?? "");
    if (!Number.isFinite(assignedToUserId) || assignedToUserId <= 0) {
      setMessage("User ID không hợp lệ");
      return;
    }

    const res = await fetch("/api/admin/analytics/incident-status", {
      method: "POST",
      headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ incidentId, action: "assign", assignedToUserId }),
    });

    const payload = (await res.json()) as { message?: string };
    setMessage(res.ok ? "Đã assign incident" : payload.message ?? "Assign thất bại");
    await load();
  }

  async function resolveIncident(incidentId: string) {
    const note = prompt("Ghi chú khi resolve:") ?? "";
    const res = await fetch("/api/admin/analytics/incident-status", {
      method: "POST",
      headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ incidentId, action: "resolve", note }),
    });

    const payload = (await res.json()) as { message?: string };
    setMessage(res.ok ? "Đã resolve incident" : payload.message ?? "Resolve thất bại");
    await load();
  }

  if (loading || !data) return <p className="text-sm text-zinc-300">Đang tải analytics...</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
        <div className="flex flex-wrap items-end gap-3">
          {[7, 30, 90].map((item) => (
            <button key={item} onClick={() => setDays(item as 7 | 30 | 90)} className="rounded-md border border-amber-500/30 px-3 py-1 text-sm">
              {item} ngày
            </button>
          ))}
          <select value={taskName} onChange={(e) => setTaskName(e.target.value)} className="rounded-md border border-amber-500/30 bg-black/30 px-3 py-2 text-sm">
            {data.filters.availableTasks.map((task) => (
              <option key={task} value={task}>
                {task}
              </option>
            ))}
          </select>
          <button onClick={() => setAutoRefresh((v) => !v)} className="rounded-md border border-amber-500/30 px-3 py-2 text-sm">
            Auto refresh: {autoRefresh ? "ON" : "OFF"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
        <h2 className="mb-3 text-lg font-semibold text-amber-200">Ngưỡng cảnh báo</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input type="number" value={thresholds.minSuccessRate} onChange={(e) => setThresholds({ ...thresholds, minSuccessRate: Number(e.target.value) })} className="rounded-md border border-amber-500/30 bg-black/30 px-3 py-2 text-sm" />
          <input type="number" value={thresholds.maxAvgDurationMs} onChange={(e) => setThresholds({ ...thresholds, maxAvgDurationMs: Number(e.target.value) })} className="rounded-md border border-amber-500/30 bg-black/30 px-3 py-2 text-sm" />
          <input type="number" value={thresholds.maxWebhookRejects} onChange={(e) => setThresholds({ ...thresholds, maxWebhookRejects: Number(e.target.value) })} className="rounded-md border border-amber-500/30 bg-black/30 px-3 py-2 text-sm" />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={saveThresholds} className="rounded-md border border-red-700/60 bg-red-800/80 px-4 py-2 text-sm">
            Lưu ngưỡng
          </button>
          {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
        </div>
      </section>

      {!!data.anomalies.length && (
        <section className="rounded-xl border border-red-500/40 bg-red-950/20 p-4">
          <h2 className="text-lg font-semibold text-red-200">Cảnh báo bất thường</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-100">
            {data.anomalies.map((a, i) => (
              <li key={`${a.type}-${i}`}>{a.message}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
        <h2 className="mb-2 text-lg font-semibold text-amber-200">Runbook</h2>
        {data.anomalies.length ? (
          data.anomalies.map((a) => (
            <div key={a.type} className="mb-3 rounded-md border border-amber-500/20 bg-black/30 p-3">
              <p className="font-medium text-amber-100">{a.type}</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-zinc-300">
                {(RUNBOOK[a.type] ?? ["Chưa có runbook cho loại này."]).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-sm text-zinc-300">Không có cảnh báo, hệ thống đang ổn định.</p>
        )}
      </section>

      <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
        <h2 className="mb-3 text-lg font-semibold text-amber-200">Biểu đồ runs</h2>
        {data.chart.map((point) => (
          <div key={point.date} className="mb-2 rounded-md border border-amber-500/15 bg-black/20 p-2">
            <div className="mb-1 flex justify-between text-xs text-zinc-300">
              <span>{point.date}</span>
              <span>{point.totalRuns} runs</span>
            </div>
            <Bar value={point.totalRuns} max={maxRuns} color="bg-amber-500/80" />
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
        <h2 className="mb-3 text-lg font-semibold text-amber-200">SLA dashboard</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Metric title="Incident" value={String(data.sla.incidentCount)} />
          <Metric title="Breach" value={`${data.sla.breachedCount} (${data.sla.breachRate}%)`} />
          <Metric title="MTTA" value={`${data.sla.mttaMs} ms`} />
          <Metric title="MTTR" value={`${data.sla.mttrMs} ms`} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-amber-200">Top assignee</h3>
            <div className="space-y-2 text-sm">
              {data.sla.topAssignees.map((item) => (
                <div key={item.email} className="rounded-md border border-amber-500/15 bg-black/20 p-2 text-zinc-200">
                  {item.email} · {item.count}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-amber-200">Top incident type (breach)</h3>
            <div className="space-y-2 text-sm">
              {data.sla.topIncidentTypes.map((item) => (
                <div key={item.incidentType} className="rounded-md border border-amber-500/15 bg-black/20 p-2 text-zinc-200">
                  {item.incidentType} · breached {item.breached}/{item.total} ({item.breachRate}%)
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-amber-200">SLA theo ngày</h3>
          <div className="space-y-2 text-sm">
            {data.sla.daily.map((d) => (
              <div key={d.date} className="rounded-md border border-amber-500/15 bg-black/20 p-2 text-zinc-200">
                {d.date} · total {d.total} · breached {d.breached} · resolved {d.resolved}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-amber-500/20 bg-black/25 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-amber-200">Incidents realtime</h2>
          <select
            value={incidentStatusFilter}
            onChange={(e) => {
              setIncidentStatusFilter(e.target.value as "all" | "open" | "acknowledged" | "resolved");
              setIncidentPage(1);
            }}
            className="rounded-md border border-amber-500/30 bg-black/30 px-2 py-1 text-xs"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="open">open</option>
            <option value="acknowledged">acknowledged</option>
            <option value="resolved">resolved</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={incidentBreachedOnly}
              onChange={(e) => {
                setIncidentBreachedOnly(e.target.checked);
                setIncidentPage(1);
              }}
            />
            Chỉ SLA breached
          </label>
        </div>

        <div className="space-y-2 text-sm">
          {incidents?.items.map((item) => (
            <div key={item.id} className="rounded-md border border-amber-500/20 bg-black/30 p-2">
              <p className="font-medium text-amber-100">
                {item.incidentType} · {item.source}
              </p>
              <p className="truncate text-zinc-300">{item.message}</p>
              <p className="mt-1 text-xs text-zinc-400">
                Status: {item.status} · SLA: {item.slaState}
                {item.slaDueAt ? ` · due ${new Date(item.slaDueAt).toLocaleString("vi-VN")}` : ""}
              </p>

              {item.assignedTo ? <p className="text-xs text-amber-300">Assigned: {item.assignedTo}</p> : null}
              {item.note ? <p className="text-xs text-zinc-400">Note: {item.note}</p> : null}

              {item.acknowledged ? (
                <p className="mt-1 text-xs text-emerald-300">
                  Đã acknowledge bởi {item.acknowledgedBy ?? "admin"}
                  {item.acknowledgedAt ? ` · ${new Date(item.acknowledgedAt).toLocaleString("vi-VN")}` : ""}
                </p>
              ) : incidents?.canAcknowledge ? (
                <button
                  onClick={() => acknowledgeIncident(item.id, item.incidentType)}
                  className="mt-2 rounded-md border border-amber-500/30 bg-black/30 px-2 py-1 text-xs text-amber-100"
                >
                  Acknowledge
                </button>
              ) : (
                <p className="mt-1 text-xs text-zinc-400">Không có quyền acknowledge</p>
              )}

              <div className="mt-2 flex flex-wrap gap-2">
                {item.status !== "resolved" ? (
                  <button
                    onClick={() => assignIncident(item.id)}
                    className="rounded-md border border-amber-500/30 bg-black/30 px-2 py-1 text-xs text-amber-100"
                  >
                    Assign
                  </button>
                ) : null}
                {item.status !== "resolved" && incidents?.canResolve ? (
                  <button
                    onClick={() => resolveIncident(item.id)}
                    className="rounded-md border border-emerald-500/40 bg-emerald-700/20 px-2 py-1 text-xs text-emerald-200"
                  >
                    Resolve
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={() => setIncidentPage((p) => Math.max(1, p - 1))} className="rounded-md border border-amber-500/30 px-3 py-1 text-xs">
            Prev
          </button>
          <button
            onClick={() => setIncidentPage((p) => Math.min(incidents?.pagination.totalPages ?? 1, p + 1))}
            className="rounded-md border border-amber-500/30 px-3 py-1 text-xs"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
