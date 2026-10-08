// CHOGRAM broadcast design system — colors, type, formatters.
// Palette discipline: bg + violet + acid + one alert pair (red/green). Nothing else.
import { staticFile } from "remotion";

export const C = {
  bg: "#07060d",
  bgLift: "#0d0b1a",
  violet: "#8b5cf6",
  acid: "#b6ff3c",
  red: "#ff5c5c",
  green: "#22d39a",
  ink: "#f2f0ff",
  dim: "rgba(242,240,255,0.55)",
  faint: "rgba(242,240,255,0.30)",
  line: "rgba(242,240,255,0.14)",
  lineStrong: "rgba(242,240,255,0.30)",
  panel: "rgba(139,92,246,0.07)",
  panelSolid: "#0b0916",
  black: "#040309",
} as const;

export const F = {
  display: '"Chakra Petch", "Liberation Sans", sans-serif',
  body: '"Space Grotesk", "Liberation Sans", sans-serif',
  mono: '"JetBrains Mono", "Liberation Mono", ui-monospace, monospace',
} as const;

/** chog.image may be "/chogs/x.jpg" (public asset) or an absolute URL. */
export const chogSrc = (src: string): string =>
  src.startsWith("/") ? staticFile(src.slice(1)) : src;

export const fmtInt = (n: number): string =>
  Math.round(n).toLocaleString("en-US");

/** 5273.0419 -> "5,270.1" — thousands-separated MON amounts. */
export const fmtMon = (n: number): string =>
  n.toLocaleString("en-US", { maximumFractionDigits: 1 });

export const fmtUsd = (n: number): string => {
  if (n >= 1000) return "$" + n.toLocaleString("en-US");
  if (n >= 1) return "$" + n.toFixed(2);
  if (n >= 0.01) return "$" + n.toFixed(4);
  return "$" + n.toFixed(6);
};

export const fmtPct = (n: number): string =>
  (n >= 0 ? "+" : "") + n.toFixed(1) + "%";

export const shortAddr = (a: string, head = 6, tail = 4): string =>
  a.length > head + tail + 2 ? `${a.slice(0, head)}…${a.slice(-tail)}` : a;

/** 0.979 → "TOP 2.1%" (1 = rarest). */
export const topPct = (p: number): string => {
  const top = (1 - p) * 100;
  const s = top < 1 ? top.toFixed(2) : top.toFixed(1);
  return `TOP ${s}%`;
};

/** Broadcast timecode from frame number. */
export const timecode = (frame: number, fps: number): string => {
  const total = Math.max(0, Math.floor(frame));
  const ff = total % fps;
  const s = Math.floor(total / fps) % 60;
  const m = Math.floor(total / (fps * 60)) % 60;
  const h = Math.floor(total / (fps * 3600));
  const p = (n: number) => String(n).padStart(2, "0");
  return `TC ${p(h)}:${p(m)}:${p(s)}:${p(ff)}`;
};

/** ISO → "2026-10-07 14:53:11 UTC" */
export const stamp = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(
    d.getUTCDate()
  )} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(
    d.getUTCSeconds()
  )} UTC`;
};

export const dateOnly = (iso: string): string => stamp(iso).slice(0, 10);

export const CHOG_TOKEN_DISPLAY = "0x3500…7777";
export const CHOG_SUPPLY = 1969;

/**
 * Per-token broadcast signature — FNV-1a 64 over `${tokenId}:${holder}:${generatedAt}`,
 * rendered `0x` + 16 hex uppercase. Unique per token, holder and issue timestamp:
 * two exports of the same Chog at different moments carry different SIGs.
 * Shown in the Summon ticker and the PriceAlert telemetry line.
 */
export const sigOf = (chog: { tokenId: string; holder: string }, generatedAt: string): string => {
  const bytes = new TextEncoder().encode(`${chog.tokenId}:${chog.holder}:${generatedAt}`);
  // 64-bit FNV-1a carried as two 32-bit halves (exact in doubles: max product < 2^53).
  let hi = 0xcbf29ce4; // offset basis 0xcbf29ce484222325
  let lo = 0x84222325;
  for (let i = 0; i < bytes.length; i++) {
    lo = (lo ^ bytes[i]) >>> 0; // XOR the byte into the low word (keep unsigned)
    // multiply by FNV prime 0x100000001b3 (hi part 0x100, lo part 0x1b3):
    //   (hi*2^32 + lo) * (0x100*2^32 + 0x1b3)  mod 2^64
    // = (hi*0x1b3 + lo*0x100 + carry) * 2^32 + (lo*0x1b3 mod 2^32)
    // all intermediates < 2^53, so double math is exact.
    const loOld = lo;
    const prod = lo * 0x1b3;
    const carry = Math.floor(prod / 0x100000000);
    lo = prod % 0x100000000;
    hi = (hi * 0x1b3 + loOld * 0x100 + carry) % 0x100000000;
  }
  return `0x${hi.toString(16).toUpperCase().padStart(8, "0")}${lo
    .toString(16)
    .toUpperCase()
    .padStart(8, "0")}`;
};
