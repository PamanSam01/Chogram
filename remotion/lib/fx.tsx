// CHOGRAM broadcast FX kit — film grain, scanlines, VHS cuts, chromatic aberration,
// redacted bar reveals, editorial slams, telemetry chrome. One motif, executed hard.
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  continueRender,
  delayRender,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_CSS } from "./fonts";
import { C, F } from "./theme";

/* ------------------------------------------------------------------ fonts */

export const Fonts: React.FC = () => {
  const [handle] = React.useState(() => delayRender("cho-fonts"));
  React.useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      continueRender(handle);
    };
    const timer = window.setTimeout(finish, 6000);
    const specs = [
      '500 16px "Chakra Petch"',
      '600 16px "Chakra Petch"',
      '700 16px "Chakra Petch"',
      '400 16px "Space Grotesk"',
      '500 16px "Space Grotesk"',
      '700 16px "Space Grotesk"',
      '400 16px "JetBrains Mono"',
      '700 16px "JetBrains Mono"',
    ];
    Promise.all(specs.map((s) => document.fonts.load(s)))
      .then(finish)
      .catch(finish);
    return () => window.clearTimeout(timer);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: FONT_CSS }} />;
};

/* ------------------------------------------------------------- interpolation */

export const ip = (
  frame: number,
  range: [number, number],
  out: [number, number],
  easing?: (t: number) => number
): number => {
  if (range[1] <= range[0]) return frame >= range[1] ? out[1] : out[0];
  // Hard-snap the endpoints: Easing.out(Easing.exp) stops at 1 - 2^-10, which
  // would otherwise leave rank counters and price tickers one value short.
  if (frame >= range[1]) return out[1];
  if (frame <= range[0]) return out[0];
  return interpolate(frame, range, out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    ...(easing ? { easing } : {}),
  });
};

const easeOut = Easing.out(Easing.cubic);
const easeExpo = Easing.out(Easing.exp);

/* ------------------------------------------------------------------ overlays */

const GRAIN_TILE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(#n)' opacity='0.55'/></svg>`
)}`;

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.13 }) => {
  const frame = useCurrentFrame();
  const x = Math.floor(random(`gx${frame}`) * 200);
  const y = Math.floor(random(`gy${frame}`) * 200);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url("${GRAIN_TILE}")`,
        backgroundSize: "200px 200px",
        backgroundPosition: `${x}px ${y}px`,
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

export const Scanlines: React.FC<{ opacity?: number; sweep?: boolean }> = ({
  opacity = 0.55,
  sweep = true,
}) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const sweepY = ((frame * 3.2) % (height + 200)) - 100;
  return (
    <>
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0.34) 0px, rgba(0,0,0,0.34) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px)",
          backgroundPositionY: `${(frame * 1.1) % 3}px`,
          opacity,
          pointerEvents: "none",
        }}
      />
      {sweep ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: sweepY,
            height: 90,
            background:
              "linear-gradient(to bottom, rgba(139,92,246,0) 0%, rgba(139,92,246,0.10) 55%, rgba(182,255,60,0.14) 100%)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      ) : null}
    </>
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({
  strength = 0.85,
}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 78% 78% at 50% 50%, rgba(4,3,9,0) 38%, rgba(4,3,9,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/** TV power-off / signal loss at frame 0 of some cuts. */
export const SignalLoss: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const d = frame - at;
  if (d < 0 || d > 3) return null;
  return (
    <AbsoluteFill
      style={{
        background: "#000",
        opacity: d === 0 ? 1 : d === 1 ? 0.6 : 0.25,
        pointerEvents: "none",
      }}
    />
  );
};

/** VHS tracking band + brand-color chromatic flash on cut frames. */
export const CutFx: React.FC<{ cuts: number[] }> = ({ cuts }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const active = cuts.find((c) => frame >= c && frame < c + 3);
  const flash = cuts.find((c) => frame >= c && frame < c + 2);
  if (active === undefined) return null;
  const strength = 1 - (frame - active) / 3;
  const bandY = random(`band${active}`) * (height - 90);
  const bandH = 26 + random(`bh${active}`) * 64;
  return (
    <>
      {flash !== undefined ? (
        <AbsoluteFill
          style={{
            background: `linear-gradient(100deg, rgba(139,92,246,${0.28 * (1 - (frame - flash) / 2)}) 0%, rgba(242,240,255,${
              0.22 * (1 - (frame - flash) / 2)
            }) 50%, rgba(182,255,60,${0.20 * (1 - (frame - flash) / 2)}) 100%)`,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: bandY,
          height: bandH,
          transform: `translateX(${(random(`bx${active}${frame}`) - 0.5) * 46 * strength}px)`,
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(242,240,255,0.16) 0px, rgba(242,240,255,0.16) 2px, rgba(4,3,9,0.72) 2px, rgba(4,3,9,0.72) 6px)",
          borderTop: `1px solid rgba(182,255,60,${0.5 * strength})`,
          borderBottom: `1px solid rgba(139,92,246,${0.6 * strength})`,
          mixBlendMode: "screen",
          opacity: 0.85,
          pointerEvents: "none",
        }}
      />
    </>
  );
};

/** Chromatic aberration text shadow in brand hues (violet / acid). */
export const chroma = (d: number, alpha = 0.85): string =>
  d <= 0.05
    ? "none"
    : `${-d}px 0 rgba(139,92,246,${alpha}), ${d}px 0 rgba(182,255,60,${alpha * 0.8})`;

export const ChannelDefs: React.FC = () => (
  <svg width="0" height="0" style={{ position: "absolute" }}>
    <defs>
      <filter id="cho-ch-r" colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
        />
      </filter>
      <filter id="cho-ch-gb" colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
        />
      </filter>
    </defs>
  </svg>
);

/* ------------------------------------------------------------------ imaging */

export const GlitchImage: React.FC<{
  src: string;
  alt: string;
  glitch?: number;
  split?: number;
  frame?: number;
  slices?: number;
  style?: React.CSSProperties;
  imgStyle?: React.CSSProperties;
}> = ({ src, alt, glitch = 0, split = 0, frame = 0, slices = 6, style, imgStyle }) => {
  const img = (extra?: React.CSSProperties): React.ReactNode => (
    <Img
      src={src}
      alt={alt}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        ...imgStyle,
        ...extra,
      }}
    />
  );
  const splitting = split > 0.5;
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...style,
      }}
    >
      {splitting ? (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateX(${-split}px)`,
              filter: "url(#cho-ch-r)",
              mixBlendMode: "screen",
            }}
          >
            {img()}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateX(${split}px)`,
              filter: "url(#cho-ch-gb)",
              mixBlendMode: "screen",
            }}
          >
            {img()}
          </div>
        </>
      ) : (
        img()
      )}
      {glitch > 0.02
        ? new Array(slices).fill(0).map((_, i) => {
            const top = (i / slices) * 100;
            const bot = 100 - ((i + 1) / slices) * 100;
            const r = random(`sl${frame}-${i}`);
            const dx = (r - 0.5) * 260 * glitch;
            if (Math.abs(dx) < 3) return null;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  clipPath: `inset(${top}% 0 ${bot}% 0)`,
                  transform: `translateX(${dx}px)`,
                }}
              >
                {img()}
              </div>
            );
          })
        : null}
      {glitch > 0.02
        ? new Array(3).fill(0).map((_, i) => {
            const top = random(`hz${frame}${i}`) * 88;
            return (
              <div
                key={`h${i}`}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: `${top}%`,
                  height: 2 + random(`hh${frame}${i}`) * 5,
                  background:
                    i % 2 === 0 ? "rgba(182,255,60,0.5)" : "rgba(139,92,246,0.55)",
                  mixBlendMode: "screen",
                  opacity: glitch,
                }}
              />
            );
          })
        : null}
    </div>
  );
};

/* ---------------------------------------------------------------- typography */

/** Editorial letter slam: squash-on-impact, staggered, brand chroma on land. */
export const Slam: React.FC<{
  text: string;
  size: number;
  start?: number;
  stagger?: number;
  color?: string;
  chromaOn?: boolean;
  weight?: number;
  tracking?: string;
  font?: string;
  from?: number;
}> = ({
  text,
  size,
  start = 0,
  stagger = 1.6,
  color = C.ink,
  chromaOn = true,
  weight = 700,
  tracking = "-0.02em",
  font = F.display,
  from = 2.6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: tracking,
        lineHeight: 0.92,
        textTransform: "uppercase",
        color,
        whiteSpace: "pre",
        display: "flex",
      }}
    >
      {text.split("").map((ch, i) => {
        const s = spring({
          frame: frame - start - i * stagger,
          fps,
          config: { damping: 14, stiffness: 210, mass: 0.5 },
        });
        const scale = interpolate(s, [0, 1], [from, 1]);
        const squash = interpolate(s, [0, 0.55, 1], [1, 1.18, 1]);
        const d = (1 - s) * 14;
        return (
          <span
            key={`${ch}-${i}`}
            style={{
              display: "inline-block",
              transform: `scale(${scale}, ${scale / squash})`,
              opacity: ip(s, [0, 0.15], [0, 1]),
              textShadow: chromaOn ? chroma(d, 0.9) : undefined,
              minWidth: ch === " " ? "0.3em" : undefined,
            }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        );
      })}
    </div>
  );
};

/** Redacted black bar that wipes off, revealing the content beneath. */
export const BarReveal: React.FC<{
  progress: number; // 0 = fully covered, 1 = revealed
  children: React.ReactNode;
  style?: React.CSSProperties;
  barColor?: string;
}> = ({ progress, children, style, barColor = C.black }) => {
  const p = Math.min(1, Math.max(0, progress));
  return (
    <div style={{ position: "relative", overflow: "hidden", ...style }}>
      {children}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateX(${p * 100}%)`,
          background: barColor,
          borderLeft: p > 0.001 && p < 0.999 ? `3px solid ${C.acid}` : undefined,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

/** Monospace typewriter with a blinking acid block cursor. */
export const Typed: React.FC<{
  text: string;
  start: number;
  cps?: number;
  style?: React.CSSProperties;
  cursor?: boolean;
}> = ({ text, start, cps = 26, style, cursor = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shown = Math.max(
    0,
    Math.min(text.length, Math.floor(((frame - start) / fps) * cps))
  );
  const done = shown >= text.length;
  const blink = done ? Math.floor(frame / 7) % 2 === 0 : true;
  return (
    <span style={style}>
      {text.slice(0, shown)}
      {cursor && blink ? (
        <span
          style={{
            display: "inline-block",
            width: "0.56em",
            height: "0.95em",
            background: C.acid,
            transform: "translateY(0.12em)",
            marginLeft: "0.12em",
          }}
        />
      ) : null}
    </span>
  );
};

/** Rolling odometer entrance for numeric strings (tabular mono). */
export const DigitRoll: React.FC<{
  text: string;
  start?: number;
  stagger?: number;
  style?: React.CSSProperties;
}> = ({ text, start = 0, stagger = 1.1, style }) => {
  const frame = useCurrentFrame();
  return (
    <span style={{ display: "inline-flex", ...style }}>
      {text.split("").map((ch, i) => {
        const p = ip(frame, [start + i * stagger, start + i * stagger + 6], [0, 1], easeOut);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${(1 - p) * 0.7}em)`,
              opacity: p,
              whiteSpace: "pre",
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

/* ---------------------------------------------------------------- telemetry */

export const CornerTicks: React.FC<{
  inset?: number;
  size?: number;
  color?: string;
  width?: number;
}> = ({ inset = 26, size = 30, color = "rgba(182,255,60,0.55)", width = 2 }) => {
  const base: React.CSSProperties = { position: "absolute", width: size, height: size };
  return (
    <>
      <div style={{ ...base, top: inset, left: inset, borderTop: `${width}px solid ${color}`, borderLeft: `${width}px solid ${color}` }} />
      <div style={{ ...base, top: inset, right: inset, borderTop: `${width}px solid ${color}`, borderRight: `${width}px solid ${color}` }} />
      <div style={{ ...base, bottom: inset, left: inset, borderBottom: `${width}px solid ${color}`, borderLeft: `${width}px solid ${color}` }} />
      <div style={{ ...base, bottom: inset, right: inset, borderBottom: `${width}px solid ${color}`, borderRight: `${width}px solid ${color}` }} />
    </>
  );
};

export const Timecode: React.FC<{ style?: React.CSSProperties; suffix?: string }> = ({
  style,
  suffix,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = Math.max(0, frame);
  const ff = total % fps;
  const s = Math.floor(total / fps) % 60;
  const m = Math.floor(total / (fps * 60)) % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <span
      style={{
        fontFamily: F.mono,
        fontSize: 20,
        letterSpacing: "0.08em",
        color: C.dim,
        ...style,
      }}
    >
      TC 00:{p(m)}:{p(s)}:{p(ff)}
      {suffix ? ` ${suffix}` : ""}
    </span>
  );
};

export const Label: React.FC<{
  children: React.ReactNode;
  color?: string;
  tick?: boolean;
  style?: React.CSSProperties;
}> = ({ children, color = C.acid, tick = true, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      fontFamily: F.mono,
      fontSize: 19,
      fontWeight: 700,
      letterSpacing: "0.26em",
      textTransform: "uppercase",
      color,
      ...style,
    }}
  >
    {tick ? (
      <span style={{ width: 22, height: 3, background: color, display: "inline-block" }} />
    ) : null}
    {children}
  </span>
);

export const Rule: React.FC<{
  style?: React.CSSProperties;
  color?: string;
  dashed?: boolean;
}> = ({ style, color = C.line, dashed = false }) => (
  <div
    style={{
      height: 1,
      background: color,
      ...(dashed
        ? {
            backgroundImage: `repeating-linear-gradient(to right, ${color} 0 10px, transparent 10px 18px)`,
            background: undefined,
          }
        : {}),
      ...style,
    }}
  />
);

/** Scrolling mono ticker strip (broadcast lower-third). */
export const Ticker: React.FC<{
  items: string[];
  speed?: number;
  style?: React.CSSProperties;
  color?: string;
}> = ({ items, speed = 0.22, style, color = C.dim }) => {
  const frame = useCurrentFrame();
  const line = items.join("   ///   ");
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap", ...style }}>
      <div
        style={{
          display: "inline-block",
          transform: `translateX(-${(frame * speed) % 50}%)`,
          fontFamily: F.mono,
          fontSize: 20,
          letterSpacing: "0.18em",
          color,
        }}
      >
        {line}
        {"   ///   "}
        {line}
      </div>
    </div>
  );
};

/** Deterministic identicon-ish 5x5 pixel mark derived from the holder address. */
export const PixelMark: React.FC<{ seed: string; size: number }> = ({
  seed,
  size,
}) => {
  const cells = useMemo(() => {
    const out: { x: number; y: number; c: string }[] = [];
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 3; x++) {
        const on = random(`px-${seed}-${x}-${y}`) > 0.44;
        if (!on) continue;
        const accent = random(`pa-${seed}-${x}-${y}`) > 0.72;
        const c = accent ? C.acid : C.violet;
        out.push({ x, y, c });
        if (x < 2) out.push({ x: 4 - x, y, c });
      }
    }
    return out;
  }, [seed]);
  const cell = size / 5;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {cells.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: c.x * cell,
            top: c.y * cell,
            width: cell - 1,
            height: cell - 1,
            background: c.c,
          }}
        />
      ))}
    </div>
  );
};

/** Percentile ring with an acid tip marker. */
export const PercentRing: React.FC<{
  progress: number; // 0..1
  size: number;
  stroke?: number;
  children?: React.ReactNode;
}> = ({ progress, size, stroke = 10, children }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  const angle = -Math.PI / 2 + p * 2 * Math.PI;
  const cx = size / 2 + Math.cos(angle) * r;
  const cy = size / 2 + Math.sin(angle) * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ display: "block" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(242,240,255,0.12)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.violet}
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${circ * p} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: "drop-shadow(0 0 10px rgba(139,92,246,0.55))" }}
        />
        {p > 0.01 ? (
          <circle cx={cx} cy={cy} r={stroke / 2 + 2} fill={C.acid} />
        ) : null}
      </svg>
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
        {children}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------- motion */

/** Camera-like slow push-in on a still. */
export const Drift: React.FC<{
  children: React.ReactNode;
  dur: number;
  from?: number;
  to?: number;
  origin?: string;
  style?: React.CSSProperties;
}> = ({ children, dur, from = 1, to = 1.04, origin = "50% 50%", style }) => {
  const frame = useCurrentFrame();
  const s = ip(frame, [0, dur], [from, to], Easing.inOut(Easing.quad));
  return (
    <AbsoluteFill style={{ transform: `scale(${s})`, transformOrigin: origin, ...style }}>
      {children}
    </AbsoluteFill>
  );
};

/** Decaying screen shake triggered at specific frames. */
export const shakeAt = (
  frame: number,
  hits: number[],
  power: number
): { x: number; y: number; rot: number } => {
  let best = 0;
  let seed = "";
  for (const h of hits) {
    const d = frame - h;
    if (d >= 0 && d < 9) {
      const decay = 1 - d / 9;
      if (decay > best) {
        best = decay;
        seed = `sh${h}${d}`;
      }
    }
  }
  if (best <= 0) return { x: 0, y: 0, rot: 0 };
  return {
    x: (random(seed + "x") - 0.5) * 2 * power * best,
    y: (random(seed + "y") - 0.5) * 2 * power * best,
    rot: (random(seed + "r") - 0.5) * 1.6 * best * (power / 14),
  };
};

/** Count-up with expo easing that lands on the exact value. */
export const useLiveCount = (to: number, start: number, dur: number): number => {
  const frame = useCurrentFrame();
  return ip(frame, [start, start + dur], [0, to], easeExpo);
};

/** Standard film shell: fonts + defs + overlays on top. */
export const Film: React.FC<{
  children: React.ReactNode;
  grain?: number;
  scan?: number;
  vignette?: number;
  sweep?: boolean;
}> = ({ children, grain = 0.13, scan = 0.5, vignette = 0.85, sweep = true }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Fonts />
    <ChannelDefs />
    {children}
    <Scanlines opacity={scan} sweep={sweep} />
    <Grain opacity={grain} />
    <Vignette strength={vignette} />
  </AbsoluteFill>
);
