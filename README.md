# CHOGRAM — Chog Broadcast Studio

**Your Chog Genesis NFT is the actor.** CHOGRAM is a broadcast studio that renders your Chog
into shareable video — a cinematic summon film, live price alerts, PFP flexes, memes and monthly
wraps — driven by real on-chain traits and live $CHOG market data, with music baked in.

Live demo: <coming soon>

---

## Features

- **The Summon film** — a fullscreen Remotion film (~18s) that introduces your Chog: traits,
  rarity rank, holder, all read from the token. Ending the film is how you enter the studio.
- **Wallet-less first run** — "No wallet? Try a sample Chog" opens a sample cast (real Chogs with
  real metadata) so a judge can go from landing → studio → exported MP4 with zero wallet setup.
- **5 broadcast templates** — The Summon (1920x1080, 18s), Price Alert (1080x1080, 6s),
  PFP Flex (1080x1350, 6s), Meme Clip (1080x1080, 5s), Chog Wrapped (1080x1350, 12s).
  Every composition reads `{chog, market, generatedAt}` props — remove the NFT and there is
  nothing to render.
- **Live data, no API keys** — $CHOG price/24h change from Dexscreener, floor + holder count from
  the OpenSea collection page, ownership/metadata from a Blockscout Monad instance, art from IPFS
  gateways. `/api/market` reports which source produced each number; a frozen fixture snapshot is
  used only when a source is unreachable.
- **Real MP4 export with audio** — `Export MP4` streams NDJSON progress
  (`bundling → rendering % → ready`), writes H.264 + AAC to `public/exports/`, then auto-downloads
  the file (a `Download MP4` link stays as fallback). Output verified: `h264` video stream +
  `aac` audio stream.
- **720p / 1080p quality toggle** — each button shows its output resolution and an estimated
  render time from measured per-frame rates.
- **3 music beds** — `BROADCAST`, `TRENCHES`, `FLOAT` (20s seamless loops in `public/audio/`,
  generated procedurally by `scripts/make-bgm.py`) selected next to the quality toggle and mixed
  into every exported MP4.
- **Price alerts that render for you** — arm an alert with a threshold (0.5–50%) and a direction;
  when $CHOG moves, the alert fires, a price-alert clip renders automatically, and the file lands
  in the broadcast archive. `TEST FIRE` runs the whole loop on demand in one click.
- **Broadcast daemon** — `npm run daemon` polls the live price every 60s and fires armed alerts
  with no browser open (retention loop: alerts → renders → archive).
- **Broadcast archive** — every export (manual or alert-fired) is recorded in `data/broadcasts.json`
  and listed in the studio: time, template, output resolution, cut length, file size, render time,
  download link.
- **Per-token broadcast signature** — every clip carries a deterministic `BROADCAST SIG 0x…`
  (FNV-1a over `tokenId:holder:generatedAt`, 16 hex digits) in the ticker/meta line, so two Chogs
  (or two takes of the same Chog) are never confusable.
- **$CHOG premium gates** — premium templates (Meme Clip, Chog Wrapped) unlock two ways:
  hold any $CHOG (`balanceOf > 0`, eth_call on chain 143) **or** burn 500 $CHOG to `0xdEaD`
  as a one-time unlock (tx hash stored and shown).

---

## Quickstart

```bash
npm i
npm run build
npm start          # → http://localhost:3000
```

Optional — run the alert daemon in a second terminal (server must be up):

```bash
npm run daemon     # polls every 60s, fires armed alerts, never exits
```

Other scripts: `npm run dev` (dev server), `npm run typecheck` (`tsc --noEmit`),
`npm run selftest` (smoke test, see below), `npm run studio` (Remotion Studio on :3001),
`npm run render` / `npm run still` (Remotion CLI).

---

## Testing instructions (judge script — about 5 minutes)

**0. Smoke test first (optional, ~10s, no server needed):**

```bash
npm run selftest                 # offline checks: build artifacts, BGM tracks, key modules,
                                 # 5 Remotion compositions
CHGRAM_URL=http://localhost:3000 npm run selftest   # also probes /, /dashboard, /api/* 
```

Every check prints a `PASS` / `FAIL` / `WARN` line; the script exits non-zero on any hard failure.
(The live probes hit whatever build is currently running — run `npm run build && npm start` first
if you just pulled new API routes.)

**1. Landing → wallet-less path (no wallet, no extension):**

1. Open `http://localhost:3000`.
2. In the hero, click **"No wallet? Try a sample Chog"** (small link under the two big buttons).
   The picker header reads `Sample cast — no wallet needed` (displayed in the site's uppercase
   micro type).
3. Pick any Chog from the sample cast. Its real traits, rarity rank and holder are saved as the
   active actor.

**2. Summon film:**

4. Click the big acid **Summon** button. A fullscreen Remotion film plays (~18s) starring your
   Chog — it starts muted; the **Sound off/on** button in the film bar unmutes it. When the film
   ends, `CAST CONFIRMED` appears → click **Enter Studio**
   (`YOUR CHOG IS SAVED — THE STUDIO IS READY`) and you land on `/dashboard`. The
   **Skip to studio** button does the same jump instantly if you are short on time.

**3. Pick a template:**

5. On the dashboard, the right column shows the template gallery: 5 slates with true-aspect
   thumbnails and mono spec lines. Click **Price Alert** (fastest to judge).
   The program monitor immediately plays a live preview built from real broadcast data
   (your Chog + current market numbers).
6. In the **EDITOR** rail, type in the alert line — the preview composes on every keystroke.

**4. Quality + music:**

7. Under the editor, the quality toggle is set to **720p** by default (shows e.g.
   `720x720 · ~3 min`); click **1080p** for full resolution (`1080x1080 · ~7 min`). Estimates
   come from measured per-frame rates on this host.
8. In the **SCORE · 20s LOOP** row, click a track chip: **BROADCAST** (96 BPM) / **TRENCHES**
   (126 BPM) / **FLOAT** (84 BPM).

**5. Export MP4:**

9. Click **Export MP4**. The status line walks `BUNDLING — COMPILING REMOTION BUNDLE` →
    `RENDERING — n% · elapsed · REMAIN ~x` with a live clock and progress bar (the REC dot is
    lit while it runs). Wait for the dot to read `OK` / `READY — …` — the file downloads
    automatically the moment it is ready (if your browser blocks it, the **Download MP4** link
    is right there).
10. Where the file lands: `public/exports/<timestamp>-<template>[-720].mp4`, served (forced
    download) at `/exports/<filename>`. The panel also prints the exact output path, e.g.
    `OUTPUT /public/exports/ · 720x720`.
11. Verify the deliverable yourself:
    `ffprobe -show_streams public/exports/<file>.mp4` → one `h264` stream and one `aac` stream.

**6. TEST FIRE (the retention loop, ~3 min):**

12. Scroll to **Alerts**: type a threshold in **THRESHOLD %** (e.g. `1`, valid range 0.5–50),
    leave **DIRECTION** at `ANY MOVE`, click **ARM ALERT**.
13. Click **TEST FIRE** on that alert (it flips to `FIRING…`). The server builds a fresh
    price-alert broadcast from the live market, renders it at 720p, marks the alert fired, and
    returns a link — the status line shows `RENDERING… n ELAPSED · ONE CLIP ≈ 3 MIN` and then the
    file link. This is the exact path the daemon takes.
14. Open **Broadcast archive**: the new clip is listed with time, template, output resolution,
    cut length, size, render time and a file link. Empty state reads
    `No broadcasts yet — export one from the studio.`
15. With `npm run daemon` running in another terminal, you'll see one timestamped
    `[chogram-daemon] …` line per 60s price check, and any armed alert whose threshold is
    crossed fires the render loop by itself.

**7. $CHOG gates:**

16. Two templates (Meme Clip, Chog Wrapped) show a `$CHOG` padlock. The balance panel reads your
    real on-chain balance (`balanceOf` eth_call, chain 143): hold any $CHOG → unlocked. Without a
    balance you get the **Unlock with 500 $CHOG** button, which sends `transfer(0xdEaD, 500e18)`
    and stores the tx hash (`UNLOCKED · tx 0x…`). No wallet → connect CTA; rejected
    transaction → nothing happens; RPC error → an honest error line.

---

## Measured render times

Measured on the demo host (2 cores, headless Chromium with software GL `swangle`, one render at a
time). **720p** = output at scale 2/3 of the composition, **1080p** = native composition size.
Per-frame rates measured: **≈ 1.0 s/frame @720p** (up to ≈1.3 when the host is busy),
**≈ 2.3 s/frame @1080p** — these same constants drive the estimates in the studio UI
(`components/dashboard/RenderPanel.tsx`) and are documented in `scripts/render-worker.mjs`.

| Template | Frames · length | 720p output | 720p render | Native output | 1080p render |
|---|---|---|---|---|---|
| The Summon | 540 · 18.0s | 1280x720 | ~9 min \* | 1920x1080 | ~21 min \* |
| Price Alert | 180 · 6.0s | 720x720 | **~171 s (measured)** | 1080x1080 | **~414 s (measured)** |
| PFP Flex | 180 · 6.0s | 720x900 | ~2.9 min \* | 1080x1350 | ~6.9 min \* |
| Meme Clip | 150 · 5.0s | 720x720 | **~207 s (measured)** | 1080x1080 | ~5.8 min \* |
| Chog Wrapped | 360 · 12.0s | 720x900 | ~6 min \* | 1080x1350 | ~13.8 min \* |

Measured cells are end-to-end through `POST /api/render` on the demo box (wall clock, including
the webpack bundle + browser spin-up: the Meme Clip run was 207 s total — ~12 s bundling +
~195 s of frames, ≈1.3 s/frame while the host was busy with other work). \* extrapolated from the
measured per-frame rates (frame count × measured rate), not timed end-to-end — only Price Alert
was measured at both qualities. Timings vary with host load; the studio's live `ELAPSED / EST TOTAL`
readout uses the same constants and keeps counting while you watch. That is why **720p is the
default** and the quick-judge path.

---

## Architecture

```
                    BROWSER  (Next.js 15 App Router · React 19 · plain CSS · no UI kits)
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │ /            landing: hero, sample-cast picker, "Why the Chog NFT matters"      │
  │                SummonModal ── <Player> plays remotion/compositions/Summon       │
  │ /dashboard   asset + market + balance panels, template gallery,                │
  │                Studio: program monitor (<Player>) + editor + RenderPanel        │
  │                Alerts panel (arm / TEST FIRE) · Broadcast archive               │
  └───────────────┬─────────────────────────────────────────────────────────────────┘
                  │ POST /api/render {templateId, broadcast, scale}
                  │ GET  /api/market · /api/chogs · /api/alerts · /api/broadcasts
                  ▼
  SERVER  app/api/render/route.ts ──── NDJSON stream: bundling → rendering{progress} → ready|failed
                  │  runtime import() of scripts/render-worker.mjs (specifier hidden from
                  │  webpack AND @vercel/nft → @remotion/* never enters a serverless bundle)
                  ▼
  scripts/render-worker.mjs
                  ├─ bundle(remotion/index.ts)         webpack, cached per process
                  ├─ ensureBrowser()                   headless Chromium (swangle)
                  ├─ selectComposition + renderMedia   h264+aac, concurrency 1, job queue
                  └─ pruneExports()                    keeps newest 12 MP4s
                  ▼
  public/exports/<ts>-<template>[-720].mp4 ── app/exports/[file]/route.ts (forced download)
                  └─ render hook appends meta → data/broadcasts.json → archive UI

  ALERT LOOP     scripts/broadcast-daemon.mjs (60s poll, `npm run daemon`)
                  Dexscreener price → data/daemon-state.json → threshold crossed?
                  → POST /api/alerts/fire → builds BroadcastData → POST /api/render → archive

  DATA (keyless)  lib/sources.ts: Dexscreener ($CHOG price/24h) · OpenSea page via r.jina.ai
                  (floor/holders) · Blockscout Monad (ownerOf, tokenURI) · IPFS gateways (art)
                  lib/market.ts fetchMarketData() → fixture fallback + provenance in /api/market
                  lib/chog.ts   fetchChogsForOwner() → ChogNFT {traits, rarity, holder}

  REMOTION 4      remotion/index.ts → Root.tsx registers 5 compositions (calculateMetadata
                  resolves width/height/fps/duration from lib/fixtures TEMPLATES);
                  every composition consumes BroadcastData props; withBgm() mounts the
                  20s music loop on all five.
```

Key files: `app/api/render/route.ts` (stream + Vercel guard), `scripts/render-worker.mjs`
(heavy pipeline, loaded at runtime), `remotion/Root.tsx` (composition registry + `broadcastFor`),
`lib/fixtures.ts` (templates + sample broadcast), `lib/sources.ts` (keyless data), `public/audio/`
(music beds), `scripts/broadcast-daemon.mjs` (alert loop), `scripts/selftest.mjs` (smoke test).

---

## Hosting matrix

| Concern | Vercel (serverless) | Self-host (VPS / Docker / laptop) |
|---|---|---|
| Landing + studio UI | works | works |
| Live data (`/api/market`, `/api/chogs`) | works | works |
| Remotion preview Players (in-browser) | works | works |
| **MP4 export (`POST /api/render`)** | **disabled — intentional** | works |
| Alert daemon (`npm run daemon`) | separate always-on process | works |
| Archive persistence (`data/broadcasts.json`) | no durable writes (read-only/ephemeral FS; the hook is fire-and-forget so the app still works) | works |

**Why export needs self-host:** rendering needs headless Chromium plus minutes of continuous CPU
(~3–21 min per clip depending on format and quality), which a serverless function cannot do — and statically importing
`@remotion/bundler`/`@remotion/renderer` would trace ~940 MB (Chromium + webpack caches) into the
function bundle. CHOGRAM handles both honestly: the route loads `scripts/render-worker.mjs`
through an opaque `import()` so the heavy tree is never bundled, and when `process.env.VERCEL` is
set the route answers immediately with an NDJSON `phase:"failed"` and a plain-language reason —
the studio shows that message plus a ready-to-run CLI fallback line instead of hanging or 500ing.
Deploy the UI/data on Vercel and point export at the self-hosted instance
(the demo at `<coming soon>` is exactly that self-hosted full path).

---

## Roadmap

- Alert channels beyond the studio: Telegram/Discord webhook delivery of the rendered clip.
- Scheduled posts: daemon-driven daily "Chog market open" broadcast with the archive as a feed.
- Render farm: Remotion Lambda / multi-worker queue to cut 1080p renders from minutes to seconds.
- Live rarity recomputation instead of the checked-in trait-frequency table, plus trait rarity
  callouts inside PFP Flex.
- More templates (raid announcement, milestone card) and per-holder brand kits (colors, handle).
- On-chain claim receipts: mint the broadcast signature `0x…` as a sidecar receipt for each export.

---

## Attribution / pre-existing work

Honest list of what CHOGRAM did not write itself:

- **Video engine:** [Remotion](https://www.remotion.dev) by **Remotion AG** — `remotion`,
  `@remotion/player`, `@remotion/bundler`, `@remotion/renderer`. CHOGRAM's compositions, HOCs and
  the render worker are our code; the player, bundler, encoder pipeline and licensing are theirs.
  Used under Remotion's own license terms (review them before commercial use).
- **Framework/runtime:** Next.js (Vercel), React, TypeScript, viem — standard dependencies
  (`package.json`), no UI kit, no CSS framework, no icon library: all styling is hand-written CSS.
- **Chog Genesis artwork:** the collection, characters and art belong to **the Chog team /
  Chog Genesis** (`0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763`, Monad chain 143, 1,969 supply).
  Token images mirrored in `public/chogs/` are the real token art fetched from the collection's
  IPFS metadata, used here to render the collection's own broadcast content. Not our art.
- **Market/collection data (keyless, third-party):** Dexscreener (price + 24h change),
  OpenSea collection page read through the `r.jina.ai` text mirror (floor, holders),
  a public Blockscout Monad instance `monscout.cp0x.com` (`ownerOf`, token metadata),
  IPFS gateways for token media. Their data, their rate limits; each helper falls back to a
  dated fixture snapshot and labels the source in `/api/market` rather than inventing numbers.
- **Music:** `public/audio/bgm*.mp3` are generated by our `scripts/make-bgm.py` (procedural
  synthesis rendered through ffmpeg) — no sampled or third-party audio.
- **How it was built:** the codebase was originally scaffolded and is still iterated with AI
  coding agents working from `AGENTS_CONTRACT.md` + `FEATURES_V2.md` (role-per-file ownership:
  Remotion, data/API, landing, dashboard, then alerts, burn, media, docs). That includes this
  README. Everything shipped was reviewed against the running app — every claim here is checkable
  in the repo, and anything partial is described as partial.
- **Sample data provenance:** `SAMPLE_CHOGS` carry real on-chain metadata (traits from tokenURI,
  `ownerOf` read 2026-10-07, rarity ranks computed over all 1,969 tokens in
  `public/fixtures/rarity.json`); `SAMPLE_MARKET` is a dated Dexscreener/OpenSea snapshot used
  only as fallback.

---

## Repo map

```
app/            landing + dashboard pages, globals/landing/dashboard CSS, API routes
components/     landing + dashboard components (plain CSS, "use client" where they touch state)
lib/            types (frozen), fixtures, keyless sources, market + chog helpers
remotion/       Remotion root, 5 compositions, theme/fx/bgm libs
scripts/        render-worker.mjs · broadcast-daemon.mjs · selftest.mjs · make-bgm.py
public/         chogs (token art) · audio (music beds) · fixtures · exports (render output)
data/           runtime state: broadcasts.json, daemon-state.json (gitignored)
qa/             responsive screenshots (6 viewports x landing/dashboard) and E2E captures
```

Verification gates: `npx tsc --noEmit` (clean), `npm run build` → production artifact
`.next/BUILD_ID` present (rebuild after pulling so newly added routes are in the served build),
`npx remotion compositions remotion/index.ts` (all 5 ids), `npm run selftest` (PASS/FAIL per
check, non-zero exit on hard failure).
