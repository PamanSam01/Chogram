// PRICE ALERT — 1080x1080, 180 frames. Market broadcast card: headline redacted-reveal,
// live price count-up, 24h direction chip, reacting Chog plate, token + timestamp rail.
import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { BroadcastData, ChogNFT, MarketData } from "../../lib/types";
import {
  BarReveal,
  CornerTicks,
  CutFx,
  DigitRoll,
  Film,
  GlitchImage,
  Label,
  Rule,
  Timecode,
  ip,
} from "../lib/fx";
import {
  C,
  F,
  CHOG_SUPPLY,
  chogSrc,
  fmtInt,
  fmtMon,
  fmtPct,
  fmtUsd,
  sigOf,
  stamp,
} from "../lib/theme";

const CUTS = [0, 62, 124];

const HazardStrip: React.FC<{ y: number }> = ({ y }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        height: 16,
        backgroundImage: `repeating-linear-gradient(115deg, ${C.acid} 0 26px, ${C.bg} 26px 52px)`,
        backgroundPositionX: `${frame * 1.6}px`,
        opacity: 0.9,
      }}
    />
  );
};

/** The Chog "reacts": jitter on a dip, vertical pump on a pump, shock rays behind. */
const ReactingChog: React.FC<{ chog: ChogNFT; market: MarketData }> = ({ chog, market }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const up = market.chogChange24h >= 0;
  const pop = spring({ frame: frame - 8, fps, config: { damping: 11, stiffness: 220 } });
  const jitter = up
    ? Math.sin(frame / 2.4) * 3
    : (Math.sin(frame * 2.7) + Math.sin(frame * 4.1)) * 4.5;
  const bob = up ? -Math.abs(Math.sin(frame / 4.4)) * 14 : 0;
  const rays = new Array(14).fill(0);
  return (
    <div style={{ position: "relative", width: 330, height: 330 }}>
      {rays.map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 165,
            top: 165,
            width: 3,
            height: 250,
            background: i % 2 === 0 ? C.acid : C.violet,
            opacity: ip(pop, [0.4, 1], [0, 0.5]),
            transformOrigin: "50% 0%",
            transform: `rotate(${i * (360 / 14)}deg) translateY(${interpolate(
              pop,
              [0, 1],
              [-70, 96]
            )}px)`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${interpolate(pop, [0, 1], [0.5, 1])}) translateX(${jitter}px) translateY(${bob}px)`,
          opacity: ip(pop, [0, 0.3], [0, 1]),
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: `2px solid ${up ? C.green : C.red}`,
            background: C.panelSolid,
            boxShadow: up
              ? "0 0 44px rgba(34,211,154,0.28)"
              : "0 0 44px rgba(255,92,92,0.28)",
            overflow: "hidden",
          }}
        >
          <GlitchImage
            src={chogSrc(chog.image)}
            alt={chog.name}
            glitch={Math.abs(Math.sin(frame / 7)) > 0.94 ? 0.5 : 0}
            split={up ? 0 : Math.abs(Math.sin(frame / 5)) > 0.9 ? 5 : 0}
            frame={frame}
            slices={4}
          />
          <CornerTicks inset={12} size={22} color={up ? C.green : C.red} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 14,
          textAlign: "center",
          fontFamily: F.mono,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "0.2em",
          color: up ? C.green : C.red,
          background: "rgba(4,3,9,0.78)",
          borderTop: `1px solid ${up ? C.green : C.red}`,
          padding: "8px 0",
          opacity: ip(frame, [26, 34], [0, 1]),
        }}
      >
        {up ? "PUMP DETECTED" : "DIP WATCH"}
      </div>
    </div>
  );
};

export const PriceAlert: React.FC<BroadcastData> = ({ chog, market, generatedAt, custom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const alertText = (custom?.alertText ?? "$CHOG MOVE DETECTED — WATCH THE TAPE").toUpperCase();
  const headSize = alertText.length > 46 ? 52 : alertText.length > 28 ? 62 : 74;
  const up = market.chogChange24h >= 0;
  const tone = up ? C.green : C.red;
  const price = ip(frame, [22, 44], [0, market.chogPriceUsd], Easing.out(Easing.exp));
  const chip = spring({ frame: frame - 30, fps, config: { damping: 12, stiffness: 250 } });
  const stats: [string, string][] = [
    ["FLOOR", fmtMon(market.floorMon)],
    ["OWNERS", fmtInt(market.holders)],
    ["SUPPLY", fmtInt(CHOG_SUPPLY)],
  ];
  return (
    <Film grain={0.14} scan={0.55} vignette={0.82}>
      {/* top rail */}
      <div style={{ position: "absolute", left: 64, right: 64, top: 84, height: 1, background: C.line }} />
      <div
        style={{
          position: "absolute",
          left: 64,
          top: 30,
          display: "flex",
          alignItems: "center",
          gap: 22,
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: "0.24em", color: C.dim }}>
          <span style={{ color: C.acid }}>■</span> MARKET ALERT — $CHOG
        </span>
      </div>
      <div style={{ position: "absolute", right: 64, top: 30 }}>
        <Timecode />
      </div>
      <HazardStrip y={104} />

      {/* headline */}
      <div style={{ position: "absolute", left: 64, top: 160, width: 952 }}>
        <BarReveal progress={ip(frame, [6, 22], [0, 1])}>
          <div
            style={{
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: headSize,
              lineHeight: 1.03,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: C.ink,
            }}
          >
            {alertText}
          </div>
        </BarReveal>
        <div
          style={{
            marginTop: 22,
            width: ip(frame, [24, 40], [0, 340], Easing.out(Easing.cubic)),
            height: 4,
            background: C.acid,
          }}
        />
      </div>

      {/* price block */}
      <div style={{ position: "absolute", left: 64, top: 452, width: 620 }}>
        <Label>LIVE PRICE // USD</Label>
        <div
          style={{
            marginTop: 18,
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 112,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: C.ink,
            opacity: ip(frame, [20, 26], [0, 1]),
          }}
        >
          <DigitRoll text={fmtUsd(price)} start={22} stagger={1.3} />
        </div>
        <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 20 }}>
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
            <span
              style={{
                fontFamily: F.display,
                fontWeight: 700,
                fontSize: 54,
                color: tone,
                letterSpacing: "-0.02em",
              }}
            >
              {fmtPct(market.chogChange24h)}
            </span>
          </div>
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 18,
              letterSpacing: "0.24em",
              color: C.dim,
              opacity: ip(frame, [38, 46], [0, 1]),
            }}
          >
            24H CHANGE
          </span>
        </div>
      </div>

      {/* reacting chog */}
      <div style={{ position: "absolute", right: 64, top: 442 }}>
        <ReactingChog chog={chog} market={market} />
      </div>

      {/* stats row */}
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          top: 806,
          display: "flex",
          gap: 44,
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 1 }}>
          <Rule />
        </div>
        {stats.map(([k, v], i) => {
          const p = ip(frame, [64 + i * 6, 76 + i * 6], [0, 1], Easing.out(Easing.back(1.5)));
          return (
            <div
              key={k}
              style={{
                opacity: ip(p, [0, 0.4], [0, 1]),
                transform: `translateY(${(1 - p) * 24}px)`,
                textAlign: "right",
              }}
            >
              <div style={{ fontFamily: F.mono, fontSize: 16, letterSpacing: "0.2em", color: C.faint }}>
                {k}
              </div>
              <div
                style={{
                  fontFamily: F.display,
                  fontWeight: 600,
                  fontSize: 38,
                  color: C.ink,
                  marginTop: 6,
                }}
              >
                {v}
              </div>
            </div>
          );
        })}
      </div>

      {/* redacted telemetry line */}
      <div style={{ position: "absolute", left: 64, top: 916, width: 952 }}>
        <BarReveal progress={ip(frame, [126, 142], [0, 1])}>
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 20,
              letterSpacing: "0.16em",
              color: C.dim,
            }}
          >
            1,969 SUPPLY · CHAIN 143 · FEED SNAPSHOT · BROADCAST SIG {sigOf(chog, generatedAt)}
          </span>
        </BarReveal>
      </div>

      {/* bottom rail */}
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 84, height: 1, background: C.line }} />
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          bottom: 30,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 22, fontWeight: 700, letterSpacing: "0.2em", color: C.acid }}>
          $CHOG
        </span>
        <span style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: "0.1em", color: C.dim }}>
          0x350035555E10d9AfAF1566AaebfCeD5BA6C27777
        </span>
        <span style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: "0.14em", color: C.faint }}>
          {stamp(generatedAt)}
        </span>
      </div>
      <CornerTicks inset={20} size={26} />
      <CutFx cuts={CUTS} />
    </Film>
  );
};
