/**
 * SSR smoke test for the dashboard surface — renders every panel with fixture
 * data through react-dom/server to catch prop/render crashes without booting
 * `next dev` (shared box), then asserts on key copy.
 *
 * Build + run:  node scripts/run-ssr-smoke.mjs
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { BroadcastData, MarketData } from "../lib/types";
import { SAMPLE_CHOGS, SAMPLE_MARKET, TEMPLATES } from "../lib/fixtures";
import { DashHeader } from "../components/dashboard/DashHeader";
import { AssetPanel } from "../components/dashboard/AssetPanel";
import { MarketPanel } from "../components/dashboard/MarketPanel";
import { BalancePanel, type BalanceState } from "../components/dashboard/BalancePanel";
import { TemplateGallery } from "../components/dashboard/TemplateGallery";
import { Studio } from "../components/dashboard/Studio";
import { DEFAULT_CUSTOM } from "../components/dashboard/editorFields";
import { fmtNum, fmtPct, fmtUsd } from "../components/dashboard/format";
import DashboardPage from "../app/dashboard/page";

const noop = () => undefined;
const lines: string[] = [];

function html(el: React.ReactElement): string {
  return renderToStaticMarkup(el);
}

function check(label: string, markup: string, mustContain: string[]): void {
  const missing = mustContain.filter((s) => !markup.includes(s));
  if (missing.length > 0) {
    console.error(`[ssr-smoke] ${label} HTML >>>\n${markup}\n<<<`);
    throw new Error(`${label}: missing ${JSON.stringify(missing)}`);
  }
  lines.push(`ok  ${label} (${markup.length} chars)`);
}

export function run(): string[] {
  const chog = SAMPLE_CHOGS[0];
  const market: MarketData = SAMPLE_MARKET;

  check(
    "DashHeader",
    html(
      createElement(DashHeader, {
        wallet: "0x9C480000000000000000000000000000006567",
        chog,
        onDisconnect: noop,
      })
    ),
    ["CHOGRAM", "Change Chog", "Disconnect", "0x9C48", "ACTIVE_ASSET"]
  );

  check(
    "AssetPanel",
    html(createElement(AssetPanel, { chog, active: true })),
    [
      "ACTIVE_ASSET",
      "TOKEN_ID",
      `#${chog.tokenId}`,
      "RARITY_RANK",
      `#${chog.rarityRank}`,
      "/1969",
      String(chog.traits[0].value),
      "HOLDER",
      chog.holder,
      "rank-bar__fill",
    ]
  );

  check(
    "MarketPanel",
    html(createElement(MarketPanel, { market })),
    [
      "MARKET_FEED",
      fmtUsd(market.chogPriceUsd),
      fmtPct(market.chogChange24h),
      "HOLDERS",
      fmtNum(market.holders),
      "FLOOR",
    ]
  );

  const balances: BalanceState[] = [
    { status: "no-wallet" },
    { status: "checking" },
    { status: "ok", raw: 1_500_000_000_000_000_000_000n, label: "1,500" },
    { status: "error", message: "RPC unreachable" },
  ];
  for (const b of balances) {
    check(
      `BalancePanel/${b.status}`,
      html(
        createElement(BalancePanel, {
          balance: b,
          onConnect: noop,
          connecting: false,
          connectError: null,
          onRetry: noop,
        })
      ),
      ["WALLET_BALANCE"]
    );
  }

  const noWallet = html(
    createElement(TemplateGallery, {
      templates: TEMPLATES,
      selected: "price-alert",
      unlocked: (t: (typeof TEMPLATES)[number]) => !t.premium,
      wallet: null,
      chog,
      connecting: false,
      connectError: null,
      onSelect: noop,
      onConnect: noop,
    })
  );
  check("TemplateGallery/no-wallet", noWallet, [
    "TEMPLATE_SLATES",
    "Price Alert",
    "Meme Clip",
    "PREMIUM SLATE",
    "Connect Wallet",
    "PFP-FLEX",
    "1080x1080",
    "6.0s",
  ]);

  const heldWallet = html(
    createElement(TemplateGallery, {
      templates: TEMPLATES,
      selected: "price-alert",
      unlocked: () => true,
      wallet: "0xabc",
      chog,
      connecting: false,
      connectError: null,
      onSelect: noop,
      onConnect: noop,
    })
  );
  check("TemplateGallery/unlocked", heldWallet, [
    "TEMPLATE_SLATES",
    "OPEN · 0 LOCKED",
    "Chog Wrapped",
  ]);

  for (const t of TEMPLATES) {
    const broadcast: BroadcastData = {
      chog,
      market,
      generatedAt: new Date().toISOString(),
      custom: { ...DEFAULT_CUSTOM[t.id] },
    };
    const markup = html(
      createElement(Studio, {
        template: t,
        inputProps: broadcast,
        draft: DEFAULT_CUSTOM[t.id],
        onField: noop,
      })
    );
    check(`Studio/${t.id}`, markup, [
      "STUDIO",
      "PROGRAM_MONITOR",
      "RENDER_QUEUE",
      "Export MP4",
      `${t.width}x${t.height}`,
      t.id === "summon" ? "Replay Summon" : "EDITOR",
      "pf-frame",
    ]);
  }

  check("DashboardPage/boot shell", html(createElement(DashboardPage)), [
    "CHOGRAM",
    "MOUNTING STUDIO",
  ]);

  return lines;
}

try {
  run().forEach((l) => console.log(`[ssr-smoke] ${l}`));
  console.log("[ssr-smoke] PASS");
} catch (err) {
  console.error("[ssr-smoke] FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
}
