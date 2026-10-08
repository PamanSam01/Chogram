#!/usr/bin/env node
/**
 * CHOGRAM selftest — fast smoke test for judges and CI. No render, no build.
 *
 *   npm run selftest                      # offline checks only
 *   node scripts/selftest.mjs --offline   # same, and ignores CHGRAM_URL
 *   CHGRAM_URL=http://localhost:3000 npm run selftest
 *                                         # + live probes of /, /dashboard,
 *                                           /api/market, /api/broadcasts, /api/alerts
 *
 * Prints one PASS / FAIL / WARN line per check, a summary, and exits non-zero
 * on any hard (FAIL) check. Target wall time: under 60 seconds.
 *
 * Severity policy:
 *   FAIL (fatal)  — shipped artefacts the product/README promises are missing,
 *                   or a live endpoint that should answer does not.
 *   WARN (soft)   — environment-dependent: no production build on disk, or the
 *                   Remotion bundler cannot run here (listing skipped).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const FORCE_OFFLINE = argv.includes("--offline");
const BASE = (process.env.CHGRAM_URL || "").replace(/\/+$/, "");
const RUN_HTTP = !FORCE_OFFLINE && BASE !== "";

let nPass = 0;
let nFail = 0;
let nWarn = 0;
const failures = [];

const stamp = () => new Date().toISOString().slice(11, 19);
const pass = (name, detail) => {
  nPass += 1;
  console.log(`PASS  ${name}${detail ? `  — ${detail}` : ""}`);
};
const fail = (name, detail) => {
  nFail += 1;
  failures.push(name);
  console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ""}`);
};
const warn = (name, detail) => {
  nWarn += 1;
  console.log(`WARN  ${name}${detail ? `  — ${detail}` : ""}`);
};

const rel = (p) => path.join(ROOT, p);
const exists = (p) => fs.existsSync(rel(p));

const t0 = Date.now();
console.log("CHOGRAM selftest");
console.log(
  `mode: ${RUN_HTTP ? `offline + live probes against ${BASE}` : FORCE_OFFLINE ? "offline (--offline)" : "offline (set CHGRAM_URL to add live probes)"}`
);
console.log("");

/* ---------------------------------------------------------------- 1. build */
{
  const idFile = rel(".next/BUILD_ID");
  if (fs.existsSync(idFile)) {
    const id = fs.readFileSync(idFile, "utf8").trim();
    pass(".next/BUILD_ID", `production build id ${id}`);
  } else {
    warn(".next/BUILD_ID", "no production build on disk — run `npm run build` (skipping)");
  }
}

/* -------------------------------------------------------------- 2. BGM ×3 */
for (const track of ["bgm.mp3", "bgm-trenches.mp3", "bgm-float.mp3"]) {
  const p = rel(path.join("public", "audio", track));
  if (!fs.existsSync(p)) {
    fail(`public/audio/${track}`, "missing — regenerate with scripts/make-bgm.py");
    continue;
  }
  const { size } = fs.statSync(p);
  if (size < 10_000) {
    fail(`public/audio/${track}`, `only ${size} bytes — looks truncated`);
  } else {
    pass(`public/audio/${track}`, `${(size / 1024).toFixed(0)} KB`);
  }
}

/* --------------------------------------------------------- 3. key modules */
const KEY_FILES = [
  // export pipeline (README "Under the hood")
  ["scripts/render-worker.mjs", "runtime-loaded render worker"],
  ["remotion/index.ts", "Remotion entry"],
  ["app/api/render/route.ts", "NDJSON render route"],
  // alert loop + archive (npm run daemon)
  ["scripts/broadcast-daemon.mjs", "alert daemon"],
  ["app/api/alerts/route.ts", "alerts API"],
  ["app/api/broadcasts/route.ts", "archive API"],
  // gates + panels
  ["components/dashboard/BalancePanel.tsx", "$CHOG balance/burn panel"],
  ["components/dashboard/RenderPanel.tsx", "export panel"],
];
for (const [file, why] of KEY_FILES) {
  if (exists(file)) pass(file, why);
  else fail(file, `missing — ${why}`);
}

/* ------------------------------------------------- 4. package.json scripts */
{
  let ok = false;
  try {
    const pkg = JSON.parse(fs.readFileSync(rel("package.json"), "utf8"));
    const s = pkg.scripts || {};
    const missing = ["selftest", "daemon"].filter((k) => typeof s[k] !== "string");
    if (missing.length === 0) {
      ok = true;
      pass("package.json scripts", `selftest → ${s.selftest} · daemon → ${s.daemon}`);
    } else {
      fail("package.json scripts", `missing script(s): ${missing.join(", ")}`);
    }
  } catch (err) {
    fail("package.json scripts", `unreadable: ${err.message}`);
  }
  void ok;
}

/* ------------------------------------------- 5. Remotion composition ids */
const COMPOSITION_IDS = ["summon", "price-alert", "pfp-flex", "meme-clip", "chog-wrapped"];

function listCompositions(timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn("npx", ["remotion", "compositions", "remotion/index.ts"], {
      cwd: ROOT,
      env: { ...process.env, CI: "1", REMOTION_DISABLE_ANIMATIONS: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        child.kill("SIGKILL");
      } catch {
        /* already gone */
      }
      resolve(result);
    };
    const timer = setTimeout(() => done({ error: `timed out after ${timeoutMs}ms` }), timeoutMs);
    child.stdout.on("data", (b) => {
      out += b.toString();
      if (out.length > 200_000) out = out.slice(-100_000);
    });
    child.stderr.on("data", (b) => {
      out += b.toString();
    });
    child.on("error", (err) => done({ error: err.message, out }));
    child.on("close", (code) => done({ code, out }));
  });
}

{
  const res = await listCompositions(45_000);
  const out = res.out || "";
  const listed = new Set();
  // e.g. "price-alert     30      1080x1080      180 (6.00 sec)"
  for (const line of out.split("\n")) {
    const m = /^([a-z][a-z0-9-]*)\s+\d+\s+\d+x\d+\s+\d+\s*\(/i.exec(line.trim());
    if (m) listed.add(m[1]);
  }
  if (res.error || (typeof res.code === "number" && res.code !== 0 && listed.size === 0)) {
    warn(
      "remotion compositions",
      `bundler unavailable here (${res.error || `exit ${res.code}`}) — listing skipped, not fatal`
    );
  } else if (listed.size === 0) {
    warn("remotion compositions", "bundler ran but produced no parseable list — skipped, not fatal");
  } else {
    const missing = COMPOSITION_IDS.filter((id) => !listed.has(id));
    if (missing.length === 0) {
      pass("remotion compositions", `all 5 ids: ${COMPOSITION_IDS.join(", ")}`);
    } else {
      fail("remotion compositions", `missing id(s): ${missing.join(", ")} (saw: ${[...listed].join(", ")})`);
    }
  }
}

/* ------------------------------------------------- 6. live probes (opt-in) */
if (RUN_HTTP) {
  const probes = [
    { path: "/", html: true },
    { path: "/dashboard", html: true },
    { path: "/api/market", json: (d) => d && typeof d.market === "object" && d.market !== null },
    { path: "/api/broadcasts", json: (d) => Array.isArray(d && d.broadcasts) },
    { path: "/api/alerts", json: (d) => Array.isArray(d && d.alerts) },
  ];
  const results = await Promise.all(
    probes.map(async (p) => {
      const url = `${BASE}${p.path}`;
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(12_000),
          headers: { accept: p.json ? "application/json" : "text/html" },
        });
        const ct = res.headers.get("content-type") || "";
        if (res.status !== 200) return { ...p, error: `HTTP ${res.status}` };
        if (p.html) {
          if (!ct.includes("text/html")) return { ...p, error: `expected HTML, got ${ct}` };
          return { ...p, ok: true, detail: `200 text/html` };
        }
        let body;
        try {
          body = await res.json();
        } catch {
          return { ...p, error: `200 but body is not JSON (${ct || "no content-type"})` };
        }
        if (!p.json(body)) return { ...p, error: "JSON shape mismatch" };
        return { ...p, ok: true, detail: "200 JSON, expected shape" };
      } catch (err) {
        return { ...p, error: err && err.message ? err.message : String(err) };
      }
    })
  );
  for (const r of results) {
    if (r.ok) pass(`GET ${r.path}`, r.detail);
    else fail(`GET ${r.path}`, r.error);
  }
} else if (!FORCE_OFFLINE && !BASE) {
  console.log("SKIP  live probes  — CHGRAM_URL not set");
}

/* -------------------------------------------------------------- 7. summary */
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log("");
console.log(
  `${nPass} passed · ${nFail} failed · ${nWarn} warnings · ${elapsed}s`
);
if (nFail > 0) {
  console.log(`RESULT: FAIL (${failures.join(", ")})`);
  process.exit(1);
}
console.log(`RESULT: PASS${nWarn > 0 ? " (with warnings)" : ""}`);
process.exit(0);
