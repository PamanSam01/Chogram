import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return NextResponse.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
}
