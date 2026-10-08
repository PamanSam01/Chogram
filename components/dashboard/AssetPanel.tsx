"use client";

import type { ChogNFT } from "../../lib/types";

type Props = { chog: ChogNFT; active: boolean };

/** Left rail: the active asset — identity, every trait, rarity telemetry, holder. */
export function AssetPanel({ chog, active }: Props) {
  const topPct = Math.max(0, Math.min(100, (chog.rarityPercentile ?? 0) * 100));
  const topLabel = (100 - topPct) < 0.05 ? "TOP <0.05%" : `TOP ${(100 - topPct).toFixed(1)}%`;

  return (
    <section className={`panel asset-panel ${active ? "is-live" : ""}`} aria-label="Active asset">
      <div className="panel__head">
        <span className="micro">ACTIVE_ASSET</span>
        <span className="micro panel__head-right">
          {active ? <span className="live-dot" aria-hidden="true" /> : null}
          {active ? "ON AIR" : "STANDBY"}
        </span>
      </div>

      <div className="asset-id">
        <div className="asset-id__frame">
          <span className="reg-mark reg-mark--tl" aria-hidden="true" />
          <span className="reg-mark reg-mark--br" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={chog.image} alt={chog.name} />
        </div>
        <div className="asset-id__text">
          <h2 className="asset-id__name">{chog.name}</h2>
          <dl className="readout">
            <div className="readout__row">
              <dt>TOKEN_ID</dt>
              <dd className="mono">#{chog.tokenId}</dd>
            </div>
            <div className="readout__row">
              <dt>COLLECTION</dt>
              <dd className="mono">{chog.collection}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="panel__block">
        <span className="micro">TRAITS · {chog.traits.length}</span>
        <ul className="trait-chips">
          {chog.traits.map((t) => (
            <li key={t.trait_type} className="trait-chip">
              <span className="trait-chip__k">{t.trait_type}</span>
              <span className="trait-chip__v">{String(t.value)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel__block">
        <span className="micro">RARITY_RANK</span>
        <div className="rank-line">
          <span className="rank-line__value mono">
            #{chog.rarityRank}
            <span className="rank-line__total">/1969</span>
          </span>
          <span className="rank-line__pct mono">{topLabel}</span>
        </div>
        <div
          className="rank-bar"
          role="meter"
          aria-valuenow={Math.round(topPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Rarity percentile"
        >
          <span className="rank-bar__fill" style={{ width: `${topPct}%` }} />
        </div>
      </div>

      <div className="panel__block">
        <span className="micro">HOLDER</span>
        <p className="mono holder-addr">{chog.holder}</p>
      </div>
    </section>
  );
}
