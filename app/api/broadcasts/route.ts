import { NextResponse } from "next/server";

import { listBroadcasts } from "./store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/broadcasts → { broadcasts: BroadcastMeta[] } newest first.
 * Backed by data/broadcasts.json (runtime state, appended by the render
 * metadata hook whenever a stream reports phase "ready").
 */
export async function GET(): Promise<Response> {
  try {
    const broadcasts = await listBroadcasts();
    return NextResponse.json({ broadcasts });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ broadcasts: [], error: message }, { status: 500 });
  }
}
