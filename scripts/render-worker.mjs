/**
 * CHOGRAM render worker — heavy Remotion pipeline, loaded at RUNTIME only.
 *
 * Why this file exists: statically importing @remotion/bundler / @remotion/renderer
 * inside a Next route makes @vercel/nft trace ~940 MB (Chromium headless shell +
 * webpack caches) into the serverless function → deploy exceeds the 250 MB limit.
 * The route loads this module through an opaque import(), so on Vercel the code is
 * never part of the function bundle; on the self-hosted box it resolves from disk.
 *
 * Measured on this host (2 cores, swangle): full scale ≈ 2.3 s/frame, 720p ≈ 1.0-1.4 s/frame.
 */
import path from "node:path";
import fs from "node:fs/promises";

import { bundle } from "@remotion/bundler";
import { ensureBrowser, renderMedia, selectComposition } from "@remotion/renderer";

const CHROMIUM = { gl: "swangle", enableMultiProcessOnLinux: false };

/** Bundle once per process. */
let serveUrlPromise = null;
function serveUrlInfo() {
  if (!serveUrlPromise) {
    serveUrlPromise = bundle({
      entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
      webpackOverride: (config) => config,
    }).catch((err) => {
      serveUrlPromise = null;
      throw err;
    });
  }
  return serveUrlPromise;
}

/** Serialize renders: one Chromium + one encoder at a time. */
let queue = Promise.resolve();
function enqueue(job) {
  const run = queue.then(job, job);
  queue = run.catch(() => undefined);
  return run;
}

/** Keep public/exports bounded on a small disk (newest 12 files win). */
async function pruneExports(dir, keep = 12) {
  try {
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".mp4"));
    if (files.length <= keep) return;
    const withStat = await Promise.all(
      files.map(async (f) => {
        const s = await fs.stat(path.join(dir, f));
        return { f, mtime: s.mtimeMs };
      })
    );
    withStat.sort((a, b) => b.mtime - a.mtime);
    for (const stale of withStat.slice(keep)) {
      await fs.unlink(path.join(dir, stale.f)).catch(() => undefined);
    }
  } catch {
    /* pruning is best-effort */
  }
}

/**
 * Renders one composition to public/exports/ and reports NDJSON phases via `send`.
 *
 * @param {{ compositionId: string, scale: number, broadcast: object,
 *           send: (msg: object) => void, startedAt: number }} args
 */
export async function runRender({ compositionId, scale, broadcast, send, startedAt }) {
  const exportsDir = path.join(process.cwd(), "public", "exports");
  await fs.mkdir(exportsDir, { recursive: true });
  await serveUrlInfo(); // bundling (warm on every later call)
  await ensureBrowser();

  return enqueue(async () => {
    const serveUrl = await serveUrlInfo();
    const inputProps = broadcast;

    const composition = await selectComposition({
      serveUrl,
      id: compositionId,
      inputProps,
      chromiumOptions: CHROMIUM,
      logLevel: "error",
      timeoutInMilliseconds: 120_000,
    });

    const safeId = String(compositionId).replace(/[^a-zA-Z0-9_-]/g, "");
    const outW = Math.round(composition.width * scale);
    const outH = Math.round(composition.height * scale);
    const fileName = `${Date.now()}-${safeId}${scale < 1 ? "-720" : ""}.mp4`;
    const outputLocation = path.join(exportsDir, fileName);
    let lastSent = -1;
    send({ phase: "rendering", progress: 0 });

    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      inputProps,
      outputLocation,
      concurrency: 1,
      scale,
      chromiumOptions: CHROMIUM,
      logLevel: "error",
      timeoutInMilliseconds: 600_000,
      onProgress: ({ progress }) => {
        const pct = Math.round(progress * 100);
        if (pct >= lastSent + 3 || pct === 100) {
          lastSent = pct;
          send({ phase: "rendering", progress });
        }
      },
    });

    const stat = await fs.stat(outputLocation);
    pruneExports(exportsDir).catch(() => undefined);
    return {
      phase: "ready",
      url: `/exports/${fileName}`,
      bytes: stat.size,
      ms: Date.now() - startedAt,
      durationSec: composition.durationInFrames / composition.fps,
      width: outW,
      height: outH,
    };
  });
}
