/** Display formatting helpers for the landing page (no deps). */

export function fmtPrice(v: number): string {
  if (!Number.isFinite(v) || v <= 0) return "——";
  if (v < 0.01) return `$${v.toFixed(6)}`;
  if (v < 1) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(2)}`;
}

export function fmtChange(v: number): string {
  if (!Number.isFinite(v)) return "——";
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
}

/** 33836 -> "33.8K", 1969 -> "1969" */
export function fmtCount(n: number): string {
  if (!Number.isFinite(n)) return "——";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export function fmtDuration(frames: number, fps: number): string {
  return `${(frames / fps).toFixed(1)}S`;
}

/** 30fps frame counter -> 00:04:12 (MM:SS:FF) */
export function timecode(frame: number, fps: number): string {
  const safe = Math.max(0, Math.floor(frame));
  const totalSec = Math.floor(safe / fps);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  const ff = String(safe % fps).padStart(2, "0");
  return `${mm}:${ss}:${ff}`;
}

/** Timestamp of the market snapshot -> 14:22:05 */
export function fmtClock(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "——:——:——";
  const d = new Date(ms);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

/** rarityPercentile (1 = rarest) -> "TOP 2.1%" */
export function fmtRarity(rarityPercentile: number): string {
  const top = Math.max(0, (1 - rarityPercentile) * 100);
  if (top < 1) return "TOP <1%";
  return `TOP ${top.toFixed(1)}%`;
}

/** Still frames used as poster art (all real files in /public/chogs). */
export const CHOG_STILLS = [
  "/chogs/chogwow.jpg",
  "/chogs/chognice.jpg",
  "/chogs/chog1.jpg",
  "/chogs/chog5.jpg",
  "/chogs/chog6.jpg",
  "/chogs/chogbadge.jpg",
] as const;
