import { promises as fs } from "node:fs";
import path from "node:path";

import type { BroadcastMeta } from "./types";

const MAX_ENTRIES = 50;
const STORE = path.join(process.cwd(), "data", "broadcasts.json");

/** Serializes mutations so concurrent renders can't interleave read-modify-write. */
let chain: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function isMeta(v: unknown): v is BroadcastMeta {
  if (!v || typeof v !== "object") return false;
  const m = v as Partial<BroadcastMeta>;
  return typeof m.file === "string" && m.file.length > 0 && typeof m.template === "string";
}

/**
 * Read the store. Missing or corrupt file recovers as an empty array —
 * this hook runs fire-and-forget inside the render stream and must never throw.
 */
export async function listBroadcasts(): Promise<BroadcastMeta[]> {
  try {
    const raw = await fs.readFile(STORE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMeta);
  } catch {
    return [];
  }
}

/** temp file + rename: readers only ever see a complete file, never a half-write. */
async function writeBroadcasts(items: BroadcastMeta[]): Promise<void> {
  await fs.mkdir(path.dirname(STORE), { recursive: true });
  const tmp = `${STORE}.${process.pid}.${Date.now().toString(36)}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  await fs.rename(tmp, STORE);
}

/** Prepend (newest first) and cap at 50 entries. */
export function appendBroadcast(entry: BroadcastMeta): Promise<void> {
  return withLock(async () => {
    const items = await listBroadcasts();
    items.unshift(entry);
    await writeBroadcasts(items.slice(0, MAX_ENTRIES));
  });
}
