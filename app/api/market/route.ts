import { NextResponse } from "next/server";
import { SAMPLE_MARKET } from "@/lib/fixtures";
import { fetchCollectionStats, fetchDexPrice } from "@/lib/sources";
import type { MarketData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/market — same numbers as fetchMarketData(), plus which live source
 * produced each group of fields, so nothing has to be taken on faith.
 *   price ................ Dexscreener $CHOG pairs on monad
 *   collection (floor/holders) ... OpenSea chog-genesis page (r.jina.ai mirror)
 *   "fixture" = source unreachable, SAMPLE_MARKET snapshot used instead
 */
export async function GET() {
  const [price, stats] = await Promise.all([fetchDexPrice(), fetchCollectionStats()]);
  const market: MarketData = {
    chogPriceUsd: price?.priceUsd ?? SAMPLE_MARKET.chogPriceUsd,
    chogChange24h: price?.change24h ?? SAMPLE_MARKET.chogChange24h,
    floorMon: stats?.floorMon ?? SAMPLE_MARKET.floorMon,
    floorUsd: stats?.floorUsd ?? SAMPLE_MARKET.floorUsd,
    holders: stats?.holders ?? SAMPLE_MARKET.holders,
    ts: Date.now(),
  };
  return NextResponse.json({
    market,
    sources: {
      price: price ? "dexscreener" : "fixture",
      collection: stats ? "opensea" : "fixture",
    },
  });
}
