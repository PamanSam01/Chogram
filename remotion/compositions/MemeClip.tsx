// MEME CLIP — 1080x1080, 150 frames. Classic top/bottom caption meme shot on a VHS deck:
// outlined impact-style type, wipe-in entries, screen shake + punch-in on each text drop.
import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { BroadcastData, ChogNFT } from "../../lib/types";
import { CutFx, Film, GlitchImage, Timecode, ip, shakeAt } from "../lib/fx";
import { C, F, chogSrc, stamp } from "../lib/theme";

const SHOTS = [0, 46, 100];

const outline = (w: number): React.CSSProperties => ({
  color: "#f2f0ff",
  WebkitTextStroke: `${w}px #040309`,
  textShadow:
    "4px 4px 0 #040309, -4px 4px 0 #040309, 4px -4px 0 #040309, -4px -4px 0 #040309, 0 7px 0 #040309, 0 16px 30px rgba(4,3,9,0.95)",
});

const MemeText: React.FC<{
  text: string;
  start: number;
  top?: number;
  bottom?: number;
  frame: number;
  fps: number;
}> = ({ text, start, top, bottom, frame, fps }) => {
  const s = spring({ frame: frame - start, fps, config: { damping: 13, stiffness: 260, mass: 0.7 } });
  const wipe = ip(frame, [start, start + 7], [100, 0], Easing.out(Easing.cubic));
  const wobble = Math.sin((frame + start) / 3.2) * 0.7;
  const size = text.length > 46 ? 52 : text.length > 24 ? 60 : 74;
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top,
        bottom,
        textAlign: "center",
        clipPath: `inset(0 ${wipe}% 0 0)`,
        transform: `scale(${interpolate(s, [0, 1], [1.35, 1])}) rotate(${wobble}deg)`,
        transformOrigin: "50% 50%",
      }}
    >
      <span
        style={{
          fontFamily: F.display,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.04,
          letterSpacing: "0.01em",
          textTransform: "uppercase",
          display: "inline-block",
          ...outline(4),
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const MemeClip: React.FC<BroadcastData> = ({ chog, generatedAt, custom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const topText = (custom?.topText ?? "WHEN THE FLOOR HOLDS").toUpperCase();
  const bottomText = (custom?.bottomText ?? "AND YOU STILL AIN'T SELLING").toUpperCase();
  const shake = shakeAt(frame, [10, 46], 26);
  const punchA = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 200 } });
  const punchB = spring({ frame: frame - 46, fps, config: { damping: 12, stiffness: 200 } });
  const push = ip(frame, [0, 150], [1.0, 1.1], Easing.inOut(Easing.quad));
  const zoom = push + (1 - Math.min(punchA, 1)) * 0.06 + (1 - Math.min(punchB, 1)) * 0.05;
  const drift = Math.sin(frame / 22) * 12;

  return (
    <Film grain={0.2} scan={0.42} vignette={0.9}>
      {/* rotating broadcast spotlight */}
      <div
        style={{
          position: "absolute",
          left: -540,
          top: -540,
          width: 2160,
          height: 2160,
          background:
            "conic-gradient(from 0deg, rgba(139,92,246,0.16) 0deg, rgba(139,92,246,0) 40deg, rgba(139,92,246,0) 140deg, rgba(139,92,246,0.14) 180deg, rgba(139,92,246,0) 220deg, rgba(139,92,246,0) 320deg, rgba(139,92,246,0.16) 360deg)",
          transform: `rotate(${frame * 1.4}deg)`,
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rot}deg)`,
        }}
      >
        {/* chog plate */}
        <div
          style={{
            position: "absolute",
            left: 150,
            top: 214,
            width: 780,
            height: 656,
            transform: `scale(${zoom}) translateX(${drift}px)`,
            transformOrigin: "50% 45%",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: `3px solid ${C.ink}`,
              overflow: "hidden",
              background: C.panelSolid,
              boxShadow: "0 0 0 10px #040309, 0 30px 70px rgba(4,3,9,0.9)",
            }}
          >
            <GlitchImage
              src={chogSrc(chog.image)}
              alt={chog.name}
              glitch={Math.abs(Math.sin(frame / 6)) > 0.92 ? 0.55 : 0}
              split={frame < 8 ? ip(frame, [0, 8], [18, 0]) : 0}
              frame={frame}
              slices={5}
            />
          </div>
          <div
            style={{
              position: "absolute",
              left: -3,
              bottom: -3,
              fontFamily: F.mono,
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: C.bg,
              background: C.acid,
              padding: "8px 16px",
              opacity: ip(frame, [18, 26], [0, 1]),
            }}
          >
            TOKEN #{chog.tokenId}
          </div>
        </div>

        <MemeText text={topText} start={10} top={44} frame={frame} fps={fps} />
        <MemeText text={bottomText} start={46} bottom={44} frame={frame} fps={fps} />
      </div>

      {/* telemetry */}
      <div
        style={{
          position: "absolute",
          left: 34,
          top: 34,
          fontFamily: F.mono,
          fontSize: 17,
          letterSpacing: "0.18em",
          color: "rgba(242,240,255,0.72)",
        }}
      >
        <Timecode suffix="· VHS" />
      </div>
      <div
        style={{
          position: "absolute",
          right: 34,
          top: 34,
          fontFamily: F.mono,
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "0.24em",
          color: C.acid,
          background: "rgba(4,3,9,0.72)",
          border: `1px solid ${C.acid}`,
          padding: "7px 14px",
        }}
      >
        CHOGRAM // MEME-CLIP
      </div>
      <div
        style={{
          position: "absolute",
          left: 34,
          top: 66,
          fontFamily: F.mono,
          fontSize: 15,
          letterSpacing: "0.16em",
          color: "rgba(242,240,255,0.45)",
        }}
      >
        {stamp(generatedAt)}
      </div>
      <CutFx cuts={SHOTS} />
    </Film>
  );
};
