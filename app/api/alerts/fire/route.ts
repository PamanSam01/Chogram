import { NextResponse } from "next/server";

import { SAMPLE_CHOGS } from "../../../../lib/fixtures";
import { fetchMarketData } from "../../../../lib/market";
import type { BroadcastData, MarketData } from "../../../../lib/types";
import { listAlerts, updateAlert } from "../store";
import type { Alert } from "../types";
import { checkSecurity, clampPayload } from "../../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Self-request base — port may differ from the default 3000 in self-hosted setups. */
const INTERNAL_BASE = (process.env.CHGRAM_INTERNAL_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const FIRE_TEMPLATE = "price-alert";
const FIRE_SCALE = 0.6667; // 720p class (~170s on this host)
/** No stream data for this long = wedged render (or one queued behind another
 *  export for too long). Healthy renders emit "bundling" immediately and
 *  rendering progress every few seconds, so a fixed request timeout would
 *  wrongly kill a slow-but-alive render — this never does, while still
 *  guaranteeing the handler can't hang forever. */
const STALL_MS = 600_000;

type Ready = { url: string; bytes: number; ms: number; width?: number; height?: number };
type RenderOutcome = { ok: true; ready: Ready } | { ok: false; status: number; error: string };

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Move the clip reports: vs the alert's baseline when measurable, otherwise the
 *  real 24h change (a just-armed alert has no move yet — never print ±0.00%). */
function computePct(alert: Alert, market: MarketData): number {
  const baseline = alert.lastPrice;
  if (typeof baseline === "number" && Number.isFinite(baseline) && baseline > 0) {
    const move = ((market.chogPriceUsd - baseline) / baseline) * 100;
    if (Math.abs(move) >= 0.05) return move;
  }
  return market.chogChange24h;
}

/** "CHOGRAM ALERT — $CHOG MOVED +3.36% — UP" (PriceAlert uppercases it anyway). */
function alertLine(pct: number): string {
  const dir = pct >= 0.005 ? "UP" : pct <= -0.005 ? "DOWN" : "FLAT";
  const sign = pct >= 0 ? "+" : "-";
  return `CHOGRAM ALERT — $CHOG MOVED ${sign}${Math.abs(pct).toFixed(2)}% — ${dir}`;
}

/**
 * POST the broadcast into the internal /api/render NDJSON stream and consume it
 * to a terminal phase. Stall-guarded (see STALL_MS) — a wedged render can never
 * hang this handler forever; a healthy one is never raced by a fixed timeout.
 */
async function runRender(broadcast: BroadcastData): Promise<RenderOutcome> {
  const controller = new AbortController();
  const state = { stalled: false };
  const arm = () =>
    setTimeout(() => {
      state.stalled = true;
      controller.abort();
    }, STALL_MS);
  let watchdog = arm();
  const poke = () => {
    clearTimeout(watchdog);
    watchdog = arm();
  };

  try {
    const res = await fetch(`${INTERNAL_BASE}/api/render`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ templateId: FIRE_TEMPLATE, broadcast, scale: FIRE_SCALE }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = `render endpoint returned HTTP ${res.status}`;
      try {
        const body = (await res.json()) as { error?: unknown };
        if (typeof body?.error === "string" && body.error) detail = body.error;
      } catch {
        /* non-JSON error body */
      }
      return { ok: false, status: 502, error: detail };
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("ndjson") && res.body) {
      const out: { ready: Ready | null; failed: string | null; phase: string } = {
        ready: null,
        failed: null,
        phase: "",
      };
      const handle = (msg: Record<string, unknown>): void => {
        poke();
        if (msg.phase === "bundling" || msg.phase === "rendering" || msg.phase === "ready" || msg.phase === "failed") {
          out.phase = String(msg.phase);
        }
        if (msg.phase === "ready") {
          out.ready = {
            url: typeof msg.url === "string" ? msg.url : "",
            bytes: num(msg.bytes),
            ms: num(msg.ms),
            width: typeof msg.width === "number" ? msg.width : undefined,
            height: typeof msg.height === "number" ? msg.height : undefined,
          };
        } else if (msg.phase === "failed") {
          out.failed = typeof msg.error === "string" ? msg.error : "render failed";
        }
      };

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        poke();
        buf += decoder.decode(value, { stream: true });
        let nl = buf.indexOf("\n");
        while (nl >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (line) {
            try {
              handle(JSON.parse(line) as Record<string, unknown>);
            } catch {
              /* partial line — wait for the rest */
            }
          }
          nl = buf.indexOf("\n");
        }
      }
      const tail = buf.trim();
      if (tail && !out.ready && !out.failed) {
        try {
          handle(JSON.parse(tail) as Record<string, unknown>);
        } catch {
          /* ignore */
        }
      }

      if (out.failed) return { ok: false, status: 502, error: out.failed };
      if (!out.ready || !out.ready.url) {
        return {
          ok: false,
          status: 502,
          error: `render stream ended in phase "${out.phase || "unknown"}" without a result`,
        };
      }
      return { ok: true, ready: out.ready };
    }

    const body = (await res.json()) as Record<string, unknown>;
    if (typeof body.url === "string" && body.url) {
      return {
        ok: true,
        ready: { url: body.url, bytes: num(body.bytes), ms: num(body.ms) },
      };
    }
    return {
      ok: false,
      status: 502,
      error: typeof body.error === "string" && body.error ? body.error : "malformed response from /api/render",
    };
  } catch (err) {
    if (state.stalled) {
      return {
        ok: false,
        status: 504,
        error: `Render stalled — no stream data for ${STALL_MS / 1000}s (wedged, or still queued behind another export)`,
      };
    }
    const message = err instanceof Error ? err.message || String(err) : String(err);
    if (/fetch failed|econnrefused|enotfound|network/i.test(message)) {
      return {
        ok: false,
        status: 502,
        error: `Internal render endpoint unreachable at ${INTERNAL_BASE} — set CHGRAM_INTERNAL_URL if the server runs on another port (${message})`,
      };
    }
    return { ok: false, status: 500, error: message };
  } finally {
    clearTimeout(watchdog);
  }
}

/**
 * POST /api/alerts/fire { id }
 * Builds BroadcastData (SAMPLE_CHOGS[0] + live fetchMarketData() +
 * custom.alertText/custom.alertId), renders it through the internal
 * /api/render stream at 720p class, marks the alert fired, returns {ok,url,pct}.
 * Serves both the dashboard "TEST FIRE" button and scripts/broadcast-daemon.mjs.
 */
export async function POST(req: Request): Promise<Response> {
  const sec = checkSecurity(req, "render");
  if (sec) return sec;

  let body: { id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body must be JSON: { id }" }, { status: 400 });
  }

  if (!clampPayload(body)) {
    return NextResponse.json({ ok: false, error: "Payload rejected: string fields exceed 2KB limit" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing alert id — body must be { id }" }, { status: 400 });
  }

  let alert: Alert | undefined;
  try {
    alert = (await listAlerts()).find((a) => a.id === id);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: `Could not read alert store: ${message}` }, { status: 500 });
  }
  if (!alert) {
    return NextResponse.json({ ok: false, error: `No alert with id ${id}` }, { status: 404 });
  }

  let market: MarketData;
  try {
    market = await fetchMarketData();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: `Market feed unavailable: ${message}` }, { status: 502 });
  }

  const pct = computePct(alert, market);
  const broadcast: BroadcastData = {
    chog: SAMPLE_CHOGS[0],
    market,
    generatedAt: new Date().toISOString(),
    custom: { alertText: alertLine(pct), alertId: alert.id },
  };

  const result = await runRender(broadcast);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  // Render landed — record it on the alert (baseline resets to the fire price).
  let warning: string | undefined;
  try {
    await updateAlert(alert.id, (a) => ({
      ...a,
      lastPrice: market.chogPriceUsd,
      fired: [...a.fired, { at: new Date().toISOString(), url: result.ready.url, pct: Number(pct.toFixed(4)) }],
    }));
  } catch (err) {
    // The clip exists (and is in the archive) — report it, but don't hide the store failure.
    warning = `Broadcast rendered, but the alert store could not be updated: ${
      err instanceof Error ? err.message : String(err)
    }`;
  }

  return NextResponse.json({
    ok: true,
    url: result.ready.url,
    pct: Number(pct.toFixed(2)),
    ...(warning ? { warning } : {}),
  });
}
