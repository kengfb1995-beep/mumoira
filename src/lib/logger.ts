type LogLevel = "debug" | "info" | "warn" | "error";

export function logEvent(level: LogLevel, event: string, payload?: Record<string, unknown>) {
  const record = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(payload ?? {}),
  };

  const serialized = JSON.stringify(record);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}
