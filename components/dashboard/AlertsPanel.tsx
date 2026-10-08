"use client";

import { useCallback, useEffect, useState } from "react";

import type { Alert, AlertDirection } from "../../app/api/alerts/types";
import { fmtElapsed, fmtUsd } from "./format";

type FireState = {
  phase: "rendering" | "ready" | "failed";
  startedAt: number;
  url?: string;
  pct?: number;
  error?: string;
};

const DIRECTIONS: { value: AlertDirection; label: string }[] = [
  { value: "any", label: "ANY MOVE" },
  { value: "up", label: "UP ONLY" },
  { value: "down", label: "DOWN ONLY" },
];

function errText(err: unknown): string {
  return err instanceof Error ? err.message || String(err) : String(err);
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  let body: T | null = null;
  try {
    body = (await res.json()) as T;
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const remote = (body as { error?: string } | null)?.error;
    throw new Error(remote || `HTTP ${res.status} from ${path}`);
  }
  if (body === null) throw new Error(`Malformed response from ${path}`);
  return body;
}

/**
 * Alert desk: arm threshold alerts against the live $CHOG price; every fired
 * alert renders a shareable clip automatically (TEST FIRE proves it instantly).
 */
export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null); // null = still connecting
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState("1.5");
  const [direction, setDirection] = useState<AlertDirection>("any");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fires, setFires] = useState<Record<string, FireState>>({});
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const body = await api<{ alerts: Alert[] }>("/api/alerts", { cache: "no-store" });
      setAlerts(Array.isArray(body.alerts) ? body.alerts : []);
      setError(null);
    } catch (err) {
      setError(errText(err));
      setAlerts((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Elapsed clock while a render is in flight (a clip takes ~3 minutes).
  const rendering = Object.values(fires).some((f) => f.phase === "rendering");
  useEffect(() => {
    if (!rendering) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [rendering]);

  const create = useCallback(async () => {
    const value = Number(threshold);
    if (!Number.isFinite(value) || value < 0.5 || value > 50) {
      setError("Threshold must be a number between 0.5 and 50 (percent).");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await api("/api/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ thresholdPct: value, direction }),
      });
      await load();
    } catch (err) {
      setError(errText(err));
    } finally {
      setCreating(false);
    }
  }, [direction, load, threshold]);

  const remove = useCallback(
    async (id: string) => {
      setDeletingId(id);
      setError(null);
      try {
        await api(`/api/alerts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        setFires((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        await load();
      } catch (err) {
        setError(errText(err));
      } finally {
        setDeletingId(null);
      }
    },
    [load]
  );

  const fireOne = useCallback(
    async (id: string) => {
      const startedAt = Date.now();
      setNow(startedAt);
      setFires((prev) => ({ ...prev, [id]: { phase: "rendering", startedAt } }));
      setError(null);
      try {
        const body = await api<{ ok?: boolean; url?: string; pct?: number; error?: string; warning?: string }>(
          "/api/alerts/fire",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ id }),
          }
        );
        if (!body.ok) throw new Error(body.error || "Fire failed");
        setFires((prev) => ({
          ...prev,
          [id]: { phase: "ready", startedAt, url: body.url, pct: body.pct },
        }));
        if (body.warning) setError(body.warning);
        await load(); // pick up the fired entry + reset baseline
      } catch (err) {
        setFires((prev) => ({
          ...prev,
          [id]: { phase: "failed", startedAt, error: errText(err) },
        }));
      }
    },
    [load]
  );

  const armedCount = (alerts ?? []).filter((a) => a.armed).length;

  return (
    <section className="panel alerts-panel" aria-label="Auto alerts">
      <div className="panel__head">
        <span className="micro">AUTO_ALERTS</span>
        <span className="micro panel__head-right">
          <span className={`live-dot ${armedCount > 0 ? "" : "is-off"}`} aria-hidden="true" />
          {alerts === null ? "CONNECTING" : `${armedCount} ARMED · DEXSCREENER 60S`}
        </span>
      </div>

      <p className="alerts-retention">
        CHOGRAM watches <span className="alerts-retention__hl mono">$CHOG</span> and broadcasts for you —
        every fired alert renders a shareable clip automatically.
      </p>

      <form
        className="alert-form"
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <label className="field" htmlFor="alert-threshold">
          <span className="field__head">
            <span className="micro">THRESHOLD %</span>
            <span className="micro field__count mono">0.5–50</span>
          </span>
          <input
            id="alert-threshold"
            className="field__input mono"
            type="number"
            min={0.5}
            max={50}
            step={0.5}
            inputMode="decimal"
            autoComplete="off"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="1.5"
          />
        </label>

        <label className="field" htmlFor="alert-direction">
          <span className="field__head">
            <span className="micro">DIRECTION</span>
          </span>
          <select
            id="alert-direction"
            className="field__input"
            value={direction}
            onChange={(e) => setDirection(e.target.value as AlertDirection)}
          >
            {DIRECTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className="btn btn-acid alert-form__submit" disabled={creating}>
          {creating ? "ARMING…" : "ARM ALERT"}
        </button>
      </form>

      {error ? <p className="err-line alerts-error">{error}</p> : null}

      <ul className="alert-list">
        {(alerts ?? []).map((a) => {
          const fire = fires[a.id];
          return (
            <li className="alert-row" key={a.id}>
              <span className={`live-dot ${a.armed ? "" : "is-off"}`} aria-hidden="true" />
              <span className="alert-row__thr mono">±{a.thresholdPct.toFixed(2)}%</span>
              <span className="micro alert-row__dir">{a.direction}</span>
              <span className="alert-row__price mono">
                {typeof a.lastPrice === "number" ? fmtUsd(a.lastPrice) : "NO BASELINE"}
              </span>
              <span className="micro alert-row__fired mono">{a.fired.length} FIRED</span>
              <span className="alert-row__actions">
                <button
                  type="button"
                  className="btn btn-primary alert-btn"
                  disabled={fire?.phase === "rendering"}
                  onClick={() => void fireOne(a.id)}
                >
                  {fire?.phase === "rendering" ? "FIRING…" : "TEST FIRE"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost alert-btn"
                  disabled={deletingId === a.id}
                  onClick={() => void remove(a.id)}
                >
                  {deletingId === a.id ? "…" : "DELETE"}
                </button>
              </span>
              {fire ? (
                <span
                  className={`alert-row__status micro mono ${fire.phase === "failed" ? "is-fail" : ""}`}
                  role="status"
                >
                  {fire.phase === "rendering"
                    ? `RENDERING… ${fmtElapsed(now - fire.startedAt)} ELAPSED · ONE CLIP ≈ 3 MIN`
                    : fire.phase === "ready"
                      ? `FIRED ${typeof fire.pct === "number" ? fire.pct.toFixed(2) : "0.00"}% — CLIP READY · `
                      : `FIRE FAILED — ${fire.error ?? "unknown error"}`}
                  {fire.phase === "ready" && fire.url ? (
                    <a className="alert-row__link" href={fire.url} download>
                      OPEN CLIP
                    </a>
                  ) : null}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {alerts !== null && alerts.length === 0 ? (
        <p className="alerts-empty">
          No alerts armed — set a threshold and arm one to start the broadcast loop.
        </p>
      ) : null}

      {alerts !== null && alerts.length > 0 && alerts.some((a) => a.fired.length > 0) ? (
        <p className="micro alerts-hint">
          FIRED CLIPS ARE KEPT — SEE BROADCAST_ARCHIVE BELOW
        </p>
      ) : (
        <p className="micro alerts-hint">
          ARMED ALERTS ALSO FIRE ON THEIR OWN — RUN{" "}
          <span className="mono">node scripts/broadcast-daemon.mjs</span> (60S POLL, DEXSCREENER DIRECT)
        </p>
      )}
    </section>
  );
}
