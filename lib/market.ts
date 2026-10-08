import { SAMPLE_MARKET } from "./fixtures";
import {
  CHOG_GENESIS,
  CHOG_TOKEN,
  MONAD_CHAIN_ID,
  MONAD_RPC,
  fetchCollectionStats,
  fetchDexPrice,
} from "./sources";
import type { MarketData } from "./types";

// Frozen public constants (defined once in ./sources, re-exported here).
export { CHOG_GENESIS, CHOG_TOKEN, MONAD_CHAIN_ID, MONAD_RPC };

let cached: MarketData | null = null;

/**
 * Live market data:
 *  - price / 24h change .... Dexscreener $CHOG-USDC pairs on monad (keyless)
 *  - floorMon / floorUsd / holders ... OpenSea "Chog Genesis" page via r.jina.ai text mirror
 * Any source that fails falls back to the SAMPLE_MARKET snapshot for that field only;
 * `ts` is the epoch of this successful call.
 */
export async function fetchMarketData(): Promise<MarketData> {
  if (cached && Date.now() - cached.ts < 25_000) return cached;
  const [price, stats] = await Promise.all([fetchDexPrice(), fetchCollectionStats()]);
  const out: MarketData = {
    chogPriceUsd: price?.priceUsd ?? SAMPLE_MARKET.chogPriceUsd,
    chogChange24h: price?.change24h ?? SAMPLE_MARKET.chogChange24h,
    floorMon: stats?.floorMon ?? SAMPLE_MARKET.floorMon,
    floorUsd: stats?.floorUsd ?? SAMPLE_MARKET.floorUsd,
    holders: stats?.holders ?? SAMPLE_MARKET.holders,
    ts: Date.now(),
  };
  cached = out;
  return cached;
}
