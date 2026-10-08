import { promises as fs } from "node:fs";
import path from "node:path";

import type { Alert } from "./types";

const STORE = path.join(process.cwd(), "data", "alerts.json");

/** Serializes mutations so concurrent requests can't interleave read-modify-write. */
let chain: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function isAlert(v: unknown): v is Alert {
  if (!v || typeof v !== "object") return false;
  const a = v as Partial<Alert>;
  return (
    typeof a.id === "string" &&
    a.id.length > 0 &&
    typeof a.thresholdPct === "number" &&
    Array.isArray(a.fired)
  );
}

/** Missing or corrupt store recovers as empty — never crashes a handler. */
export async function listAlerts(): Promise<Alert[]> {
  try {
    const raw = await fs.readFile(STORE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAlert);
  } catch {
    return [];
  }
}

/** temp file + rename: readers only ever see a complete file. */
async function writeAlerts(alerts: Alert[]): Promise<void> {
  await fs.mkdir(path.dirname(STORE), { recursive: true });
  const tmp = `${STORE}.${process.pid}.${Date.now().toString(36)}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(alerts, null, 2)}\n`, "utf8");
  await fs.rename(tmp, STORE);
}

/** Newest first. */
export function createAlert(alert: Alert): Promise<Alert> {
  return withLock(async () => {
    const alerts = await listAlerts();
    alerts.unshift(alert);
    await writeAlerts(alerts);
    return alert;
  });
}

/** Returns false when the id did not exist. */
export function deleteAlert(id: string): Promise<boolean> {
  return withLock(async () => {
    const alerts = await listAlerts();
    const next = alerts.filter((a) => a.id !== id);
    if (next.length === alerts.length) return false;
    await writeAlerts(next);
    return true;
  });
}

/** Read-modify-write under the lock; null when the id no longer exists. */
export function updateAlert(id: string, apply: (a: Alert) => Alert): Promise<Alert | null> {
  return withLock(async () => {
    const alerts = await listAlerts();
    const idx = alerts.findIndex((a) => a.id === id);
    if (idx < 0) return null;
    const updated = apply({ ...alerts[idx] });
    alerts[idx] = updated;
    await writeAlerts(alerts);
    return updated;
  });
}
