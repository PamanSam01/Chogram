// CHOGRAM — keyless live data sources (agent B).
// Every helper returns null when the source fails so callers can fall back
// explicitly; nothing here ever invents values.
import type { Trait } from "./types";

export const CHOG_TOKEN = "0x350035555E10d9AfAF1566AaebfCeD5BA6C27777";
export const CHOG_GENESIS = "0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763";
export const MONAD_CHAIN_ID = 143;
export const MONAD_RPC = "https://rpc.monad.xyz";

/** Wrapped MON (Dexscreener: "monad MON 0x3bd359C1…", priceUsd tracks MON/USD). */
export const WMON = "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A";

export type DexPrice = { priceUsd: number; change24h: number };
export type CollectionStats = { floorMon: number; floorUsd: number; holders: number };

async function getJson(url: string, ms: number): Promise<unknown> {
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(ms),
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function getText(url: string, ms: number): Promise<string> {
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(ms),
    headers: { accept: "text/plain" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/**
 * $CHOG price + 24h change from Dexscreener (keyless).
 * Picks the monad pair with the deepest liquidity; null if none usable.
 */
export async function fetchDexPrice(): Promise<DexPrice | null> {
  try {
    const data = (await getJson(
      `https://api.dexscreener.com/latest/dex/tokens/${CHOG_TOKEN}`,
      8000
    )) as { pairs?: unknown[] };
    const pairs = Array.isArray(data.pairs) ? (data.pairs as Record<string, unknown>[]) : [];
    const monad = pairs.filter((p) => p.chainId === "monad");
    const pool = monad.length > 0 ? monad : pairs;
    if (pool.length === 0) return null;
    const best = pool.reduce((a, b) => {
      const la = Number((a.liquidity as { usd?: number } | undefined)?.usd ?? 0);
      const lb = Number((b.liquidity as { usd?: number } | undefined)?.usd ?? 0);
      return lb > la ? b : a;
    });
    const priceUsd = Number(best.priceUsd);
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) return null;
    const changeRaw = best.priceChange as { h24?: number } | undefined;
    const change = Number(changeRaw?.h24);
    return { priceUsd, change24h: Number.isFinite(change) ? change : 0 };
  } catch {
    return null;
  }
}

/** MON/USD from Dexscreener (wrapped MON pair) — used to derive a USD floor if OpenSea omits it. */
export async function fetchMonUsd(): Promise<number | null> {
  try {
    const data = (await getJson(
      `https://api.dexscreener.com/latest/dex/tokens/${WMON}`,
      8000
    )) as { pairs?: unknown[] };
    const pairs = Array.isArray(data.pairs) ? (data.pairs as Record<string, unknown>[]) : [];
    const monad = pairs.filter((p) => p.chainId === "monad");
    for (const p of monad.length > 0 ? monad : pairs) {
      const usd = Number(p.priceUsd);
      if (Number.isFinite(usd) && usd > 0) return usd;
    }
    return null;
  } catch {
    return null;
  }
}

function num(s: string): number {
  return Number(s.replace(/,/g, ""));
}

/**
 * Chog Genesis floor price + owner count from the public OpenSea collection page.
 * OpenSea blocks direct curl (403/Cloudflare), so we read it through the
 * keyless r.jina.ai text mirror. Returns null when anything is missing.
 */
export async function fetchCollectionStats(): Promise<CollectionStats | null> {
  let md: string;
  try {
    md = await getText("https://r.jina.ai/https://opensea.io/collection/chog-genesis", 10000);
  } catch {
    return null;
  }
  try {
    // Title looks like: "Chog Genesis 5,273.0419 MON - Collection | OpenSea"
    const title = md.match(/^Title:\s*.*?([\d,]+\.\d+|\d[\d,]*)\s+MON\s+-\s+Collection/m);
    // Body block looks like: "Floor price\n\n$143.27"
    const usd = md.match(/Floor price\s+\$([\d,]+\.\d+|\d[\d,]*)/);
    // "Owners (Unique)[1,012](https://opensea.io/.../holders) (51.4%)"
    const owners = md.match(/Owners \(Unique\)\[([\d,]+)\]/);
    if (!title || !owners) return null;
    const floorMon = num(title[1]);
    if (!Number.isFinite(floorMon) || floorMon <= 0) return null;
    let floorUsd = usd ? num(usd[1]) : NaN;
    if (!Number.isFinite(floorUsd) || floorUsd <= 0) {
      const monUsd = await fetchMonUsd();
      floorUsd = monUsd ? floorMon * monUsd : NaN;
    }
    if (!Number.isFinite(floorUsd) || floorUsd <= 0) return null;
    return { floorMon, floorUsd, holders: num(owners[1]) };
  } catch {
    return null;
  }
}

export type TokenMeta = { name?: string; image?: string; attributes?: Trait[] };

/** IPFS gateway order: the first two resolve reliably from this network. */
export const IPFS_GATEWAYS = [
  "https://ipfs.filebase.io/ipfs",
  "https://gateway.ipfs.cybernode.ai/ipfs",
  "https://ipfs.io/ipfs",
];

export function httpImageUrl(uri: string | undefined): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) return `${IPFS_GATEWAYS[0]}/${uri.slice(7)}`;
  return uri;
}
