"use client";

import type { MarketData } from "../../lib/types";
import { fmtNum, fmtPct, fmtUsd } from "./format";

type Props = { market: MarketData | null };

/** Left rail: live $CHOG feed (Dexscreener via lib/market). */
export function MarketPanel({ market }: Props) {
  const change = market?.chogChange24h ?? 0;
  const dir = change > 0 ? "up" : change < 0 ? "down" : "flat";
  const ageSec = market ? Math.max(0, Math.round((Date.now() - market.ts) / 1000)) : null;

  return (
    <section className="panel market-panel" aria-label="Market feed">
      <div className="panel__head">
        <span className="micro">MARKET_FEED</span>
        <span className="micro panel__head-right">
          <span className={`live-dot ${market ? "" : "is-off"}`} aria-hidden="true" />
          {market ? (ageSec !== null && ageSec < 90 ? "LIVE" : "CACHED") : "CONNECTING"}
        </span>
      </div>

      <div className="price-block">
        <span className="micro">PRICE · $CHOG</span>
        <div className="price-line">
          <span className="price-line__value mono">{market ? fmtUsd(market.chogPriceUsd) : "—"}</span>
          <span className={`price-line__change mono dir-${dir}`}>
            {market ? fmtPct(change) : "—"}
            <span className="price-line__window">24H</span>
          </span>
        </div>
      </div>

      <dl className="readout readout--grid">
        <div className="readout__row">
          <dt>FLOOR</dt>
          <dd className="mono">
            {market ? `${market.floorMon.toLocaleString("en-US", { maximumFractionDigits: 1 })} MON` : "—"}
            <span className="readout__sub">{market ? fmtUsd(market.floorUsd) : ""}</span>
          </dd>
        </div>
        <div className="readout__row">
          <dt>OWNERS</dt>
          <dd className="mono">{market ? fmtNum(market.holders) : "—"}</dd>
        </div>
      </dl>

      <p className="micro feed-src">SOURCE: DEXSCREENER · CHAIN: MONAD</p>
    </section>
  );
}
