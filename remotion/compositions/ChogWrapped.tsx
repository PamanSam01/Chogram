// CHOG WRAPPED — 1080x1350, 360 frames. Monthly recap deck: kinetic month intro,
// six staged stat cards sliding across a rail, closing share card.
import React from "react";
import { Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { BroadcastData, ChogNFT, MarketData } from "../../lib/types";
import {
  BarReveal,
  CornerTicks,
  CutFx,
  Drift,
  Film,
  GlitchImage,
  Label,
  Rule,
  Slam,
  Timecode,
  ip,
} from "../lib/fx";
import {
  C,
  F,
  CHOG_SUPPLY,
  chogSrc,
  dateOnly,
  fmtInt,
  fmtMon,
  fmtPct,
  fmtUsd,
  stamp,
  topPct,
} from "../lib/theme";

const CARD_STARTS = [70, 110, 150, 190, 230, 270];
const CARD_LEN = 46; // 38 visible + 8 exit overlap with the next card
const OUTRO = 316;

/* ------------------------------------------------------------------ intro */

const Intro: React.FC<{ chog: ChogNFT; custom?: Record<string, string> }> = ({
  chog,
  custom,
}) => {
  const frame = useCurrentFrame();
  const month = (custom?.month ?? "OCTOBER 2026").toUpperCase();
  const headline = (custom?.headline ?? "A MONTH IN THE CHOG WORLD ORDER").toUpperCase();
  const monthSize = month.length > 12 ? 100 : month.length > 9 ? 124 : 164;
  return (
    <>
      <div style={{ position: "absolute", left: 140, top: 150 }}>
        <Label>CHOGRAM PRESENTS</Label>
        <Rule style={{ marginTop: 20, width: 620 }} />
        <div style={{ marginTop: 44 }}>
          <Slam text={month} size={monthSize} start={8} stagger={2.4} />
        </div>
        <div style={{ marginTop: 34, width: 560 }}>
          <BarReveal progress={ip(frame, [34, 50], [0, 1])}>
            <div
              style={{
                fontFamily: F.display,
                fontWeight: 600,
                fontSize: 44,
                lineHeight: 1.14,
                letterSpacing: "0.01em",
                color: C.ink,
              }}
            >
              {headline}
            </div>
          </BarReveal>
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: F.mono,
            fontSize: 20,
            letterSpacing: "0.2em",
            color: C.acid,
            opacity: ip(frame, [50, 60], [0, 1]),
          }}
        >
          TOKEN #{chog.tokenId} · RANK #{chog.rarityRank}/{CHOG_SUPPLY}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 74,
          bottom: 210,
          width: 350,
          height: 350,
          border: `1px solid ${C.lineStrong}`,
          overflow: "hidden",
          boxShadow: "0 0 50px rgba(139,92,246,0.3)",
          transform: `translateY(${ip(frame, [14, 32], [70, 0], Easing.out(Easing.cubic))}px)`,
          opacity: ip(frame, [14, 26], [0, 1]),
        }}
      >
        <GlitchImage
          src={chogSrc(chog.image)}
          alt={chog.name}
          glitch={frame < 8 ? ip(frame, [0, 8], [0.7, 0]) : 0}
          split={ip(frame, [0, 12], [14, 0])}
          frame={frame}
          slices={4}
        />
        <CornerTicks inset={12} size={22} />
      </div>
    </>
  );
};

/* -------------------------------------------------------------- stat cards */

const CardShell: React.FC<{
  index: number;
  total: number;
  title: string;
  children: React.ReactNode;
  local: number;
}> = ({ index, total, title, children, local }) => {
  const { fps } = useVideoConfig();
  const inS = spring({ frame: local, fps, config: { damping: 17, stiffness: 165, mass: 0.9 } });
  const out = ip(local, [CARD_LEN - 8, CARD_LEN], [0, 1], Easing.in(Easing.cubic));
  return (
    <div
      style={{
        position: "absolute",
        left: 140,
        top: 300,
        width: 866,
        height: 640,
        background: C.panelSolid,
        border: `1px solid ${C.lineStrong}`,
        boxShadow: "0 30px 80px rgba(4,3,9,0.75)",
        transform: `translateX(${interpolate(inS, [0, 1], [1060, 0]) + out * -1120}px) rotate(${interpolate(
          inS,
          [0, 1],
          [2.5, 0]
        )}deg)`,
        opacity: ip(inS, [0, 0.25], [0, 1]) * (1 - out),
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 30px",
          borderBottom: `1px solid ${C.line}`,
          background: "rgba(139,92,246,0.08)",
        }}
      >
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "0.26em",
            color: C.acid,
          }}
        >
          STAT {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 17,
            letterSpacing: "0.24em",
            color: C.dim,
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ padding: "34px 34px 0 34px" }}>{children}</div>
      <CornerTicks inset={14} size={22} />
    </div>
  );
};

const CardRank: React.FC<{ chog: ChogNFT; local: number }> = ({ chog, local }) => {
  const p = ip(local, [6, 34], [0, 1], Easing.out(Easing.exp));
  const value = Math.round(interpolate(p, [0, 1], [CHOG_SUPPLY, chog.rarityRank]));
  return (
    <>
      <Label>RARITY RANK</Label>
      <div style={{ display: "flex", alignItems: "baseline", marginTop: 26 }}>
        <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 76, color: C.violet }}>#</span>
        <span
          style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 184,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: C.ink,
            textShadow: `rgba(139,92,246,${0.9 * (1 - p)}) -${(1 - p) * 8}px 0, rgba(182,255,60,${
              0.7 * (1 - p)
            }) ${(1 - p) * 8}px 0`,
          }}
        >
          {fmtInt(value)}
        </span>
        <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 56, color: C.dim, marginLeft: 18 }}>
          /{CHOG_SUPPLY}
        </span>
      </div>
      <div
        style={{
          marginTop: 30,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: F.mono,
          fontSize: 15,
          letterSpacing: "0.24em",
          color: C.faint,
        }}
      >
        <span>PERCENTILE FILL</span>
        <span>{(chog.rarityPercentile * 100).toFixed(1)}%</span>
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 4, height: 24 }}>
        {new Array(40).fill(0).map((_, i) => {
          const on = i < Math.round(p * chog.rarityPercentile * 40);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: on ? (i === Math.round(p * chog.rarityPercentile * 40) - 1 ? C.violet : C.acid) : "rgba(242,240,255,0.09)",
              }}
            />
          );
        })}
      </div>
      <div style={{ marginTop: 26, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 52, color: C.acid }}>
          {topPct(chog.rarityPercentile)}
        </span>
        <span style={{ fontFamily: F.mono, fontSize: 19, letterSpacing: "0.18em", color: C.dim }}>
          OF {fmtInt(CHOG_SUPPLY)} MINTS
        </span>
      </div>
    </>
  );
};

const CardTraits: React.FC<{ chog: ChogNFT; local: number }> = ({ chog, local }) => (
  <>
    <Label>TRAITS ON-CHAIN</Label>
    <div style={{ display: "flex", alignItems: "baseline", marginTop: 20 }}>
      <span
        style={{
          fontFamily: F.display,
          fontWeight: 700,
          fontSize: 116,
          lineHeight: 1,
          color: C.ink,
        }}
      >
        {String(chog.traits.length).padStart(2, "0")}
      </span>
      <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 54, color: C.dim, marginLeft: 16 }}>
        /{chog.traits.length} LOCKED
      </span>
    </div>
    <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px 28px" }}>
      {chog.traits.map((t, i) => {
        const s = ip(local, [10 + i * 3, 20 + i * 3], [0, 1], Easing.out(Easing.back(1.4)));
        return (
          <div
            key={t.trait_type}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              borderBottom: `1px solid ${C.line}`,
              paddingBottom: 6,
              opacity: ip(s, [0, 0.4], [0, 1]),
              transform: `translateX(${(1 - s) * 40}px)`,
            }}
          >
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 17,
                letterSpacing: "0.16em",
                color: C.acid,
              }}
            >
              {t.trait_type.toUpperCase()}
            </span>
            <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 24, color: C.ink }}>
              {String(t.value)}
            </span>
          </div>
        );
      })}
    </div>
  </>
);

const CardPrice: React.FC<{ market: MarketData; local: number }> = ({ market, local }) => {
  const { fps } = useVideoConfig();
  const base = ip(local, [4, 24], [0, market.chogPriceUsd], Easing.out(Easing.exp));
  const up = market.chogChange24h >= 0;
  const tone = up ? C.green : C.red;
  const chip = spring({ frame: local - 18, fps, config: { damping: 12, stiffness: 250 } });
  return (
    <>
      <Label>$CHOG // LIVE</Label>
      <div
        style={{
          marginTop: 26,
          fontFamily: F.display,
          fontWeight: 700,
          fontSize: 122,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: C.ink,
        }}
      >
        {fmtUsd(base)}
      </div>
      <div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 22 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            border: `2px solid ${tone}`,
            background: up ? "rgba(34,211,154,0.10)" : "rgba(255,92,92,0.10)",
            padding: "12px 24px",
            transform: `scale(${interpolate(chip, [0, 1], [0.7, 1])})`,
            opacity: ip(chip, [0, 0.4], [0, 1]),
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "13px solid transparent",
              borderRight: "13px solid transparent",
              transform: up ? "none" : "rotate(180deg)",
              borderBottom: `22px solid ${tone}`,
            }}
          />
          <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 50, color: tone }}>
            {fmtPct(market.chogChange24h)}
          </span>
        </div>
        <span style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: "0.22em", color: C.dim }}>
          24H CHANGE
        </span>
      </div>
      <Rule style={{ marginTop: 34 }} />
      <div
        style={{
          marginTop: 20,
          fontFamily: F.mono,
          fontSize: 19,
          letterSpacing: "0.14em",
          color: C.dim,
          wordBreak: "break-all",
        }}
      >
        0x350035555E10d9AfAF1566AaebfCeD5BA6C27777
      </div>
    </>
  );
};

const CardFloor: React.FC<{ market: MarketData; local: number }> = ({ market, local }) => {
  const p = ip(local, [4, 26], [0, 1], Easing.out(Easing.exp));
  return (
    <>
      <Label>COLLECTION FLOOR</Label>
      <div
        style={{
          marginTop: 26,
          fontFamily: F.display,
          fontWeight: 700,
          fontSize: 150,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: C.ink,
        }}
      >
        {fmtMon(market.floorMon)}
        <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 66, color: C.acid, marginLeft: 18 }}>
          MON
        </span>
      </div>
      <div
        style={{
          marginTop: 26,
          fontFamily: F.mono,
          fontWeight: 700,
          fontSize: 64,
          color: C.dim,
          opacity: ip(p, [0.3, 1], [0, 1]),
        }}
      >
        ≈ {fmtUsd(market.floorUsd)}
      </div>
      <Rule style={{ marginTop: 34 }} />
      <div
        style={{
          marginTop: 20,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: F.mono,
          fontSize: 19,
          letterSpacing: "0.16em",
          color: C.faint,
        }}
      >
        <span>1,969 SUPPLY</span>
        <span>1% OF SUPPLY LISTED</span>
      </div>
    </>
  );
};

const CardHolders: React.FC<{ market: MarketData; chog: ChogNFT; local: number }> = ({
  market,
  chog,
  local,
}) => {
  const p = ip(local, [4, 30], [0, 1], Easing.out(Easing.exp));
  return (
    <>
      <Label>OWNERS OF CHOG GENESIS</Label>
      <div
        style={{
          marginTop: 26,
          fontFamily: F.display,
          fontWeight: 700,
          fontSize: 158,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: C.ink,
        }}
      >
        {fmtInt(p * market.holders)}
      </div>
      <div
        style={{
          marginTop: 18,
          fontFamily: F.display,
          fontWeight: 600,
          fontSize: 44,
          color: C.acid,
        }}
      >
        wallets holding the collection
      </div>
      <Rule style={{ marginTop: 32 }} />
      <div
        style={{
          marginTop: 22,
          display: "flex",
          gap: 26,
          alignItems: "center",
          opacity: ip(local, [20, 30], [0, 1]),
        }}
      >
        <div style={{ border: `1px solid ${C.lineStrong}`, padding: 8, background: C.black }}>
          <div style={{ width: 74, height: 74, position: "relative", overflow: "hidden" }}>
            <GlitchImage
              src={chogSrc(chog.image)}
              alt={chog.name}
              style={{ position: "absolute", inset: 0 }}
            />
          </div>
        </div>
        <span style={{ fontFamily: F.mono, fontSize: 20, letterSpacing: "0.16em", color: C.dim }}>
          YOU HOLD #{chog.rarityRank} — {topPct(chog.rarityPercentile)}
        </span>
      </div>
    </>
  );
};

const CardDate: React.FC<{ generatedAt: string; local: number }> = ({ generatedAt, local }) => {
  const d = new Date(generatedAt);
  const monthShort = Number.isNaN(d.getTime())
    ? "OCT"
    : ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][
        d.getUTCMonth()
      ];
  return (
    <>
      <Label>RECAP GENERATED</Label>
      <div
        style={{
          marginTop: 26,
          fontFamily: F.display,
          fontWeight: 700,
          fontSize: 164,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: C.ink,
        }}
      >
        {monthShort} {String(d.getUTCDate()).padStart(2, "0")}
      </div>
      <div
        style={{
          marginTop: 24,
          fontFamily: F.mono,
          fontWeight: 700,
          fontSize: 40,
          color: C.acid,
          opacity: ip(local, [10, 22], [0, 1]),
        }}
      >
        {stamp(generatedAt)}
      </div>
      <Rule style={{ marginTop: 34 }} />
      <div
        style={{
          marginTop: 20,
          fontFamily: F.mono,
          fontSize: 19,
          letterSpacing: "0.16em",
          color: C.faint,
        }}
      >
        SNAPSHOT {dateOnly(generatedAt)} · CHOGRAM STUDIO
      </div>
    </>
  );
};

const CardRail: React.FC = () => {
  const frame = useCurrentFrame();
  const active = CARD_STARTS.reduce((acc, s, i) => (frame >= s - 6 ? i : acc), 0);
  return (
    <div style={{ position: "absolute", left: 46, top: 330 }}>
      {CARD_STARTS.map((s, i) => {
        const on = i === active;
        const past = frame >= CARD_STARTS[Math.min(i + 1, 5)] - 6;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 54 }}>
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 16,
                fontWeight: on ? 700 : 400,
                letterSpacing: "0.1em",
                color: on ? C.acid : past ? C.faint : "rgba(242,240,255,0.18)",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              style={{
                width: on ? 54 : 26,
                height: on ? 4 : 2,
                background: on ? C.acid : "rgba(242,240,255,0.25)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ outro */

const Outro: React.FC<BroadcastData> = ({ chog, market, generatedAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 6, fps, config: { damping: 14, stiffness: 180 } });
  return (
    <Drift dur={60} from={1} to={1.035}>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 300,
          width: 866,
          height: 740,
          background: C.panelSolid,
          border: `2px solid ${C.acid}`,
          boxShadow: "0 0 80px rgba(182,255,60,0.18), 0 40px 90px rgba(4,3,9,0.8)",
          transform: `scale(${interpolate(pop, [0, 1], [0.86, 1])})`,
          opacity: ip(pop, [0, 0.3], [0, 1]),
        }}
      >
        <div style={{ padding: "40px 44px 0 44px" }}>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "0.3em",
              color: C.acid,
            }}
          >
            SHARE CARD · 1080×1350
          </div>
          <div style={{ marginTop: 18 }}>
            <Slam text="MY CHOG WRAPPED" size={76} start={10} stagger={1.4} />
          </div>
          <div
            style={{
              marginTop: 20,
              height: 4,
              width: ip(frame, [22, 40], [0, 778], Easing.out(Easing.cubic)),
              background: `linear-gradient(to right, ${C.acid} 0%, ${C.violet} 100%)`,
            }}
          />
          <div style={{ marginTop: 40, display: "flex", gap: 34 }}>
            <div
              style={{
                width: 250,
                height: 250,
                border: `1px solid ${C.lineStrong}`,
                overflow: "hidden",
                flexShrink: 0,
                position: "relative",
              }}
            >
              <GlitchImage src={chogSrc(chog.image)} alt={chog.name} />
              <CornerTicks inset={10} size={18} />
            </div>
            <div style={{ paddingTop: 8 }}>
              <div
                style={{
                  fontFamily: F.display,
                  fontWeight: 700,
                  fontSize: 54,
                  letterSpacing: "-0.01em",
                  color: C.ink,
                  textTransform: "uppercase",
                }}
              >
                CHOG #{chog.tokenId}
              </div>
              <div
                style={{
                  marginTop: 20,
                  fontFamily: F.mono,
                  fontSize: 25,
                  letterSpacing: "0.08em",
                  color: C.acid,
                }}
              >
                RANK #{chog.rarityRank}/{CHOG_SUPPLY} · {topPct(chog.rarityPercentile)}
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontFamily: F.mono,
                  fontSize: 25,
                  letterSpacing: "0.08em",
                  color: C.ink,
                }}
              >
                $CHOG {fmtUsd(market.chogPriceUsd)}{" "}
                <span style={{ color: market.chogChange24h >= 0 ? C.green : C.red }}>
                  {fmtPct(market.chogChange24h)}
                </span>
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontFamily: F.mono,
                  fontSize: 25,
                  letterSpacing: "0.08em",
                  color: C.dim,
                }}
              >
                OWNERS {fmtInt(market.holders)} · FLOOR {fmtMon(market.floorMon)} MON
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 44,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              borderTop: `1px solid ${C.line}`,
              paddingTop: 24,
            }}
          >
            <span
              style={{
                fontFamily: F.display,
                fontWeight: 700,
                fontSize: 44,
                letterSpacing: "0.04em",
                color: C.ink,
              }}
            >
              CHOGRAM
            </span>
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 18,
                letterSpacing: "0.18em",
                color: C.dim,
              }}
            >
              {stamp(generatedAt)}
            </span>
          </div>
        </div>
        <CornerTicks inset={18} size={26} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 1074,
          fontFamily: F.mono,
          fontSize: 21,
          letterSpacing: "0.26em",
          color: C.faint,
          opacity: ip(frame, [34, 46], [0, 1]),
        }}
      >
        YOUR NFT IS THE ACTOR
      </div>
    </Drift>
  );
};

/* ------------------------------------------------------------------- film */

export const ChogWrapped: React.FC<BroadcastData> = (data) => {
  const { chog, market, generatedAt, custom } = data;
  const cards: [string, React.FC<{ local: number }>][] = [
    ["RARITY", ({ local }) => <CardRank chog={chog} local={local} />],
    ["TRAITS", ({ local }) => <CardTraits chog={chog} local={local} />],
    ["MARKET", ({ local }) => <CardPrice market={market} local={local} />],
    ["FLOOR", ({ local }) => <CardFloor market={market} local={local} />],
    ["OWNERS", ({ local }) => <CardHolders market={market} chog={chog} local={local} />],
    ["DATE", ({ local }) => <CardDate generatedAt={generatedAt} local={local} />],
  ];
  const frame = useCurrentFrame();
  return (
    <Film grain={0.14} scan={0.5} vignette={0.84}>
      {/* background hairline grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(to right, rgba(242,240,255,0.05) 0 1px, transparent 1px 108px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -240,
          top: -240,
          width: 900,
          height: 900,
          background:
            "radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0) 70%)",
        }}
      />

      {/* top rail */}
      <div style={{ position: "absolute", left: 46, right: 46, top: 84, height: 1, background: C.line }} />
      <div
        style={{
          position: "absolute",
          left: 46,
          right: 46,
          top: 30,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: "0.26em", color: C.dim }}>
          <span style={{ color: C.acid }}>■ CHOGRAM</span>  //  CHOG WRAPPED
        </span>
        <Timecode />
      </div>

      <Sequence from={0} durationInFrames={OUTRO}>
        <Intro chog={chog} custom={custom} />
      </Sequence>

      <CardRail />

      {cards.map(([title, Comp], i) => {
        const start = CARD_STARTS[i];
        return (
          <Sequence key={title} from={start} durationInFrames={CARD_LEN}>
            <LocalCard index={i} title={title}>
              <Comp local={frame - start} />
            </LocalCard>
          </Sequence>
        );
      })}

      <Sequence from={OUTRO} durationInFrames={360 - OUTRO}>
        <Outro {...data} />
      </Sequence>

      {/* bottom ticker */}
      <div style={{ position: "absolute", left: 46, right: 46, bottom: 84, height: 1, background: C.line }} />
      <div
        style={{
          position: "absolute",
          left: 46,
          right: 46,
          bottom: 32,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: F.mono,
          fontSize: 17,
          letterSpacing: "0.16em",
          color: C.faint,
          maskImage:
            "linear-gradient(to right, transparent 0, black 40px, black calc(100% - 40px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 40px, black calc(100% - 40px), transparent 100%)",
        }}
      >
        <span>CHOG WRAPPED · {dateOnly(generatedAt)}</span>
        <span>
          RANK #{chog.rarityRank}/{CHOG_SUPPLY} · $CHOG {fmtUsd(market.chogPriceUsd)} · OWNERS{" "}
          {fmtInt(market.holders)}
        </span>
      </div>

      <CornerTicks inset={20} size={26} />
      <CutFx cuts={[0, OUTRO]} />
    </Film>
  );
};

/** Wrapper that maps Sequence-local frame into the card body. */
const LocalCard: React.FC<{ index: number; title: string; children: React.ReactNode }> = ({
  index,
  title,
  children,
}) => {
  const local = useCurrentFrame();
  return (
    <CardShell index={index} total={6} title={title} local={local}>
      {children}
    </CardShell>
  );
};
