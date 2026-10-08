import { NextResponse } from "next/server";

// Simple in-memory rate limit store
const hits = new Map<string, { count: number; resetAt: number }>();

export function checkSecurity(req: Request, type: "render" | "alert"): Response | null {
  // 1. Token Check (Optional)
  const expectedToken = process.env.CHGRAM_TOKEN;
  if (expectedToken) {
    const providedToken = req.headers.get("x-chogram-token") || req.headers.get("authorization")?.replace("Bearer ", "");
    if (providedToken !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // 2. Rate Limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown-ip";
  const key = `${type}:${ip}`;
  const now = Date.now();
  
  let record = hits.get(key);
  if (!record || now > record.resetAt) {
    // Limits: render = 1 per 3 mins (180s), alert = 10 per 1 min (60s)
    const windowMs = type === "render" ? 180_000 : 60_000;
    record = { count: 0, resetAt: now + windowMs };
    hits.set(key, record);
  }
  
  const limit = type === "render" ? 1 : 10;
  if (record.count >= limit) {
    return NextResponse.json({ error: `Rate limit exceeded for ${type}. Max ${limit} request(s) allowed.` }, { status: 429 });
  }
  
  record.count++;
  return null; // OK
}

// Clamp large strings in JSON payloads (max 2KB)
export function clampPayload(obj: unknown): boolean {
  if (typeof obj === "string") {
    return obj.length <= 2048;
  }
  if (Array.isArray(obj)) {
    return obj.every(clampPayload);
  }
  if (obj !== null && typeof obj === "object") {
    for (const val of Object.values(obj)) {
      if (!clampPayload(val)) return false;
    }
  }
  return true;
}

// Concurrency queue for render
let activeRenders = 0;
const MAX_RENDERS = 1; // max 1 job bareng
const renderQueue: Array<() => void> = [];

export async function acquireRenderLock(): Promise<void> {
  if (activeRenders < MAX_RENDERS) {
    activeRenders++;
    return;
  }
  return new Promise<void>((resolve) => {
    renderQueue.push(resolve);
  });
}

export function releaseRenderLock(): void {
  if (renderQueue.length > 0) {
    const next = renderQueue.shift();
    if (next) next();
  } else {
    activeRenders = Math.max(0, activeRenders - 1);
  }
}
