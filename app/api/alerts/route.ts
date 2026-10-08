import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { fetchMarketData } from "../../../lib/market";
import { createAlert, deleteAlert, listAlerts } from "./store";
import type { Alert, AlertDirection } from "./types";
import { checkSecurity, clampPayload } from "../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIRECTIONS: AlertDirection[] = ["any", "up", "down"];

function errText(err: unknown): string {
  return err instanceof Error ? err.message || String(err) : String(err);
}

/**
 * GET /api/alerts → { alerts: Alert[] }  (newest first)
 * POST /api/alerts { thresholdPct: 0.5–50, direction? } → { alert }
 * DELETE /api/alerts?id=… → { ok, id }
 */
export async function GET(): Promise<Response> {
  try {
    return NextResponse.json({ alerts: await listAlerts() });
  } catch (err) {
    return NextResponse.json({ alerts: [], error: errText(err) }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<Response> {
  const sec = checkSecurity(req, "alert");
  if (sec) return sec;

  let body: { thresholdPct?: unknown; direction?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Body must be JSON: { thresholdPct: number (0.5–50), direction?: "any"|"up"|"down" }' },
      { status: 400 }
    );
  }

  if (!clampPayload(body)) {
    return NextResponse.json({ error: "Payload rejected: string fields exceed 2KB limit" }, { status: 400 });
  }

  const thresholdPct = Number(body.thresholdPct);
  if (!Number.isFinite(thresholdPct) || thresholdPct < 0.5 || thresholdPct > 50) {
    return NextResponse.json(
      { error: "thresholdPct must be a number between 0.5 and 50 (percent move that triggers the broadcast)" },
      { status: 400 }
    );
  }

  let direction: AlertDirection = "any";
  if (body.direction !== undefined && body.direction !== null) {
    if (typeof body.direction !== "string" || !DIRECTIONS.includes(body.direction as AlertDirection)) {
      return NextResponse.json({ error: 'direction must be "any", "up" or "down"' }, { status: 400 });
    }
    direction = body.direction as AlertDirection;
  }

  // Baseline price for measuring the alert's move. A failing live feed must
  // not block arming — the alert simply starts with no baseline (lastPrice null).
  let lastPrice: number | null = null;
  try {
    const market = await fetchMarketData();
    if (Number.isFinite(market.chogPriceUsd) && market.chogPriceUsd > 0) lastPrice = market.chogPriceUsd;
  } catch {
    /* live feed unreachable — arm without a baseline */
  }

  const alert: Alert = {
    id: randomUUID(),
    thresholdPct: Math.round(thresholdPct * 100) / 100,
    direction,
    armed: true,
    createdAt: new Date().toISOString(),
    lastPrice,
    fired: [],
  };

  try {
    await createAlert(alert);
  } catch (err) {
    return NextResponse.json({ error: `Could not persist alert: ${errText(err)}` }, { status: 500 });
  }
  return NextResponse.json({ alert });
}

export async function DELETE(req: Request): Promise<Response> {
  const sec = checkSecurity(req, "alert");
  if (sec) return sec;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id — use DELETE /api/alerts?id=…" }, { status: 400 });
  }
  try {
    const removed = await deleteAlert(id);
    if (!removed) {
      return NextResponse.json({ ok: false, error: `No alert with id ${id}` }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ error: errText(err) }, { status: 500 });
  }
}
