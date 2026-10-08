#!/usr/bin/env node
/**
 * Standalone end-to-end proof of the CHOGRAM export pipeline.
 * Same logic as app/api/render/route.ts: bundle once → selectComposition →
 * renderMedia (h264, concurrency 1) → public/exports/test-price-alert.mp4
 *
 *   node scripts/test-render.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { bundle } from "@remotion/bundler";
import { ensureBrowser, renderMedia, selectComposition } from "@remotion/renderer";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "exports");
const OUT_FILE = path.join(OUT_DIR, "test-price-alert.mp4");
const ENTRY = path.join(ROOT, "remotion", "index.ts");
const COMPOSITION_ID = "price-alert";

/** Mirrors lib/fixtures.ts sampleBroadcast() — fixtures are TS, so inline here. */
const SAMPLE = {
  chog: {
    tokenId: "1806",
    collection: "Chog Genesis",
    name: "CHOG #1806",
    image: "/chogs/chogwow.jpg",
    traits: [
      { trait_type: "Background", value: "Acid Green" },
      { trait_type: "Eyes", value: "Laser" },
      { trait_type: "Head", value: "Crown" },
      { trait_type: "Mouth", value: "Grill" },
      { trait_type: "Body", value: "Hoodie" },
      { trait_type: "Aura", value: "Chaos" },
    ],
    rarityRank: 42,
    rarityPercentile: 0.979,
    holder: "0x9C480000000000000000000000000000006567",
  },
  market: {
    chogPriceUsd: 0.002076,
    chogChange24h: -15.2,
    floorMon: 22.5,
    floorUsd: 38.7,
    holders: 33836,
    ts: 1780000000000,
  },
  generatedAt: new Date().toISOString(),
  custom: { alertText: "$CHOG moved +12.4% in 1h — the Chog called it first" },
};

const inputProps = SAMPLE;
const started = Date.now();
const log = (...a) => console.log(`[test-render]`, ...a);

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  log("ensuring headless browser…");
  await ensureBrowser();

  log("bundling remotion/index.ts (once)…");
  const tBundle = Date.now();
  const serveUrl = await bundle({
    entryPoint: ENTRY,
    webpackOverride: (config) => config,
  });
  log(`bundle ready in ${((Date.now() - tBundle) / 1000).toFixed(1)}s → ${serveUrl}`);

  log(`selecting composition "${COMPOSITION_ID}"…`);
  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps,
    logLevel: "error",
  });
  log(
    `composition: ${composition.id} ${composition.width}x${composition.height}` +
      ` @${composition.fps}fps, ${composition.durationInFrames} frames`
  );

  const attempts = [
    // swangle first — verified working on this host (route uses the same options)
    { label: "swangle", chromiumOptions: { gl: "swangle", enableMultiProcessOnLinux: false } },
    { label: "angle", chromiumOptions: { gl: "angle", enableMultiProcessOnLinux: false } },
  ];

  let lastError = null;
  for (const attempt of attempts) {
    try {
      log(`rendering with gl=${attempt.label}, concurrency=1, codec=h264…`);
      const t0 = Date.now();
      let lastPct = -1;
      await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        inputProps,
        outputLocation: OUT_FILE,
        concurrency: 1,
        chromiumOptions: attempt.chromiumOptions,
        logLevel: "error",
        onProgress: ({ progress }) => {
          const pct = Math.round(progress * 100);
          if (pct >= lastPct + 25 || pct === 100) {
            lastPct = pct;
            log(`  progress ${pct}%`);
          }
        },
      });
      const renderMs = Date.now() - t0;
      const stat = await fs.stat(OUT_FILE);
      log("OK");
      log(`  file        ${OUT_FILE}`);
      log(`  size        ${stat.size} bytes (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
      log(`  render ms   ${renderMs} (${(renderMs / 1000).toFixed(1)}s)`);
      log(`  total ms    ${Date.now() - started}`);
      log(`  gl          ${attempt.label}`);
      return;
    } catch (err) {
      lastError = err;
      log(`gl=${attempt.label} failed: ${err?.message ?? err}`);
      await fs.rm(OUT_FILE, { force: true });
    }
  }

  throw lastError ?? new Error("render failed");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[test-render] FAILED:", err?.stack ?? err);
    process.exit(1);
  });
