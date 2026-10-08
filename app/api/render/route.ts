import { pathToFileURL } from "node:url";

import { NextResponse } from "next/server";

import { appendBroadcast } from "../broadcasts/store";
import { TEMPLATES } from "../../../lib/fixtures";
import type { BroadcastData, TemplateId } from "../../../lib/types";
import { checkSecurity, clampPayload, acquireRenderLock, releaseRenderLock } from "../../../lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function errText(err: unknown): string {
  if (err instanceof Error) return err.message || String(err);
  return String(err);
}

function isBroadcast(value: unknown): value is BroadcastData {
  if (!value || typeof value !== "object") return false;
  const b = value as Partial<BroadcastData>;
  return (
    typeof b.generatedAt === "string" &&
    !!b.chog &&
    typeof b.chog === "object" &&
    typeof (b.chog as { tokenId?: unknown }).tokenId === "string" &&
    !!b.market &&
    typeof b.market === "object"
  );
}

function jsonError(status: number, error: string): Response {
  return NextResponse.json({ error }, { status });
}

/**
 * Composition ids follow the Remotion contract ("id <- template id").
 * Lives here (not in the worker) so it compiles into the normal Next chunk.
 */
async function resolveCompositionId(templateId: TemplateId): Promise<string> {
  try {
    const mod = (await import("../../../remotion/Root")) as {
      COMPOSITION_IDS?: Partial<Record<TemplateId, string>>;
    };
    const mapped = mod?.COMPOSITION_IDS?.[templateId];
    if (typeof mapped === "string" && mapped.length > 0) return mapped;
  } catch {
    /* fall through */
  }
  return templateId;
}

/**
 * Runtime-only import of scripts/render-worker.mjs.
 * `new Function` hides the specifier from webpack AND @vercel/nft — the heavy
 * @remotion/bundler/renderer tree never enters the serverless function bundle.
 * On a self-hosted box the file is read from disk at request time.
 */
const runtimeImport = new Function("s", "return import(s);") as (
  spec: string
) => Promise<{ runRender: (a: Record<string, unknown>) => Promise<unknown> }>;

const WORKER_B64 = "c2NyaXB0cy9yZW5kZXItd29ya2VyLm1qcw=="; // scripts/render-worker.mjs

export async function POST(req: Request): Promise<Response> {
  const sec = checkSecurity(req, "render");
  if (sec) return sec;

  // ---- validate ----------------------------------------------------------
  let payload: {
    templateId?: unknown;
    broadcast?: unknown;
    scale?: unknown;
  };
  try {
    payload = await req.json();
  } catch {
    return jsonError(400, "Body must be JSON: {templateId, broadcast, scale?}");
  }

  if (!clampPayload(payload)) {
    return jsonError(400, "Payload rejected: string fields exceed 2KB limit");
  }

  const templateId = payload.templateId as TemplateId | undefined;
  const template = TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    return jsonError(
      400,
      `Unknown templateId "${String(templateId)}". Valid: ${TEMPLATES.map((t) => t.id).join(", ")}`
    );
  }
  if (!isBroadcast(payload.broadcast)) {
    return jsonError(
      400,
      "broadcast must be BroadcastData { chog, market, generatedAt } (see lib/types.ts)"
    );
  }
  const broadcast = payload.broadcast;
  /**
   * Output scale: 1 = full composition (1080p class), 2/3 = 720p class.
   * UI only ever sends these two; anything else snaps to full quality.
   */
  const scale =
    typeof payload.scale === "number" && payload.scale <= 0.8 ? 2 / 3 : 1;

  const encoder = new TextEncoder();
  const startedAt = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (msg: Record<string, unknown>) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(msg)}\n`));
        } catch {
          open = false;
        }
      };
      const close = () => {
        if (!open) return;
        open = false;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      try {
        await acquireRenderLock();
        send({ phase: "bundling" });

        // Serverless can't run Chromium for minutes — degrade with a clear
        // message instead of a cold-start explosion (UI shows the CLI fallback).
        if (process.env.VERCEL) {
          send({
            phase: "failed",
            error:
              "Video export needs the self-hosted runtime (headless Chromium + ~4-7 min render) and is disabled on serverless. Use the CLI line below, or point VITE-less builds at a VPS/Docker host.",
          });
          return;
        }

        const compositionId = await resolveCompositionId(templateId as TemplateId);
        const workerSpec = pathToFileURL(
          `${process.cwd()}/${Buffer.from(WORKER_B64, "base64").toString("utf8")}`
        ).href;
        const { runRender } = await runtimeImport(workerSpec);
        const result = (await runRender({
          compositionId,
          scale,
          broadcast,
          send,
          startedAt,
        })) as Record<string, unknown>;
        send(result);

        // Append-metadata hook (V2 alerts): record the finished render in
        // data/broadcasts.json for /api/broadcasts + the archive panel.
        // Fire-and-forget — never blocks or can fail the NDJSON stream.
        if (result.phase === "ready" && typeof result.url === "string") {
          const file = result.url.split("/").pop() ?? "";
          const custom = broadcast.custom ?? {};
          if (file) {
            void appendBroadcast({
              file,
              template: template.id,
              scale,
              ms: typeof result.ms === "number" ? result.ms : 0,
              bytes: typeof result.bytes === "number" ? result.bytes : 0,
              at: new Date().toISOString(),
              ...(typeof custom.bgm === "string" && custom.bgm ? { bgm: custom.bgm } : {}),
              ...(typeof custom.alertId === "string" && custom.alertId ? { alertId: custom.alertId } : {}),
            }).catch(() => undefined);
          }
        }
      } catch (err) {
        send({ phase: "failed", error: errText(err) });
      } finally {
        releaseRenderLock();
        close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
