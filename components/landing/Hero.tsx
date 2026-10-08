import type { CSSProperties } from "react";
import type { ChogNFT, MarketData } from "@/lib/types";
import { shortAddr } from "@/lib/chog";
import { CHOG_GENESIS } from "@/lib/market";
import { fmtChange, fmtClock, fmtCount, fmtPrice, fmtRarity } from "./format";
import { IconArrow, IconCaret, IconPlay } from "./icons";

type Props = {
  market: MarketData | null;
  wallet: string | null;
  connecting: boolean;
  activeChog: ChogNFT | null;
  notice: string | null;
  onConnect: () => void;
  onWatch: () => void;
  onSample: () => void;
  onSummon: () => void;
  onOpenPicker: () => void;
};

/** Per-letter staggered reveal for the display headline. */
function Kinetic({
  text,
  delay = 0,
  className,
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  return (
    <span className={className}>
      {Array.from(text).map((ch, i) => (
        <span
          key={i}
          className={ch === " " ? "ltr ltr-space" : "ltr"}
          style={{ "--i": i, "--d": `${delay}s` } as CSSProperties}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

export default function Hero({
  market,
  wallet,
  connecting,
  activeChog,
  notice,
  onConnect,
  onWatch,
  onSample,
  onSummon,
  onOpenPicker,
}: Props) {
  const change = market?.chogChange24h ?? null;
  const up = (change ?? 0) >= 0;

  const ticks: { k: string; v: string; tone?: "up" | "down" | "acid" }[] = [
    {
      k: "$CHOG",
      v: market ? fmtPrice(market.chogPriceUsd) : "——",
      tone: market ? (up ? "up" : "down") : undefined,
    },
    {
      k: "24H",
      v: market ? fmtChange(market.chogChange24h) : "——",
      tone: market ? (up ? "up" : "down") : undefined,
    },
    { k: "Supply", v: "1,969" },
    { k: "Owners", v: market ? fmtCount(market.holders) : "——" },
    { k: "Floor", v: market ? `${market.floorMon.toLocaleString("en-US", { maximumFractionDigits: 1 })} MON` : "——" },
    { k: "Chain", v: "Monad / 143" },
    { k: "Cast", v: "Chog Genesis" },
    { k: "Order", v: "Chog World Order", tone: "acid" },
    { k: "Contract", v: `${CHOG_GENESIS.slice(0, 8)}…${CHOG_GENESIS.slice(-4)}` },
    { k: "Status", v: "Chogathon 2026 — live", tone: "acid" },
  ];

  return (
    <section className="hero" id="top">
      <div className="hero-bg" aria-hidden="true">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
        <span className="bg-grid" />
        <span className="bg-noise" />
        <span className="chog-float cf-1">
          <img src="/chogs/chogwow.jpg" alt="" />
        </span>
        <span className="chog-float cf-2">
          <img src="/chogs/chognice.jpg" alt="" />
        </span>
        <span className="chog-float cf-3">
          <img src="/chogs/chog1.jpg" alt="" />
        </span>
        <span className="hero-ghost">CHOG WORLD ORDER</span>
      </div>

      <div className="hero-inner lg-wrap">
        <div className="hero-rail">
          <span className="micro">CHOGRAM / CHOG BROADCAST STUDIO</span>
          <span className="micro rec">REC ●</span>
          <span className="micro rail-opt">MONAD / 143</span>
          <span className="micro rail-opt">SUPPLY 1,969</span>
          <span className="micro rail-opt micro-vio">CHOGATHON 2026</span>
        </div>

        <h1 className="hero-title" aria-label="Your Chog is the actor">
          <span className="ht-row ht-row1" aria-hidden="true">
            <Kinetic text="YOUR" />
            <Kinetic text="CHOG" className="ht-acid" />
          </span>
          <span className="ht-row ht-row2" aria-hidden="true">
            <Kinetic text="IS THE" className="ht-outline" delay={0.42} />
            <Kinetic text="ACTOR" delay={0.74} />
          </span>
        </h1>

        <div className="hero-body">
          <div className="hero-copy">
            <p className="hero-sub">
              Chog is the mascot of Monad. CHOGRAM casts your <b>Chog Genesis NFT</b> as the lead
              actor and cuts it into broadcast-ready film — <b>traits drive the rig</b>,{" "}
              <b>rarity drives the rank HUD</b>, live <b>$CHOG</b> data drives the edit. Five
              Remotion templates, real on-chain inputs, exported MP4.
            </p>

            <div className="hero-ctas">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={wallet ? onOpenPicker : onConnect}
                disabled={connecting}
              >
                {connecting
                  ? "Connecting…"
                  : wallet
                    ? `My Chogs · ${shortAddr(wallet)}`
                    : "Connect Wallet"}
              </button>
              <button type="button" className="btn btn-ghost btn-lg" onClick={onWatch}>
                <IconPlay size={15} />
                Watch a Summon
              </button>
            </div>

            <div className="hero-alt">
              <button type="button" className="link-quiet" onClick={onSample}>
                No wallet? Try a sample Chog
                <IconArrow size={13} />
              </button>
            </div>

            {notice ? (
              <p className="hero-note micro">
                <IconCaret size={10} up />
                {notice}
              </p>
            ) : null}

            {activeChog ? (
              <div className="summon-block reg-on">
                <div className="summon-chog">
                  <img src={activeChog.image} alt={activeChog.name} />
                  <div>
                    <b>{activeChog.name}</b>
                    <span className="micro">
                      RANK #{activeChog.rarityRank} / 1,969 · {fmtRarity(activeChog.rarityPercentile)}{" "}
                      · CAST
                    </span>
                  </div>
                </div>
                <button type="button" className="btn btn-acid summon-btn" onClick={onSummon}>
                  Summon
                  <IconArrow size={17} />
                </button>
              </div>
            ) : null}
          </div>

          <aside className="hero-market reg-on" aria-label="Live $CHOG market data">
            <div className="hm-head">
              <span className="micro hm-live">Live · $CHOG USD</span>
              <span className="micro">Monad DEX</span>
            </div>
            <div className="hm-price">{market ? fmtPrice(market.chogPriceUsd) : "······"}</div>
            <div className={`hm-change ${market ? (up ? "up" : "down") : ""}`}>
              <IconCaret size={11} up={up} />
              {market ? fmtChange(market.chogChange24h) : "····"}
              <span>24H</span>
            </div>
            <dl className="hm-rows">
              <div>
                <dt>Supply</dt>
                <dd>1,969</dd>
              </div>
              <div>
                <dt>Owners</dt>
                <dd>{market ? fmtCount(market.holders) : "——"}</dd>
              </div>
              <div>
                <dt>Floor</dt>
                <dd>{market ? `${market.floorMon.toLocaleString("en-US", { maximumFractionDigits: 1 })} MON` : "——"}</dd>
              </div>
              <div>
                <dt>Chain</dt>
                <dd>MONAD / 143</dd>
              </div>
            </dl>
            <div className="hm-foot micro">
              Source: Dexscreener · snapshot {market ? fmtClock(market.ts) : "pending"}
            </div>
          </aside>
        </div>
      </div>

      <div className="ticker" aria-label="Live broadcast strip">
        <span className="ticker-label">LIVE ●</span>
        <div className="ticker-track">
          {[0, 1].map((dup) => (
            <div className="ticker-set" key={dup} aria-hidden={dup === 1 ? "true" : undefined}>
              {ticks.map((t, i) => (
                <span className="tick" key={`${dup}-${i}`}>
                  <span className="tick-k">{t.k}</span>
                  <span className={`tick-v${t.tone ? ` ${t.tone}` : ""}`}>{t.v}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
