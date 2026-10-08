#!/usr/bin/env node
/**
 * CHOGRAM broadcast daemon — `node scripts/broadcast-daemon.mjs`
 *
 * Watches the live $CHOG price and, when the move since the last baseline
 * crosses any ARMED alert's threshold (respecting its direction), asks the
 * running server to render a broadcast via POST /api/alerts/fire.
 *
 * Rules (FEATURES_V2): poll every 60s, Dexscreener direct (no deps), state in
 * data/daemon-state.json, one line per check, never exits, never auto-creates
 * alerts. Requires `npm start` (or `next start`) to be up.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = (process.env.CHGRAM_INTERNAL_URL || "http://localhost:3000").replace(/\/+$/, "");
const TOKEN = process.env.CHGRAM_TOKEN || "";
const CHOG_TOKEN = "0x350035555E10d9AfAF1566AaebfCeD5BA6C27777";
const POLL_MS = Number(process.env.CHGRAM_DAEMON_POLL_MS) > 0 ? Number(process.env.CHGRAM_DAEMON_POLL_MS) : 60_000;
const FIRE_TIMEOUT_MS = 600_000; // renders take ~170s (+ queue) — never cut a live render short
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATE_FILE = path.join(ROOT, "data", "daemon-state.json");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stamp = () => new Date().toISOString().replace("T", " ").slice(0, 19);
const log = (line) => process.stdout.write(`[chogram-daemon] ${line}\n`);

/** temp + rename so a crash can never leave a half-written state file. */
async function writeState(state) {
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  const tmp = `${STATE_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  await fs.rename(tmp, STATE_FILE);
}

/** Missing/corrupt state recovers as {} — the first check re-seeds the baseline. */
async function readState() {
  try {
    const parsed = JSON.parse(await fs.readFile(STATE_FILE, "utf8"));
    const lastPrice = Number(parsed?.lastPrice);
    return Number.isFinite(lastPrice) && lastPrice > 0 ? { lastPrice } : {};
  } catch {
    return {};
  }
}

/** Live $CHOG/USD straight from Dexscreener (deepest monad pair), null if unreachable. */
async function fetchPrice() {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CHOG_TOKEN}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  const pairs = Array.isArray(data?.pairs) ? data.pairs : [];
  const pool = pairs.filter((p) => p.chainId === "monad");
  const candidates = pool.length > 0 ? pool : pairs;
  let best = null;
  let bestLiq = -1;
  for (const p of candidates) {
    const price = Number(p?.priceUsd);
    const liq = Number(p?.liquidity?.usd ?? 0);
    if (Number.isFinite(price) && price > 0 && liq > bestLiq) {
      best = price;
      bestLiq = liq;
    }
  }
  return best;
}

async function getAlerts() {
  const res = await fetch(`${BASE}/api/alerts`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GET /api/alerts → HTTP ${res.status}`);
  const body = await res.json();
  return Array.isArray(body?.alerts) ? body.alerts : [];
}

/** Ask the server to render this alert's clip. Returns true when it reports ok. */
async function fire(id) {
  const res = await fetch(`${BASE}/api/alerts/fire`, {
    method: "POST",
    headers: { 
      "content-type": "application/json", 
      "accept": "application/json",
      ...(TOKEN ? { "x-chogram-token": TOKEN } : {})
    },
    body: JSON.stringify({ id }),
    signal: AbortSignal.timeout(FIRE_TIMEOUT_MS),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.ok !== true) {
    throw new Error(`fire ${id.slice(0, 8)} → ${body?.error || `HTTP ${res.status}`}`);
  }
  return body;
}

function directionMatches(direction, movePct) {
  if (direction === "up") return movePct > 0;
  if (direction === "down") return movePct < 0;
  return true;
}

async function tick() {
  const price = await fetchPrice();
  const alerts = await getAlerts();
  const armed = alerts.filter((a) => a && a.armed !== false);

  if (price === null) {
    log(`${stamp()} price=unavailable(dexscreener) armed=${armed.length} skipped`);
    return;
  }
  const shown = `$${price.toFixed(6)}`;

  // Nothing armed → idle-track the price so a later arm starts from "now".
  if (armed.length === 0) {
    const state = await readState();
    if (state.lastPrice !== price) await writeState({ lastPrice: price });
    log(`${stamp()} price=${shown} armed=0 idle-baseline set`);
    return;
  }

  const state = await readState();
  const base = state.lastPrice;
  if (!Number.isFinite(base)) {
    await writeState({ lastPrice: price });
    log(`${stamp()} price=${shown} armed=${armed.length} baseline seeded`);
    return;
  }

  const movePct = ((price - base) / base) * 100;
  const matches = armed.filter(
    (a) => typeof a.thresholdPct === "number" && Math.abs(movePct) >= a.thresholdPct && directionMatches(a.direction, movePct)
  );

  if (matches.length === 0) {
    log(
      `${stamp()} price=${shown} armed=${armed.length} move=${movePct >= 0 ? "+" : ""}${movePct.toFixed(2)}% vs $${base.toFixed(6)} fired=0`
    );
    return;
  }

  // Renders queue one-at-a-time server side; fire sequentially and only reset
  // the baseline when at least one broadcast actually succeeded.
  let okCount = 0;
  const errors = [];
  for (const alert of matches) {
    try {
      const result = await fire(alert.id);
      okCount += 1;
      log(
        `${stamp()} FIRED ${alert.thresholdPct}% ${alert.direction} → ${result.url} (${result.pct}%)`
      );
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  if (okCount > 0) await writeState({ lastPrice: price });
  const move = `${movePct >= 0 ? "+" : ""}${movePct.toFixed(2)}%`;
  const errNote = errors.length > 0 ? ` errors=${errors.length}:${errors[0]}` : "";
  log(`${stamp()} price=${shown} armed=${armed.length} move=${move} matched=${matches.length} fired=${okCount}${errNote}`);
}

async function main() {
  log(`watching $CHOG · base=${BASE} poll=${POLL_MS / 1000}s state=${path.relative(ROOT, STATE_FILE)}`);
  log(`armed alerts fire automatically; create them from /dashboard (TEST FIRE works without this daemon)`);
  for (;;) {
    try {
      await tick();
    } catch (err) {
      // Server down, network blip, timeout — report and keep going, never exit.
      log(`${stamp()} error ${err instanceof Error ? err.message : String(err)}`);
    }
    await sleep(POLL_MS);
  }
}

main();
