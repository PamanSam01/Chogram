// PFP FLEX — 1080x1350, 180 frames. Vertical editorial: framed Chog with slow push-in,
// mono marquee rail, trait chips popping in staggered, rarity ring, caption redacted-reveal.
import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { BroadcastData, ChogNFT } from "../../lib/types";
import {
  BarReveal,
  CornerTicks,
  CutFx,
  Drift,
  Film,
  GlitchImage,
  PercentRing,
  Timecode,
  ip,
} from "../lib/fx";
import {
  C,
  F,
  CHOG_SUPPLY,
  chogSrc,
  fmtInt,
  stamp,
  topPct,
} from "../lib/theme";

const MARQUEE = (chog: ChogNFT): string =>
  [
    chog.collection.toUpperCase(),
    `SUPPLY ${fmtInt(CHOG_SUPPLY)}`,
    `RANK #${chog.rarityRank}/${CHOG_SUPPLY}`,
    topPct(chog.rarityPercentile),
    `TOKEN #${chog.tokenId}`,
    "CHOG WORLD ORDER",
    `AURA ${String(chog.traits.find((t) => t.trait_type === "Aura")?.value ?? "—").toUpperCase()}`,
    "MONAD 143",
  ].join("   ·   ");

export const PfpFlex: React.FC<BroadcastData> = ({ chog, generatedAt, custom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const caption = (custom?.caption ?? "Certified Chog — traits verified on Monad").toUpperCase();
  const chips = chog.traits.slice(0, 6);
  const badge = spring({ frame: frame - 8, fps, config: { damping: 13, stiffness: 210 } });
  const nameSlam = spring({ frame: frame - 16, fps, config: { damping: 15, stiffness: 190 } });
  const ringP = ip(frame, [30, 74], [0, chog.rarityPercentile], Easing.inOut(Easing.cubic));
  const marquee = MARQUEE(chog);
  return (
    <Film grain={0.13} scan={0.5} vignette={0.8}>
      {/* top rail */}
      <div style={{ position: "absolute", left: 74, right: 74, top: 78, height: 1, background: C.line }} />
      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          top: 26,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: "0.26em", color: C.dim }}>
          <span style={{ color: C.acid }}>■ CHOGRAM</span>  //  PFP FLEX
        </span>
        <Timecode />
      </div>

      {/* marquee */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 96,
          height: 44,
          borderTop: `1px solid ${C.line}`,
          borderBottom: `1px solid ${C.line}`,
          background: "rgba(139,92,246,0.06)",
          overflow: "hidden",
          whiteSpace: "nowrap",
          maskImage:
            "linear-gradient(to right, transparent 0, black 60px, black calc(100% - 60px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 60px, black calc(100% - 60px), transparent 100%)",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 11,
            display: "inline-block",
            transform: `translateX(-${(frame * 0.3) % 50}%)`,
            fontFamily: F.mono,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: C.acid,
          }}
        >
          {marquee}
          {"   ·   "}
          {marquee}
        </span>
      </div>

      {/* framed chog */}
      <div
        style={{
          position: "absolute",
          left: 74,
          top: 186,
          width: 764,
          height: 660,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: "translate(16px, 16px)",
            border: `2px solid ${C.acid}`,
            opacity: 0.55,
          }}
        />
        <Drift dur={180} from={1} to={1.06}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: `1px solid ${C.lineStrong}`,
              overflow: "hidden",
              boxShadow: "0 0 70px rgba(139,92,246,0.24)",
              background: C.panelSolid,
            }}
          >
            <GlitchImage
              src={chogSrc(chog.image)}
              alt={chog.name}
              glitch={frame < 6 ? ip(frame, [0, 6], [0.8, 0]) : 0}
              split={ip(frame, [0, 10], [16, 0])}
              frame={frame}
              slices={5}
            />
            <div
              style={{
                position: "absolute",
                left: 16,
                top: 16,
                fontFamily: F.mono,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: C.bg,
                background: C.acid,
                padding: "7px 14px",
              }}
            >
              CHOG GENESIS
            </div>
            <div
              style={{
                position: "absolute",
                left: 18,
                bottom: 14,
                fontFamily: F.mono,
                fontSize: 16,
                letterSpacing: "0.18em",
                color: "rgba(242,240,255,0.75)",
                textShadow: "0 2px 8px rgba(0,0,0,0.8)",
              }}
            >
              TOKEN #{chog.tokenId} · RANK {chog.rarityRank}/{CHOG_SUPPLY}
            </div>
          </div>
        </Drift>

        {/* rarity ring overlapping the plate corner */}
        <div
          style={{
            position: "absolute",
            right: -86,
            bottom: -84,
            opacity: ip(frame, [28, 38], [0, 1]),
            transform: `scale(${interpolate(
              spring({ frame: frame - 28, fps, config: { damping: 12, stiffness: 200 } }),
              [0, 1],
              [0.7, 1]
            )})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: C.bg,
              border: `1px solid ${C.lineStrong}`,
            }}
          />
          <PercentRing progress={ringP} size={214} stroke={12}>
            <div
              style={{
                fontFamily: F.display,
                fontWeight: 700,
                fontSize: 62,
                color: C.ink,
                lineHeight: 1,
              }}
            >
              #{chog.rarityRank}
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "0.16em",
                color: C.acid,
                marginTop: 8,
              }}
            >
              {topPct(chog.rarityPercentile)}
            </div>
          </PercentRing>
        </div>
      </div>

      {/* vertical rail */}
      <div
        style={{
          position: "absolute",
          right: 44,
          top: 210,
          transform: "rotate(90deg)",
          transformOrigin: "right top",
          fontFamily: F.mono,
          fontSize: 17,
          letterSpacing: "0.34em",
          color: C.faint,
          whiteSpace: "nowrap",
        }}
      >
        {chog.collection.toUpperCase()} // TOKEN #{chog.tokenId} // MONAD 143
      </div>

      {/* badge + name */}
      <div
        style={{
          position: "absolute",
          left: 74,
          top: 866,
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          border: `1px solid ${C.acid}`,
          padding: "9px 18px",
          transform: `scale(${interpolate(badge, [0, 1], [0.8, 1])})`,
          transformOrigin: "left center",
          opacity: ip(badge, [0, 0.4], [0, 1]),
        }}
      >
        <span style={{ width: 10, height: 10, background: C.acid, display: "inline-block" }} />
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "0.24em",
            color: C.acid,
          }}
        >
          {chog.collection.toUpperCase()} — COLLECTION 01
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 70,
          top: 906,
          fontFamily: F.display,
          fontWeight: 700,
          fontSize: 88,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
          color: C.ink,
          lineHeight: 1,
          transform: `translateY(${(1 - nameSlam) * 40}px) skewY(${interpolate(
            nameSlam,
            [0, 1],
            [-3, 0]
          )}deg)`,
          opacity: ip(nameSlam, [0, 0.35], [0, 1]),
          textShadow: `rgba(139,92,246,${0.9 * (1 - nameSlam)}) -${(1 - nameSlam) * 10}px 0, rgba(182,255,60,${
            0.7 * (1 - nameSlam)
          }) ${(1 - nameSlam) * 10}px 0`,
        }}
      >
        CHOG #{chog.tokenId}
      </div>
      <div
        style={{
          position: "absolute",
          right: 74,
          top: 930,
          textAlign: "right",
          fontFamily: F.mono,
          fontSize: 20,
          letterSpacing: "0.16em",
          color: C.dim,
          opacity: ip(frame, [24, 34], [0, 1]),
        }}
      >
        HOLDER {chog.holder.slice(0, 8)}…
        <br />
        <span style={{ color: C.faint }}>TRAITS {chog.traits.length}/{chog.traits.length} · SUPPLY {fmtInt(CHOG_SUPPLY)}</span>
      </div>

      {/* trait chips */}
      <div
        style={{
          position: "absolute",
          left: 74,
          width: 764,
          top: 1004,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        {chog.traits.length > 6 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              fontFamily: F.mono,
              fontSize: 17,
              letterSpacing: "0.18em",
              color: C.faint,
              paddingTop: 4,
              opacity: ip(frame, [78, 88], [0, 1]),
            }}
          >
            +{chog.traits.length - 6} MORE TRAITS ON-CHAIN
          </div>
        ) : null}
        {chips.map((t, i) => {
          const s = spring({
            frame: frame - (38 + i * 7),
            fps,
            config: { damping: 13, stiffness: 240, mass: 0.6 },
          });
          return (
            <div
              key={t.trait_type}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                border: `1px solid ${i === 5 ? C.violet : C.lineStrong}`,
                background: i === 5 ? "rgba(139,92,246,0.14)" : C.panel,
                padding: "11px 18px",
                transform: `translateY(${(1 - s) * 34}px) scale(${interpolate(s, [0, 1], [0.9, 1])})`,
                opacity: ip(s, [0, 0.35], [0, 1]),
              }}
            >
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  color: C.faint,
                }}
              >
                {t.trait_type.toUpperCase()}
              </span>
              <span
                style={{
                  fontFamily: F.display,
                  fontWeight: 600,
                  fontSize: 27,
                  color: C.ink,
                }}
              >
                {String(t.value)}
              </span>
            </div>
          );
        })}
      </div>

      {/* caption */}
      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          top: 1216,
          borderLeft: `5px solid ${C.acid}`,
          background: "rgba(139,92,246,0.10)",
          padding: "13px 22px",
        }}
      >
        <BarReveal progress={ip(frame, [64, 80], [0, 1])}>
          <span
            style={{
              fontFamily: F.display,
              fontWeight: 600,
              fontSize: 31,
              letterSpacing: "0.01em",
              color: C.ink,
              }}
              >
              {caption}
          </span>
        </BarReveal>
      </div>

      {/* footer */}
      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          bottom: 30,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: F.mono,
          fontSize: 17,
          letterSpacing: "0.16em",
          color: C.faint,
        }}
      >
        <span>CHOGRAM // PFP FLEX</span>
        <span>{stamp(generatedAt)}</span>
      </div>

      <CornerTicks inset={18} size={26} />
      <CutFx cuts={[0, 60, 120]} />
    </Film>
  );
};
