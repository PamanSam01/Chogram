// SUMMON — cinematic origin film, 1920x1080 @ 30fps, 540 frames.
// Edited on a broadcast/telemetry grid: hard cuts every 30-60 frames, VHS tracking
// bands on cuts, redacted bar reveals, oversized editorial slams, live market feed.
import React from "react";
import { Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { BroadcastData, ChogNFT, MarketData } from "../../lib/types";
import {
  BarReveal,
  CornerTicks,
  CutFx,
  DigitRoll,
  Drift,
  Film,
  GlitchImage,
  Label,
  PixelMark,
  Rule,
  Slam,
  Timecode,
  Typed,
  chroma,
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
  shortAddr,
  sigOf,
  stamp,
  topPct,
} from "../lib/theme";

const CUTS = [36, 96, 200, 305, 365, 430, 490];
const LEFT = 140;

/* ------------------------------------------------------------ persistent plate */

type Plate = {
  x: number;
  y: number;
  w: number;
  h: number;
  op: number;
  glitch: number;
  split: number;
  scale: number;
};

const plateAt = (f: number): Plate | null => {
  if (f < 36 || f >= 430) return null;
  const burst = (c: number) => ip(f, [c, c + 5], [0.7, 0]);
  if (f < 96)
    return {
      x: 1036, y: 132, w: 744, h: 736, op: 1,
      glitch: ip(f, [36, 66], [1, 0]) + burst(36),
      split: ip(f, [36, 74], [30, 0]),
      scale: ip(f, [36, 96], [1.08, 1.01]),
    };
  if (f < 200)
    return {
      x: 1036, y: 132, w: 744, h: 736, op: 1,
      glitch: 0, split: 0,
      scale: ip(f, [96, 200], [1.01, 1.05]),
    };
  if (f < 305)
    return {
      x: 1220, y: 176, w: 560, h: 692, op: 1,
      glitch: burst(200), split: ip(f, [200, 208], [16, 0]),
      scale: ip(f, [200, 305], [1, 1.03]),
    };
  if (f < 365)
    return {
      x: 1220, y: 176, w: 560, h: 692, op: ip(f, [305, 322], [1, 0.34]),
      glitch: burst(305), split: ip(f, [305, 313], [14, 0]),
      scale: ip(f, [305, 365], [1.03, 1.05]),
    };
  return {
    x: 1320, y: 300, w: 460, h: 568, op: 1,
    glitch: burst(365), split: ip(f, [365, 373], [14, 0]),
    scale: ip(f, [365, 430], [1, 1.04]),
  };
};

const ChogPlate: React.FC<{ chog: ChogNFT }> = ({ chog }) => {
  const frame = useCurrentFrame();
  const p = plateAt(frame);
  if (!p) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: p.x,
        top: p.y,
        width: p.w,
        height: p.h,
        opacity: p.op,
      }}
    >
      <div
        style={{
          position: "relative",
          width: p.w,
          height: p.h,
          border: `1px solid ${C.lineStrong}`,
          boxShadow: "0 0 60px rgba(139,92,246,0.22), inset 0 0 40px rgba(4,3,9,0.5)",
          transform: `scale(${p.scale})`,
          overflow: "hidden",
        }}
      >
        <GlitchImage
          src={chogSrc(chog.image)}
          alt={chog.name}
          glitch={p.glitch}
          split={p.split}
          frame={frame}
          slices={8}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingTop: 60,
            background:
              "linear-gradient(to bottom, rgba(4,3,9,0) 0%, rgba(4,3,9,0.82) 60%)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            padding: "0 22px 18px 22px",
            fontFamily: F.mono,
            fontSize: 19,
            letterSpacing: "0.14em",
          }}
        >
          <span style={{ color: C.ink }}>TOKEN #{chog.tokenId}</span>
          <span style={{ color: C.acid }}>
            RANK #{chog.rarityRank}/{CHOG_SUPPLY}
          </span>
        </div>
        <CornerTicks inset={16} size={26} />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chrome */

const Chrome: React.FC<{ generatedAt: string; chog: ChogNFT; market: MarketData }> = ({
  generatedAt,
  chog,
  market,
}) => (
  <>
    <div
      style={{
        position: "absolute",
        left: 140,
        right: 140,
        top: 92,
        height: 1,
        background: C.line,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 140,
        top: 34,
        display: "flex",
        alignItems: "center",
        gap: 28,
      }}
    >
      <span
        style={{
          fontFamily: F.mono,
          fontSize: 20,
          letterSpacing: "0.26em",
          color: C.dim,
        }}
      >
        CHOG WORLD ORDER — CHOG #{chog.tokenId}
      </span>
      <span
        style={{
          fontFamily: F.mono,
          fontSize: 20,
          letterSpacing: "0.16em",
          color: C.faint,
        }}
      >
        HOLDER {shortAddr(chog.holder, 6, 4)}
      </span>
    </div>
    <div style={{ position: "absolute", right: 140, top: 34 }}>
      <Timecode />
    </div>
    <div
      style={{
        position: "absolute",
        left: 140,
        right: 140,
        bottom: 92,
        height: 1,
        background: C.line,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 140,
        right: 140,
        bottom: 36,
        display: "flex",
        alignItems: "center",
        gap: 30,
      }}
    >
      <span
        style={{
          fontFamily: F.mono,
          fontSize: 19,
          fontWeight: 700,
          letterSpacing: "0.3em",
          color: C.acid,
        }}
      >
        ■ CHOGRAM
      </span>
      <span
        style={{
          flex: 1,
          marginRight: 40,
          overflow: "hidden",
          whiteSpace: "nowrap",
          position: "relative",
          height: 26,
          maskImage:
            "linear-gradient(to right, transparent 0, black 48px, black calc(100% - 48px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 48px, black calc(100% - 48px), transparent 100%)",
        }}
      >
        <TickerLine
          text={[
            `TOKEN #${chog.tokenId}`,
            `RANK ${chog.rarityRank}/${CHOG_SUPPLY}`,
            `$CHOG ${fmtUsd(market.chogPriceUsd)}`,
            `24H ${fmtPct(market.chogChange24h)}`,
            `FLOOR ${fmtMon(market.floorMon)} MON`,
            `OWNERS ${fmtInt(market.holders)}`,
            `SUPPLY ${fmtInt(CHOG_SUPPLY)}`,
            `BROADCAST SIG ${sigOf(chog, generatedAt)}`,
          ].join("   ///   ")}
        />
      </span>
      <span
        style={{
          fontFamily: F.mono,
          fontSize: 18,
          letterSpacing: "0.16em",
          color: C.faint,
        }}
      >
        {stamp(generatedAt)}
      </span>
    </div>
  </>
);

const TickerLine: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  return (
    <span
      style={{
        position: "absolute",
        display: "inline-block",
        transform: `translateX(-${(frame * 0.16) % 50}%)`,
        fontFamily: F.mono,
        fontSize: 18,
        letterSpacing: "0.18em",
        color: C.faint,
      }}
    >
      {text}
      {"   ///   "}
      {text}
    </span>
  );
};

/* ------------------------------------------------------------------ act 01 */

const ActBoot: React.FC<{ chog: ChogNFT }> = ({ chog }) => {
  const frame = useCurrentFrame();
  const flicker = frame > 28 ? (Math.floor(random01(frame) * 3) === 0 ? 0.25 : 1) : 1;
  const lineW = ip(frame, [6, 30], [0, 1640], Easing.out(Easing.cubic));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: flicker }}>
      <div style={{ position: "absolute", left: LEFT, top: 400, width: 1200 }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 26,
            letterSpacing: "0.2em",
            color: C.dim,
            opacity: frame >= 3 ? 1 : 0,
          }}
        >
          CHOGRAM RX // MONAD MAINNET — CHAIN 143
        </div>
        <div style={{ marginTop: 26, height: 40 }}>
          <Typed
            text={`TUNING CONTRACT 0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763`}
            start={7}
            cps={60}
            style={{
              fontFamily: F.mono,
              fontSize: 26,
              letterSpacing: "0.1em",
              color: C.ink,
            }}
          />
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 56,
            letterSpacing: "0.06em",
            color: C.acid,
            opacity: frame >= 17 ? 1 : 0,
            textShadow: chroma(ip(frame, [17, 26], [8, 0]), 0.7),
          }}
        >
          SIGNAL ACQUIRED
        </div>
        <div style={{ marginTop: 24, width: 1020 }}>
          <BarReveal progress={ip(frame, [23, 33], [0, 1])}>
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 26,
                letterSpacing: "0.14em",
                color: C.ink,
                background: "rgba(139,92,246,0.14)",
                padding: "10px 18px",
                borderLeft: `3px solid ${C.violet}`,
                display: "inline-block",
              }}
            >
              CARRIER LOCKED — DECODING TOKEN #{chog.tokenId}
            </span>
          </BarReveal>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: 640,
          width: lineW,
          height: 2,
          background: C.violet,
          borderRight: `6px solid ${C.acid}`,
        }}
      />
    </div>
  );
};

const random01 = (n: number): number => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/* ------------------------------------------------------------------ act 02 */

const ActReveal: React.FC<{ chog: ChogNFT }> = ({ chog }) => {
  const frame = useCurrentFrame();
  const bars = new Array(26).fill(0);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: LEFT, top: 196, width: 840 }}>
        <Label>ORIGIN // DECODED</Label>
        <Rule style={{ marginTop: 22 }} />
        <div
          style={{
            marginTop: 44,
            fontFamily: F.mono,
            fontSize: 28,
            letterSpacing: "0.3em",
            color: C.dim,
            opacity: ip(frame, [4, 12], [0, 1]),
          }}
        >
          {chog.collection.toUpperCase()}
        </div>
        <div style={{ marginTop: 8, height: 260 }}>
          <Slam text={`#${chog.tokenId}`} size={252} start={8} stagger={3.2} />
        </div>
        <div style={{ marginTop: 6 }}>
          <Typed
            text={`RARITY ${chog.rarityRank}/${CHOG_SUPPLY}  ·  AURA ${String(
              chog.traits.find((t) => t.trait_type === "Aura")?.value ?? "—"
            ).toUpperCase()}  ·  MONAD`}
            start={26}
            cps={46}
            style={{ fontFamily: F.mono, fontSize: 24, letterSpacing: "0.14em", color: C.acid }}
          />
        </div>
        <div style={{ marginTop: 40, display: "flex", alignItems: "flex-end", gap: 7, height: 64 }}>
          {bars.map((_, i) => {
            const h = 10 + random01(i * 7 + 1) * 40 + Math.abs(Math.sin((frame + i * 5) / 7)) * 22;
            return (
              <div
                key={i}
                style={{
                  width: 9,
                  height: h,
                  background: i % 5 === 2 ? C.acid : "rgba(139,92,246,0.75)",
                  opacity: ip(frame, [16 + i * 0.6, 22 + i * 0.6], [0, 1]),
                }}
              />
            );
          })}
        </div>
        <div style={{ marginTop: 34, width: 820 }}>
          <BarReveal progress={ip(frame, [34, 46], [0, 1])}>
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 22,
                letterSpacing: "0.18em",
                color: C.dim,
              }}
            >
              CARRIER INTEGRITY 100% — NO SIGNAL LOSS
            </span>
          </BarReveal>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ act 03 */

const ActTraits: React.FC<{ chog: ChogNFT }> = ({ chog }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const traits = chog.traits;
  const rowH = Math.min(96, Math.floor(664 / Math.max(traits.length, 1)));
  const dense = rowH < 70;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: LEFT, top: 160, width: 880 }}>
        <Label>TRAIT MATRIX — {String(traits.length).padStart(2, "0")} SIGNALS LOCKED</Label>
        <Rule style={{ marginTop: 20 }} />
      </div>
      <div style={{ position: "absolute", left: LEFT, top: 244, width: 880 }}>
        {traits.map((t, i) => {
          const enter = 6 + i * (dense ? 4.5 : 10);
          const s = spring({
            frame: frame - enter,
            fps,
            config: { damping: 15, stiffness: 200, mass: 0.7 },
          });
          const reveal = ip(frame, [enter + 6, enter + 18], [0, 1]);
          return (
            <div
              key={t.trait_type}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                height: rowH,
                borderBottom: `1px solid ${C.line}`,
                transform: `translateX(${interpolate(s, [0, 1], [-130, 0])}px) skewX(${interpolate(
                  s,
                  [0, 1],
                  [9, 0]
                )}deg)`,
                opacity: ip(s, [0, 0.35], [0, 1]),
                background:
                  i % 2 === 1 ? "rgba(139,92,246,0.05)" : "transparent",
              }}
            >
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 18,
                  color: C.faint,
                  width: 30,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: dense ? 16 : 19,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  color: C.acid,
                  width: dense ? 152 : 152,
                }}
              >
                {t.trait_type.toUpperCase()}
              </span>
              <BarReveal progress={reveal} style={{ width: 404 }}>
                <span
                  style={{
                    fontFamily: F.display,
                    fontWeight: 600,
                    fontSize: dense ? 30 : 42,
                    letterSpacing: "0.01em",
                    color: C.ink,
                  }}
                >
                  {String(t.value)}
                </span>
              </BarReveal>
              <div style={{ flex: 1, height: 1, background: C.line, minWidth: 24 }} />
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 16,
                  letterSpacing: "0.14em",
                  color: C.faint,
                }}
              >
                ON-CHAIN
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ act 04 */

const ActRarity: React.FC<{ chog: ChogNFT }> = ({ chog }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = ip(frame, [6, 54], [0, 1], Easing.out(Easing.exp));
  const value = Math.round(interpolate(progress, [0, 1], [CHOG_SUPPLY, chog.rarityRank]));
  const segs = 46;
  const filled = Math.round(progress * chog.rarityPercentile * segs);
  const pop = spring({ frame: frame - 54, fps, config: { damping: 11, stiffness: 240 } });
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: LEFT, top: 190, width: 1000 }}>
        <Label>RARITY INDEX // ON-CHAIN</Label>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 30 }}>
          <span
            style={{
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 110,
              color: C.violet,
              lineHeight: 1,
            }}
          >
            #
          </span>
          <span
            style={{
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 236,
              lineHeight: 0.98,
              letterSpacing: "-0.03em",
              color: C.ink,
              textShadow: chroma((1 - progress) * 10, 0.8),
            }}
          >
            {fmtInt(value)}
          </span>
          <span
            style={{
              fontFamily: F.display,
              fontWeight: 600,
              fontSize: 74,
              color: C.dim,
              marginLeft: 22,
            }}
          >
            /{CHOG_SUPPLY}
          </span>
        </div>
        <div
          style={{
            marginTop: 44,
            display: "flex",
            justifyContent: "space-between",
            width: 940,
            fontFamily: F.mono,
            fontSize: 16,
            letterSpacing: "0.24em",
            color: C.faint,
          }}
        >
          <span>PERCENTILE FILL — 1 = RAREST OF 1,969</span>
          <span>{(chog.rarityPercentile * 100).toFixed(1)}%</span>
        </div>
        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 5,
            width: 940,
            height: 30,
            alignItems: "stretch",
          }}
        >
          {new Array(segs).fill(0).map((_, i) => {
            const on = i < filled;
            const tip = i === filled - 1;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: tip
                    ? C.violet
                    : on
                    ? C.acid
                    : "rgba(242,240,255,0.09)",
                  boxShadow: on ? "0 0 12px rgba(182,255,60,0.35)" : undefined,
                  transform: on ? `scaleY(${1})` : `scaleY(0.55)`,
                }}
              />
            );
          })}
        </div>
        <div
          style={{
            marginTop: 34,
            display: "flex",
            alignItems: "baseline",
            gap: 30,
          }}
        >
          <span
            style={{
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 66,
              letterSpacing: "0.02em",
              color: C.acid,
              transform: `scale(${interpolate(pop, [0, 1], [0.7, 1])})`,
              transformOrigin: "left center",
              display: "inline-block",
              textShadow: chroma((1 - pop) * 8, 0.7),
            }}
          >
            {topPct(chog.rarityPercentile)}
          </span>
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 22,
              letterSpacing: "0.2em",
              color: C.dim,
            }}
          >
            OF {fmtInt(CHOG_SUPPLY)} MINTS
          </span>
        </div>
        <div style={{ marginTop: 44, display: "flex", gap: 22, width: 940 }}>
          {[
            ["PERCENTILE", `${(chog.rarityPercentile * 100).toFixed(1)} PCT`],
            ["TRAITS", `${chog.traits.length}/${chog.traits.length} LOCKED`],
            ["MINT INDEX", `#${fmtInt(chog.rarityRank)} OF ${fmtInt(CHOG_SUPPLY)}`],
          ].map(([k, v], i) => {
            const p = ip(frame, [58 + i * 5, 70 + i * 5], [0, 1], Easing.out(Easing.back(1.4)));
            return (
              <div
                key={k}
                style={{
                  flex: 1,
                  border: `1px solid ${C.line}`,
                  borderTop: `3px solid ${i === 0 ? C.acid : C.violet}`,
                  background: C.panel,
                  padding: "18px 22px",
                  opacity: ip(p, [0, 0.4], [0, 1]),
                  transform: `translateY(${(1 - p) * 22}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: 16,
                    letterSpacing: "0.2em",
                    color: C.faint,
                  }}
                >
                  {k}
                </div>
                <div
                  style={{
                    fontFamily: F.mono,
                    fontWeight: 700,
                    fontSize: 34,
                    color: C.ink,
                    marginTop: 8,
                  }}
                >
                  {v}
                </div>
              </div>
            );
          })}
        </div>
        <Rule style={{ marginTop: 34, width: 940 }} />
        <div
          style={{
            marginTop: 20,
            fontFamily: F.mono,
            fontSize: 20,
            letterSpacing: "0.18em",
            color: C.faint,
          }}
        >
          RANK DERIVED FROM ON-CHAIN TRAIT RARITY — CHOG GENESIS
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ act 05 */

const ActHolder: React.FC<{ chog: ChogNFT }> = ({ chog }) => {
  const frame = useCurrentFrame();
  const chips = [
    `TOKEN #${chog.tokenId}`,
    chog.collection.toUpperCase(),
    `SUPPLY ${fmtInt(CHOG_SUPPLY)}`,
  ];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: LEFT, top: 236, width: 1000 }}>
        <Label>HOLDER // VERIFIED ON-CHAIN</Label>
        <Rule style={{ marginTop: 20, width: 940 }} />
        <div
          style={{
            marginTop: 46,
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: 36,
            letterSpacing: "0.04em",
            color: C.ink,
          }}
        >
          <Typed text={chog.holder} start={6} cps={30} />
        </div>
        <div style={{ marginTop: 54, display: "flex", alignItems: "center", gap: 34 }}>
          <div
            style={{
              border: `1px solid ${C.lineStrong}`,
              padding: 12,
              background: C.panelSolid,
              opacity: ip(frame, [22, 32], [0, 1]),
              transform: `translateY(${ip(frame, [22, 32], [16, 0])}px)`,
            }}
          >
            <PixelMark seed={chog.holder} size={96} />
          </div>
          <div style={{ opacity: ip(frame, [26, 36], [0, 1]) }}>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 19,
                letterSpacing: "0.2em",
                color: C.faint,
              }}
            >
              WALLET MARK
            </div>
            <div
              style={{
                fontFamily: F.display,
                fontWeight: 600,
                fontSize: 52,
                color: C.ink,
                marginTop: 6,
              }}
            >
              {shortAddr(chog.holder, 8, 6)}
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 19,
                letterSpacing: "0.2em",
                color: C.acid,
                marginTop: 6,
              }}
            >
              EOA // MONAD 143
            </div>
          </div>
        </div>
        <div style={{ marginTop: 56, display: "flex", gap: 18 }}>
          {chips.map((c, i) => {
            const s = ip(frame, [34 + i * 6, 44 + i * 6], [0, 1], Easing.out(Easing.back(1.6)));
            return (
              <div
                key={c}
                style={{
                  fontFamily: F.mono,
                  fontSize: 21,
                  letterSpacing: "0.16em",
                  color: C.ink,
                  border: `1px solid ${C.lineStrong}`,
                  background: C.panel,
                  padding: "14px 24px",
                  opacity: ip(s, [0, 0.4], [0, 1]),
                  transform: `scale(${interpolate(s, [0, 1], [0.86, 1])})`,
                }}
              >
                <span style={{ color: C.acid, marginRight: 12 }}>■</span>
                {c}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 44, width: 940 }}>
          <BarReveal progress={ip(frame, [44, 56], [0, 1])}>
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 22,
                letterSpacing: "0.16em",
                color: C.green,
              }}
            >
              CARRIER AUTHENTIC — SIGNATURE VALID
            </span>
          </BarReveal>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ act 06 */

const ActPrice: React.FC<{ chog: ChogNFT; market: MarketData }> = ({ market }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const price = ip(frame, [4, 26], [0, market.chogPriceUsd], Easing.out(Easing.exp));
  const up = market.chogChange24h >= 0;
  const tone = up ? C.green : C.red;
  const chip = spring({ frame: frame - 26, fps, config: { damping: 12, stiffness: 260 } });
  const stats: [string, string][] = [
    ["FLOOR", `${fmtMon(market.floorMon)} MON`],
    ["FLOOR USD", fmtUsd(market.floorUsd)],
    ["OWNERS", fmtInt(market.holders)],
    ["SUPPLY", fmtInt(CHOG_SUPPLY)],
  ];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: LEFT, top: 172, width: 1120 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Label>$CHOG // LIVE MARKET FEED</Label>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontFamily: F.mono,
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "0.24em",
              color: C.bg,
              background: C.acid,
              padding: "6px 14px",
              opacity: ip(frame, [6, 12], [0, 1]),
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 99,
                background: C.bg,
                opacity: frame % 20 < 13 ? 1 : 0.3,
              }}
            />
            LIVE
          </span>
        </div>
        <Rule style={{ marginTop: 22, width: 1080 }} />
        <div
          style={{
            marginTop: 44,
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 164,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: C.ink,
            display: "flex",
            alignItems: "baseline",
          }}
        >
          <DigitRoll text={fmtUsd(price)} start={4} stagger={1.4} />
        </div>
        <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 18,
              border: `2px solid ${tone}`,
              background: up ? "rgba(34,211,154,0.10)" : "rgba(255,92,92,0.10)",
              padding: "16px 30px",
              transform: `scale(${interpolate(chip, [0, 1], [0.7, 1])})`,
              opacity: ip(chip, [0, 0.4], [0, 1]),
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "17px solid transparent",
                borderRight: "17px solid transparent",
                transform: up ? "rotate(180deg)" : "none",
                borderBottom: `28px solid ${tone}`,
              }}
            />
            <span
              style={{
                fontFamily: F.mono,
                fontWeight: 700,
                fontSize: 64,
                letterSpacing: "-0.02em",
                color: tone,
              }}
            >
              {fmtPct(market.chogChange24h)}
            </span>
          </div>
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 22,
              letterSpacing: "0.24em",
              color: C.dim,
              opacity: ip(frame, [34, 42], [0, 1]),
            }}
          >
            24H CHANGE
          </span>
        </div>
        <div style={{ marginTop: 52, display: "flex", gap: 66 }}>
          {stats.map(([k, v], i) => {
            const p = ip(frame, [36 + i * 5, 48 + i * 5], [0, 1], Easing.out(Easing.back(1.4)));
            return (
              <div
                key={k}
                style={{
                  opacity: ip(p, [0, 0.4], [0, 1]),
                  transform: `translateY(${(1 - p) * 26}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: 18,
                    letterSpacing: "0.22em",
                    color: C.faint,
                  }}
                >
                  {k}
                </div>
                <div
                  style={{
                    fontFamily: F.display,
                    fontWeight: 600,
                    fontSize: 44,
                    color: C.ink,
                    marginTop: 8,
                  }}
                >
                  {v}
                </div>
              </div>
            );
          })}
        </div>
        <Rule style={{ marginTop: 48, width: 1080 }} />
        <div
          style={{
            marginTop: 22,
            display: "flex",
            gap: 34,
            alignItems: "baseline",
            opacity: ip(frame, [50, 58], [0, 1]),
          }}
        >
          <span
            style={{
              fontFamily: F.mono,
              fontWeight: 700,
              fontSize: 26,
              letterSpacing: "0.2em",
              color: C.acid,
            }}
          >
            $CHOG
          </span>
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 22,
              letterSpacing: "0.12em",
              color: C.dim,
            }}
          >
            0x350035555E10d9AfAF1566AaebfCeD5BA6C27777
          </span>
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 19,
              letterSpacing: "0.18em",
              color: C.faint,
            }}
          >
            ERC-20 // CHAIN 143
          </span>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ act 07 */

const ActTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rule = spring({ frame: frame - 30, fps, config: { damping: 16, stiffness: 150 } });
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          left: 180,
          top: 120,
          width: 1500,
          height: 760,
          background:
            "radial-gradient(ellipse 50% 50% at 40% 45%, rgba(139,92,246,0.28) 0%, rgba(139,92,246,0) 70%)",
          opacity: ip(frame, [0, 18], [0, 1]),
        }}
      />
      <div style={{ position: "absolute", left: 100, top: 268 }}>
        <Slam text="CHOG WORLD" size={268} start={4} stagger={1.6} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 560,
          width: 1720,
          display: "flex",
          gap: 20,
          transform: `scaleX(${rule})`,
          transformOrigin: "left center",
        }}
      >
        <div style={{ flex: 3, height: 4, background: C.violet }} />
        <div style={{ flex: 1, height: 4, background: C.acid }} />
      </div>
      <div style={{ position: "absolute", right: 110, top: 606 }}>
        <Slam text="ORDER" size={296} start={14} stagger={2.2} />
      </div>
      <div style={{ position: "absolute", left: 104, top: 900, width: 1400 }}>
        <BarReveal progress={ip(frame, [36, 48], [0, 1])}>
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 27,
              letterSpacing: "0.34em",
              color: C.ink,
            }}
          >
            1969 SUPPLY · MONAD · CHOG GENESIS
          </span>
        </BarReveal>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ act 08 */

const ActEnd: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = 18 + Math.sin(frame / 5) * 8;
  const rule = ip(frame, [14, 30], [0, 620], Easing.out(Easing.cubic));
  return (
    <Drift dur={50} from={1} to={1.03}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            textShadow:
              frame >= 14
                ? `0 0 ${glow}px rgba(139,92,246,0.95), 0 0 ${glow * 4}px rgba(139,92,246,0.5), 0 0 150px rgba(139,92,246,0.3)`
                : chroma(ip(frame, [0, 16], [14, 0]), 0.9),
          }}
        >
          <Slam text="CHOGRAM" size={216} start={3} stagger={2.4} chromaOn={false} />
        </div>
        <div
          style={{
            marginTop: 34,
            width: rule,
            height: 3,
            background: C.acid,
          }}
        />
        <div style={{ marginTop: 34, width: 900 }}>
          <BarReveal progress={ip(frame, [24, 36], [0, 1])}>
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 26,
                letterSpacing: "0.4em",
                color: C.dim,
                textAlign: "center",
                display: "block",
              }}
            >
              YOUR NFT IS THE ACTOR
            </span>
          </BarReveal>
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: F.mono,
            fontSize: 19,
            letterSpacing: "0.3em",
            color: C.faint,
            opacity: ip(frame, [34, 44], [0, 1]),
          }}
        >
          CHOGATHON 2026 · MADE WITH CHOGRAM
        </div>
      </div>
    </Drift>
  );
};

/* -------------------------------------------------------------------- film */

export const Summon: React.FC<BroadcastData> = ({ chog, market, generatedAt }) => (
  <Film grain={0.15} scan={0.5} vignette={0.85}>
    <Sequence from={0} durationInFrames={36}>
      <ActBoot chog={chog} />
    </Sequence>
    <ChogPlate chog={chog} />
    <Sequence from={36} durationInFrames={60}>
      <ActReveal chog={chog} />
    </Sequence>
    <Sequence from={96} durationInFrames={104}>
      <ActTraits chog={chog} />
    </Sequence>
    <Sequence from={200} durationInFrames={105}>
      <ActRarity chog={chog} />
    </Sequence>
    <Sequence from={305} durationInFrames={60}>
      <ActHolder chog={chog} />
    </Sequence>
    <Sequence from={365} durationInFrames={65}>
      <ActPrice chog={chog} market={market} />
    </Sequence>
    <Sequence from={430} durationInFrames={60}>
      <ActTitle />
    </Sequence>
    <Sequence from={490} durationInFrames={50}>
      <ActEnd />
    </Sequence>
    <Chrome generatedAt={generatedAt} chog={chog} market={market} />
    <CutFx cuts={CUTS} />
  </Film>
);
