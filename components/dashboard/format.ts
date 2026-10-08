// Presentation helpers for the broadcast console. Pure functions, no side effects.

/** 1920x1080 → "1920x1080" (readouts are monospace, no thousands separators). */
export function fmtRes(w: number, h: number): string {
  return `${w}x${h}`;
}

/** 540 frames @30fps → "18.0s" */
export function fmtDuration(frames: number, fps: number): string {
  return `${(frames / fps).toFixed(1)}s`;
}

/** 0.002076 → "$0.002076" (never lose sub-cent precision) */
export function fmtUsd(v: number): string {
  if (!Number.isFinite(v)) return "—";
  if (v === 0) return "$0.00";
  if (v < 0.01) return `$${v.toFixed(6)}`;
  if (v < 1) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(2)}`;
}

/** -15.2 → "−15.20%" (sign is part of the readout, tabular) */
export function fmtPct(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${Math.abs(v).toFixed(2)}%`;
}

export function fmtNum(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("en-US");
}

/** Raw on-chain units → "1,337.00 $CHOG" */
export function fmtToken(raw: bigint, decimals = 18): string {
  const neg = raw < 0n;
  const abs = neg ? -raw : raw;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  const num = Number(`${whole}.${fracStr.padEnd(2, "0") || "0"}`);
  const body = Number.isFinite(num)
    ? num.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : whole.toString();
  return `${neg ? "-" : ""}${body}`;
}

/** Frame → SMPTE timecode HH:MM:SS:FF */
export function timecode(frame: number, fps: number): string {
  const f = Math.max(0, Math.floor(frame));
  const ff = f % fps;
  const totalSeconds = Math.floor(f / fps);
  const ss = totalSeconds % 60;
  const mm = Math.floor(totalSeconds / 60) % 60;
  const hh = Math.floor(totalSeconds / 3600);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${p(hh)}:${p(mm)}:${p(ss)}:${p(ff)}`;
}

/** 45678 → "45.7 KB" | 4_512_331 → "4.5 MB" */
export function fmtBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 45678 ms → "45.7s" | 1234 → "1.2s" */
export function fmtMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Elapsed ms → clock-style "00:12.4" for the live render readout */
export function fmtElapsed(ms: number): string {
  const total = Math.max(0, ms);
  const s = Math.floor(total / 1000);
  const tenths = Math.floor((total % 1000) / 100);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}.${tenths}`;
}
