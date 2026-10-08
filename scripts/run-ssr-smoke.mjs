#!/usr/bin/env node
/**
 * Bundle scripts/ssr-smoke.tsx with esbuild (CSS imports emptied) and run it.
 *   node scripts/run-ssr-smoke.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const esbuild = path.join(ROOT, "node_modules", ".bin", "esbuild");
const outfile = path.join(ROOT, "node_modules", ".cache", "ssr-smoke.cjs");

const build = spawnSync(
  esbuild,
  [
    path.join(ROOT, "scripts", "ssr-smoke.tsx"),
    "--bundle",
    "--platform=node",
    "--format=cjs",
    "--jsx=automatic",
    "--loader:.css=empty",
    `--outfile=${outfile}`,
    "--log-level=warning",
  ],
  { stdio: "inherit" }
);
if (build.status !== 0) {
  console.error("esbuild failed");
  process.exit(build.status ?? 1);
}

const run = spawnSync(process.execPath, [outfile], { stdio: "inherit" });
process.exit(run.status ?? 1);
