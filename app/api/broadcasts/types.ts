/**
 * One entry of the shared store `data/broadcasts.json` (FEATURES_V2).
 * Newest-first array, max 50 entries, created lazily at runtime.
 *
 * Type-only module — safe to import from client components with `import type`.
 */
export type BroadcastMeta = {
  /** File name inside `public/exports`, e.g. "1791…-price-alert-720.mp4". */
  file: string;
  /** TemplateId of the rendered composition. */
  template: string;
  /** Output scale actually rendered (1 = full, 0.6667 = 720p class). */
  scale: number;
  /** Wall-clock render time in ms. */
  ms: number;
  /** File size in bytes. */
  bytes: number;
  /** ISO timestamp of the moment the render reported ready. */
  at: string;
  /** `custom.bgm` track id, when the export selected one ("trenches" | "float"). */
  bgm?: string;
  /** `custom.alertId`, when this render was fired by an alert. */
  alertId?: string;
};
