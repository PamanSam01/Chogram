/**
 * Alert shapes from the FEATURES_V2 API contract.
 * Type-only module — safe to import from client components with `import type`.
 */
export type AlertDirection = "any" | "up" | "down";

/** One completed broadcast produced by this alert. */
export type FiredEntry = {
  at: string; // ISO
  url: string; // /exports/<file>.mp4
  pct: number; // move reported in that clip, percent
};

export type Alert = {
  id: string;
  thresholdPct: number; // 0.5 – 50
  direction: AlertDirection;
  armed: boolean;
  createdAt: string; // ISO
  /** Price the move is measured against (armed-at / last-fired price). */
  lastPrice: number | null;
  fired: FiredEntry[];
};
